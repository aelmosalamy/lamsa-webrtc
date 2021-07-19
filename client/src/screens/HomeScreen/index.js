import React from 'react'
import { Card, Button, Form, FormControl, InputGroup, Row, Col } from 'react-bootstrap'
import { useHistory } from 'react-router'

import './styles.css'
import image from './wallpaper.jpg'

const HomeScreen = () => {
	let history = useHistory()

	const handleNewMeetingButtonClick = e => {
		history.push('/hello')
	}

	return (
		<div className='HomeScreen screen'>
			<img className='HomeScreen__background' src={image} alt='Wallpaper' />
			<div className='HomeScreen__overlay'></div>
			<div className='HomeScreen__body'>
				<Card id='HomeScreen__card' style={{}}>
					<Card.Body>
						<Card.Title>Welcome to WebRTC Meet!</Card.Title>
						<Card.Subtitle className='mb-4 text-muted'>
							We provide peer-to-peer video and audio chat.
						</Card.Subtitle>
						<Button
							onClick={handleNewMeetingButtonClick}
							variant='primary'
							className='w-100 w-md-auto'
							href='#'
						>
							Create a new meeting
						</Button>
						<p className='text-secondary text-center my-4'>
							or provide a <span className='fw-bold'>Room ID</span> below
						</p>
						<Form id='room-id-form'>
							{/* <InputGroup className='mb-3'> */}
							<Row>
								<Col xs={12} sm='auto'>
									<Form.Control
										id='room-id'
										maxLength='8'
										placeholder='Room ID'
										aria-describedby='room-id-text'
									/>
								</Col>
								<Col xs={12} sm='auto' className='mt-2 mt-sm-0'>
									<Button variant='primary' className='w-100'>
										Enter room
									</Button>
								</Col>
								{/* </InputGroup> */}
							</Row>
						</Form>
					</Card.Body>
				</Card>
			</div>
		</div>
	)
}

export default HomeScreen
