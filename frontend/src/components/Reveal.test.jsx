import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockSocket = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock('../socket', () => ({ default: mockSocket }));

import Reveal from './Reveal';

const memes = [
  { playerId: 'p1', pseudo: 'Alice', imageBase64: 'data:image/png;base64,a' },
  { playerId: 'p2', pseudo: 'Bob', imageBase64: 'data:image/png;base64,b' },
];
const room = { id: 'LION42', host: 'p1' };

describe('Reveal', () => {
  beforeEach(() => vi.clearAllMocks());

  test('affiche le premier mème', () => {
    render(<Reveal room={room} myId="p1" revealMemes={memes} />);
    expect(screen.getByTestId('meme-author')).toHaveTextContent('Alice');
    expect(screen.getByTestId('meme-image')).toBeInTheDocument();
  });

  test('navigue vers le mème suivant', () => {
    render(<Reveal room={room} myId="p1" revealMemes={memes} />);
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('meme-author')).toHaveTextContent('Bob');
  });

  test('affiche le bouton "Lancer le vote" au host sur le dernier mème', () => {
    render(<Reveal room={room} myId="p1" revealMemes={[memes[0]]} />);
    expect(screen.getByTestId('start-vote-btn')).toBeInTheDocument();
  });

  test('n\'affiche pas "Lancer le vote" aux guests', () => {
    render(<Reveal room={room} myId="p2" revealMemes={[memes[0]]} />);
    expect(screen.queryByTestId('start-vote-btn')).not.toBeInTheDocument();
  });

  test('émet start-vote quand le host clique', () => {
    render(<Reveal room={room} myId="p1" revealMemes={[memes[0]]} />);
    fireEvent.click(screen.getByTestId('start-vote-btn'));
    expect(mockSocket.emit).toHaveBeenCalledWith('start-vote', { roomId: 'LION42' });
  });
});
