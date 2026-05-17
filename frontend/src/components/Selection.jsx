// frontend/src/components/Selection.jsx
import socket from '../socket';

export default function Selection({ room, myId }) {
  const currentPicker = room?.selectionQueue?.[0];
  const isMyTurn = currentPicker === myId;
  const players = room?.players || [];
  const library = room?.library || [];

  function handleSelectImage(imageId) {
    socket.emit('select-image', { roomId: room.id, imageId });
  }

  return (
    <div data-testid="selection" className="selection-screen">
      <h2>Manche {room?.currentRound} — Choix des images</h2>

      <p data-testid="turn-indicator">
        {isMyTurn
          ? '🎯 C\'est ton tour de choisir !'
          : `⏳ ${players.find(p => p.id === currentPicker)?.pseudo || '...'} choisit...`}
      </p>

      {isMyTurn && (
        <div data-testid="image-grid" className="image-grid">
          {library.map(img => (
            <button
              key={img.id}
              data-testid={`img-btn-${img.id}`}
              className="image-card"
              onClick={() => handleSelectImage(img.id)}
            >
              <img src={img.base64} alt="Choix" />
            </button>
          ))}
        </div>
      )}

      <div className="queue-status">
        <p>Joueurs restants: {room?.selectionQueue?.length || 0}</p>
      </div>
    </div>
  );
}
