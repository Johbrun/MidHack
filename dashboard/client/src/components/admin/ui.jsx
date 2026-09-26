import { useEffect, useState } from 'react';

// Briques communes aux onglets de la console : en-tête de page, carte,
// tuile de chiffre clé, état vide, et deux formats d'heure.

export function PageHead({ cmd, title, desc, children }) {
  return (
    <header className="adm-page-head">
      <div>
        <p className="adm-page-cmd">
          <span className="panel-prompt">$</span> {cmd}
        </p>
        <h2 className="adm-page-title">{title}</h2>
        {desc && <p className="adm-page-desc">{desc}</p>}
      </div>
      {children && <div className="adm-page-actions">{children}</div>}
    </header>
  );
}

export function Card({ title, aside, tone, className = '', children }) {
  return (
    <section className={`adm-card${tone ? ` adm-card-${tone}` : ''} ${className}`}>
      {title && (
        <header className="adm-card-head">
          <h3 className="adm-card-title">
            <span className="panel-prompt">$</span> {title}
          </h3>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, max, sub, tone = 'neutral', icon: Icon }) {
  return (
    <div className={`adm-kpi adm-kpi-${tone}`}>
      <div className="adm-kpi-top">
        <span className="adm-kpi-label">{label}</span>
        {Icon && <Icon size={18} />}
      </div>
      <span className="adm-kpi-value">
        {value}
        {max !== undefined && <small> / {max}</small>}
      </span>
      {sub && <span className="adm-kpi-sub">{sub}</span>}
    </div>
  );
}

export function Empty({ cmd, children }) {
  return (
    <div className="adm-empty">
      {cmd && (
        <p className="adm-empty-cmd">
          <span className="panel-prompt">$</span> {cmd}
          <span className="cursor">_</span>
        </p>
      )}
      <p>{children}</p>
    </div>
  );
}

export function Bar({ value, max, tone = 'accent' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span className={`adm-bar adm-bar-${tone}`}>
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}

// Horloge partagée par les compteurs « il y a … » et le chrono.
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export const fmtClock = (iso) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function timeAgo(ts, now) {
  const s = Math.max(0, Math.floor((now - new Date(ts).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${String(m % 60).padStart(2, '0')}`;
  return `${Math.floor(h / 24)} j`;
}

const pad = (n) => String(n).padStart(2, '0');

export function fmtCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
