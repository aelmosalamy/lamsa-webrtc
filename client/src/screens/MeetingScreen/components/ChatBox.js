import { useState } from 'react';
import { Toast, Form, Button, InputGroup } from 'react-bootstrap';

const ChatBox = ({ username, open, messages, sendMessageHandler }) => {
	const [msg, setMsg] = useState('');

	return (
		<div className="ChatBox">
			<Toast>
				<Toast.Header>
					<strong className="mr-auto">Chat</strong>
					{/* <small>2 seconds ago</small> */}
				</Toast.Header>
				<Toast.Body>
					{messages.length ? (
						<div className="ChatBox__messages">
							{messages.map((msg, i) => (
								<p className="ChatBox__message" key={i}>
									<strong className="mr-1">
										{msg.sender}
									</strong>
									<span>{msg.body}</span>
								</p>
							))}
						</div>
					) : (
						<p className="text-danger">No messages sent yet!</p>
					)}
					{/* What's in your mind? */}
					<Form
						onSubmit={e => {
							e.preventDefault();
							// Don't send if empty :)
							if (!msg.trim()) return;

							sendMessageHandler({ sender: username, body: msg });
							setMsg('');

							// e.preventDefault();
						}}
					>
						<InputGroup className="mt-2" size="sm">
							<Form.Control
								onChange={e => setMsg(e.target.value)}
								value={msg}
								placeholder="Type here"
								type="text"
							/>
							<InputGroup.Append>
								<Button type="submit">
									<i className="px-1 fa fa-send"></i>
								</Button>
							</InputGroup.Append>
						</InputGroup>
					</Form>
				</Toast.Body>
			</Toast>
		</div>
	);
};

export default ChatBox;
