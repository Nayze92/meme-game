// frontend/src/components/Lobby.jsx
import { useState } from 'react';
import socket from '../socket';

export default function Lobby({ room, myId }) {
  const [settings, setSettings] = useState({ totalRounds: 3, timerSeconds: 90, maxSwaps: 2 });
  const isHost = room?.host === myId;

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      socket.emit('upload-image', { roomId: room.id, base64: ev.target.result });
    };
    reader.readAsDataURL(file);
  }

  function handleSettingsChange(key, value) {
    const updated = { ...settings, [key]: Number(value) };
    setSettings(updated);
    socket.emit('update-settings', { roomId: room.id, settings: updated });
  }

  function handleStartGame() {
    socket.emit('start-game', { roomId: room.id });
  }

  const myImages = room?.library?.filter(img => img.uploadedBy === myId) || [];
  const players = room?.players || [];

  return (
    <div data-testid="lobby" className="lobby-screen">
      <h2>Room: <span data-testid="room-code">{room?.id}</span></h2>

      <section className="players-section">
        <h3>Joueurs ({players.length})</h3>
        <ul>
          {players.map(p => (
            <li key={p.id} data-testid={`player-${p.id}`}>
              {p.pseudo} {p.id === room?.host ? '👑' : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="library-section">
        <h3>Mes images ({myImages.length})</h3>
        <input
          data-testid="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <p>{myImages.length} image(s) uploadée(s)</p>
      </section>

      {isHost && (
        <section data-testid="settings-section" className="settings-section">
          <h3>Paramètres</h3>
          <label>
            Manches:
            <input
              data-testid="rounds-input"
              type="number" min="1" max="10"
              value={settings.totalRounds}
              onChange={e => handleSettingsChange('totalRounds', e.target.value)}
            />
          </label>
          <label>
            Timer (s):
            <input
              data-testid="timer-input"
              type="number" min="30" max="300"
              value={settings.timerSeconds}
              onChange={e => handleSettingsChange('timerSeconds', e.target.value)}
            />
          </label>
          <label>
            Swaps max:
            <input
              data-testid="swaps-input"
              type="number" min="0" max="5"
              value={settings.maxSwaps}
              onChange={e => handleSettingsChange('maxSwaps', e.target.value)}
            />
          </label>
          <button data-testid="start-btn" onClick={handleStartGame}>
            Lancer la partie
          </button>
        </section>
      )}
    </div>
  );
}
