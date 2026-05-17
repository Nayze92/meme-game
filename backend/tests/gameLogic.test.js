const { _rooms } = require('../rooms');
const { startSelection, selectImage, swapImage, submitMeme, submitVote, allVotesIn, calculateScores, isGameOver } = require('../gameLogic');

let room;
beforeEach(() => {
  _rooms.clear();
  room = {
    id: 'TEST01',
    host: 's1',
    players: [
      { id: 's1', pseudo: 'Alice', score: 0, swapsLeft: 0 },
      { id: 's2', pseudo: 'Bob', score: 0, swapsLeft: 0 },
    ],
    settings: { totalRounds: 3, timerSeconds: 90, maxSwaps: 2 },
    library: [
      { id: 'img1', base64: 'data1', uploadedBy: 's1' },
      { id: 'img2', base64: 'data2', uploadedBy: 's2' },
      { id: 'img3', base64: 'data3', uploadedBy: 's1' },
    ],
    phase: 'lobby',
    currentRound: 0,
    roundImages: [],
    selectionQueue: [],
    playerImages: {},
    memes: [],
    votes: {},
    timer: null,
  };
});

describe('startSelection', () => {
  test('passe en phase selection et crée la file aléatoire', () => {
    startSelection(room);
    expect(room.phase).toBe('selection');
    expect(room.currentRound).toBe(1);
    expect(room.selectionQueue).toHaveLength(2);
    expect(room.selectionQueue).toContain('s1');
    expect(room.selectionQueue).toContain('s2');
  });

  test('reset les swaps selon les settings', () => {
    room.settings.maxSwaps = 3;
    startSelection(room);
    room.players.forEach(p => expect(p.swapsLeft).toBe(3));
  });

  test('reset memes et votes du round précédent', () => {
    room.memes = [{ playerId: 's1' }];
    room.votes = { s1: 's2' };
    startSelection(room);
    expect(room.memes).toHaveLength(0);
    expect(room.votes).toEqual({});
  });
});

describe('selectImage', () => {
  beforeEach(() => startSelection(room));

  test('le bon joueur peut choisir une image', () => {
    const firstPlayer = room.selectionQueue[0];
    const result = selectImage(room, firstPlayer, 'img1');
    expect(result.error).toBeUndefined();
    expect(room.playerImages[firstPlayer]).toBe('img1');
    expect(room.roundImages).toContain('img1');
  });

  test('retourne une erreur si ce n\'est pas le tour du joueur', () => {
    const notFirst = room.selectionQueue[1];
    const result = selectImage(room, notFirst, 'img1');
    expect(result.error).toBe('not your turn');
  });

  test('passe en phase creation quand tous ont choisi', () => {
    const [first, second] = [...room.selectionQueue];
    selectImage(room, first, 'img1');
    selectImage(room, second, 'img2');
    expect(room.phase).toBe('creation');
  });
});

describe('swapImage', () => {
  beforeEach(() => {
    startSelection(room);
    const [first, second] = [...room.selectionQueue];
    selectImage(room, first, 'img1');
    selectImage(room, second, 'img2');
  });

  test('un joueur peut swapper contre une image de la manche', () => {
    const player = room.players.find(p => p.id === 's1');
    const initialSwaps = player.swapsLeft;
    const result = swapImage(room, 's1', 'img2');
    expect(result.error).toBeUndefined();
    expect(room.playerImages['s1']).toBe('img2');
    expect(player.swapsLeft).toBe(initialSwaps - 1);
  });

  test('retourne erreur si plus de swaps', () => {
    room.players.find(p => p.id === 's1').swapsLeft = 0;
    const result = swapImage(room, 's1', 'img2');
    expect(result.error).toBe('no swaps left');
  });

  test('retourne erreur si image pas dans la manche', () => {
    const result = swapImage(room, 's1', 'img3');
    expect(result.error).toBe('image not in round');
  });
});

describe('submitMeme', () => {
  test('retourne erreur si le joueur n\'a pas d\'image', () => {
    const result = submitMeme(room, 's1', {});
    expect(result.error).toBe('no image selected');
  });

  test('soumet un mème avec l\'image du joueur', () => {
    room.playerImages['s1'] = 'img1';
    const result = submitMeme(room, 's1', { objects: [] });
    expect(result.error).toBeUndefined();
    expect(room.memes).toHaveLength(1);
    expect(room.memes[0]).toMatchObject({ playerId: 's1', imageId: 'img1' });
  });
});

describe('submitVote et calculateScores', () => {
  test('ne peut pas voter pour soi-même', () => {
    const result = submitVote(room, 's1', 's1');
    expect(result.error).toBe('cannot vote for yourself');
  });

  test('calcule les scores correctement', () => {
    room.votes = { s1: 's2', s2: 's1' };
    const { voteCounts } = calculateScores(room);
    expect(voteCounts['s1']).toBe(1);
    expect(voteCounts['s2']).toBe(1);
    expect(room.players.find(p => p.id === 's1').score).toBe(1);
  });

  test('accumule les scores sur plusieurs manches', () => {
    room.players.find(p => p.id === 's1').score = 2;
    room.votes = { s2: 's1' };
    calculateScores(room);
    expect(room.players.find(p => p.id === 's1').score).toBe(3);
  });
});

describe('isGameOver', () => {
  test('retourne true si currentRound >= totalRounds', () => {
    room.currentRound = 3;
    room.settings.totalRounds = 3;
    expect(isGameOver(room)).toBe(true);
  });

  test('retourne false sinon', () => {
    room.currentRound = 1;
    room.settings.totalRounds = 3;
    expect(isGameOver(room)).toBe(false);
  });
});
