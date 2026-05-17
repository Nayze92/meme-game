// backend/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*' }
});

app.get('/health', (_, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log('connected:', socket.id);
  socket.on('disconnect', () => console.log('disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));
}

module.exports = { app, httpServer, io };
