import React, { useEffect, useState, useRef } from 'react';
import {
	Button,
	Form,
	FormControl,
	InputGroup,
	Row,
	Col,
} from 'react-bootstrap';
import { useHistory, useParams, useRouteMatch, Prompt } from 'react-router';

import { createSocket } from '../../utils/socketFunctions';
import { getLocalMediaStream } from '../../utils/mediaFunctions';
import meetingIdUtils from '../../utils/meetingIdUtils';

import Video from './components/Video';
import './styles.css';

const MeetingScreen = () => {
	const history = useHistory();
	const { meeting_id } = useParams();

	const [userData, setUserData] = useState(
		JSON.parse(sessionStorage.getItem('userData'))
	);
	const [socket, setSocket] = useState(undefined);
	const [others, setOthers] = useState({});
	const [peerConnections, setPeerConnections] = useState({});

	const [localMediaStream, setLocalMediaStream] = useState(undefined);
	const [remoteMediaStreams, setRemoteMediaStreams] = useState({});
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
	useEffect(async () => {
		if (!socket) {
			setSocket(
				createSocket(
					meeting_id,
					userData,
					others,
					setLocalMediaStream,
					setRemoteMediaStreams
				)
			);
			console.log('SOCKET CREATED');
		}
	}, [localMediaStream]);


	useEffect(() => {
		console.log('peerConnections', peerConnections);
	}, [peerConnections]);

	useEffect(() => {
		// Function returned by the useEffect callback is ran on unmount (idk why i
		// never learned about this till now lol)
		return () => {
			// Terminate socket
			if (socket) {
				socket.disconnect();
				console.log('SOCKET TERMINATED');
			}
		};
		// If socket isn't a dependency, the value of socket inside this hook will
		// always stay as "undefined", hence keeping socket as dependency updates
		// the value of socket everytime socket changes, think of variable in
		// useEffect as byVal not byRef
	}, [socket]);

	if (meetingIdUtils.isValid(meeting_id)) {
		return (
			<div className="MeetingScreen container">
				<Prompt
					message={location =>
						`Are you sure you wanna leave your current meeting?`
					}
				/>
				<Row>
					<Col xs={6}>
						<Video stream={localMediaStream} muted />
					</Col>
					{Object.values(remoteMediaStreams).map((stream, index) => (
						<Col xs={6}>
							<Video key={index} stream={stream} muted={false} />
						</Col>
					))}
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

export default MeetingScreen;
