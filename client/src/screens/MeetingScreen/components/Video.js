import React, { useEffect, useRef } from 'react';

const Video = ({ stream, muted = false, ...props }) => {
	const videoRef = useRef(null);

	useEffect(() => {
		if (!(stream && videoRef.current)) return;

		videoRef.current.defaultMuted = muted;
		videoRef.current.muted = muted;
		videoRef.current.srcObject = stream;
	}, [videoRef, stream, muted]);

	return <video ref={videoRef} autoPlay {...props} />;
};

export default Video;
