const { createRoom, getRoom, addPlayer, removePlayer, addImage, deleteRoom, _rooms } = require('../rooms');

afterEach(() => _rooms.clear());

describe('createRoom', () => {
  test('crée une room avec host et settings par défaut', () => {
    const room = createRoom('socket-1', 'Bilal');
    expect(room.host).toBe('socket-1');
    expect(room.players).toHaveLength(1);
    expect(room.players[0]).toMatchObject({ id: 'socket-1', pseudo: 'Bilal', score: 0 });
    expect(room.phase).toBe('lobby');
    expect(room.settings).toEqual({ totalRounds: 3, timerSeconds: 90, maxSwaps: 2 });
    expect(room.id).toHaveLength(6);
  });

  test('génère des IDs uniques', () => {
    const r1 = createRoom('s1', 'A');
    const r2 = createRoom('s2', 'B');
    expect(r1.id).not.toBe(r2.id);
  });
});

describe('addPlayer', () => {
  test('ajoute un joueur à une room existante', () => {
    const room = createRoom('s1', 'Host');
    const updated = addPlayer(room.id, 's2', 'Guest');
    expect(updated.players).toHaveLength(2);
    expect(updated.players[1]).toMatchObject({ id: 's2', pseudo: 'Guest' });
  });

  test('retourne null si la room n\'existe pas', () => {
    expect(addPlayer('INVALID', 's1', 'X')).toBeNull();
  });

  test('n\'ajoute pas le même joueur deux fois', () => {
    const room = createRoom('s1', 'Host');
    addPlayer(room.id, 's2', 'Guest');
    addPlayer(room.id, 's2', 'Guest');
    expect(getRoom(room.id).players).toHaveLength(2);
  });
});

describe('removePlayer', () => {
  test('supprime un joueur', () => {
    const room = createRoom('s1', 'Host');
    addPlayer(room.id, 's2', 'Guest');
    removePlayer(room.id, 's2');
    expect(getRoom(room.id).players).toHaveLength(1);
  });

  test('supprime la room si elle est vide', () => {
    const room = createRoom('s1', 'Solo');
    removePlayer(room.id, 's1');
    expect(getRoom(room.id)).toBeNull();
  });
});

describe('addImage', () => {
  test('ajoute une image à la bibliothèque', () => {
    const room = createRoom('s1', 'Host');
    const img = addImage(room.id, 's1', 'data:image/png;base64,abc123');
    expect(img).not.toBeNull();
    expect(img.id).toBeDefined();
    expect(getRoom(room.id).library).toHaveLength(1);
  });

  test('refuse les images > 2Mo', () => {
    const room = createRoom('s1', 'Host');
    const bigBase64 = 'x'.repeat(3 * 1024 * 1024);
    const result = addImage(room.id, 's1', bigBase64);
    expect(result).toBeNull();
  });
});
