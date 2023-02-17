import { io } from 'socket.io-client';

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useHistory, useParams, Prompt } from 'react-router';

import { getLocalMediaStream } from '../../utils/mediaFunctions';
import meetingIdUtils from '../../utils/meetingIdUtils';
import Dish from '../../utils/adaptiveDish';

import BottomNavigation from './components/BottomNavigation';
import ChatBox from './components/ChatBox';
import VideoTiles from './components/VideoTiles';

import './styles.css';
const CHIME = '/chime.webm';

//const WEBSOCKETS_SERVER = process.env.WEBSOCKETS_SERVER

const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

var peerConnections = {};
var remoteMediaStreams = {};
var localMediaStream = undefined;
var localScreenStream = undefined;

const MeetingScreen = () => {
	const history = useHistory();

	const { meeting_id } = useParams();

	const [userData, setUserData] = useState(
		JSON.parse(sessionStorage.getItem('me'))
	);
	const [others, setOthers] = useState({});

	const [stateSocket, setStateSocket] = useState(undefined);
	const [stateLocalMediaStream, setStateLocalMediaStream] =
		useState(undefined);
	const [stateLocalScreenStream, setStateLocalScreenStream] =
		useState(undefined);
	const [stateRemoteMediaStreams, setStateRemoteMediaStreams] = useState({});

	const [messages, setMessages] = useState([]);
	const [showChat, setShowChat] = useState(false);

	// Request media stream and create connection through sockets
	useEffect(() => {
		// Don't run socket initialization if meeting id is not valid
		if (!meetingIdUtils.isValid(meeting_id)) return;
		// If userData wasn't provided, return back to HomeScreen
		if (!userData) return history.replace('/', 'no_user_data');
		// Don't run socket initialization if socket exists
		if (stateSocket) return;

    // No need to pass server URL, default is window.location, and we are
    // running our server on the same address
		const socket = io();

		// Fires once the socket "opens" a connection with WebSockets server
		socket.on('connect', async () => {
			console.log(
				`CONNECTED to signaling server. socket id is ${socket.id}`
			);

			// Request access to mediaDevices and pass in a callback to peer up!
			localMediaStream = await getLocalMediaStream({
				video: true,
				audio: true,
			});

			setStateLocalMediaStream(localMediaStream);
			// setStateRemoteMediaStreams({});

			// For making videos adapt to available screen width
			window.onresize = Dish;

			const newUserData = Object.assign({}, userData, {
				id: socket.id,
			});

			userData &&
				sessionStorage.setItem('me', JSON.stringify(newUserData));
			setUserData(newUserData);
			sessionStorage.setItem('others', JSON.stringify({}));

			socket.emit('join meeting', meeting_id, newUserData, () => {
				console.log(`You joined meeting [${meeting_id}].`);
			});

			// Get data of other people in room (if any)
			socket.emit('get others data', meeting_id, others => {
				console.log('Got other joinees data :D', others);
				updateSessionStorage(obj => {
					return others;
				}, 'others');
				setOthers(others);
			});
		});

		// Fires once the socket "closes" the connection existing between it and the
		// WebSocket server
		socket.on('disconnect', () => {
			console.log('DISCONNECTED from signaling server.');

			// Nullify peer streams
			remoteMediaStreams = {};
			setStateRemoteMediaStreams(remoteMediaStreams);

			// Close existing peer connections
			for (let peer_id in peerConnections) {
				peerConnections[peer_id].close();
			}
			console.log('Peer connectioned closed.');

			// Reset peerConnections
			peerConnections = {};
		});

		socket.on('someone joined', (id, userData) => {
			console.log(`${id} joined the meeting`);

			// Play a little audio indicator
			new Audio(CHIME).play();

			// Add him to session
			updateSessionStorage(obj => {
				obj[id] = userData;
				setOthers(obj);
				return obj;
			}, 'others');
		});

		socket.on('someone left', id => {
			console.log(`${id} left the meeting`);

			// Remote the media streams associated with him
			delete remoteMediaStreams[id];
			setStateRemoteMediaStreams(remoteMediaStreams);

			// Remove him from session
			updateSessionStorage(obj => {
				delete obj[id];
				setOthers(obj);
				return obj;
			}, 'others');
		});

		socket.on('chat message', msg => {
			console.log(`Message received: "${msg}"`);
			setMessages(old_msgs => old_msgs.concat(msg));
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

			Object.assign(peerConnections, {
				[peer_id]: peer_connection,
			});
			console.log('Peer added', peerConnections);

			peer_connection.onnegotiationneeded = e => {
				if (!should_create_offer) return;
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
								console.log(
									'Offer setLocalDescription succeeded'
								);
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
			};

			// Listen for 'icecandidate' events on the peer_connection
			peer_connection.onicecandidate = e => {
				if (e.candidate)
					socket.emit(
						'webrtc:relayICECandidate',
						meeting_id,
						peer_id,
						e.candidate
					);
			};

			peer_connection.ontrack = e => {
				console.log('A track was received through peer connection');
				console.log(e.streams);
				// Each stream will cause 2 track event calls (one for "audio" and one for "video"), we will act only in one of them, I choose the audio track because we might have video off in some instances, then we will grab the stream object from the event only once.
				if (e.track.kind === 'video') {
					// It's important that you mutate the local remoteMediaStream as you set the setRemoteMediaStreams state! Otherwise you gonna always have 1 remote media stream at a time
					Object.assign(remoteMediaStreams, {
						// Use peer_id as a key storing that peer's streams
						[peer_id]: [].concat(
							remoteMediaStreams[peer_id] || [],
							e.streams
						),
					});

					setStateRemoteMediaStreams(
						Object.assign({}, remoteMediaStreams)
					);

					// Audio indicator when you start receiving remote streams :D Idk why I love this feature so much
					new Audio(CHIME).play();
				}
			};

			// Add local track to our peer connection
			console.log('Trying to send localMediaStream over peer connection');
			localMediaStream &&
				localMediaStream.getTracks().forEach(track => {
					console.log(
						'Adding localMediaStream track to peer connection',
						track
					);
					peer_connection.addTrack(track, localMediaStream);
				});

			// Add local screen track to our peer connection if exists
			// Add stream to all our peer connections
			console.log(
				`Trying to send localScreenStream over peer connection`
			);
			localScreenStream &&
				localScreenStream.getTracks().forEach(track => {
					console.log(
						'Adding localScreenStream track to peer connection',
						track
					);
					peer_connection.addTrack(track, localScreenStream);
				});

			// // Only one side of the peer connection should send offer
			// if (!should_create_offer) return;
			// console.log('Creating RTC offer to ', peer_id);
			// peer_connection
			// 	.createOffer()
			// 	.then(localSessionDescription => {
			// 		console.log(
			// 			'Local offer/session description is: ',
			// 			localSessionDescription
			// 		);
			// 		peer_connection
			// 			.setLocalDescription(localSessionDescription)
			// 			.then(() => {
			// 				socket.emit(
			// 					'webrtc:relaySessionDescription',
			// 					meeting_id,
			// 					peer_id,
			// 					localSessionDescription
			// 				);
			// 				console.log('Offer setLocalDescription succeeded');
			// 			})
			// 			.catch(error => {
			// 				console.error(
			// 					'Offer setLocalDescription failed',
			// 					error
			// 				);
			// 			});
			// 	})
			// 	.catch(error => {
			// 		console.log('Error sending offer:', error);
			// 	});
		});

		socket.on('webrtc:removePeer', peer_id => {
			console.log(`Signaling server said to remove peer: ${peer_id}`);
			// Remove stream from peer streams
			if (peer_id in remoteMediaStreams) {
				// Non-mutating removal

				delete remoteMediaStreams[peer_id];

				setStateRemoteMediaStreams(remoteMediaStreams);
			}

			// Close peer connection and delete it from our peerConnections object
			if (peer_id in peerConnections) {
				console.log('Removing peer', peerConnections);
				peerConnections[peer_id].close();

				delete peerConnections[peer_id];
			}
		});

		socket.on(
			'webrtc:sessionDescription',
			(peer_id, remote_description) => {
				console.log(
					'Remote description received: ',
					remote_description
				);

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
				console.log(
					'Remote session description: ',
					remoteSessionDescription
				);
			}
		);

		socket.on('webrtc:iceCandidate', (peer_id, ice_candidate) => {
			const peer = peerConnections[peer_id];

			peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
		});

		setStateSocket(socket);
		console.log('SOCKET CREATED');
	}, [stateSocket, meeting_id, userData]);

	useEffect(() => {}, [stateLocalScreenStream]);

	const chat_SendMsgHandler = msg => {
		console.log('Message passed to server...');

		stateSocket?.emit('chat message', meeting_id, msg, success => {
			if (!success) return console.error('Message sending failed!');
			// This is our message, make sure it says "You"
			Object.assign(msg, { sender: 'You' });
			setMessages(old_msg => old_msg.concat(msg));
			console.log('SUCCESS: Message sent');
		});
	};

	const handleToggleChat = () => {
		setShowChat(!showChat);
	};

	const handleMute = setMutedSlash => {
		try {
			console.log('MUTE');
			const track = stateLocalMediaStream?.getAudioTracks()[0];

			track.enabled = !track.enabled;
			setMutedSlash(!track.enabled);
		} catch (error) {
			console.error(error);
		}
	};

	const handleVideo = setVideoSlash => {
		try {
			console.log('VIDEO');

			const track = stateLocalMediaStream?.getVideoTracks()[0];

			track.enabled = !track.enabled;
			setVideoSlash(!track.enabled);
		} catch (error) {
			console.error(error);
		}
	};

	const startScreenSharing = async (screenSharing, setScreenSharing) => {
		// If doesn't exist or stopped
		if (
			localScreenStream === undefined ||
			localScreenStream.getVideoTracks()[0].readyState === 'ended'
		) {
			try {
				console.log('SCREEN SHARE');
				localScreenStream =
					await navigator.mediaDevices.getDisplayMedia();
				setStateLocalScreenStream(localScreenStream);

				// Add stream to all our peer connections
				for (let id in peerConnections) {
					console.log(peerConnections[id]);
					console.log(
						`Sending screen stream through peer connect ${id}`
					);
					let pc = peerConnections[id];
					localScreenStream.getTracks().forEach(track => {
						pc.addTrack(track, localScreenStream);
						console.log(
							'Screen stream added to peer connection',
							track
						);
					});
					setScreenSharing(true);
				}
				console.log('Screen stream', localScreenStream);
			} catch (err) {
				console.error(err);
			}
		} else {
			localScreenStream = undefined;
			setStateLocalScreenStream(localScreenStream);

			console.log('SCREEN SHARE STOPPED');
		}
	};

	useEffect(() => {
		// Function returned by the useEffect callback is ran on unmount (idk why i
		// never learned about this till now lol)
		return () => {
			// Terminate socket
			if (stateSocket) {
				stateSocket.disconnect();
				setStateSocket(undefined);
				console.log('SOCKET TERMINATED');
				// Clean up onresize handler as it is no longer needed when MeetingScreen is unmounted
				window.onresize = undefined;
			}
		};
		// If socket isn't a dependency, the value of socket inside this hook will
		// always stay as "undefined", hence keeping socket as dependency updates
		// the value of socket everytime socket changes, think of variable in
		// useEffect as byVal not byRef
	}, [stateSocket]);

	// Responsive video resizing whenever a new client enters or leaves
	useEffect(() => {
		Dish();
	}, [
		stateLocalMediaStream,
		stateLocalScreenStream,
		stateRemoteMediaStreams,
	]);

	return (
		<div className="MeetingScreen">
			{
				/*meetingIdUtils.isValid(meeting_id) && */ stateSocket ? (
					<>
						<Prompt
							when={!!userData}
							message={location =>
								`Are you sure you wanna leave your current meeting?`
							}
						/>
						<div className="MeetingScreen__UpperSection">
							{
								<VideoTiles
									joinees={[
										{
											userData: Object.assign(
												{},
												userData,
												{ id: stateSocket.id }
											),
											streams: [
												stateLocalMediaStream,
												stateLocalScreenStream,
											],
										},
										...Object.keys(
											stateRemoteMediaStreams
										).map(id => {
											return {
												userData: Object.assign(
													{},
													others[id],
													{ id }
												),
												streams:
													stateRemoteMediaStreams[id],
											};
										}),
									]}
								/>
							}
							<ChatBox
								username={userData?.name}
								open={showChat}
								messages={messages}
								sendMessageHandler={chat_SendMsgHandler}
								meeting_id={meeting_id}
							/>
						</div>
						<BottomNavigation
							handleMute={handleMute}
							handleVideo={handleVideo}
							handleToggleChat={handleToggleChat}
							startScreenSharing={startScreenSharing}
						/>
					</>
				) : (
					<>
						<p className="text-danger">Loading [{meeting_id}]</p>
					</>
				)
			}
		</div>
	);
};

// Given a function and an item, updates sessionStorage
const updateSessionStorage = (fn, item) => {
	if (sessionStorage.getItem(item)) {
		const value = JSON.parse(sessionStorage.getItem(item));
		sessionStorage.setItem(item, JSON.stringify(fn(value)));
	}
};

export default MeetingScreen;
