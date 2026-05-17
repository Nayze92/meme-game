import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Mock socket.io-client
vi.mock('./socket', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    id: 'test-socket-id',
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Home by default', () => {
    render(<App />);
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });
});
