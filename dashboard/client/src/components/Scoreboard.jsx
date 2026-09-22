import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CATEGORIES,
  DIFFICULTIES,
  DIFFICULTY_POINTS,
  DIFF_TONE,
  FLAGS,
  MAX_SCORE,
  shortName,
} from '../flags';
import { IconBulb, IconCheck, IconClock, IconDrop, IconSnowflake } from './icons';

// Colonnes regroupées par difficulté, dans l'ordre du barème.
const GROUPS = [...DIFFICULTIES, ...new Set(FLAGS.map((f) => f.difficulty))]
  .filter((d, i, all) => all.indexOf(d) === i)
  .map((difficulty) => ({ difficulty, flags: FLAGS.filter((f) => f.difficulty === difficulty) }))
  .filter((g) => g.flags.length > 0);
const COLUMNS = GROUPS.flatMap((g) => g.flags.map((f, i) => ({ ...f, groupStart: i === 0 })));

// Hauteur de ligne bornée (en rem) : entre les deux, le tableau s'étire pour
// occuper tout l'écran, quel que soit le nombre d'équipes. Au-delà de
// ROW_ROOMY, noms et cases grossissent pour remplir les lignes.
const ROW_MIN = 2.5;
const ROW_MAX = 6.5;
const ROW_ROOMY = 5;
// Trop d'équipes pour l'écran : personne ne fait défiler un vidéoprojecteur,
// le tableau alterne donc seul entre le haut et le bas.
const AUTOSCROLL_MS = 10000;

export default function Scoreboard({ teams, hintPenalty = 3, frozen = false }) {
  const scrollRef = useRef(null);
  const headRef = useRef(null);
  const [rowH, setRowH] = useState(null);
  const [roomy, setRoomy] = useState(false);
  const fresh = useFreshCaptures(teams);
  const hasTeams = teams.length > 0;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || teams.length === 0) return undefined;
    const fit = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const avail = el.clientHeight - headRef.current.offsetHeight;
      const h = Math.min(ROW_MAX * rem, Math.max(ROW_MIN * rem, avail / teams.length));
      setRowH(Math.floor(h));
      setRoomy(h >= ROW_ROOMY * rem);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [teams.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const id = setInterval(() => {
      if (el.scrollHeight <= el.clientHeight) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      el.scrollTo({ top: atBottom ? 0 : el.scrollHeight, behavior: 'smooth' });
    }, AUTOSCROLL_MS);
    return () => clearInterval(id);
  }, [hasTeams]);

  return (
    <section className="panel board">
      <header className="panel-head">
        <h2 className="panel-title">
          <span className="panel-prompt">$</span> ./scoreboard --live
        </h2>
        <Legend />
      </header>

      {frozen && (
        <div className="freeze-banner">
          <IconSnowflake size={18} />
          CTF gelé — les scores affichés sont figés
        </div>
      )}

      {!hasTeams ? (
        <div className="empty">
          <p className="empty-cmd">
            <span className="panel-prompt">$</span>
            en attente des équipes<span className="cursor">_</span>
          </p>
          <p>Le classement s'affiche dès l'arrivée des équipes.</p>
        </div>
      ) : (
        <div className="board-scroll" ref={scrollRef}>
          <table
            className={roomy ? 'table is-roomy' : 'table'}
            style={rowH ? { '--row-h': `${rowH}px` } : undefined}
          >
            <colgroup>
              <col className="col-rank" />
              <col />
              <col className="col-score" />
              {COLUMNS.map((f) => (
                <col key={f.flagId} className="col-flag" />
              ))}
              <col className="col-last" />
            </colgroup>
            <thead ref={headRef}>
              <tr>
                <th className="th-group" colSpan={3} />
                {GROUPS.map((g) => (
                  <th key={g.difficulty} className="th-group" colSpan={g.flags.length}>
                    <div className={`group tone-${DIFF_TONE[g.difficulty] || 'ok'}`}>
                      {g.difficulty}
                      <span>· {DIFFICULTY_POINTS[g.difficulty] ?? '?'} pts</span>
                    </div>
                  </th>
                ))}
                <th className="th-group" />
              </tr>
              <tr>
                <th className="th">#</th>
                <th className="th">Équipe</th>
                <th className="th th-right">Score</th>
                {COLUMNS.map((f) => (
                  <th
                    key={f.flagId}
                    className={`th-flag${f.groupStart ? ' group-start' : ''}`}
                    title={f.name}
                  >
                    <span
                      className="th-flag-cat"
                      style={{ background: (CATEGORIES[f.category] || CATEGORIES.other).color }}
                    />
                    {shortName(f)}
                  </th>
                ))}
                <th className="th th-right">Dernier flag</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <TeamRow
                  key={team.name}
                  team={team}
                  rank={i + 1}
                  hintPenalty={hintPenalty}
                  fresh={fresh}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Legend() {
  return (
    <div className="legend">
      <div className="legend-group">
        <span className="legend-item">
          <span className="cell cell-ok"><IconCheck /></span>Flag
        </span>
        <span className="legend-item">
          <span className="cell cell-ok-hint"><IconCheck /></span>Flag avec indice
        </span>
        <span className="legend-item">
          <span className="cell cell-hint"><IconBulb /></span>Indice
        </span>
        <span className="legend-item">
          <span className="cell-blood"><IconDrop /></span>First blood
        </span>
      </div>
      <span className="legend-sep" />
      <div className="legend-group">
        {Object.values(CATEGORIES).map((cat) => (
          <span key={cat.label} className="legend-item">
            <span className="th-flag-cat" style={{ background: cat.color, margin: 0 }} />
            {cat.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TeamRow({ team, rank, hintPenalty = 3, fresh }) {
  const hints = team.hints || [];
  const score =
    team.score !== undefined
      ? team.score
      : team.captures.reduce((s, c) => s + (c.points || 0), 0) - hints.length * hintPenalty;
  const isFresh = team.captures.some((c) => fresh.has(`${team.name}|${c.flagId}`));
  const rowClass = ['row', rank === 1 && score > 0 && 'is-leader', isFresh && 'is-fresh']
    .filter(Boolean)
    .join(' ');

  return (
    <tr className={rowClass}>
      <td>
        <span className={`rank rank-${rank}`}>
          <span className="rank-hash">#</span>
          {rank}
        </span>
      </td>
      <td>
        <div className="team">
          <span className="team-name" title={team.name}>
            {team.name}
          </span>
          {hints.length > 0 && (
            <span
              className="chip"
              title={`${hints.length} indice(s) utilisé(s) (-${hints.length * hintPenalty} pts)`}
            >
              <IconBulb size={14} />
              {hints.length}
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="score">
          <span className="score-value">
            {score}
            <span className="score-max">/{MAX_SCORE}</span>
          </span>
          <span className="bar">
            <span
              className="bar-fill"
              style={{ width: `${Math.max(0, Math.min(100, (score / MAX_SCORE) * 100))}%` }}
            />
          </span>
        </div>
      </td>
      {COLUMNS.map((f) => (
        <td key={f.flagId} className={`td-flag${f.groupStart ? ' group-start' : ''}`}>
          <FlagCell
            capture={team.captures.find((c) => c.flagId === f.flagId)}
            hintUsed={hints.some((h) => h.challengeName === f.name)}
            isFresh={fresh.has(`${team.name}|${f.flagId}`)}
          />
        </td>
      ))}
      <td>
        <TimeSinceLastFlag captures={team.captures} />
      </td>
    </tr>
  );
}

function FlagCell({ capture, hintUsed, isFresh }) {
  if (capture) {
    return (
      <span
        className={`cell ${hintUsed ? 'cell-ok-hint' : 'cell-ok'}${isFresh ? ' is-fresh' : ''}`}
        title={new Date(capture.capturedAt).toLocaleTimeString('fr-FR')}
      >
        <IconCheck />
        {capture.firstBlood && (
          <span className="cell-blood">
            <IconDrop />
          </span>
        )}
      </span>
    );
  }
  if (hintUsed) {
    return (
      <span className="cell cell-hint">
        <IconBulb />
      </span>
    );
  }
  return <span className="cell cell-empty" />;
}

function TimeSinceLastFlag({ captures }) {
  const lastTs =
    captures.length > 0
      ? Math.max(...captures.map((c) => new Date(c.capturedAt).getTime()))
      : null;

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lastTs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lastTs]);

  if (!lastTs) return <span className="last">—</span>;

  const elapsed = Math.max(0, now - lastTs);
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isStale = elapsed > 10 * 60 * 1000;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <span className={`last${isStale ? ' is-stale' : ''}`} title="Temps depuis le dernier flag">
      <IconClock size={16} />
      {formatted}
    </span>
  );
}

// Captures apparues depuis le dernier rendu, pour animer la case et la ligne
// concernées. Le premier chargement n'anime rien : tout y est « ancien ».
function useFreshCaptures(teams) {
  const seenRef = useRef(null);
  const timerRef = useRef(null);
  const [fresh, setFresh] = useState(() => new Set());

  useLayoutEffect(() => {
    const keys = new Set(teams.flatMap((t) => t.captures.map((c) => `${t.name}|${c.flagId}`)));
    if (seenRef.current) {
      const added = [...keys].filter((k) => !seenRef.current.has(k));
      if (added.length > 0) {
        setFresh(new Set(added));
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setFresh(new Set()), 2600);
      }
    }
    seenRef.current = keys;
  }, [teams]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return fresh;
}
