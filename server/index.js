const PORT = process.env.PORT || 5000;

// Utilities
require('colors');
const path = require('path');

const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
	cors: {
		origin: 'http://localhost:3000',
	},
});
const cors = require('cors');

const { logAllSockets, logActualRooms } = require('./utils/socketLogging')

const indexRouter = require('./routers/indexRouter');

// Attach io to app.locals so it is available globally
app.locals.io = io;
//app.use(express.static(path.join(__dirname, 'client', 'build')))
app.use(
	cors({
		origin: 'http://localhost:3000',
	})
);
app.use('/', indexRouter);

// Room events (through adapter)
io.sockets.adapter.on('create-room', room => {
	console.log(`Room [${room}] has been created`.bgMagenta.yellow);
});

io.sockets.adapter.on('delete-room', room => {
	console.log(`Room [${room}] has been deleted`.bgMagenta.yellow);
});

io.sockets.adapter.on('join-room', (room, id) => {
	console.log(`socket [${id}] has joined room [${room}]`.bgMagenta.yellow);

	io.to(room).emit('someone entered', id);
});

io.sockets.adapter.on('leave-room', (room, id) => {
	console.log(`socket [${id}] left room [${room}]`.bgMagenta.yellow);

	io.to(room).emit('someone left', id);
});

// Manage WebSocket connections
io.on('connection', async socket => {
	socket.on('disconnect', async () => {
		console.log(`[${socket.id}] has disconnected.`.red);
    logAllSockets(io)
		/*
		for (var channel in socket.channels) {
			part(channel);
		}
		delete sockets[socket.id];
		console.log(
			`${Object.keys(sockets).length} ${Object.keys(sockets)}`.yellow
		);
    */
	});

	socket.on('join meeting', (meeting_id, ack) => {
		console.log(
			`[${socket.id}] wants to join meeting [${meeting_id}]`.magenta
		);
		// Make the socket join the room with the provided meeting id
		socket.join(meeting_id);
    logActualRooms(io)
		// Acknowledgement is run on the client-side
		ack();
	});

	/*
	socket.on('message', message => {
		message = JSON.parse(message);
		switch (message.type) {
			case undefined || false:
				console.log('No message type provided by client -', message);
				break;
			case 'join':
				console.log(
					`${socket.id} wants to join channel ${
						message.channel_id
					}, he sent the following userData: ${JSON.stringify(
						message.userData
					)}`.blue
				);
				var channel = message.channel_id;
				var userData = message.userData;

				if (channel in socket.channels) {
					console.log(
						`[${socket.id}] ERROR: already exists in ${channel}`.red
					);
					return;
				}

				if (!(channel in app.locals.channels)) {
					app.locals.channels[channel] = {};
				}

				for (id in app.locals.channels[channel]) {
					// Connect newly created peer to existing peers
					app.locals.channels[channel][id].send(
						JSON.stringify({
							type: 'addPeer',
							config: {
								peer_id: socket.id,
								should_create_offer: false,
							},
						})
					);
					// Connect existing peers to our newly created peer
					socket.send(
						JSON.stringify({
							type: 'addPeer',
							config: { peer_id: id, should_create_offer: true },
						})
					);
				}

				app.locals.channels[channel][socket.id] = socket;
				socket.channels[channel] = channel;

				console.log(
					`${Object.keys(sockets).length} ${Object.keys(sockets)}`
						.yellow
				);

				// 'join' handler break
				break;
			case 'part':
				part(message.channel_id);
				// 'part' handler break
				break;
			case 'relayICECandidate':
				var peer_id = message.peer_id;
				var ice_candidate = message.ice_candidate;
				console.log(
					`[${socket.id}] relaying ICE candidate to [${peer_id}]`
						.underline.blue
					// ice_candidate
				);

				if (peer_id in sockets) {
					sockets[peer_id].send(
						JSON.stringify({
							type: 'iceCandidate',
							peer_id: socket.id,
							ice_candidate,
						})
					);
				}
				// 'relayICECandidate' handler break
				break;
			case 'relaySessionDescription':
				var peer_id = message.peer_id;
				var session_description = message.session_description;
				console.log(
					`[${socket.id}] relaying session description to [${peer_id}]`
						.underline.blue
					// session_description
				);

				if (peer_id in sockets) {
					sockets[peer_id].send(
						JSON.stringify({
							type: 'sessionDescription',
							peer_id: socket.id,
							session_description: session_description,
						})
					);
				}
				// 'relaySessionDescription' handler break
				break;
			default:
				console.log(
					'Unknown message type received from client -',
					message.type
				);
				break;
		}
	});

	// Utility function "part"
	const part = channel => {
		console.log(`[${socket.id}] wants to part channel ${channel}`.blue);

		if (!(channel in socket.channels)) {
			console.log(`[${socket.id}] ERROR: not in ${channel}`.red);
			return;
		}

		delete socket.channels[channel];
		delete app.locals.channels[channel][socket.id];

		for (id in app.locals.channels[channel]) {
			app.locals.channels[channel][id].send(
				JSON.stringify({
					type: 'removePeer',
					peer_id: socket.id,
				})
			);
			socket.send(
				JSON.stringify({
					type: 'removePeer',
					peer_id: id,
				})
			);
		}
	};
});
*/
	console.log(`[${socket.id}] has connected.`.green);
  logAllSockets(io)
});

httpServer.listen(PORT, () => {
	console.log(`Listening at ${PORT}...`);
});

httpServer.on('error', error => {
	console.log(error);
});
