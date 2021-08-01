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

	useEffect(() => {}, [screenWidth]);

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
		<Container fluid className="VideoTiles">
			<GridLayout me={me} others={others} colWidth={colWidth} />
		</Container>
	);
};

const GridLayout = ({ me, others, colWidth }) => (
	<Row className="VideoTiles__Row">
		<Col
			className="VideoTiles__Col"
			xs={colWidth.xs}
			sm={colWidth.sm}
			md={colWidth.md}
		>
			<Video className="me" user={me} isLocal={true} muted={true} />
		</Col>
		{others.map((other, index, arr) => {
			console.log('remote media length', arr.length);

			return (
				<Col
					className="VideoTiles__Col"
					xs={colWidth.xs}
					sm={colWidth.sm}
					md={colWidth.md}
					xl={colWidth.xl}
					key={index}
				>
					<Video className="remote" user={other} />
				</Col>
			);
		})}
	</Row>
);

const MobileLayout = ({ me, others, colWidth }) => <></>;

export default VideoTiles;
