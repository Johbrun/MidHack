import { useEffect, useState } from 'react';
import { onNudge } from '../lib/nudge';

// Bandeau « tu n'es pas loin » : il dit ce que le serveur a constaté, jamais la
// marche à suivre. Se ferme à la main ou au bout de 20 secondes.
export default function NudgeBanner() {
  const [message, setMessage] = useState(null);

  useEffect(() => onNudge(setMessage), []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), 20000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] max-w-xl w-[calc(100%-2rem)] rounded-lg border border-cyan/40 bg-dark/95 px-4 py-3 shadow-lg backdrop-blur-md">
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none">🧭</span>
        <p className="flex-1 text-sm leading-relaxed text-white/80">{message}</p>
        <button
          onClick={() => setMessage(null)}
          className="text-white/40 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
