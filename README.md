# lamsa-webrtc

This is a web conferencing application I created to learn more about WebRTC and WebSockets. The application features real-time video, audio, screen sharing and texting plus the ability to create, share and join rooms. Under the hood, lamsa-webrtc makes use of [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) and WebSockets to coordinate and connect peers over the network.

## Project structure
It is not the most polished thing I have written, but I am sure you can manage your way through. In this repo I have provided two version:
1. A proof-of-concept with simply two files `server.js` and `client.html` available in the root of this repo demonstrating WebRTC capabilities + raw WebSockets.
2. A more polished version residing at `/server` and `/client` directories respectively. The server uses Express + socket.io for room management and WebRTC signaling, while the client uses React and socket.io client. 
