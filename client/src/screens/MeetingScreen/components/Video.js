import { cyan } from 'colors';
import React, { useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';

const Video = ({ user, isLocal, muted = false, ...props }) => {
	const videoRef = useRef(null);

	useEffect(() => {
		// Leveraging babel to use new spec's optional chaining :D
		if (!(user?.stream && videoRef.current)) return;
		videoRef.current.srcObject = user.stream;

		videoRef.current.defaultMuted = muted;
		videoRef.current.muted = muted;
	}, [user, videoRef.current]);

	return user?.stream ? (
		<div id={user?.id} className="Video">
			{/* <code>{JSON.stringify(user.userData)}</code> */}
			<video ref={videoRef} autoPlay {...props} />
			<p className="Video__name">{isLocal ? 'You' : user.id} </p>
		</div>
	) : (
		<Spinner animation="grow" role="status" />
	);
};

export default Video;
