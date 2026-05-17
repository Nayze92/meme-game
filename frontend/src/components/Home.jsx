// frontend/src/components/Home.jsx
import { useState } from 'react';
import socket from '../socket';

export default function Home({ onJoined }) {
  const [pseudo, setPseudo] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState('choice'); // 'choice' | 'create' | 'join'
  const [error, setError] = useState('');

  function connect() {
    if (!socket.connected) socket.connect();
  }

  function handleCreate() {
    if (!pseudo.trim()) return setError('Entre un pseudo');
    connect();
    socket.emit('create-room', { pseudo: pseudo.trim() });
    socket.once('room-created', () => onJoined());
    socket.once('error', ({ message }) => setError(message));
  }

  function handleJoin() {
    if (!pseudo.trim()) return setError('Entre un pseudo');
    if (!roomId.trim()) return setError('Entre un code de room');
    connect();
    socket.emit('join-room', { pseudo: pseudo.trim(), roomId: roomId.trim().toUpperCase() });
    socket.once('room-updated', () => onJoined());
    socket.once('error', ({ message }) => setError(message));
  }

  return (
    <div data-testid="home" className="home-screen">
      <h1>🎭 Mème Game</h1>

      {mode === 'choice' && (
        <div className="choice-buttons">
          <input
            data-testid="pseudo-input"
            type="text"
            placeholder="Ton pseudo"
            value={pseudo}
            onChange={e => { setPseudo(e.target.value); setError(''); }}
            maxLength={20}
          />
          <button data-testid="create-btn" onClick={() => setMode('create')}>
            Créer une room
          </button>
          <button data-testid="join-btn" onClick={() => setMode('join')}>
            Rejoindre une room
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="create-form">
          <p>Pseudo: <strong>{pseudo || '(vide)'}</strong></p>
          <button data-testid="confirm-create-btn" onClick={handleCreate}>
            Créer la room
          </button>
          <button onClick={() => setMode('choice')}>Retour</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="join-form">
          <input
            data-testid="room-id-input"
            type="text"
            placeholder="Code de la room (ex: LION42)"
            value={roomId}
            onChange={e => { setRoomId(e.target.value); setError(''); }}
            maxLength={6}
          />
          <button data-testid="confirm-join-btn" onClick={handleJoin}>
            Rejoindre
          </button>
          <button onClick={() => setMode('choice')}>Retour</button>
        </div>
      )}

      {error && <p data-testid="error-msg" className="error">{error}</p>}
    </div>
  );
}
