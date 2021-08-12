import { cyan } from 'colors';
import React, { useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';

const Video = ({ stream, userData, isLocal, isScreen, ...props }) => {
	const videoRef = useRef(null);

	// Leveraging babel to use new spec's optional chaining :D
	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.srcObject = stream;

		videoRef.current.defaultMuted = isLocal;
		videoRef.current.muted = isLocal;
	}, [videoRef.current]);

	return stream ? (
		<div className={'VideoTiles__VideoWrapper'}>
			{/* <code>{JSON.stringify(user.userData)}</code> */}
			<video
				{...props}
				className={`VideoTiles__Video ${!isScreen && 'me'}`}
				id={userData.id}
				ref={videoRef}
				autoPlay
			/>
			<p className="VideoTiles__username">
				{isLocal ? 'You' : userData.name} {isScreen && '(Screen)'}
			</p>
		</div>
	) : (
		<Spinner animation="grow" role="status" />
	);
};

export default Video;
