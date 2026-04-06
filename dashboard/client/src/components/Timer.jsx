import { useEffect, useState } from 'react';

export default function Timer({ endTime }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!endTime) return <div />;

  const remaining = Math.max(0, endTime - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const warning = remaining < 300000;
  const display =
    String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

  return (
    <div className="text-center">
      <div className="text-[0.7rem] text-white/30 uppercase tracking-wider">
        Temps restant
      </div>
      <div
        className={`font-heading font-black text-3xl tracking-wider ${
          warning ? 'text-red-400 animate-pulse-dot' : 'text-accent'
        }`}
      >
        {display}
      </div>
    </div>
  );
}
