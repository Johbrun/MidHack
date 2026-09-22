import Timer from './Timer';
import { NantesHackLogo, nantesHack } from '../lib/branding';
import { FLAGS } from '../flags';
import { IconMoon, IconShield, IconSnowflake, IconSun } from './icons';

// Bandeau d'environnement, comme dans le QG. Les commandes (thème, admin)
// y restent discrètes : elles servent à l'animateur, pas à la salle.
export function EnvBar({ online, status, frozen, onAdmin, isDark, onToggleTheme }) {
  const ThemeIcon = isDark ? IconSun : IconMoon;
  return (
    <div className={`envbar${frozen ? ' is-frozen' : ''}`}>
      <span className={`envbar-status${online ? ' is-live' : ''}`}>
        <span className="live-dot" />
        {status}
      </span>
      <span className="envbar-title">
        {frozen ? (
          <>
            <IconSnowflake size={14} />
            CTF gelé — scores figés
          </>
        ) : (
          'Hacking QG · Scoreboard'
        )}
      </span>
      <span className="envbar-tools">
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={isDark ? 'Mode jour' : 'Mode nuit'}
          aria-label={isDark ? 'Mode jour' : 'Mode nuit'}
        >
          <ThemeIcon size={15} />
        </button>
        <button className="icon-btn" onClick={onAdmin} title="Administration" aria-label="Administration">
          <IconShield size={15} />
        </button>
      </span>
    </div>
  );
}

export default function Header({ teams, timerEndTime, eventTitle }) {
  const captures = teams.reduce((n, t) => n + t.captures.length, 0);
  const fallen = new Set(teams.flatMap((t) => t.captures.map((c) => c.flagId))).size;

  return (
    <header className="head">
      <div className="brand">
        <span className="brand-mark">{nantesHack ? <NantesHackLogo /> : '>_'}</span>
        <div className="brand-text">
          <p className="prompt">
            <span className="prompt-user">root@qg</span>:
            <span className="prompt-path">~/scoreboard</span>$ watch ./rank
          </p>
          <h1 className="brand-title">
            {eventTitle || 'BananaShop CTF'}
            <span className="cursor">_</span>
          </h1>
        </div>
      </div>

      <Timer endTime={timerEndTime} />

      <div className="stats">
        <Stat label="Équipes" value={teams.length} />
        <Stat label="Flags" value={captures} />
        <Stat label="Challenges tombés" value={fallen} max={FLAGS.length} />
      </div>
    </header>
  );
}

function Stat({ label, value, max }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {max !== undefined && <small> / {max}</small>}
      </span>
    </div>
  );
}
