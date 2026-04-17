import { useState } from 'react';

export default function AdminPanel({ onClose }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [timerDuration, setTimerDuration] = useState(90);
  const [status, setStatus] = useState(null);

  async function login() {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setAuthenticated(true);
        setMessage('');
        fetchStatus(data.token);
      } else {
        setMessage('Mot de passe invalide');
      }
    } catch {
      setMessage('Erreur de connexion');
    }
  }

  async function fetchStatus(t) {
    try {
      const res = await fetch(`/api/admin/status?token=${t || token}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (!authenticated) setAuthenticated(true);
      } else if (res.status === 401) {
        setAuthenticated(false);
        localStorage.removeItem('adminToken');
      }
    } catch { /* ignore */ }
  }

  // Auto-check stored token
  useState(() => {
    if (token) fetchStatus(token);
  });

  async function adminAction(url, body = {}) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('Action effectuée');
        fetchStatus();
      } else {
        setMessage(data.error || 'Erreur');
      }
    } catch {
      setMessage('Erreur réseau');
    }
    setTimeout(() => setMessage(''), 3000);
  }

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-xl text-accent">Admin Dashboard</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white text-xl">&times;</button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Mot de passe admin"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 mb-4 focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={login}
            className="w-full py-3 bg-accent/20 border border-accent/40 rounded-lg text-accent font-heading font-bold hover:bg-accent/30 transition"
          >
            Connexion
          </button>
          {message && <p className="text-red-400 text-sm mt-3 text-center">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 max-w-2xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading font-bold text-xl text-accent">Admin Dashboard</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl">&times;</button>
        </div>

        {message && (
          <div className="mb-4 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm text-center">
            {message}
          </div>
        )}

        {/* Timer */}
        <Section title="Timer">
          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={timerDuration}
              onChange={(e) => setTimerDuration(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-accent/50"
              min={1}
            />
            <span className="text-white/40 text-sm">minutes</span>
            <button onClick={() => adminAction('/api/timer/start', { duration: timerDuration })} className="btn-admin bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30">
              Démarrer
            </button>
            <button onClick={() => adminAction('/api/timer/stop')} className="btn-admin bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30">
              Arrêter
            </button>
          </div>
        </Section>

        {/* Announcements */}
        <Section title="Annonces">
          <div className="flex gap-3">
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && announcement.trim()) {
                  adminAction('/api/announce', { message: announcement });
                  setAnnouncement('');
                }
              }}
              placeholder="Message à diffuser à toutes les équipes..."
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent/50"
            />
            <button
              onClick={() => {
                if (announcement.trim()) {
                  adminAction('/api/announce', { message: announcement });
                  setAnnouncement('');
                }
              }}
              className="btn-admin bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
            >
              Envoyer
            </button>
          </div>
        </Section>

        {/* Scoreboard controls */}
        <Section title="Scoreboard">
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => adminAction('/api/scoreboard/freeze')} className="btn-admin bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30">
              🧊 Geler
            </button>
            <button onClick={() => adminAction('/api/scoreboard/unfreeze')} className="btn-admin bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30">
              🔓 Dégeler
            </button>
            <button
              onClick={() => {
                if (confirm('Réinitialiser tous les scores ? Cette action est irréversible.')) {
                  adminAction('/api/reset');
                }
              }}
              className="btn-admin bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
            >
              Réinitialiser les scores
            </button>
          </div>
          {status && (
            <div className="mt-3 text-sm text-white/40">
              {status.frozen && <span className="text-blue-400 font-bold mr-3">🧊 Scoreboard gelé</span>}
              {status.timer?.running && <span className="text-emerald-400 mr-3">Timer actif</span>}
              <span>{status.teamCount} équipe(s) enregistrée(s)</span>
            </div>
          )}
        </Section>

        {/* Export */}
        <Section title="Export">
          <div className="flex gap-3">
            <a
              href={`/api/export?token=${token}&format=json`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-admin bg-purple-500/20 border-purple-500/40 text-purple-400 hover:bg-purple-500/30 no-underline"
            >
              Export JSON
            </a>
            <a
              href={`/api/export?token=${token}&format=csv`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-admin bg-purple-500/20 border-purple-500/40 text-purple-400 hover:bg-purple-500/30 no-underline"
            >
              Export CSV
            </a>
            <a
              href={`/api/certificates?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-admin bg-purple-500/20 border-purple-500/40 text-purple-400 hover:bg-purple-500/30 no-underline"
            >
              Certificats
            </a>
          </div>
        </Section>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              setAuthenticated(false);
              setToken('');
              onClose();
            }}
            className="text-white/30 text-sm hover:text-white/60 transition"
          >
            Déconnexion admin
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-white/50 mb-3">{title}</h3>
      {children}
    </div>
  );
}
