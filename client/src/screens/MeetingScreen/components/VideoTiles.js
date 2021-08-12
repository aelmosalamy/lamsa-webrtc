import Video from './Video';

const VideoTiles = ({ joinees: [me, ...others] }) => {
	// me = { stream: {...}, userData: {...} }, others = Array<me>
	return (
		<div className="VideoTilesWrapper">
			<div className="VideoTiles">
				<div id="VideoTiles__Row">
					{console.log(me)}
					{me.streams.map(
						(stream, i) =>
							stream && (
								<Video
									key={stream.id}
									stream={stream}
									userData={me.userData}
									isLocal={true}
									isScreen={i !== 0}
								/>
							)
					)}
					{others.map((other, index, arr) => {
						console.log('remote peers count', arr.length);
						// other.userData = joinees.find(
						// 	j => j.id === other.id
						// )?.userData;
						console.log(
							`remote peer [${index + 1}] streams`,
							other.streams
						);
						return other.streams.map(
							(stream, i) =>
								stream && (
									<Video
										key={stream.id}
										className="remote"
										stream={stream}
										userData={other.userData}
										isLocal={false}
										isScreen={i !== 0}
									/>
								)
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default VideoTiles;
