import React, { useState } from 'react';
import { Navbar } from 'react-bootstrap';

const BottomNavigation = ({ handleMute, handleVideo, handleToggleChat }) => {
	const [mutedSlash, setMutedSlash] = useState(false);
	const [videoSlash, setVideoSlash] = useState(false);

	return (
		<Navbar className="bottom_nav">
			{/* <Container className="bottom_nav_buttons"> */}
			<div className="buttons">
				<div
					onClick={() => handleVideo(setVideoSlash)}
					className="button"
				>
					<i
						className={`fas fa-video${videoSlash ? '-slash' : ''}`}
					></i>
				</div>
				<div
					onClick={() => handleMute(setMutedSlash)}
					className="button"
				>
					<i
						className={`fas fa-microphone${
							mutedSlash ? '-slash' : ''
						}`}
					></i>
				</div>
			</div>
			<button className="end_call">Leave Meeting</button>
			<div className="buttons">
				<div onClick={handleToggleChat} className="button">
					<i className={`fas fa-comments`}></i>
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
