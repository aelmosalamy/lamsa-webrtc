import React, { useState, useEffect } from 'react';
import {
	Card,
	Alert,
	Button,
	Form,
	FormControl,
	InputGroup,
	Row,
	Col,
} from 'react-bootstrap';
import { useHistory } from 'react-router-dom';

import meetingIdUtils from '../../utils/meetingIdUtils';
import UserDataModal from './components/UserDataModal';

import './styles.css';

const HomeScreen = () => {
	const [showModal, setShowModal] = useState(false);
	const [isNewMeeting, setIsNewMeeting] = useState(true);
	const [newMeetingId, setNewMeetingId] = useState(undefined);
	const [invalidMeetingId, setInvalidMeetingId] = useState(undefined);
	const [joinMeetingId, setJoinMeetingId] = useState(undefined);

	const history = useHistory();

	const handleSubmitModal = userData => {
		sessionStorage.setItem('me', JSON.stringify(userData));
		// Create and move to new room
		history.push(`/${isNewMeeting ? newMeetingId : joinMeetingId}`);
	};

	const handleNewMeetingClick = () => {
		setIsNewMeeting(true);
		setNewMeetingId(meetingIdUtils.generateId());

		setShowModal(true);
	};

	const handleJoinMeetingSubmit = async e => {
		e.preventDefault();
		const data = await fetch(
			`/meetings/${joinMeetingId}/exists`
		);
		if (meetingIdUtils.isValid(joinMeetingId) && (await data.json())) {
			setInvalidMeetingId(false);
			setIsNewMeeting(false);
			setShowModal(true);
		} else {
			setInvalidMeetingId(true);
		}
	};

	useEffect(() => {
		if (joinMeetingId)
			setInvalidMeetingId(!meetingIdUtils.isValid(joinMeetingId));
	}, [joinMeetingId]);

	return (
		<div className="HomeScreen container">
			<UserDataModal
				meeting_id={isNewMeeting ? newMeetingId : joinMeetingId}
				show={showModal ? showModal : undefined}
				handleClose={() => setShowModal(false)}
				handleSubmit={handleSubmitModal}
			/>
			<Card id="HomeScreen__card" style={{}}>
				<Card.Body>
					<Card.Title>Welcome to WebRTC Meet!</Card.Title>
					<Card.Subtitle className="mb-4 text-muted">
						We provide peer-to-peer video and audio chat.
					</Card.Subtitle>
					<Button
						onClick={handleNewMeetingClick}
						variant="primary"
						className="w-100 w-md-auto"
						href="#"
					>
						Create a new meeting
					</Button>
					<p className="text-secondary text-center my-4">
						or provide a <span className="fw-bold">Meeting ID</span>{' '}
						below
					</p>
					<Form onSubmit={handleJoinMeetingSubmit}>
						{/* <InputGroup className='mb-3'> */}
						<Row>
							<Col xs={12} sm="auto">
								<Form.Control
									tabIndex={0}
									placeholder="Meeting ID"
									isValid={invalidMeetingId === false}
									isInvalid={invalidMeetingId === true}
									onChange={e => {
										setJoinMeetingId(e.target.value);
									}}
								/>
								<Form.Control.Feedback type="invalid">
									Meeting ID is invalid or doesn't exist
								</Form.Control.Feedback>
							</Col>
							<Col xs={12} sm="auto" className="mt-2 mt-sm-0">
								<Button
									onClick={handleJoinMeetingSubmit}
									variant="primary"
									className="w-100"
								>
									Join meeting
								</Button>
							</Col>
							{/* </InputGroup> */}
						</Row>
					</Form>
				</Card.Body>
			</Card>
		</div>
	);
};

export default HomeScreen;
