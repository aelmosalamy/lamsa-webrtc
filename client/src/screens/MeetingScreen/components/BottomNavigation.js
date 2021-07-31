import React, { useState } from 'react'
import { Navbar } from 'react-bootstrap'

const BottomNavigation = ({ handleMute, handleDeafen, handleVideo }) => {
	const [muted, setMuted] = useState(false)
	const [deafened, setDeafened] = useState(false)
	const [noVideo, setNoVideo] = useState(false)

	const handleOnMute = () => {
		setMuted(!muted)

		handleMute()
	}

	const handleOnDeafen = () => {
		setDeafened(!deafened)

		handleDeafen()
	}

	const handleOnVideo = () => {
		setNoVideo(!noVideo)

		handleVideo()
	}

	return (
		<Navbar className="bottom_nav" fixed="bottom">
			<div className="container" >
				<div className="bottom_nav_buttons" >
					<div>
					<i onClick={handleOnVideo} class={`fas fa-video${noVideo ? '-slash' : ''}`}></i>
					<i onClick={handleOnDeafen} class={`fas fa-volume-${deafened ? 'mute' : 'up'}`}></i>
					<i onClick={handleOnMute} class={`fas fa-microphone${muted ? '-slash' : ''}`}></i>
					</div>
					<button className="end_call">End Call</button>
					<div>
					<i class={`fas fa-edit`}></i>
					<i class={`fas fa-expand`}></i>
					<i class={`fas fa-ellipsis-h`}></i>
					</div>
				</div>
			</div>
		</Navbar>
	)
}

export default BottomNavigation;