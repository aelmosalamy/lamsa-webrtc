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

	// Try to fit tiles in 1 screen up to 3 joinees
	const colWidth = [1, 2, 3].includes(joinees.length)
		? 12 / joinees.length
		: 4;

	return (
		<Container fluid className="VideoTiles">
			<Row className="VideoTiles__Row">
				<Col xs={colWidth}>
					<Video
						className="me"
						user={me}
						isLocal={true}
						muted={true}
					/>
				</Col>
				{others.map((other, index, arr) => {
					console.log('remote media length', arr.length);

					return (
						<Col xs={colWidth} key={index}>
							<Video className="remote" user={other} />
						</Col>
					);
				})}
			</Row>
		</Container>
	);
};

export default VideoTiles;
