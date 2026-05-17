import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockSocket = vi.hoisted(() => ({ emit: vi.fn(), connected: true, connect: vi.fn(), on: vi.fn(), off: vi.fn() }));
vi.mock('../socket', () => ({ default: mockSocket }));

import Lobby from './Lobby';

const baseRoom = {
  id: 'LION42',
  host: 'host-id',
  players: [{ id: 'host-id', pseudo: 'Alice' }, { id: 'guest-id', pseudo: 'Bob' }],
  library: [{ id: 'img1', base64: 'data', uploadedBy: 'host-id' }],
  settings: { totalRounds: 3, timerSeconds: 90, maxSwaps: 2 },
};

describe('Lobby', () => {
  beforeEach(() => vi.clearAllMocks());

  test('affiche le code de la room', () => {
    render(<Lobby room={baseRoom} myId="host-id" />);
    expect(screen.getByTestId('room-code')).toHaveTextContent('LION42');
  });

  test('affiche la liste des joueurs', () => {
    render(<Lobby room={baseRoom} myId="host-id" />);
    expect(screen.getByTestId('player-host-id')).toBeInTheDocument();
    expect(screen.getByTestId('player-guest-id')).toBeInTheDocument();
  });

  test('affiche les paramètres seulement au host', () => {
    render(<Lobby room={baseRoom} myId="host-id" />);
    expect(screen.getByTestId('settings-section')).toBeInTheDocument();
  });

  test('n\'affiche pas les paramètres aux guests', () => {
    render(<Lobby room={baseRoom} myId="guest-id" />);
    expect(screen.queryByTestId('settings-section')).not.toBeInTheDocument();
  });

  test('émet start-game quand le host clique Lancer', () => {
    render(<Lobby room={baseRoom} myId="host-id" />);
    fireEvent.click(screen.getByTestId('start-btn'));
    expect(mockSocket.emit).toHaveBeenCalledWith('start-game', { roomId: 'LION42' });
  });

  test('émet update-settings quand le host change le timer', () => {
    render(<Lobby room={baseRoom} myId="host-id" />);
    fireEvent.change(screen.getByTestId('timer-input'), { target: { value: '60' } });
    expect(mockSocket.emit).toHaveBeenCalledWith('update-settings', expect.objectContaining({
      roomId: 'LION42',
      settings: expect.objectContaining({ timerSeconds: 60 }),
    }));
  });
});
