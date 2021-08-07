import { Toast } from 'react-bootstrap';

const ChatBox = () => {
	return (
		<div className="ChatBox">
			<Toast>
				<Toast.Header>
					<img
						src="holder.js/20x20?text=%20"
						className="rounded mr-2"
						alt=""
					/>
					<strong className="mr-auto">Bootstrap</strong>
					<small>just now</small>
				</Toast.Header>
				<Toast.Body>See? Just like this.</Toast.Body>
			</Toast>
			<Toast>
				<Toast.Header>
					<img
						src="holder.js/20x20?text=%20"
						className="rounded mr-2"
						alt=""
					/>
					<strong className="mr-auto">Bootstrap</strong>
					<small>2 seconds ago</small>
				</Toast.Header>
				<Toast.Body>
					Heads up, toasts will stack automatically
				</Toast.Body>
			</Toast>
		</div>
	);
};

export default ChatBox;
