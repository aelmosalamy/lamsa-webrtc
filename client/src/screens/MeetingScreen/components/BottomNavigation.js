import React, { useState } from 'react';
import { Container, Navbar, Dropdown, DropdownButton } from 'react-bootstrap';

const BottomNavigation = ({ handleMute, handleDeafen, handleVideo }) => {
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
			<button className="end_call">Leave</button>
			<div className="buttons">
				<div className="button" id="edit_button">
					<i className={`fas fa-edit`}></i>
				</div>
				<div className="button" id="eclipse_button">
					<i className={`fas fa-expand`}></i>
				</div>
				<div className="dropup">
					<div className="button dropdown-toggle" id="meeting_controls_dropdown" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<i className={`fas fa-ellipsis-h`}></i>
					</div>
					<div className="dropdown-menu meeting_controls_dropdown" aria-labelledby="meeting_controls_dropdown">
						<div className="button dropdown-item">
							<i className={`fas fa-edit`}></i>
						</div>
						<div className="button dropdown-item">
							<i className={`fas fa-expand`}></i>
						</div>
					</div>
				</div>
			</div>
			{/* </Container> */}
		</Navbar>
	);
};

export default BottomNavigation;
