// backend/gameLogic.js

function startSelection(room) {
  room.phase = 'selection';
  room.currentRound += 1;
  room.roundImages = [];
  room.memes = [];
  room.votes = {};
  room.playerImages = {};
  room.players.forEach(p => { p.swapsLeft = room.settings.maxSwaps; });
  room.selectionQueue = [...room.players.map(p => p.id)].sort(() => Math.random() - 0.5);
  return room;
}

function selectImage(room, socketId, imageId) {
  if (room.selectionQueue[0] !== socketId) return { error: 'not your turn' };
  const image = room.library.find(img => img.id === imageId);
  if (!image) return { error: 'image not found' };

  room.playerImages[socketId] = imageId;
  room.roundImages.push(imageId);
  room.selectionQueue.shift();

  if (room.selectionQueue.length === 0) room.phase = 'creation';
  return { room };
}

function swapImage(room, socketId, imageId) {
  const player = room.players.find(p => p.id === socketId);
  if (!player || player.swapsLeft <= 0) return { error: 'no swaps left' };
  if (!room.roundImages.includes(imageId)) return { error: 'image not in round' };
  const image = room.library.find(img => img.id === imageId);
  if (!image) return { error: 'image not found' };

  room.playerImages[socketId] = imageId;
  player.swapsLeft -= 1;
  return { room };
}

function submitMeme(room, socketId, canvasJSON) {
  room.memes = room.memes.filter(m => m.playerId !== socketId);
  room.memes.push({ playerId: socketId, imageId: room.playerImages[socketId], canvasJSON });
  return room;
}

function submitVote(room, voterId, targetId) {
  if (voterId === targetId) return { error: 'cannot vote for yourself' };
  const target = room.players.find(p => p.id === targetId);
  if (!target) return { error: 'target not found' };
  room.votes[voterId] = targetId;
  return { room };
}

function allVotesIn(room) {
  const eligibleVoters = room.players.filter(p => room.memes.find(m => m.playerId === p.id));
  return eligibleVoters.length > 0 && eligibleVoters.every(p => room.votes[p.id]);
}

function calculateScores(room) {
  const voteCounts = {};
  room.players.forEach(p => { voteCounts[p.id] = 0; });
  Object.values(room.votes).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });
  room.players.forEach(p => { p.score += voteCounts[p.id] || 0; });
  return { room, voteCounts };
}

function isGameOver(room) {
  return room.currentRound >= room.settings.totalRounds;
}

module.exports = { startSelection, selectImage, swapImage, submitMeme, submitVote, allVotesIn, calculateScores, isGameOver };
