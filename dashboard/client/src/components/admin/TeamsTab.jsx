import { useState } from 'react';
import { FLAGS, MAX_SCORE } from '../../flags';
import { IconBulb, IconCheck, IconClock, IconDrop, IconList, IconServer, IconShield } from '@shared/ui/icons';
import { Bar, Card, Empty, PageHead, fmtClock, timeAgo, useNow } from './ui';
import { lastCaptureAt, restartList, teamScore } from './stats';

const STALE_MS = 10 * 60 * 1000;

export default function TeamsTab({ teams, status, hintPenalty, goTo }) {
  const now = useNow();
  const [query, setQuery] = useState('');
  const restarts = restartList(status);
  const q = query.trim().toLowerCase();
  const rows = teams.map((t, i) => ({ team: t, rank: i + 1 })).filter((r) => r.team.name.toLowerCase().includes(q));

  return (
    <>
      <PageHead
        cmd="ctfctl teams --list"
        title="Équipes"
        desc="Classement détaillé : captures, indices, phase Blue Team et santé des services de chaque équipe."
      >
        <input
          className="input adm-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer les équipes…"
        />
      </PageHead>

      <Card title={`teams (${rows.length})`}>
        {teams.length === 0 ? (
          <Empty cmd="en attente des équipes">Les équipes apparaissent ici dès que leur QG démarre.</Empty>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Équipe</th>
                  <th className="num">Score</th>
                  <th>Flags</th>
                  <th className="num" title="First bloods">
                    <IconDrop size={13} />
                  </th>
                  <th className="num">Indices</th>
                  <th>Blue Team</th>
                  <th>Dernier flag</th>
                  <th>Services</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ team: t, rank }) => {
                  const score = teamScore(t, hintPenalty);
                  const hints = (t.hints || []).length;
                  const bloods = t.captures.filter((c) => c.firstBlood).length;
                  const last = lastCaptureAt(t);
                  const stale = last && now - new Date(last).getTime() > STALE_MS;
                  const blue = t.blue || { answered: 0, firstTry: 0 };
                  const boots = restarts.filter((r) => r.team === t.name);
                  return (
                    <tr key={t.name} className={rank === 1 && score > 0 ? 'is-leader' : ''}>
                      <td className="num">
                        <span className={`rank rank-${rank}`}>
                          <span className="rank-hash">#</span>
                          {rank}
                        </span>
                      </td>
                      <td>
                        <span className="adm-team">{t.name}</span>
                      </td>
                      <td className="num">
                        <span className="adm-score">{score}</span>
                        <Bar value={score} max={MAX_SCORE} />
                      </td>
                      <td>
                        <span className="adm-frac">
                          {t.captures.length}
                          <small>/{FLAGS.length}</small>
                        </span>
                      </td>
                      <td className="num">{bloods > 0 ? <span className="text-danger">{bloods}</span> : <span className="text-dim">—</span>}</td>
                      <td className="num">
                        {hints > 0 ? (
                          <span className="chip" title={`-${hints * hintPenalty} pts`}>
                            <IconBulb size={13} />
                            {hints}
                          </span>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                      <td>
                        {blue.answered > 0 ? (
                          <span className="chip chip-blue" title="Correctifs trouvés · dont du premier coup">
                            <IconShield size={13} />
                            {blue.answered}
                            <span className="chip-blue-ok">
                              <IconCheck size={11} />
                              {blue.firstTry}
                            </span>
                          </span>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                      <td>
                        {last ? (
                          <span className={`chip chip-time${stale ? ' is-stale' : ''}`} title={fmtClock(last)}>
                            <IconClock size={13} />
                            {timeAgo(last, now)}
                          </span>
                        ) : (
                          <span className="text-dim">aucun</span>
                        )}
                      </td>
                      <td>
                        {boots.length === 0 ? (
                          <span className="adm-state adm-state-ok">OK</span>
                        ) : (
                          <span
                            className="adm-state adm-state-warn"
                            title={boots.map((b) => `${b.service} redémarré ${b.count} fois`).join('\n')}
                          >
                            <IconServer size={12} />
                            {boots.reduce((n, b) => n + b.count, 0)} restart
                          </span>
                        )}
                      </td>
                      <td className="adm-cell-action">
                        <button className="btn btn-sm btn-ghost" onClick={() => goTo('logs', { team: t.name })}>
                          <IconList size={14} />
                          Journal
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
