import React, { useEffect, useRef } from 'react';

const Video = ({ stream, muted = false, ...props }) => {
	const videoRef = useRef(null);

	if (stream && videoRef.current) {
		videoRef.current.defaultMuted = muted;
		videoRef.current.muted = muted;

		videoRef.current.srcObject = stream;
	}

	return <video ref={videoRef} autoPlay {...props} />;
};

export default Video;
