const indexRouter = require('express').Router();

// Checks if a meeting exists
indexRouter.get('/meetings/:id/exists', (req, res) => {
	const meetingId = req.params.id;
	const rooms = Array.from(req.app.locals.io.sockets.adapter.rooms.keys());

	return res.json(rooms.indexOf(meetingId) === -1 ? false : true);
});

module.exports = indexRouter;
