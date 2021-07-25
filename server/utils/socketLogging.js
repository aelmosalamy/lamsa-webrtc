const logAllSockets = io => {
	const sockets = Array.from(io.sockets.sockets.keys());
	console.log(`Sockets (${sockets.length}): [${sockets}]`.cyan);
};

// Log all rooms except the default rooms that are created for each socket
const logActualRooms = io => {
	const rooms = Array.from(io.sockets.adapter.rooms.keys());
	const sockets = Array.from(io.sockets.sockets.keys());

	const actualRooms = rooms.filter(r => !sockets.includes(r));
	console.log(`Rooms (${actualRooms.length}): [${actualRooms}]`.cyan);
};

module.exports = { logAllSockets, logActualRooms };
