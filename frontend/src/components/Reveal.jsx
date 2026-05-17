// frontend/src/components/Reveal.jsx
import { useState } from 'react';
import socket from '../socket';

export default function Reveal({ room, myId, revealMemes }) {
  const [current, setCurrent] = useState(0);
  const isHost = room?.host === myId;
  const memes = revealMemes || [];

  function handleStartVote() {
    socket.emit('start-vote', { roomId: room.id });
  }

  const meme = memes[current];

  return (
    <div data-testid="reveal" className="reveal-screen">
      <h2>Révélation ({current + 1}/{memes.length})</h2>

      {meme ? (
        <div data-testid="meme-display" className="meme-display">
          <p data-testid="meme-author">{meme.pseudo}</p>
          <img
            data-testid="meme-image"
            src={meme.imageBase64}
            alt={`Mème de ${meme.pseudo}`}
          />
        </div>
      ) : (
        <p>En attente des mèmes...</p>
      )}

      <div className="reveal-nav">
        {current > 0 && (
          <button data-testid="prev-btn" onClick={() => setCurrent(c => c - 1)}>
            ← Précédent
          </button>
        )}
        {current < memes.length - 1 && (
          <button data-testid="next-btn" onClick={() => setCurrent(c => c + 1)}>
            Suivant →
          </button>
        )}
      </div>

      {isHost && current === memes.length - 1 && memes.length > 0 && (
        <button data-testid="start-vote-btn" onClick={handleStartVote}>
          Lancer le vote 🗳️
        </button>
      )}
    </div>
  );
}
