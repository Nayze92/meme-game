// backend/rooms.js
const { randomUUID } = require('crypto');

const _rooms = new Map();

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function createRoom(hostSocketId, pseudo) {
  let id;
  do { id = generateRoomId(); } while (_rooms.has(id));

  const room = {
    id,
    host: hostSocketId,
    players: [{ id: hostSocketId, pseudo, score: 0, swapsLeft: 0 }],
    settings: { totalRounds: 3, timerSeconds: 90, maxSwaps: 2 },
    library: [],
    phase: 'lobby',
    currentRound: 0,
    roundImages: [],
    selectionQueue: [],
    playerImages: {},
    memes: [],
    votes: {},
    timer: null,
  };
  _rooms.set(id, room);
  return room;
}

function getRoom(roomId) {
  return _rooms.get(roomId) || null;
}

function addPlayer(roomId, socketId, pseudo) {
  const room = _rooms.get(roomId);
  if (!room) return null;
  if (room.players.find(p => p.id === socketId)) return room;
  room.players.push({ id: socketId, pseudo, score: 0, swapsLeft: 0 });
  return room;
}

function removePlayer(roomId, socketId) {
  const room = _rooms.get(roomId);
  if (!room) return null;
  room.players = room.players.filter(p => p.id !== socketId);
  room.selectionQueue = room.selectionQueue.filter(id => id !== socketId);
  if (room.players.length === 0) {
    deleteRoom(roomId);
    return null;
  }
  return room;
}

function addImage(roomId, socketId, base64) {
  const room = _rooms.get(roomId);
  if (!room) return null;
  if (base64.length > 2.8 * 1024 * 1024) return null;
  const image = { id: randomUUID(), base64, uploadedBy: socketId };
  room.library.push(image);
  return image;
}

function deleteRoom(roomId) {
  const room = _rooms.get(roomId);
  if (room) {
    if (room.timer) clearInterval(room.timer);
    if (room.voteTimer) clearTimeout(room.voteTimer);
  }
  _rooms.delete(roomId);
}

module.exports = { createRoom, getRoom, addPlayer, removePlayer, addImage, deleteRoom, _rooms };
