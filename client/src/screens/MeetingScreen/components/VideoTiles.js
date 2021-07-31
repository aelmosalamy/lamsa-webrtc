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
	const adaptiveWidth = [1, 2, 3].includes(joinees.length)
		? 12 / joinees.length
		: joinees.length === 4
		? 6
		: 4;
	const colWidth = {
		xs: 12,
		//md: 6,
		md: adaptiveWidth,
	};

	return (
		<Container fluid className="VideoTiles">
			<Row className="VideoTiles__Row">
				<Col xs={colWidth.xs} md={colWidth.md}>
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
						<Col
							xs={colWidth.xs}
							md={colWidth.md}
							xl={colWidth.xl}
							key={index}
						>
							<Video className="remote" user={other} />
						</Col>
					);
				})}
			</Row>
		</Container>
	);
};

export default VideoTiles;
