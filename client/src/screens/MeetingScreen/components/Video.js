import React, { useEffect, useRef } from 'react';

const Video = ({ stream, muted = false, ...props }) => {
	const videoRef = useRef(null);

	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.defaultMuted = muted;
		videoRef.current.muted = muted;
	}, [videoRef]);

	useEffect(() => {
		if (!stream) return;
		videoRef.current.srcObject = stream;
	}, [stream]);

	return stream ? (
		<video ref={videoRef} autoPlay {...props} />
	) : (
		<p className="text-danger">Stream loading...</p>
	);
};

export default Video;
