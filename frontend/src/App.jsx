// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import socket from './socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Selection from './components/Selection';
import MemeEditor from './components/MemeEditor';
import Reveal from './components/Reveal';
import VoteScreen from './components/VoteScreen';
import Scoreboard from './components/Scoreboard';

export default function App() {
  const [phase, setPhase] = useState('home');
  const [room, setRoom] = useState(null);
  const [myId, setMyId] = useState(null);
  const [revealMemes, setRevealMemes] = useState([]);
  const [voteResults, setVoteResults] = useState([]);
  const [finalScores, setFinalScores] = useState([]);

  useEffect(() => {
    socket.on('connect', () => setMyId(socket.id));

    socket.on('room-created', ({ roomId }) => {
      setPhase('lobby');
    });

    socket.on('room-updated', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('phase-changed', ({ phase: newPhase }) => {
      setPhase(newPhase);
    });

    socket.on('reveal-memes', (memes) => {
      setRevealMemes(memes);
    });

    socket.on('vote-results', (results) => {
      setVoteResults(results);
    });

    socket.on('game-over', (scores) => {
      setFinalScores(scores);
    });

    socket.on('room-closed', () => {
      setPhase('home');
      setRoom(null);
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.off('connect');
      socket.off('room-created');
      socket.off('room-updated');
      socket.off('phase-changed');
      socket.off('reveal-memes');
      socket.off('vote-results');
      socket.off('game-over');
      socket.off('room-closed');
      socket.off('error');
    };
  }, []);

  const props = { room, myId, revealMemes, voteResults, finalScores };

  switch (phase) {
    case 'home':       return <Home onJoined={() => setPhase('lobby')} />;
    case 'lobby':      return <Lobby {...props} />;
    case 'selection':  return <Selection {...props} />;
    case 'creation':   return <MemeEditor {...props} />;
    case 'reveal':     return <Reveal {...props} revealMemes={revealMemes} />;
    case 'vote':       return <VoteScreen {...props} />;
    case 'scores':     return <Scoreboard {...props} voteResults={voteResults} isLastRound={false} />;
    case 'gameover':   return <Scoreboard {...props} voteResults={voteResults} finalScores={finalScores} isLastRound={true} />;
    default:           return <Home onJoined={() => setPhase('lobby')} />;
  }
}
