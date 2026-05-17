import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockSocket = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock('../socket', () => ({ default: mockSocket }));

import VoteScreen from './VoteScreen';

const room = {
  id: 'LION42',
  players: [{ id: 'p1', pseudo: 'Alice' }, { id: 'p2', pseudo: 'Bob' }],
  memes: [
    { playerId: 'p1', imageId: 'img1', canvasJSON: {} },
    { playerId: 'p2', imageId: 'img2', canvasJSON: {} },
  ],
  library: [
    { id: 'img1', base64: 'data:image/png;base64,a' },
    { id: 'img2', base64: 'data:image/png;base64,b' },
  ],
};

describe('VoteScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  test('affiche les mèmes des autres joueurs', () => {
    render(<VoteScreen room={room} myId="p1" />);
    expect(screen.getByTestId('vote-btn-p2')).toBeInTheDocument();
    expect(screen.queryByTestId('vote-btn-p1')).not.toBeInTheDocument();
  });

  test('émet submit-vote au clic', () => {
    render(<VoteScreen room={room} myId="p1" />);
    fireEvent.click(screen.getByTestId('vote-btn-p2'));
    expect(mockSocket.emit).toHaveBeenCalledWith('submit-vote', { roomId: 'LION42', targetId: 'p2' });
  });

  test('affiche confirmation après le vote', () => {
    render(<VoteScreen room={room} myId="p1" />);
    fireEvent.click(screen.getByTestId('vote-btn-p2'));
    expect(screen.getByTestId('voted-msg')).toBeInTheDocument();
    expect(screen.queryByTestId('vote-grid')).not.toBeInTheDocument();
  });
});
