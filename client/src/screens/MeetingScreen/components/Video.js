import React, { useEffect, useRef } from 'react';

const Video = ({ stream, muted = false, ...props }) => {
	const videoRef = useRef(null);

	useEffect(() => {
		if (!(stream && videoRef.current)) return;
		videoRef.current.srcObject = stream;

		videoRef.current.defaultMuted = muted;
		videoRef.current.muted = muted;
	}, [stream, videoRef.current]);

	return stream ? (
		<video ref={videoRef} autoPlay {...props} />
	) : (
		<p className="text-danger">Stream loading...</p>
	);
};

export default Video;
