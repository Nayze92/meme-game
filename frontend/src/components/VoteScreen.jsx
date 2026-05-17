// frontend/src/components/VoteScreen.jsx
import { useState } from 'react';
import socket from '../socket';

export default function VoteScreen({ room, myId }) {
  const [voted, setVoted] = useState(false);
  const memes = room?.memes || [];

  function handleVote(targetId) {
    socket.emit('submit-vote', { roomId: room.id, targetId });
    setVoted(true);
  }

  return (
    <div data-testid="vote-screen" className="vote-screen">
      <h2>🗳️ Vote !</h2>

      {voted ? (
        <p data-testid="voted-msg">✅ Vote enregistré ! En attente des autres...</p>
      ) : (
        <div data-testid="vote-grid" className="vote-grid">
          {memes
            .filter(m => m.playerId !== myId)
            .map(m => {
              const player = room?.players?.find(p => p.id === m.playerId);
              const img = room?.library?.find(i => i.id === m.imageId);
              return (
                <div key={m.playerId} className="vote-card">
                  {img && <img src={img.base64} alt="mème" />}
                  <button
                    data-testid={`vote-btn-${m.playerId}`}
                    onClick={() => handleVote(m.playerId)}
                  >
                    Voter pour {player?.pseudo || m.playerId}
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
