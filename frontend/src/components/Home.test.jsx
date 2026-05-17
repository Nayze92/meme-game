// frontend/src/components/Home.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockSocket = vi.hoisted(() => ({
  connected: false,
  connect: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
}));

vi.mock('../socket', () => ({ default: mockSocket }));

import Home from './Home';

describe('Home', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders pseudo input and action buttons', () => {
    render(<Home onJoined={vi.fn()} />);
    expect(screen.getByTestId('pseudo-input')).toBeInTheDocument();
    expect(screen.getByTestId('create-btn')).toBeInTheDocument();
    expect(screen.getByTestId('join-btn')).toBeInTheDocument();
  });

  test('shows create form when "Créer une room" is clicked', () => {
    render(<Home onJoined={vi.fn()} />);
    fireEvent.click(screen.getByTestId('create-btn'));
    expect(screen.getByTestId('confirm-create-btn')).toBeInTheDocument();
  });

  test('shows join form when "Rejoindre une room" is clicked', () => {
    render(<Home onJoined={vi.fn()} />);
    fireEvent.click(screen.getByTestId('join-btn'));
    expect(screen.getByTestId('room-id-input')).toBeInTheDocument();
  });

  test('shows error if pseudo is empty on create', () => {
    render(<Home onJoined={vi.fn()} />);
    fireEvent.click(screen.getByTestId('create-btn'));
    fireEvent.click(screen.getByTestId('confirm-create-btn'));
    expect(screen.getByTestId('error-msg')).toHaveTextContent('Entre un pseudo');
  });

  test('emits create-room with pseudo when valid', () => {
    render(<Home onJoined={vi.fn()} />);
    fireEvent.change(screen.getByTestId('pseudo-input'), { target: { value: 'Bilal' } });
    fireEvent.click(screen.getByTestId('create-btn'));
    fireEvent.click(screen.getByTestId('confirm-create-btn'));
    expect(mockSocket.connect).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('create-room', { pseudo: 'Bilal' });
  });

  test('shows error if roomId is empty on join', () => {
    render(<Home onJoined={vi.fn()} />);
    fireEvent.change(screen.getByTestId('pseudo-input'), { target: { value: 'Bilal' } });
    fireEvent.click(screen.getByTestId('join-btn'));
    fireEvent.click(screen.getByTestId('confirm-join-btn'));
    expect(screen.getByTestId('error-msg')).toHaveTextContent('Entre un code de room');
  });

  test('emits join-room with uppercase roomId', () => {
    render(<Home onJoined={vi.fn()} />);
    fireEvent.change(screen.getByTestId('pseudo-input'), { target: { value: 'Bilal' } });
    fireEvent.click(screen.getByTestId('join-btn'));
    fireEvent.change(screen.getByTestId('room-id-input'), { target: { value: 'lion42' } });
    fireEvent.click(screen.getByTestId('confirm-join-btn'));
    expect(mockSocket.emit).toHaveBeenCalledWith('join-room', { pseudo: 'Bilal', roomId: 'LION42' });
  });
});
