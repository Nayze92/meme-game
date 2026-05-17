const { httpServer, io } = require('../server');
const { io: createClient } = require('socket.io-client');

let host, guest, PORT;

beforeAll((done) => {
  httpServer.listen(0, () => {
    PORT = httpServer.address().port;
    done();
  });
});

afterAll((done) => {
  io.close();
  httpServer.close(done);
});

beforeEach((done) => {
  host = createClient(`http://localhost:${PORT}`);
  guest = createClient(`http://localhost:${PORT}`);
  let connected = 0;
  const onConnect = () => { if (++connected === 2) done(); };
  host.on('connect', onConnect);
  guest.on('connect', onConnect);
});

afterEach(() => {
  host.disconnect();
  guest.disconnect();
});

test('host crée une room et reçoit son ID', (done) => {
  host.emit('create-room', { pseudo: 'Alice' });
  host.on('room-created', ({ roomId }) => {
    expect(roomId).toHaveLength(6);
    done();
  });
});

test('guest rejoint la room du host', (done) => {
  host.emit('create-room', { pseudo: 'Alice' });
  host.on('room-created', ({ roomId }) => {
    guest.emit('join-room', { pseudo: 'Bob', roomId });
    guest.on('room-updated', (room) => {
      if (room.players.length === 2) {
        expect(room.players.map(p => p.pseudo)).toContain('Bob');
        done();
      }
    });
  });
});

test('ne peut pas rejoindre une room inexistante', (done) => {
  guest.emit('join-room', { pseudo: 'Bob', roomId: 'XXXXX' });
  guest.on('error', ({ message }) => {
    expect(message).toBe('Room not found');
    done();
  });
});

test('start-game nécessite au moins 2 joueurs', (done) => {
  host.emit('create-room', { pseudo: 'Alice' });
  host.on('room-created', ({ roomId }) => {
    host.emit('start-game', { roomId });
    host.on('error', ({ message }) => {
      expect(message).toContain('2 players');
      done();
    });
  });
});
