require('dotenv').config();

const PORT = process.env.PORT || 5000;
// Utilities
require('colors');
const path = require('path');

const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);

const socket_server_config = {};
if (process.env.NODE_ENV === 'development') {
	socket_server_config.cors = { origin: 'http://localhost:3000' };
}

const io = require('socket.io')(httpServer, socket_server_config);
const cors = require('cors');

const { logAllSockets, logActualRooms } = require('./utils/socketLogging');

const indexRouter = require('./routers/indexRouter');

// Attach io to app.locals so it is available globally
app.locals.io = io;

//app.use(express.static(path.join(__dirname, 'client', 'build')))
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
	app.get('/', function (req, res) {
		res.sendFile(
			path.join(__dirname, '..', 'client', 'build', 'index.html')
		);
	});
}

if (process.env.NODE_ENV === 'development') {
	app.use(
		cors({
			origin: 'http://localhost:3000',
		})
	);
}

app.use('/', indexRouter);

// Room events (through adapter), we will use these just for logging, since we
// need to pass some data
io.sockets.adapter.on('create-room', room => {
	console.log(`Room [${room}] has been created`.bgMagenta.yellow);
});

io.sockets.adapter.on('delete-room', room => {
	console.log(`Room [${room}] has been deleted`.bgMagenta.yellow);
});

io.sockets.adapter.on('join-room', (room, id) => {
	console.log(`socket [${id}] has joined room [${room}]`.bgMagenta.yellow);
	// Tell everyone in the room that someone joined them & give some data about him as well
	const socket = Object.fromEntries(io.sockets.sockets.entries())[id];
	io.to(room).except(id).emit('someone joined', id, socket.data);
});

io.sockets.adapter.on('leave-room', (room, id) => {
	console.log(`socket [${id}] has left room [${room}]`.bgMagenta.yellow);
	// Tell the rest of people in the room that someone left
	io.to(room).except(id).emit('someone left', id);
});

// Manage WebSocket connections
io.on('connection', socket => {
	console.log(`[${socket.id}] has connected.`.green);
	logAllSockets(io);

	socket.on('disconnect', () => {
		console.log(`[${socket.id}] has disconnected.`.red);
		logAllSockets(io);
	});

	socket.on('join meeting', async (meeting_id, user_data, ack) => {
		socket.data = user_data;

		console.log(
			`[${socket.id}] wants to join room [${meeting_id}]`.magenta
		);

		// Make sockets in meeting add the incoming socket (who made this event) as
		// peer
		const sockets_already_in_meeting = await io
			.in(meeting_id)
			.fetchSockets();
		// Think of peering as a two-dimensional process, each node (in this case a
		// socket) has to add the opposite node as a peer.
		//
		// Tell sockets in room to add the new joinee (me) as peer
		socket.to(meeting_id).emit('webrtc:addPeer', socket.id, false);
		console.log(
			`Told sockets in [${meeting_id}] to add [${socket.id}] as peer`
				.bgBlue.cyan
		);
		// Tell new joinee (me) to add people in room as peers
		for (let s of sockets_already_in_meeting) {
			io.to(socket.id).emit('webrtc:addPeer', s.id, true);
			console.log(
				`Told socket [${socket.id}] to add socket [${s.id}] of [${meeting_id}] as peer`
					.bgBlue.cyan
			);
		}

		// Make the socket join the room
		socket.join(meeting_id);
		logActualRooms(io);
		// Acknowledgement is run on the client-side
		ack();
	});

	socket.on('leave meeting', async (meeting_id, user_data, ack) => {
		console.log(
			`[${socket.id}] wants to leave room [${meeting_id}]`.magenta
		);

		// Tear peers
		console.log(`Tearing down peers associated with [${socket.id}]`);

		const sockets_left_in_meeting = await io.in(meeting_id).fetchSockets();

		for (let s of sockets_left_in_meeting) {
			io.to(s.id).emit('webrtc:removePeer', socket.id);

			io.to(socket.id).emit('webrtc:removePeer', s.id);

			console.log(`Tore peers with socket ${s.id}`);
		}

		// Make the socket leave the room
		socket.leave(meeting_id);
		logActualRooms(io);

		// Acknowledgement is run on the client-side
		ack();

		socket.disconnect();
	});

	socket.on('chat message', (meeting_id, msg, ack) => {
		try {
			// Send to everyone in room and including self
			socket.to(meeting_id).emit('chat message', msg);
			console.log(
				`A message was sent in meeting [${meeting_id}]: ${msg}`
			);
			// Report back that the message was sent successfully
			ack(true);
		} catch (error) {
			ack(false);
		}
	});

	socket.on('get others data', async (meeting_id, ack) => {
		try {
			let others = await io
				.in(meeting_id)
				.except(socket.id)
				.fetchSockets();

			others = Object.assign(
				{},
				...others.map(socket => {
					return { [socket.id]: socket.data };
				})
			);
			// Send the data to the client-side socket who requested it by passing it through the acknowledgment
			return ack(others);
		} catch (error) {
			return console.log(error);
		}
	});

	socket.on(
		'webrtc:relaySessionDescription',
		async (meeting_id, peer_id, session_description) => {
			console.log(
				`[${socket.id}] relaying session description to [${peer_id}]`
					.bgBlue.cyan
			);

			const sockets = await io.in(meeting_id).fetchSockets();

			// relay the session description to the given peer
			for (let s of sockets) {
				if (s.id == peer_id) {
					s.emit(
						'webrtc:sessionDescription',
						socket.id,
						session_description
					);
					return;
				}
			}
		}
	);

	socket.on(
		'webrtc:relayICECandidate',
		async (meeting_id, peer_id, ice_candidate) => {
			console.log(
				`[${socket.id}] relaying ICE candidate to [${peer_id}]`.bgBlue
					.cyan
			);

			const sockets = await io.in(meeting_id).fetchSockets();

			// relay the ice candidate to the given peer
			for (let s of sockets) {
				if (s.id == peer_id) {
					s.emit('webrtc:iceCandidate', socket.id, ice_candidate);
					return;
				}
			}
		}
	);
});

httpServer.listen(PORT, () => {
	console.log(`Listening at ${PORT}...`);
});

httpServer.on('error', error => {
	console.log(error);
});
