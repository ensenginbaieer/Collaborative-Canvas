const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Set the server port
const PORT = process.env.PORT || 8080;

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('A new client has connected');

  // Listen for messages from the client
  ws.on('message', (message) => {
    // Broadcast the message to all other connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('A client has disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});