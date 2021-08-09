import { useState } from 'react';
import { Toast, Form, Button, InputGroup } from 'react-bootstrap';

const ChatBox = ({
	username,
	open,
	messages,
	sendMessageHandler,
	meeting_id,
}) => {
	const [msg, setMsg] = useState('');

	return (
		<div
			className={`ChatBoxWrapper ${open ? '' : 'ChatBoxWrapper--hidden'}`}
		>
			<Toast className="ChatBox">
				<Toast.Header closeButton={false}>
					<strong className="mr-auto">
						Chat <span className="font-italic">({meeting_id})</span>
					</strong>
					{/* <small>2 seconds ago</small> */}
				</Toast.Header>
				<Toast.Body className="ChatBox__body">
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
							<div id="chat-anchor"></div>
						</div>
					) : (
						<p className="font-italic">No messages sent yet!</p>
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
