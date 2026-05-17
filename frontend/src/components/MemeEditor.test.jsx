import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('fabric', () => {
  const CanvasMock = vi.fn().mockImplementation(function () {
    this.add = vi.fn();
    this.setActiveObject = vi.fn();
    this.toJSON = vi.fn().mockReturnValue({});
    this.dispose = vi.fn();
    this.renderAll = vi.fn();
    this.backgroundImage = null;
  });
  const TextboxMock = vi.fn().mockImplementation(function () {});
  return {
    Canvas: CanvasMock,
    FabricImage: { fromURL: vi.fn().mockResolvedValue({ scaleToWidth: vi.fn() }) },
    Textbox: TextboxMock,
  };
});

const mockSocket = vi.hoisted(() => ({
  emit: vi.fn(), on: vi.fn(), off: vi.fn(),
}));
vi.mock('../socket', () => ({ default: mockSocket }));

import MemeEditor from './MemeEditor';

const baseRoom = {
  id: 'LION42',
  settings: { timerSeconds: 90, maxSwaps: 2 },
  players: [{ id: 'p1', pseudo: 'Alice', swapsLeft: 2 }],
  library: [
    { id: 'img1', base64: 'data:image/png;base64,abc', uploadedBy: 'p1' },
    { id: 'img2', base64: 'data:image/png;base64,def', uploadedBy: 'p2' },
  ],
  playerImages: { p1: 'img1' },
  roundImages: ['img1', 'img2'],
};

describe('MemeEditor', () => {
  beforeEach(() => vi.clearAllMocks());

  test('affiche le timer et les swaps restants', () => {
    render(<MemeEditor room={baseRoom} myId="p1" />);
    expect(screen.getByTestId('timer')).toHaveTextContent('90s');
    expect(screen.getByTestId('swaps-left')).toHaveTextContent('2');
  });

  test('affiche le canvas', () => {
    render(<MemeEditor room={baseRoom} myId="p1" />);
    expect(screen.getByTestId('fabric-canvas')).toBeInTheDocument();
  });

  test('affiche les options de swap quand swapsLeft > 0', () => {
    render(<MemeEditor room={baseRoom} myId="p1" />);
    expect(screen.getByTestId('swap-section')).toBeInTheDocument();
    expect(screen.getByTestId('swap-btn-img2')).toBeInTheDocument();
  });

  test('émet swap-image au clic sur swap', () => {
    render(<MemeEditor room={baseRoom} myId="p1" />);
    fireEvent.click(screen.getByTestId('swap-btn-img2'));
    expect(mockSocket.emit).toHaveBeenCalledWith('swap-image', { roomId: 'LION42', imageId: 'img2' });
  });

  test('émet submit-meme et affiche confirmation', () => {
    render(<MemeEditor room={baseRoom} myId="p1" />);
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(mockSocket.emit).toHaveBeenCalledWith('submit-meme', expect.objectContaining({ roomId: 'LION42' }));
    expect(screen.getByTestId('submitted-msg')).toBeInTheDocument();
  });
});
