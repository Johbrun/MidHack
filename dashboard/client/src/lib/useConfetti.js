import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti(events) {
  const seenRef = useRef(new Set());

  useEffect(() => {
    events.forEach((evt) => {
      if (seenRef.current.has(evt.id)) return;
      if (evt.type !== 'capture' && evt.type !== 'first_blood') return;
      seenRef.current.add(evt.id);

      if (evt.type === 'first_blood') {
        // Big dramatic burst for first blood
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, startVelocity: 55 });
        setTimeout(() => confetti({ particleCount: 100, spread: 70, angle: 60, origin: { x: 0 } }), 250);
        setTimeout(() => confetti({ particleCount: 100, spread: 70, angle: 120, origin: { x: 1 } }), 400);
      } else {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    });
  }, [events]);
}
