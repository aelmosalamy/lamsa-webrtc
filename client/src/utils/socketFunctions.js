import { io } from 'socket.io-client';
import { getLocalMediaStream } from './mediaFunctions';

const WEBSOCKETS_SERVER = 'ws://localhost:5000';
const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

// Media streams
let localMediaStream = null;
let remoteMediaStreams = {};

// Stores peer connections as { id: <Connection Object> }
let peerConnections = {};

const createSocket = (
	meeting_id,
	user_data,
	[others, setOthers],
	setLocalMediaStream,
	setRemoteMediaStreams
) => {
	const socket = io(WEBSOCKETS_SERVER);

	// Fires once the socket "opens" a connection with WebSockets server
	socket.on('connect', async () => {
		console.log(`CONNECTED to signaling server. socket id is ${socket.id}`);

		// Request access to mediaDevices and pass in a callback to peer up!
		localMediaStream = await getLocalMediaStream({
			video: true,
			audio: true,
		});
		setLocalMediaStream([localMediaStream]);

		// Initialize sessionStorage `session` with this socket
		sessionStorage.setItem(
			'session',
			JSON.stringify({
				meeting_id,
				me: Object.assign({ id: socket.id }, user_data),
				others: {},
			})
		);

		socket.emit('join meeting', meeting_id, user_data, () => {
			console.log(`You joined meeting [${meeting_id}].`);
		});

		// Get data of other people in room (if any)
		socket.emit('get others data', meeting_id, others => {
			console.log('Got other joinees data :D', others);
			updateSessionStorage(obj => {
				obj.others = others;
				return obj;
			}, 'session');
			setOthers(others);
		});
	});

	// Fires once the socket "closes" the connection existing between it and the
	// WebSocket server
	socket.on('disconnect', () => {
		console.log('DISCONNECTED from signaling server.');

		// Clear sessionStorage
		sessionStorage.clear();

		socket.emit('leave meeting', meeting_id, user_data, () => {
			console.log('You left the meeting.');
		});

		// Nullify peer streams
		setRemoteMediaStreams({});
		// Close existing peer connections
		for (let peer_id in peerConnections) {
			peerConnections[peer_id].close();
		}
		// Nullify peerConnections
		// setPeerConnections({});
		peerConnections = {};
	});

	socket.on('someone joined', (id, user_data) => {
		console.log(`${id} joined the meeting`);
		// Add him to session
		updateSessionStorage(obj => {
			obj.others[id] = user_data;
			return obj;
		}, 'session');
	});

	socket.on('someone left', id => {
		console.log(`${id} left the meeting`);
		// Remove him from session
		updateSessionStorage(obj => {
			delete obj.others[id];
			return obj;
		}, 'session');
	});

	socket.on('webrtc:addPeer', (peer_id, should_create_offer) => {
		console.log(`Signaling server said to add peer [${peer_id}]`);

		if (peer_id in peerConnections) {
			return console.log('Already connected to peer', peer_id);
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
		/*setPeerConnections(
			Object.assign({}, peerConnections, {
				[peer_id]: peer_connection,
			})
		);*/
		Object.assign(peerConnections, { [peer_id]: peer_connection });
		console.log('Peer added', peerConnections);

		// Listen for 'icecandidate' events on the peer_connection
		peer_connection.addEventListener('icecandidate', ({ candidate }) => {
			if (candidate)
				socket.emit(
					'webrtc:relayICECandidate',
					meeting_id,
					peer_id,
					candidate
				);
		});

		peer_connection.addEventListener('track', e => {
			// Each stream will cause 2 track event calls (one for "audio" and one for "video"), we will act only in one of them, I choose the audio track because we might have video off in some instances, then we will grab the stream object from the event only once.
			if (e.track.kind === 'audio') {
				// It's important that you mutate the local remoteMediaStream as you set the setRemoteMediaStreams state! Otherwise you gonna always have 1 remote media stream at a time
				setRemoteMediaStreams(
					Object.assign(remoteMediaStreams, {
						// Use peer_id as a key storing that peer's streams
						[peer_id]: [...e.streams],
					})
				);
			}
		});

		// Add local track to our peer connection

		localMediaStream &&
			localMediaStream.getTracks().forEach(track => {
				peer_connection.addTrack(track, localMediaStream);
			});

		// Only one side of the peer connection should send offer
		if (should_create_offer) {
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
							socket.emit(
								'webrtc:relaySessionDescription',
								meeting_id,
								peer_id,
								localSessionDescription
							);
							console.log('Offer setLocalDescription succeeded');
						})
						.catch(error => {
							console.error(
								'Offer setLocalDescription failed',
								error
							);
						});
				})
				.catch(error => {
					console.log('Error sending offer:', error);
				});
		}
	});

	socket.on('webrtc:removePeer', peer_id => {
		console.log(`Signaling server said to remove peer: ${peer_id}`);
		// Remove stream from peer streams
		if (peer_id in remoteMediaStreams) {
			// Non-mutating removal
			const streams = Object.assign({}, remoteMediaStreams);
			delete streams.peer_id;

			setRemoteMediaStreams(streams);
		}

		// Close peer connection and delete it from our peerConnections object
		if (peer_id in peerConnections) {
			peerConnections.peer_id.close();
			// Again, non-mutable
			/*const ps = Object.assign({}, peerConnections);
			delete ps.peer_id;

			setPeerConnections(ps);*/
			delete peerConnections[peer_id];
		}
	});

	socket.on('webrtc:sessionDescription', (peer_id, remote_description) => {
		console.log('Remote description received: ', remote_description);

		console.log(peer_id);
		console.log('peerConnections', peerConnections);
		const peer = peerConnections[peer_id];

		const remoteSessionDescription = new RTCSessionDescription(
			remote_description
		);
		// Set remote description
		peer.setRemoteDescription(remoteSessionDescription)
			.then(() => {
				if (remote_description.type == 'offer') {
					console.log('Creating answer');
					peer.createAnswer().then(local_description => {
						console.log(
							`Answer description is: `,
							local_description
						);
						peer.setLocalDescription(local_description)
							.then(() => {
								socket.emit(
									'webrtc:relaySessionDescription',
									meeting_id,
									peer_id,
									local_description
								);
								console.log(
									'Answer setLocalDescription succeeded'
								);
							})
							.catch(error => {
								console.error(
									'Answer setLocalDescription error:',
									error
								);
							});
					});
				}
			})
			.catch(error => {
				console.log('setRemoteDescription error: ', error);
			});
		console.log('Remote session description: ', remoteSessionDescription);
	});

	socket.on('webrtc:iceCandidate', (peer_id, ice_candidate) => {
		const peer = peerConnections[peer_id];

		peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
	});

	return socket;
};

// Given a function and an item, updates sessionStorage
const updateSessionStorage = (fn, item) => {
	if (sessionStorage.getItem(item)) {
		const value = JSON.parse(sessionStorage.getItem(item));
		sessionStorage.setItem(item, JSON.stringify(fn(value)));
	}
};

export { createSocket };
export default { createSocket };
