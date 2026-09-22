import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

// Quatre états lisibles de loin : en attente, en cours, cinq dernières
// minutes (rouge, pulsé), terminé.
export default function Timer({ endTime }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endTime) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!endTime) {
    return (
      <div className="timer is-idle">
        <span className="timer-label">Chrono</span>
        <span className="timer-value">--:--</span>
      </div>
    );
  }

  const remaining = Math.max(0, endTime - now);
  const total = Math.floor(remaining / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const display = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  const state = remaining === 0 ? ' is-over' : remaining < 300000 ? ' is-warning' : '';

  return (
    <div className={`timer${state}`}>
      <span className="timer-label">{remaining === 0 ? 'Temps écoulé' : 'Temps restant'}</span>
      <span className="timer-value">{display}</span>
    </div>
  );
}
