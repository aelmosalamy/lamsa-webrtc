import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useHistory } from 'react-router';

import selectElementContents from '../../../utils/selectElementContents';

const UserDataModal = ({ show, handleClose, handleSubmit, meeting_id }) => {
	const [name, setName] = useState('');

	const history = useHistory();

	return (
		<Modal show={show ? show : undefined} onHide={() => {}}>
			<Modal.Header>
				<Modal.Title>
					Joining room{' '}
					<span
						onDoubleClick={({ target }) => {
							selectElementContents(target);
						}}
						className="text-info"
					>
						{meeting_id}
					</span>
				</Modal.Title>
			</Modal.Header>
			<Form
				onSubmit={e => {
					handleSubmit({ name });
					e.preventDefault();
				}}
			>
				<Modal.Body>
					<Form.Group>
						<Form.Label>Your name?</Form.Label>
						<Form.Control
							autoFocus
							onChange={e => setName(e.target.value)}
						/>
						<Form.Text className="text-muted">
							*This name is going to be displayed to others in the
							meeting
						</Form.Text>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="outline-secondary" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" variant="primary">
						Join
					</Button>
				</Modal.Footer>
			</Form>
		</Modal>
	);
};

export default UserDataModal;
