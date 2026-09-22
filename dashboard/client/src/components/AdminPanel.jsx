import { useEffect, useRef, useState } from 'react';
import {
  IconAlert,
  IconDownload,
  IconMessage,
  IconRefresh,
  IconSnowflake,
  IconTrash,
  IconUnlock,
  IconX,
} from './icons';

export default function AdminPanel({ onClose }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [timerDuration, setTimerDuration] = useState(90);
  const [status, setStatus] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const [events, setEvents] = useState([]);
  const [showEvents, setShowEvents] = useState(false);

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

  // Chemins d'exploitation : ce que les équipes ont réellement fait, et pas
  // seulement ce qu'elles ont validé.
  async function fetchEvents() {
    try {
      const res = await fetch(`/api/admin/events?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setShowEvents(true);
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

  async function fetchFeedbacks() {
    try {
      const res = await fetch(`/api/feedback?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        setShowFeedbacks(true);
      } else {
        setMessage('Impossible de charger les feedbacks');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Erreur réseau');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  if (!authenticated) {
    return (
      <Modal title="Administration" size="sm" onClose={onClose}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && login()}
          placeholder="Mot de passe admin"
          className="input"
          autoFocus
        />
        <button onClick={login} className="btn btn-primary btn-block">
          Connexion
        </button>
        {message && <div className="alert alert-err" style={{ margin: 'var(--sp-3) 0 0' }}>{message}</div>}
      </Modal>
    );
  }

  const restarts = Object.entries(status?.restarts || {})
    .map(([team, boots]) =>
      Object.entries(boots)
        .filter(([, n]) => n > 0)
        .map(([svc, n]) => `${team}/${svc} ×${n}`)
        .join(', ')
    )
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Modal title="Administration" onClose={onClose}>
        {message && (
          <div className={`alert ${message === 'Action effectuée' ? 'alert-ok' : 'alert-err'}`}>{message}</div>
        )}

        <Section title="timer">
          <div className="row-actions">
            <input
              type="number"
              value={timerDuration}
              onChange={(e) => setTimerDuration(Number(e.target.value))}
              className="input input-num"
              min={1}
            />
            <span className="text-muted">minutes</span>
            <button onClick={() => adminAction('/api/timer/start', { duration: timerDuration })} className="btn btn-ok">
              Démarrer
            </button>
            <button onClick={() => adminAction('/api/timer/stop')} className="btn btn-danger">
              Arrêter
            </button>
          </div>
        </Section>

        <Section title="announce">
          <div className="row-actions">
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
              className="input"
            />
            <button
              onClick={() => {
                if (announcement.trim()) {
                  adminAction('/api/announce', { message: announcement });
                  setAnnouncement('');
                }
              }}
              className="btn btn-accent"
            >
              Envoyer
            </button>
          </div>
        </Section>

        <Section title="scoreboard">
          <div className="row-actions">
            <button onClick={() => adminAction('/api/scoreboard/freeze')} className="btn btn-info">
              <IconSnowflake size={16} />
              Geler le CTF
            </button>
            <button onClick={() => adminAction('/api/scoreboard/unfreeze')} className="btn btn-info">
              <IconUnlock size={16} />
              Dégeler le CTF
            </button>
            <button
              onClick={() => {
                if (confirm('Réinitialiser tous les scores ? Cette action est irréversible.')) {
                  adminAction('/api/reset');
                }
              }}
              className="btn btn-danger"
            >
              <IconTrash size={16} />
              Réinitialiser les scores
            </button>
          </div>
          {status && (
            <div className="section-status">
              {status.frozen && <span className="text-info">● CTF gelé</span>}
              {status.timer?.running && <span className="text-ok">● Timer actif</span>}
              <span>{status.teamCount} équipe(s) enregistrée(s)</span>
            </div>
          )}
          {/* Un service qui redémarre pendant l'atelier doit se voir ici, pas
              dans les logs Docker. */}
          {restarts && (
            <div className="alert alert-warn">
              <IconAlert size={16} />
              <span>Redémarrages de services : {restarts}</span>
            </div>
          )}
        </Section>

        <Section title="paths --all">
          <p className="section-desc">
            Ce que les équipes ont fait, pas seulement ce qu'elles ont validé : flag délivré,
            flag retenu (un autre était déjà tombé sur la requête), challenge verrouillé,
            effet de bord, ou technique employée au mauvais endroit.
          </p>
          <button onClick={fetchEvents} className="btn btn-info">
            <IconRefresh size={16} />
            {showEvents ? 'Rafraîchir' : 'Afficher'}
          </button>
          {showEvents && (
            <div className="log">
              {events.length === 0 ? (
                <p className="log-empty">Aucun événement pour l'instant.</p>
              ) : (
                <table>
                  <tbody>
                    {events.map((e, i) => (
                      <tr key={i}>
                        <td className="log-time">{new Date(e.at).toLocaleTimeString()}</td>
                        <td className="log-team">{e.teamName}</td>
                        <td className={KIND_STYLE[e.kind] || 'text-muted'}>{KIND_LABEL[e.kind] || e.kind}</td>
                        <td className="text-muted">{e.flagId || '—'}</td>
                        <td className="log-proof">{e.proof || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </Section>

        <Section title="export">
          <div className="row-actions">
            <a
              href={`/api/export?token=${token}&format=json`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              <IconDownload size={16} />
              Export JSON
            </a>
            <a
              href={`/api/export?token=${token}&format=csv`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              <IconDownload size={16} />
              Export CSV
            </a>
          </div>
        </Section>

        <Section title="feedbacks">
          <div className="row-actions">
            <button onClick={fetchFeedbacks} className="btn btn-accent">
              <IconMessage size={16} />
              Voir les feedbacks
            </button>
            <a
              href={`/api/feedback/export?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              <IconDownload size={16} />
              Exporter (.txt)
            </a>
          </div>
        </Section>

        <div className="modal-foot">
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              setAuthenticated(false);
              setToken('');
              onClose();
            }}
            className="btn btn-ghost"
          >
            Déconnexion admin
          </button>
        </div>
      </Modal>

      {/* Au-dessus de la modale d'administration : Échap ne ferme que celle-ci. */}
      {showFeedbacks && (
        <Modal
          title={
            <>
              Feedbacks des participants <small>({feedbacks.length})</small>
            </>
          }
          onClose={() => setShowFeedbacks(false)}
        >
          {feedbacks.length === 0 ? (
            <p className="log-empty">Aucun feedback pour le moment.</p>
          ) : (
            <div className="fb-list">
              {feedbacks.map((f) => (
                <div key={f.id} className="fb">
                  <div className="fb-head">
                    <span className="fb-team">{f.teamName}</span>
                    <span className="fb-date">{new Date(f.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  {(f.answers || []).map((a, i) => (
                    <div key={a.id || i}>
                      <p className="fb-q">{a.question}</p>
                      <p className="fb-a">{a.answer}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

const KIND_LABEL = {
  award: 'flag délivré',
  withheld: 'flag retenu',
  locked: 'verrouillé',
  side_effect: 'effet de bord',
  near_miss: 'mauvais endroit',
};

const KIND_STYLE = {
  award: 'text-ok',
  withheld: 'text-accent',
  locked: 'text-info',
  side_effect: 'text-accent',
  near_miss: 'text-dim',
};

// Même structure de modale que le QG : en-tête, corps défilant, Échap pour fermer.
function Modal({ title, size = 'md', onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // Seule la modale du dessus (la dernière ouverte) réagit.
      const all = document.querySelectorAll('.modal-backdrop');
      if (all[all.length - 1] === ref.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div ref={ref} className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconX size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// Titres de section en commande shell, comme les panneaux du QG.
function Section({ title, children }) {
  return (
    <section className="section">
      <h3 className="section-title">
        <span className="panel-prompt">$</span> {title}
      </h3>
      {children}
    </section>
  );
}
