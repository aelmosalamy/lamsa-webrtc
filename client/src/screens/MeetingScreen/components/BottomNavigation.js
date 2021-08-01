import React, { useState } from 'react';
import { Container, Navbar } from 'react-bootstrap';

const BottomNavigation = ({ handleMute, handleDeafen, handleVideo }) => {
	const [muted, setMuted] = useState(false);
	const [deafened, setDeafened] = useState(false);
	const [noVideo, setNoVideo] = useState(false);

	const handleOnMute = () => {
		setMuted(!muted);

		handleMute();
	};

	const handleOnDeafen = () => {
		setDeafened(!deafened);

		handleDeafen();
	};

	const handleOnVideo = () => {
		setNoVideo(!noVideo);

		handleVideo();
	};

	return (
		<Navbar className="bottom_nav">
			{/* <Container className="bottom_nav_buttons"> */}
			<div className="buttons">
				<div onClick={handleOnVideo} className="button">
					<i className={`fas fa-video${noVideo ? '-slash' : ''}`}></i>
				</div>
				<div onClick={handleOnDeafen} className="button">
					<i
						className={`fas fa-volume-${deafened ? 'mute' : 'up'}`}
					></i>
				</div>
				<div onClick={handleOnMute} className="button">
					<i
						className={`fas fa-microphone${muted ? '-slash' : ''}`}
					></i>
				</div>
			</div>
			<button className="end_call">Leave Meeting</button>
			<div className="buttons">
				<div className="button">
					<i className={`fas fa-edit`}></i>
				</div>
				<div className="button">
					<i className={`fas fa-expand`}></i>
				</div>
				<div className="button">
					<i className={`fas fa-ellipsis-h`}></i>
				</div>
			</div>
			{/* </Container> */}
		</Navbar>
	);
};

export default BottomNavigation;
