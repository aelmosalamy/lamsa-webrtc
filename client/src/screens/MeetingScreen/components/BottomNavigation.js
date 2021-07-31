import React, { useState } from 'react';
import { Navbar } from 'react-bootstrap';

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
			<div className="container">
				<div className="bottom_nav_buttons">
					<div>
						<div onClick={handleOnVideo} className="button">
							<i
								class={`fas fa-video${noVideo ? '-slash' : ''}`}
							></i>
						</div>
						<div onClick={handleOnDeafen} className="button">
							<i
								class={`fas fa-volume-${
									deafened ? 'mute' : 'up'
								}`}
							></i>
						</div>
						<div onClick={handleOnMute} className="button">
							<i
								class={`fas fa-microphone${
									muted ? '-slash' : ''
								}`}
							></i>
						</div>
					</div>
					<button className="end_call">End Call</button>
					<div>
						<div className="button">
							<i class={`fas fa-edit`}></i>
						</div>
						<div className="button">
							<i class={`fas fa-expand`}></i>
						</div>
						<div className="button">
							<i class={`fas fa-ellipsis-h`}></i>
						</div>
					</div>
				</div>
			</div>
		</Navbar>
	);
};

export default BottomNavigation;
