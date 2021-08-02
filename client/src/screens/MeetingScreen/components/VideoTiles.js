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

	// Responsive, adaptive layout based on screen width
	const [screenWidth, setScreenWidth] = useState(window.screen.width);


	// Try to fit tiles in 1 screen up to 3 joinees
	const adaptiveWidth = [1, 2].includes(joinees.length)
		? 12 / joinees.length
		: joinees.length === 4
		? 6
		: 4;
	const colWidth = {
		xs: 6,
		sm: 6,
		//md: 6,
		md: adaptiveWidth,
	};

	return (
		<div className="VideoTiles">
			<GridLayout me={me} others={others}/>
		</div>
	);
};

const GridLayout = ({ me, others }) => (
	<div id="VideoTiles__Row">
			<Video className="me" user={me} isLocal={true} muted={true} />
		{others.map((other, index, arr) => {
			console.log('remote media length', arr.length);

			return (
					<Video className="remote" user={other} />
			);
		})}
	</div>
);

const MobileLayout = ({ me, others, colWidth }) => <></>;

export default VideoTiles;
