import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockSocket = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock('../socket', () => ({ default: mockSocket }));

import Scoreboard from './Scoreboard';

const room = { id: 'LION42', host: 'p1', currentRound: 1 };
const voteResults = [
  { playerId: 'p1', pseudo: 'Alice', score: 2, votesThisRound: 1 },
  { playerId: 'p2', pseudo: 'Bob', score: 1, votesThisRound: 0 },
];
const finalScores = [
  { id: 'p1', pseudo: 'Alice', score: 3 },
  { id: 'p2', pseudo: 'Bob', score: 1 },
];

describe('Scoreboard', () => {
  beforeEach(() => vi.clearAllMocks());

  test('affiche les résultats de la manche', () => {
    render(<Scoreboard room={room} myId="p1" voteResults={voteResults} isLastRound={false} />);
    expect(screen.getByTestId('result-p1')).toHaveTextContent('Alice');
    expect(screen.getByTestId('result-p2')).toHaveTextContent('Bob');
  });

  test('affiche le bouton "Manche suivante" au host si pas la fin', () => {
    render(<Scoreboard room={room} myId="p1" voteResults={voteResults} isLastRound={false} />);
    expect(screen.getByTestId('next-round-btn')).toBeInTheDocument();
  });

  test('cache le bouton "Manche suivante" si c\'est la fin', () => {
    render(<Scoreboard room={room} myId="p1" voteResults={voteResults} finalScores={finalScores} isLastRound={true} />);
    expect(screen.queryByTestId('next-round-btn')).not.toBeInTheDocument();
  });

  test('affiche le podium final si isLastRound', () => {
    render(<Scoreboard room={room} myId="p1" voteResults={voteResults} finalScores={finalScores} isLastRound={true} />);
    expect(screen.getByTestId('final-podium')).toBeInTheDocument();
    expect(screen.getByTestId('podium-0')).toHaveTextContent('Alice');
  });

  test('émet next-round quand le host clique', () => {
    render(<Scoreboard room={room} myId="p1" voteResults={voteResults} isLastRound={false} />);
    fireEvent.click(screen.getByTestId('next-round-btn'));
    expect(mockSocket.emit).toHaveBeenCalledWith('next-round', { roomId: 'LION42' });
  });
});
