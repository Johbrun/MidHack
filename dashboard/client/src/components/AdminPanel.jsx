import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconAlert,
  IconCheck,
  IconClock,
  IconDownload,
  IconGrid,
  IconList,
  IconLogout,
  IconMessage,
  IconMoon,
  IconShield,
  IconSliders,
  IconSnowflake,
  IconSun,
  IconTarget,
  IconTrophy,
  IconUsers,
} from '@shared/ui/icons';
import { useTheme } from '@shared/ui/useTheme';
import { FLAGS } from '../flags';
import OverviewTab from './admin/OverviewTab';
import ControlTab from './admin/ControlTab';
import TeamsTab from './admin/TeamsTab';
import ChallengesTab from './admin/ChallengesTab';
import LogsTab from './admin/LogsTab';
import FeedbacksTab from './admin/FeedbacksTab';
import { fmtCountdown, useNow } from './admin/ui';
import { restartList } from './admin/stats';
import './admin/admin.css';

const STATUS_POLL_MS = 5000;

// Console d'administration du CTF. Le classement, le gel et le chrono
// arrivent en direct par le WebSocket du scoreboard ; seuls l'état serveur
// (captures en attente, redémarrages), le journal et les feedbacks passent
// par l'API admin. Le jeton vient de l'écran de verrouillage (AdminPage) ; un
// 401 y renvoie via `onLogout`.
export default function AdminPanel({ token, onLogout, teams, online, frozen, timerEndTime, config }) {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [status, setStatus] = useState(null);
  const [feedbacks, setFeedbacks] = useState(null);
  const [tab, setTab] = useState('overview');
  const [logsTeam, setLogsTeam] = useState('');
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);

  const notify = useCallback((kind, text) => {
    setFlash({ kind, text, id: Date.now() });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const logout = onLogout;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/status?token=${encodeURIComponent(token)}`);
      if (res.status === 401) return logout();
      if (res.ok) setStatus(await res.json());
    } catch { /* hors ligne : on garde le dernier état */ }
  }, [token, logout]);

  // Jeton mémorisé : on l'essaie directement, un 401 renvoie à la connexion.
  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [token, fetchStatus]);

  const action = useCallback(
    async (url, body = {}, success = 'Action effectuée') => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          logout();
          return false;
        }
        if (!data.ok) {
          notify('err', data.error || 'Erreur');
          return false;
        }
        notify('ok', success);
        fetchStatus();
        return true;
      } catch {
        notify('err', 'Erreur réseau');
        return false;
      }
    },
    [token, logout, notify, fetchStatus]
  );

  const fetchEvents = useCallback(
    async (team) => {
      try {
        const q = team ? `&team=${encodeURIComponent(team)}` : '';
        const res = await fetch(`/api/admin/events?token=${encodeURIComponent(token)}${q}`);
        if (res.ok) return (await res.json()).events || [];
      } catch { /* ignore */ }
      notify('err', 'Impossible de charger le journal');
      return null;
    },
    [token, notify]
  );

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await fetch(`/api/feedback?token=${encodeURIComponent(token)}`);
      if (res.ok) return setFeedbacks((await res.json()).feedbacks || []);
    } catch { /* ignore */ }
    notify('err', 'Impossible de charger les feedbacks');
  }, [token, notify]);

  // Compteur de la navigation, chargé une fois à l'ouverture.
  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  function goTo(next, opts = {}) {
    if (next === 'logs') setLogsTeam(opts.team || '');
    setTab(next);
  }

  const hintPenalty = config?.hintPenalty ?? 3;
  const restarts = restartList(status).length;
  const nav = [
    { group: 'Épreuve' },
    { id: 'overview', label: "Vue d'ensemble", icon: IconGrid },
    { id: 'control', label: 'Pilotage', icon: IconSliders, badge: frozen ? { text: 'gel', tone: 'info' } : null },
    { group: 'Données' },
    { id: 'teams', label: 'Équipes', icon: IconUsers, badge: { text: teams.length }, alert: restarts > 0 },
    { id: 'challenges', label: 'Challenges', icon: IconTarget, badge: { text: FLAGS.length } },
    { id: 'logs', label: 'Journal', icon: IconList },
    { id: 'feedbacks', label: 'Feedbacks', icon: IconMessage, badge: feedbacks?.length ? { text: feedbacks.length, tone: 'accent' } : null },
  ];

  const common = { teams, status, hintPenalty, goTo };

  return (
    <div className="adm">
      <TopBar
        online={online}
        frozen={frozen}
        timerEndTime={timerEndTime}
        teamCount={teams.length}
        onLogout={logout}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <div className="adm-shell">
        <nav className="adm-nav">
          {nav.map((item) =>
            item.group ? (
              <span key={item.group} className="adm-nav-group">
                {item.group}
              </span>
            ) : (
              <button
                key={item.id}
                className={`adm-nav-item${tab === item.id ? ' is-active' : ''}`}
                onClick={() => goTo(item.id)}
              >
                <item.icon size={17} />
                <span className="adm-nav-label">{item.label}</span>
                {item.alert && <IconAlert size={14} className="text-accent" />}
                {item.badge && (
                  <span className={`adm-nav-badge${item.badge.tone ? ` is-${item.badge.tone}` : ''}`}>{item.badge.text}</span>
                )}
              </button>
            )
          )}

          <div className="adm-nav-foot">
            <span className="adm-nav-group">Exports</span>
            <a className="adm-nav-item" href={`/api/export?token=${token}&format=json`} target="_blank" rel="noopener noreferrer">
              <IconDownload size={17} />
              <span className="adm-nav-label">Classement</span>
              <span className="adm-nav-badge">json</span>
            </a>
            <a className="adm-nav-item" href={`/api/export?token=${token}&format=csv`} target="_blank" rel="noopener noreferrer">
              <IconDownload size={17} />
              <span className="adm-nav-label">Classement</span>
              <span className="adm-nav-badge">csv</span>
            </a>
          </div>
        </nav>

        <main className="adm-main" key={tab === 'logs' ? `logs-${logsTeam}` : tab}>
          {tab === 'overview' && (
            <OverviewTab {...common} online={online} frozen={frozen} timerEndTime={timerEndTime} />
          )}
          {tab === 'control' && (
            <ControlTab frozen={frozen} timerEndTime={timerEndTime} status={status} teamCount={teams.length} action={action} />
          )}
          {tab === 'teams' && <TeamsTab {...common} />}
          {tab === 'challenges' && <ChallengesTab teams={teams} />}
          {tab === 'logs' && <LogsTab teams={teams} fetchEvents={fetchEvents} initialTeam={logsTeam} />}
          {tab === 'feedbacks' && <FeedbacksTab feedbacks={feedbacks} reload={fetchFeedbacks} token={token} />}
        </main>
      </div>

      {flash && (
        <div key={flash.id} className={`adm-flash is-${flash.kind}`} role="status">
          {flash.kind === 'ok' ? <IconCheck size={16} /> : <IconAlert size={16} />}
          {flash.text}
        </div>
      )}
    </div>
  );
}

// Barre du haut, dans le style du bandeau d'environnement : invite shell à
// gauche, état de l'épreuve au centre, session à droite.
function TopBar({ online, frozen, timerEndTime, teamCount, onLogout, isDark, onToggleTheme }) {
  const ThemeIcon = isDark ? IconSun : IconMoon;
  const now = useNow();
  const remaining = timerEndTime ? timerEndTime - now : null;
  return (
    <header className="adm-top">
      <div className="adm-top-brand">
        <span className="adm-top-mark">
          <IconShield size={16} />
        </span>
        <span className="adm-top-prompt">
          <span className="prompt-user">root@qg</span>:<span className="prompt-path">~/admin</span>#
        </span>
        <span className="adm-top-title">ctfctl</span>
      </div>

      <div className="adm-top-status">
        <span className={`adm-pill${online ? ' is-live' : ''}`}>
          <span className="live-dot" />
          {online ? 'En direct' : 'Hors ligne'}
        </span>
        {frozen && (
          <span className="adm-pill is-frozen">
            <IconSnowflake size={12} />
            Gelé
          </span>
        )}
        <span className={`adm-pill${remaining !== null && remaining < 300000 ? ' is-warn' : ''}`}>
          <IconClock size={12} />
          {remaining === null ? '--:--' : fmtCountdown(remaining)}
        </span>
        <span className="adm-pill">{teamCount} équipe{teamCount > 1 ? 's' : ''}</span>
      </div>

      <div className="adm-top-tools">
        <button className="adm-top-btn" onClick={onLogout} title="Déconnexion">
          <IconLogout size={15} />
          <span>logout</span>
        </button>
        <a className="adm-top-btn is-link" href="/" title="Retour au scoreboard">
          <IconTrophy size={15} />
          <span>scoreboard</span>
        </a>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={isDark ? 'Mode jour' : 'Mode nuit'}
          aria-label={isDark ? 'Mode jour' : 'Mode nuit'}
        >
          <ThemeIcon size={15} />
        </button>
      </div>
    </header>
  );
}
