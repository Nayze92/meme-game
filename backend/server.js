// backend/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createRoom, getRoom, addPlayer, removePlayer, addImage, deleteRoom } = require('./rooms');
const { startSelection, selectImage, swapImage, submitMeme, submitVote, allVotesIn, calculateScores, isGameOver } = require('./gameLogic');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }
});

app.get('/health', (_, res) => res.json({ ok: true }));

// ── Helpers ────────────────────────────────────────────────────
function emitRoom(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  // Don't send timer handle to clients
  const { timer, ...safeRoom } = room;
  io.to(roomId).emit('room-updated', safeRoom);
}

function startTimer(room) {
  let seconds = room.settings.timerSeconds;
  room.timer = setInterval(() => {
    seconds -= 1;
    io.to(room.id).emit('timer-tick', { secondsLeft: seconds });
    if (seconds <= 0) endCreationPhase(room);
  }, 1000);
}

function endCreationPhase(room) {
  if (room.timer) { clearInterval(room.timer); room.timer = null; }
  if (room.phase !== 'creation') return;
  room.phase = 'reveal';
  const memes = room.memes.map(m => {
    const img = room.library.find(i => i.id === m.imageId);
    return { playerId: m.playerId, pseudo: room.players.find(p => p.id === m.playerId)?.pseudo, imageBase64: img?.base64, canvasJSON: m.canvasJSON };
  });
  io.to(room.id).emit('phase-changed', { phase: 'reveal' });
  io.to(room.id).emit('reveal-memes', memes);
}

function startVoteTimeout(room) {
  room.voteTimer = setTimeout(() => {
    if (room.phase === 'vote') endVotePhase(room);
    room.voteTimer = null;
  }, 30000);
}

function endVotePhase(room) {
  if (room.phase !== 'vote') return;
  const { voteCounts } = calculateScores(room);
  room.phase = 'scores';
  const results = room.players.map(p => ({
    playerId: p.id, pseudo: p.pseudo, score: p.score, votesThisRound: voteCounts[p.id] || 0,
    meme: room.memes.find(m => m.playerId === p.id)
  }));
  io.to(room.id).emit('vote-results', results);
  io.to(room.id).emit('phase-changed', { phase: 'scores' });
}

// ── Socket handlers ─────────────────────────────────────────────
io.on('connection', (socket) => {

  socket.on('create-room', ({ pseudo }) => {
    const room = createRoom(socket.id, pseudo);
    socket.join(room.id);
    socket.emit('room-created', { roomId: room.id });
    emitRoom(room.id);
  });

  socket.on('join-room', ({ pseudo, roomId }) => {
    const room = getRoom(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.phase !== 'lobby') return socket.emit('error', { message: 'Game already started' });
    addPlayer(roomId, socket.id, pseudo);
    socket.join(roomId);
    emitRoom(roomId);
  });

  socket.on('upload-image', ({ roomId, base64 }) => {
    const img = addImage(roomId, socket.id, base64);
    if (!img) return socket.emit('error', { message: 'Image too large or room not found' });
    socket.emit('image-uploaded', { imageId: img.id });
    emitRoom(roomId);
  });

  socket.on('update-settings', ({ roomId, settings }) => {
    const room = getRoom(roomId);
    if (!room || room.host !== socket.id) return socket.emit('error', { message: 'Not authorized' });
    Object.assign(room.settings, settings);
    emitRoom(roomId);
  });

  socket.on('start-game', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.host !== socket.id) return socket.emit('error', { message: 'Not authorized' });
    if (room.players.length < 2) return socket.emit('error', { message: 'Need at least 2 players' });
    if (room.library.length < room.players.length) return socket.emit('error', { message: 'Not enough images in library' });
    startSelection(room);
    io.to(roomId).emit('phase-changed', { phase: 'selection' });
    io.to(roomId).emit('selection-turn', { playerId: room.selectionQueue[0] });
    emitRoom(roomId);
  });

  socket.on('select-image', ({ roomId, imageId }) => {
    const room = getRoom(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    const result = selectImage(room, socket.id, imageId);
    if (result.error) return socket.emit('error', { message: result.error });
    if (room.phase === 'creation') {
      io.to(roomId).emit('phase-changed', { phase: 'creation' });
      startTimer(room);
    } else {
      io.to(roomId).emit('selection-turn', { playerId: room.selectionQueue[0] });
    }
    emitRoom(roomId);
  });

  socket.on('swap-image', ({ roomId, imageId }) => {
    const room = getRoom(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    const result = swapImage(room, socket.id, imageId);
    if (result.error) return socket.emit('error', { message: result.error });
    emitRoom(roomId);
  });

  socket.on('submit-meme', ({ roomId, canvasJSON }) => {
    const room = getRoom(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    const result = submitMeme(room, socket.id, canvasJSON);
    if (result.error) return socket.emit('error', { message: result.error });
    // If all players submitted, end creation phase early
    if (room.memes.length >= room.players.length) endCreationPhase(room);
    emitRoom(roomId);
  });

  socket.on('start-vote', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.host !== socket.id) return socket.emit('error', { message: 'Not authorized' });
    if (room.phase !== 'reveal') return socket.emit('error', { message: 'Not in reveal phase' });
    room.phase = 'vote';
    io.to(roomId).emit('phase-changed', { phase: 'vote' });
    startVoteTimeout(room);
    emitRoom(roomId);
  });

  socket.on('submit-vote', ({ roomId, targetId }) => {
    const room = getRoom(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    const result = submitVote(room, socket.id, targetId);
    if (result.error) return socket.emit('error', { message: result.error });
    if (allVotesIn(room)) endVotePhase(room);
    else emitRoom(roomId);
  });

  socket.on('next-round', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.host !== socket.id) return socket.emit('error', { message: 'Not authorized' });
    if (isGameOver(room)) {
      room.phase = 'gameover';
      const finalScores = [...room.players].sort((a, b) => b.score - a.score);
      io.to(roomId).emit('game-over', finalScores);
      io.to(roomId).emit('phase-changed', { phase: 'gameover' });
      emitRoom(roomId);
    } else {
      startSelection(room);
      io.to(roomId).emit('phase-changed', { phase: 'selection' });
      io.to(roomId).emit('selection-turn', { playerId: room.selectionQueue[0] });
      emitRoom(roomId);
    }
  });

  socket.on('disconnect', () => {
    // Find all rooms this socket was in
    for (const [roomId, room] of require('./rooms')._rooms) {
      if (room.players.find(p => p.id === socket.id)) {
        const wasHost = room.host === socket.id;
        removePlayer(roomId, socket.id);
        if (wasHost) {
          io.to(roomId).emit('room-closed', { reason: 'Host disconnected' });
        } else {
          emitRoom(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));
}

module.exports = { app, httpServer, io };
