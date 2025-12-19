#!/usr/bin/env node
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT_WS || 3001;

const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`WebSocket server listening on ws://0.0.0.0:${PORT}`);

// Broadcast a message to all clients except optional sender
function broadcast(data, sender) {
  const raw = typeof data === 'string' ? data : JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(raw);
    }
  }
}

wss.on('connection', (ws, req) => {
  const addr = req.socket.remoteAddress + ':' + req.socket.remotePort;
  console.log('client connected', addr);

  ws.on('message', (message) => {
    let parsed = message;
    try {
      parsed = JSON.parse(message.toString());
    } catch (e) {
      // keep raw
    }

    // Simple protocol: forward everything to other clients
    broadcast(parsed, ws);
  });

  ws.on('close', () => {
    console.log('client disconnected', addr);
  });

  ws.on('error', (err) => {
    console.warn('ws error', err.message || err);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => process.exit(0));
});
