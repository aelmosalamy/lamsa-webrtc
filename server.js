const PORT = 3000

// Utilities
const nanoid = require('nanoid').nanoid
require('colors')

const http = require('http')
const WebSocket = require('ws')
const express = require('express')

const app = express()
const server = http.createServer(app)

const wss = new WebSocket.Server({ server })

const sockets = {}
const channels = {}

// Listen to HTTP requests
server.listen(PORT, () => {
  console.log(`Listening at ${PORT}...`)
})

server.on('error', error => {
  console.log(error)
})

// Manage HTTP requests using Express
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client.html')
})

wss.on('error', error => {
  console.log(error)
})

// Manage WebSocket connections
wss.on('connection', socket => {
  socket.id = nanoid()

  socket.channels = {}
  sockets[socket.id] = socket

  socket.on('close', () => {
    for (var channel in socket.channels) {
      part(channel)
    }
    console.log(`[${socket.id}] has disconnected.`.red)
    delete sockets[socket.id]
    console.log(`${Object.keys(sockets).length} ${Object.keys(sockets)}`.yellow)
  })

  socket.on('message', message => {
    message = JSON.parse(message)
    switch (message.type) {
      case undefined || false:
        console.log('No message type provided by client -', message)
        break
      case 'join':
        console.log(
          `${socket.id} wants to join channel ${
            message.channel
          }, he sent the following userData: ${JSON.stringify(
            message.userData
          )}`.blue
        )
        var channel = message.channel
        var userData = message.userData

        if (channel in socket.channels) {
          console.log(`[${socket.id}] ERROR: already exists in ${channel}`.red)
          return
        }

        if (!(channel in channels)) {
          channels[channel] = {}
        }

        for (id in channels[channel]) {
          // Connect newly created peer to existing peers
          channels[channel][id].send(
            JSON.stringify({
              type: 'addPeer',
              config: { peer_id: socket.id, should_create_offer: false },
            })
          )
          // Connect existing peers to our newly created peer
          socket.send(
            JSON.stringify({
              type: 'addPeer',
              config: { peer_id: id, should_create_offer: true },
            })
          )
        }

        channels[channel][socket.id] = socket
        socket.channels[channel] = channel

        console.log(
          `${Object.keys(sockets).length} ${Object.keys(sockets)}`.yellow
        )

        // 'join' handler break
        break
      case 'part':
        part(message.channel)
        // 'part' handler break
        break
      case 'relayICECandidate':
        var peer_id = message.peer_id
        var ice_candidate = message.ice_candidate
        console.log(
          `[${socket.id}] relaying ICE candidate to [${peer_id}]`.underline.blue
          // ice_candidate
        )

        if (peer_id in sockets) {
          sockets[peer_id].send(
            JSON.stringify({
              type: 'iceCandidate',
              peer_id: socket.id,
              ice_candidate,
            })
          )
        }
        // 'relayICECandidate' handler break
        break
      case 'relaySessionDescription':
        var peer_id = message.peer_id
        var session_description = message.session_description
        console.log(
          `[${socket.id}] relaying session description to [${peer_id}]`
            .underline.blue
          // session_description
        )

        if (peer_id in sockets) {
          sockets[peer_id].send(
            JSON.stringify({
              type: 'sessionDescription',
              peer_id: socket.id,
              session_description: session_description,
            })
          )
        }
        // 'relaySessionDescription' handler break
        break
      default:
        console.log('Unknown message type received from client -', message.type)
        break
    }
  })

  // Utility function "part"
  const part = channel => {
    console.log(`[${socket.id}] wants to part channel ${channel}`.blue)

    if (!(channel in socket.channels)) {
      console.log(`[${socket.id}] ERROR: not in ${channel}`.red)
      return
    }

    delete socket.channels[channel]
    delete channels[channel][socket.id]

    for (id in channels[channel]) {
      channels[channel][id].send(
        JSON.stringify({
          type: 'removePeer',
          peer_id: socket.id,
        })
      )
      socket.send(
        JSON.stringify({
          type: 'removePeer',
          peer_id: id,
        })
      )
    }
  }

  console.log(`[${socket.id}] has connected.`.green)
})
