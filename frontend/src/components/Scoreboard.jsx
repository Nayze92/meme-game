// frontend/src/components/Scoreboard.jsx
import socket from '../socket';

export default function Scoreboard({ room, myId, voteResults, finalScores, isLastRound }) {
  const isHost = room?.host === myId;

  function handleNextRound() {
    socket.emit('next-round', { roomId: room.id });
  }

  const results = voteResults || [];
  const scores = finalScores || [];

  return (
    <div data-testid="scoreboard" className="scoreboard-screen">
      <h2>{isLastRound ? '🏆 Résultats finaux' : `Manche ${room?.currentRound} — Résultats`}</h2>

      <ul data-testid="results-list" className="results-list">
        {results.map((r, i) => (
          <li key={r.playerId} data-testid={`result-${r.playerId}`}>
            <strong>{r.pseudo}</strong>: +{r.votesThisRound} vote(s) → {r.score} pts
          </li>
        ))}
      </ul>

      {isLastRound && scores.length > 0 && (
        <div data-testid="final-podium" className="final-podium">
          <h3>Podium</h3>
          {scores.map((p, i) => (
            <p key={p.id} data-testid={`podium-${i}`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.pseudo} — {p.score} pts
            </p>
          ))}
        </div>
      )}

      {isHost && !isLastRound && (
        <button data-testid="next-round-btn" onClick={handleNextRound}>
          Manche suivante →
        </button>
      )}
    </div>
  );
}
