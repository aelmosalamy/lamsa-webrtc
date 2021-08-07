import { io } from 'socket.io-client';

import React, { useEffect, useState, useRef } from 'react';
import { useHistory, useParams, useRouteMatch, Prompt } from 'react-router';
import {
	Button,
	Form,
	FormControl,
	InputGroup,
	Row,
	Col,
	Navbar,
	Container,
} from 'react-bootstrap';

import { getLocalMediaStream } from '../../utils/mediaFunctions';
import meetingIdUtils from '../../utils/meetingIdUtils';

import BottomNavigation from './components/BottomNavigation';
import ChatBox from './components/ChatBox';
import VideoTiles from './components/VideoTiles';

import './styles.css';
const CHIME = '/chime.webm';

const WEBSOCKETS_SERVER = 'ws://localhost:5000';
const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

var peerConnections = {};
var remoteMediaStreams = {};
var localMediaStream = undefined;

const MeetingScreen = () => {
	const history = useHistory();
	const { meeting_id } = useParams();

	const [userData, setUserData] = useState(
		JSON.parse(sessionStorage.getItem('me'))
	);
	const [stateSocket, setStateSocket] = useState(undefined);
	const [others, setOthers] = useState({});

	const [stateLocalMediaStream, setStateLocalMediaStream] =
		useState(undefined);
	const [stateRemoteMediaStreams, setStateRemoteMediaStreams] = useState({});

	const [messages, setMessages] = useState([]);

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

	function Area(Increment, Count, Width, Height, Margin = 10) {
		let i = 0;
		let w = 0;
		let h = Increment * 0.75 + Margin * 2;
		while (i < Count) {
			if (w + Increment > Width) {
				w = 0;
				h = h + Increment * 0.75 + Margin * 2;
			}
			w = w + Increment + Margin * 2;
			i++;
		}
		if (h > Height) return false;
		else return Increment;
	}

	function Dish() {
		let Margin = 10;
		let Scenary = document.getElementById('VideoTiles__Row');
		let Width = Scenary.offsetWidth - Margin * 2;
		let Height = Scenary.offsetHeight - Margin * 2;
		let Cameras = document.getElementsByClassName(
			'VideoTiles__VideoWrapper'
		);
		let max = 0;

		let i = 1;
		while (i < 5000) {
			let w = Area(i, Cameras.length, Width, Height, Margin);
			if (w === false) {
				max = i - 1;
				break;
			}
			i++;
		}

		max = max - Margin * 2;
		setWidth(max, Margin);
	}

	function setWidth(width, margin) {
		let Cameras = document.getElementsByClassName(
			'VideoTiles__VideoWrapper'
		);
		for (var s = 0; s < Cameras.length; s++) {
			Cameras[s].style.width = width + 'px';
			Cameras[s].style.margin = margin + 'px';
			Cameras[s].style.height = width * 0.75 + 'px';
		}
	}

	window.addEventListener(
		'load',
		function (event) {
			Dish();
			window.onresize = Dish;
		},
		false
	);

	/*
	useEffect(() => {
		// Prompt user before leaving the room, also do necessary clean up
		// (terminate socket connection with server), the termination has to be done
		// manually due to this being a Single Page App, since routes are completely
		// visual, the page is never left/unloaded, hence connected sockets must be
		// closed manually.
		console.log('Started listening to route changes');
	}, []);*/
	// useEffect(() => {
	// 	console.log('stateRemoteMediaStreams', stateRemoteMediaStreams);
	// }, [stateRemoteMediaStreams]);

	// Request media stream and create connection through sockets
	useEffect(() => {
		// Don't run socket initialization if meeting id is not valid
		if (!meetingIdUtils.isValid(meeting_id)) return;
		// Don't run socket initialization if socket exists
		if (stateSocket === undefined) {
			const socket = io(WEBSOCKETS_SERVER);

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

				// Initialize sessionStorage
				// sessionStorage.clear();
				userData &&
					sessionStorage.setItem(
						'me',
						JSON.stringify(
							Object.assign({}, userData, { id: socket.id })
						)
					);
				sessionStorage.setItem('others', JSON.stringify({}));

				socket.emit('join meeting', meeting_id, userData, () => {
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

				// Clear sessionStorage
				// sessionStorage.clear(); (No need)

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

				// Remote the media stream associated with him
				delete remoteMediaStreams[id];
				setStateRemoteMediaStreams(remoteMediaStreams);

				// Remove him from session
				updateSessionStorage(obj => {
					delete obj[id];
					setOthers(obj);
					return obj;
				}, 'others');
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
					// Each stream will cause 2 track event calls (one for "audio" and one for "video"), we will act only in one of them, I choose the audio track because we might have video off in some instances, then we will grab the stream object from the event only once.
					if (e.track.kind === 'video') {
						// It's important that you mutate the local remoteMediaStream as you set the setRemoteMediaStreams state! Otherwise you gonna always have 1 remote media stream at a time
						Object.assign(remoteMediaStreams, {
							// Use peer_id as a key storing that peer's streams
							[peer_id]: e.streams[0],
						});

						setStateRemoteMediaStreams(
							Object.assign({}, remoteMediaStreams)
						);

						// Audio indicator when you start receiving remote streams :D Idk why I love this feature so much
						new Audio(CHIME).play();
					}
				};

				// Add local track to our peer connection
				console.log('Sending localMediaStream over peer connection');
				localMediaStream &&
					localMediaStream.getTracks().forEach(track => {
						console.log(
							'Adding localMediaStream track to peer connection',
							track
						);
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
				}
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
		}
	}, [stateSocket, meeting_id, userData]);

	useEffect(() => {
		// Function returned by the useEffect callback is ran on unmount (idk why i
		// never learned about this till now lol)
		return () => {
			// Terminate socket
			if (stateSocket) {
				stateSocket.disconnect();
				setStateSocket(undefined);
				console.log('SOCKET TERMINATED');
			}
		};
		// If socket isn't a dependency, the value of socket inside this hook will
		// always stay as "undefined", hence keeping socket as dependency updates
		// the value of socket everytime socket changes, think of variable in
		// useEffect as byVal not byRef
	}, [stateSocket]);

	useEffect(() => {
		Dish();
	});

	return (
		<div className="MeetingScreen">
			{meetingIdUtils.isValid(meeting_id) ? (
				<>
					<Prompt
						message={location =>
							`Are you sure you wanna leave your current meeting?`
						}
					/>
					<VideoTiles
						joinees={
							stateSocket
								? [
										{
											id: stateSocket.id,
											userData,
											stream: stateLocalMediaStream,
										},
										...Object.keys(
											stateRemoteMediaStreams
										).map(id => {
											return {
												id,
												userData: others[id],
												stream: stateRemoteMediaStreams[
													id
												],
											};
										}),
								  ]
								: []
						}
					/>
					<ChatBox open={true} />
					<BottomNavigation
						handleMute={handleMute}
						handleVideo={handleVideo}
					/>
				</>
			) : (
				<>
					<p className="text-danger">
						ERROR: Invalid meeting id {meeting_id}
					</p>
				</>
			)}
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
