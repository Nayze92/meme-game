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

  // All round images except my current one → swap candidates
  const swapImages = (room?.roundImages || [])
    .map(id => room?.library?.find(img => img.id === id))
    .filter((img, idx, arr) => img && img.id !== myImageId && arr.findIndex(i => i?.id === img.id) === idx);

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
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }

      const canvas = new Canvas(canvasRef.current, {
        width: 600,
        height: 400,
        backgroundColor: '#111',
      });
      fabricRef.current = canvas;

      // Ensure proper data URI prefix
      const src = myImage.base64.startsWith('data:')
        ? myImage.base64
        : `data:image/jpeg;base64,${myImage.base64}`;

      FabricImage.fromURL(src).then(img => {
        // Scale to fill canvas while keeping aspect ratio
        const scaleX = 600 / img.width;
        const scaleY = 400 / img.height;
        const scale = Math.min(scaleX, scaleY);

        img.set({
          left: 300,
          top: 200,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
        });

        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();
      }).catch(() => {
        canvas.backgroundColor = '#333';
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
        left: 50,
        top: 50,
        width: 200,
        fontSize: 24,
        fill: '#000000',
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: 8,
      });
      fabricRef.current.add(text);
      fabricRef.current.setActiveObject(text);
      fabricRef.current.renderAll();
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

      <div className="canvas-wrapper">
        <canvas data-testid="fabric-canvas" ref={canvasRef} />
      </div>

      <div className="editor-tools">
        <button data-testid="add-text-btn" onClick={addTextBubble}>
          + Ajouter du texte
        </button>
        {!submitted ? (
          <button data-testid="submit-btn" className="submit-btn" onClick={handleSubmit}>
            ✅ Soumettre mon mème
          </button>
        ) : (
          <span data-testid="submitted-msg" style={{ color: '#4ade80' }}>
            ✅ Mème soumis ! En attente des autres...
          </span>
        )}
      </div>

      {swapsLeft > 0 && swapImages.length > 0 && (
        <div data-testid="swap-section" className="swap-section">
          <h4>🔄 Swapper ton image :</h4>
          <div className="swap-grid">
            {swapImages.map(img => (
              <button
                key={img.id}
                className="swap-thumb"
                data-testid={`swap-btn-${img.id}`}
                onClick={() => handleSwap(img.id)}
                title="Prendre cette image"
              >
                <img src={img.base64} alt="option swap" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
