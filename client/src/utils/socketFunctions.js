import { io } from 'socket.io-client';
import {
	attachMediaStreamToElement,
	getLocalMediaStream,
} from './mediaFunctions';

const WEBSOCKETS_SERVER = 'ws://localhost:5000';
const ICE_SERVERS = [{ url: 'stun:stun.l.google.com:19302' }];

const USE_VIDEO = true;
const MUTE_AUDIO_BY_DEFAULT = false;

let local_media_stream = null;
let peers = {};
let peer_media_elements = {};

const createSocket = (meeting_id, userData, [peers, setPeers]) => {
	const socket = io(WEBSOCKETS_SERVER);

	const { name } = userData;
	// Fires once the socket "opens" a connection with WebSockets server
	socket.on('connect', () => {
		console.log(`CONNECTED to signaling server. socket id is ${socket.id}`);

		socket.emit('join meeting', meeting_id, () => {
			console.log(`You joined the meeting.`);
		});
		/*
		// Request access to mediaDevices and pass in a callback to peer up!
		getLocalMediaStream({ video: true, audio: true }, () => {
			// Peer up her
			console.log('inside getLocalMediaStream callback');
			socketJoinChannel(socket, channel_id, {
				name,
			});
		});
    */
	});

	// Fires once the socket "closes" the connection existing between it and the
	// WebSocket server
	socket.on('disconnect', () => {
		console.log('DISCONNECTED from signaling server.');
		/*
		// Tear down all peer connections
		// 1. Remove all peer audio/video elements they are tracked in our peer_media_elements object
		for (let peer_id in peer_media_elements) {
			peer_media_elements[peer_id].remove();
		}
		// 2. Not really sure, I think this refers to peer sockets, but I don't know why would all other peer sockets disconnect completely just because one socket decided to disconnect :/
		for (let peer_id in peers) {
			peers[peer_id].close();
		}

		peers = {};
		peer_media_elements = {};
    */
	});

	socket.on('someone joined', id => {
		console.log(`${id} joined the meeting`);
	});

	socket.on('someone left', id => {
		console.log(`${id} left the meeting`);
	});
	/*
	socket.addEventListener('message', message => {
		message = JSON.parse(message.data);
		switch (message.type) {
			case undefined || false:
				console.log('No message type provided by server -', message);
				return;
			case 'addPeer':
				let { config } = message;
				console.log('Signaling server said to add peer:', config);
				var { peer_id } = config;
				if (peer_id in peers) {
					console.log('Already connected to peer', peer_id);
					return;
				}

				const peer_connection = new RTCPeerConnection(
					{
						iceServers: ICE_SERVERS,
					},
					{
						// Might be needed (does something about Firefox being able to communicate with Chrome)
						optional: [{ DtlsSrtpKeyAgreement: true }],
					}
				);
				// Start tracking the peer connection
				peers[peer_id] = peer_connection;
				// Listen for 'icecandidate' events on the peer_connection
				peer_connection.addEventListener('icecandidate', e => {
					if (e.candidate) {
						socket.send(
							JSON.stringify({
								type: 'relayICECandidate',
								peer_id,
								ice_candidate: e.candidate,
							})
						);
					}
				});

				peer_connection.addEventListener('track', e => {
					// Each stream will cause 2 track event calls (one for "audio" and one for "video"), we will act only in one of them, I choose the audio track because we might have video off in some instances, then we will grab the stream object from the event only once.
					if (e.track.kind === 'audio') {
						let remote_media_element = USE_VIDEO
							? document.createElement('video')
							: document.createElement('audio');
						remote_media_element.autoplay = true;
						if (MUTE_AUDIO_BY_DEFAULT)
							remote_media_element.muted = true;
						remote_media_element.controls = true;
						peer_media_elements[peer_id] = remote_media_element;
						document.body.append(remote_media_element);
						attachMediaStreamToElement(
							remote_media_element,
							e.streams[0]
						);
					}
				});

				// Add local track to our peer connection
				local_media_stream.getTracks().forEach(track => {
					peer_connection.addTrack(track, local_media_stream);
				});

				// Only one side of the peer connection should send offer
				if (config.should_create_offer) {
					console.log('Creating RTC offer to ', peer_id);
					peer_connection
						.createOffer()
						.then(localSessionDescription => {
							console.log(
								'Local offer/session description is: ',
								localSessionDescription
							);
							peer_connection
								.setLocalDescription(localSessionDescription)
								.then(() => {
									socket.send(
										JSON.stringify({
											type: 'relaySessionDescription',
											peer_id: peer_id,
											session_description: localSessionDescription,
										})
									);
									console.log(
										'Offer setLocalDescription succeeded'
									);
								})
								.catch(error => {
									console.error(
										'Offer setLocalDescription failed!',
										error
									);
								});
						})
						.catch(error => {
							console.log('Error sending offer:', error);
						});
				}
				// break from 'addPeer'
				return;
			case 'sessionDescription':
				var { peer_id } = message;
				var remote_description = message.session_description;
				console.log(
					'Remote description received: ',
					remote_description
				);
				var peer = peers[peer_id];

				let remoteSessionDescription = new RTCSessionDescription(
					remote_description
				);
				// SetRemoteDescription
				// let stuff =
				peer.setRemoteDescription(remoteSessionDescription)
					.then(() => {
						if (remote_description.type === 'offer') {
							console.log('Creating answer');
							peer.createAnswer().then(local_description => {
								console.log(
									`Answer description is: `,
									local_description
								);
								peer.setLocalDescription(local_description)
									.then(() => {
										socket.send(
											JSON.stringify({
												type: 'relaySessionDescription',
												peer_id: peer_id,
												session_description: local_description,
											})
										);
										console.log(
											'Answer setLocalDescription succeeded'
										);
									})
									.catch(error => {
										console.error(
											'Answer setLocalDescription failed!',
											error
										);
									});
							});
						}
					})
					.catch(error => {
						console.log('setRemoteDescription error: ', error);
					});
				console.log('Description Object: ', remoteSessionDescription);
				// break from 'sessionDescription'
				return;
			case 'iceCandidate':
				var peer = peers[message.peer_id];
				var ice_candidate = message.ice_candidate;
				peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
				// break from 'iceCandidate'
				return;
			case 'removePeer':
				var { peer_id } = message;
				console.log('Signaling server said to remove peer:', peer_id);
				// Remove DOM element
				if (peer_id in peer_media_elements) {
					peer_media_elements[peer_id].remove();
				}
				// Close RTCPeerConnection
				if (peer_id in peers) {
					peers[peer_id].close();
				}
				// Remove references to both of these things
				delete peers[peer_id];
				delete peer_media_elements[peer_id];
				// break from 'removePeer'
				return;
			default:
				console.log(
					'Unknown message type received from server -',
					message.type
				);
				return;
		}
	});
*/
	return socket;
};

const socketJoinChannel = (socket, channel_id, userData) => {
	console.log('inside socketJoinChannel');
	socket.send(
		JSON.stringify({
			type: 'join',
			channel_id,
			userData,
		})
	);
};

const socketPartChannel = (socket, channel_id) => {
	socket.send(JSON.stringify({ type: 'part', channel_id }));
};

export { socketJoinChannel, socketPartChannel, createSocket };
export default {
	socketJoinChannel,
	socketPartChannel,
	createSocket,
};
