import { useState, useEffect } from 'react';
import {
	Button,
	Form,
	FormControl,
	InputGroup,
	Row,
	Col,
	Container,
} from 'react-bootstrap';
import Video from './Video';

const VideoTiles = ({ joinees }) => {
	// me = { stream: {...}, userData: {...} }, others = Array<me>
	const [me, ...others] = joinees;

	return (
		<div className="VideoTiles">
			<div id="VideoTiles__Row">
				<Video className="me" user={me} isLocal={true} muted={true} />
				{others.map((other, index, arr) => {
					console.log('remote media length', arr.length);
					// other.userData = joinees.find(
					// 	j => j.id === other.id
					// )?.userData;
					return (
						<Video key={index} className="remote" user={other} />
					);
				})}
			</div>
		</div>
	);
};

export default VideoTiles;
