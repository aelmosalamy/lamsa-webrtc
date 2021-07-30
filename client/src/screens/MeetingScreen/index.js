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
} from 'react-bootstrap';

import { getLocalMediaStream } from '../../utils/mediaFunctions';
import meetingIdUtils from '../../utils/meetingIdUtils';

import Video from './components/Video';
import './styles.css';

const WEBSOCKETS_SERVER = 'ws://localhost:5000';
const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

var peerConnections = {};
var remoteMediaStreams = {};
var localMediaStream = undefined;

const MeetingScreen = () => {
	const history = useHistory();
	const { meeting_id } = useParams();

	const [userData, setUserData] = useState(
		JSON.parse(sessionStorage.getItem('userData'))
	);
	const [stateSocket, setStateSocket] = useState(undefined);
	const [others, setOthers] = useState({});

	const [stateLocalMediaStream, setStateLocalMediaStream] =
		useState(undefined);
	const [stateRemoteMediaStreams, setStateRemoteMediaStreams] = useState({});
	/*
	useEffect(() => {
		// Prompt user before leaving the room, also do necessary clean up
		// (terminate socket connection with server), the termination has to be done
		// manually due to this being a Single Page App, since routes are completely
		// visual, the page is never left/unloaded, hence connected sockets must be
		// closed manually.
		console.log('Started listening to route changes');
	}, []);*/

	// Request media stream and create connection through sockets
	useEffect(() => {
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

				// Initialize sessionStorage `session` with this socket
				sessionStorage.setItem(
					'session',
					JSON.stringify({
						meeting_id,
						me: Object.assign({ id: socket.id }, userData),
						others: {},
					})
				);

				socket.emit('join meeting', meeting_id, userData, () => {
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

				// Nullify peer streams
				remoteMediaStreams = {};
				setStateRemoteMediaStreams(remoteMediaStreams);

				console.log('Closing existing peer connections');
				// Close existing peer connections
				for (let peer_id in peerConnections) {
					peerConnections[peer_id].close();
				}
				// Nullify peerConnections
				peerConnections = {};
			});

			socket.on('someone joined', (id, userData) => {
				console.log(`${id} joined the meeting`);
				// Add him to session
				updateSessionStorage(obj => {
					obj.others[id] = userData;
					return obj;
				}, 'session');
			});

			socket.on('someone left', id => {
				console.log(`${id} left the meeting`);

				// Remote the media stream associated with him
				delete remoteMediaStreams[id];
				setStateRemoteMediaStreams(remoteMediaStreams);

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
							[peer_id]: [e.streams[0]],
						});

						setStateRemoteMediaStreams(
							Object.assign({}, remoteMediaStreams)
						);
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
	}, []);

	useEffect(() => {
		console.log(
			'stateRemoteMediaStreams was mutated',
			stateRemoteMediaStreams
		);
	}, [stateRemoteMediaStreams]);

	// useEffect(() => {
	// 	console.log('peerConnections', peerConnections);
	// }, [peerConnections]);

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

	if (meetingIdUtils.isValid(meeting_id)) {
		return (
			<div className="MeetingScreen container">
				<Prompt
					message={location =>
						`Are you sure you wanna leave your current meeting?`
					}
				/>
				<Row>
					<Col xs={3}>
						{stateSocket && stateSocket.id}
						<Video
							className="me"
							stream={stateLocalMediaStream}
							muted={true}
						/>
					</Col>
				</Row>
				<Row id="123"></Row>
				<Row>
					{Object.keys(stateRemoteMediaStreams).map(
						(key, index, arr) => {
							console.log('remote media length', arr.length);
							const stream = stateRemoteMediaStreams[key][0];

							return (
								<Col key={index} xs={3}>
									<p>{key}</p>
									<Video className="remote" stream={stream} />
								</Col>
							);
						}
					)}
				</Row>
				<p>{meeting_id}</p>
				<p>Name: {userData && userData.name}</p>
				<h1>Others</h1>
				<ul>
					{Object.keys(others).map((o, index) => (
						<li key={index}>
							{JSON.stringify(others[o], null, 3)}
						</li>
					))}
				</ul>
				<Button>Click me</Button>
			</div>
		);
	} else {
		return <p className="text-danger">Invalid meeting id {meeting_id}</p>;
	}
};

// Given a function and an item, updates sessionStorage
const updateSessionStorage = (fn, item) => {
	if (sessionStorage.getItem(item)) {
		const value = JSON.parse(sessionStorage.getItem(item));
		sessionStorage.setItem(item, JSON.stringify(fn(value)));
	}
};

export default MeetingScreen;
