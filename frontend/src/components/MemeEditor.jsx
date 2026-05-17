// frontend/src/components/MemeEditor.jsx
import { useEffect, useRef, useState } from 'react';
import socket from '../socket';

export default function MemeEditor({ room, myId }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(room?.settings?.timerSeconds || 90);
  const [swapsLeft, setSwapsLeft] = useState(
    room?.players?.find(p => p.id === myId)?.swapsLeft ?? room?.settings?.maxSwaps ?? 2
  );
  const [submitted, setSubmitted] = useState(false);

  const myImageId = room?.playerImages?.[myId];
  const myImage = room?.library?.find(img => img.id === myImageId);
  const roundImages = (room?.roundImages || [])
    .map(id => room?.library?.find(img => img.id === id))
    .filter(Boolean);

  useEffect(() => {
    socket.on('timer-tick', ({ secondsLeft }) => setTimeLeft(secondsLeft));
    socket.on('room-updated', (updatedRoom) => {
      const player = updatedRoom.players?.find(p => p.id === myId);
      if (player) setSwapsLeft(player.swapsLeft);
    });
    return () => {
      socket.off('timer-tick');
      socket.off('room-updated');
    };
  }, [myId]);

  useEffect(() => {
    if (!canvasRef.current || !myImage) return;
    import('fabric').then(({ Canvas, FabricImage, Textbox }) => {
      if (fabricRef.current) fabricRef.current.dispose();
      const canvas = new Canvas(canvasRef.current, { width: 600, height: 400 });
      fabricRef.current = canvas;

      FabricImage.fromURL(myImage.base64).then(img => {
        img.scaleToWidth(600);
        canvas.backgroundImage = img;
        canvas.renderAll();
      });
    });
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [myImage]);

  function addTextBubble() {
    if (!fabricRef.current) return;
    import('fabric').then(({ Textbox }) => {
      const text = new Textbox('Ton texte ici', {
        left: 50, top: 50, width: 200, fontSize: 24,
        fill: '#000000', backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 8,
      });
      fabricRef.current.add(text);
      fabricRef.current.setActiveObject(text);
    });
  }

  function handleSwap(imageId) {
    socket.emit('swap-image', { roomId: room.id, imageId });
  }

  function handleSubmit() {
    const canvasJSON = fabricRef.current ? fabricRef.current.toJSON() : {};
    socket.emit('submit-meme', { roomId: room.id, canvasJSON });
    setSubmitted(true);
  }

  return (
    <div data-testid="meme-editor" className="editor-screen">
      <div className="editor-header">
        <span data-testid="timer">⏱ {timeLeft}s</span>
        <span data-testid="swaps-left">🔄 {swapsLeft} swap(s)</span>
      </div>

      <canvas data-testid="fabric-canvas" ref={canvasRef} />

      <div className="editor-tools">
        <button data-testid="add-text-btn" onClick={addTextBubble}>
          + Texte
        </button>
      </div>

      {swapsLeft > 0 && roundImages.length > 1 && (
        <div data-testid="swap-section" className="swap-section">
          <h4>Swapper ton image:</h4>
          {roundImages.map(img => (
            img.id !== myImageId && (
              <button key={img.id} data-testid={`swap-btn-${img.id}`}
                onClick={() => handleSwap(img.id)}>
                Swap
              </button>
            )
          ))}
        </div>
      )}

      {!submitted ? (
        <button data-testid="submit-btn" onClick={handleSubmit}>
          Soumettre mon mème
        </button>
      ) : (
        <p data-testid="submitted-msg">✅ Mème soumis ! En attente des autres...</p>
      )}
    </div>
  );
}
