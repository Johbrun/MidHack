import { FLAGS, shortName } from '../flags';
import { IconDrop } from './icons';

const MAX_ITEMS = 12;

const byId = new Map(FLAGS.map((f) => [f.flagId, f]));
const byName = new Map(FLAGS.map((f) => [f.name, f]));
const label = (flag, fallback) => (flag ? shortName(flag) : fallback);
const hhmm = (iso) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Dernières captures et indices, du plus récent au plus ancien, reconstruits
// depuis l'état du classement : le fil survit à un rechargement de la page,
// contrairement aux notifications.
export default function ActivityFeed({ teams, hintPenalty = 3 }) {
  const items = teams
    .flatMap((t) => [
      ...t.captures.map((c) => ({
        key: `${t.name}|${c.flagId}`,
        at: c.capturedAt,
        team: t.name,
        flag: label(byId.get(c.flagId), c.flagId),
        points: c.points,
        firstBlood: c.firstBlood,
      })),
      ...(t.hints || []).map((h) => ({
        key: `${t.name}|hint|${h.challengeName}`,
        at: h.usedAt,
        team: t.name,
        flag: label(byName.get(h.challengeName), h.challengeName),
        hint: true,
      })),
    ])
    .filter((e) => e.at)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ITEMS);

  return (
    <section className="feed" aria-label="Activité récente">
      <span className="feed-label">
        <span className="panel-prompt">$</span> tail -f flags.log
      </span>
      <ul className="feed-list">
        {items.length === 0 && <li className="feed-empty">aucun flag pour l'instant…</li>}
        {items.map((e) => (
          <li key={e.key} className={`feed-item${e.hint ? ' feed-hint' : ''}`}>
            <span className="feed-time">{hhmm(e.at)}</span>
            <span className="feed-team">{e.team}</span>
            <span className="feed-arrow">{e.hint ? 'indice' : '▸'}</span>
            <span className="feed-flag">{e.flag}</span>
            <span className="feed-pts">{e.hint ? `−${hintPenalty}` : `+${e.points}`}</span>
            {e.firstBlood && (
              <span className="feed-blood">
                <IconDrop size={12} />
                FIRST BLOOD
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
