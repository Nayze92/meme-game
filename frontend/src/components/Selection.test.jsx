import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockSocket = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock('../socket', () => ({ default: mockSocket }));

import Selection from './Selection';

const baseRoom = {
  id: 'LION42',
  currentRound: 1,
  selectionQueue: ['player-1', 'player-2'],
  players: [{ id: 'player-1', pseudo: 'Alice' }, { id: 'player-2', pseudo: 'Bob' }],
  library: [
    { id: 'img1', base64: 'data:image/png;base64,abc', uploadedBy: 'player-1' },
    { id: 'img2', base64: 'data:image/png;base64,def', uploadedBy: 'player-2' },
  ],
};

describe('Selection', () => {
  beforeEach(() => vi.clearAllMocks());

  test('affiche "c\'est ton tour" quand c\'est le bon joueur', () => {
    render(<Selection room={baseRoom} myId="player-1" />);
    expect(screen.getByTestId('turn-indicator')).toHaveTextContent('C\'est ton tour');
  });

  test('affiche "attend" quand ce n\'est pas ton tour', () => {
    render(<Selection room={baseRoom} myId="player-2" />);
    expect(screen.getByTestId('turn-indicator')).toHaveTextContent('Alice choisit');
  });

  test('affiche la grille d\'images quand c\'est ton tour', () => {
    render(<Selection room={baseRoom} myId="player-1" />);
    expect(screen.getByTestId('image-grid')).toBeInTheDocument();
    expect(screen.getByTestId('img-btn-img1')).toBeInTheDocument();
  });

  test('n\'affiche pas la grille si ce n\'est pas ton tour', () => {
    render(<Selection room={baseRoom} myId="player-2" />);
    expect(screen.queryByTestId('image-grid')).not.toBeInTheDocument();
  });

  test('émet select-image au clic sur une image', () => {
    render(<Selection room={baseRoom} myId="player-1" />);
    fireEvent.click(screen.getByTestId('img-btn-img1'));
    expect(mockSocket.emit).toHaveBeenCalledWith('select-image', { roomId: 'LION42', imageId: 'img1' });
  });
});
