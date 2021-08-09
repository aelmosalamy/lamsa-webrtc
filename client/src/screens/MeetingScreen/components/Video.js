import { cyan } from 'colors';
import React, { useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';

const Video = ({ user, isLocal, muted = false, ...props }) => {
	const videoRef = useRef(null);

	// Leveraging babel to use new spec's optional chaining :D
	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.srcObject = user.stream;

		videoRef.current.defaultMuted = muted;
		videoRef.current.muted = muted;
		console.log('stream set');
	}, [videoRef.current, muted]);

	return user?.stream ? (
		<div className="VideoTiles__VideoWrapper">
			{/* <code>{JSON.stringify(user.userData)}</code> */}
			<video
				{...props}
				className={'VideoTiles__Video ' + props.className}
				id={user.id}
				ref={videoRef}
				autoPlay
			/>
			<p className="VideoTiles__username">
				{isLocal ? 'You' : user.userData?.name}{' '}
			</p>
		</div>
	) : (
		<Spinner animation="grow" role="status" />
	);
};

export default Video;
