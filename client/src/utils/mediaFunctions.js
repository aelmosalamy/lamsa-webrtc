const MUTE_AUDIO_BY_DEFAULT = false;
let local_media_stream = {};
let USE_VIDEO = true;

const attachMediaStreamToElement = (stream, element) => {
	element.srcObject = stream;
};

// Returns stream and runs a callback afterwards
const getLocalMediaStream = async constraints => {
	console.log('Requesting access to media devices.');
	try {
		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		console.log(
			'Access granted to media devices. Stream acquired:',
			stream
		);
		// local_media_stream = stream;
		// let local_media_element = USE_VIDEO
		// ? document.createElement('video')
		// : document.createElement('audio');
		// local_media_element.autoplay = true;
		// local_media_element.muted = true;
		// local_media_element.controls = true;
		// document.body.append(local_media_element);
		// attachMediaStreamToElement(stream, local_media_element);
		return stream;
	} catch (error) {
		console.error('Media devices access request was rejected.', error);
	}
};

export { attachMediaStreamToElement, getLocalMediaStream };
export default { attachMediaStreamToElement, getLocalMediaStream };
