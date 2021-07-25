const MUTE_AUDIO_BY_DEFAULT = false;
let local_media_stream = {};
let USE_VIDEO = true;

const attachMediaStreamToElement = (stream, element) => {
	element.srcObject = stream;
};

// Returns stream and runs a callback afterwards
const getLocalMediaStream = async (
	constraints,
	onSuccessCallback,
	onErrorCallback
) => {
	// If stream has been assigned already (by this function probably)
	if (local_media_stream) {
		if (onSuccessCallback) onSuccessCallback();
		return;
	}

	console.log('Requesting access to media devices.');
	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(stream => {
			console.log('Access granted to media devices.');
			local_media_stream = stream;
			let local_media_element = USE_VIDEO
				? document.createElement('video')
				: document.createElement('audio');
			local_media_element.autoplay = true;
			local_media_element.muted = true;
			local_media_element.controls = true;
			document.body.append(local_media_element);
			attachMediaStreamToElement(stream, local_media_element);
			if (onSuccessCallback) onSuccessCallback();
		})
		.catch(error => {
			console.log('Media devices access request was rejected.');
			console.error(error);
			if (onErrorCallback) onErrorCallback();
		});
};

export { attachMediaStreamToElement, getLocalMediaStream };
export default { attachMediaStreamToElement, getLocalMediaStream };
