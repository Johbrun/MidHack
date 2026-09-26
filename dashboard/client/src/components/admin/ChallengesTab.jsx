import { CATEGORIES, DIFF_TONE, flagLabel } from '../../flags';
import { IconBulb, IconDrop } from '@shared/ui/icons';
import { Bar, Card, PageHead, fmtClock } from './ui';
import { challengeStats } from './stats';

export default function ChallengesTab({ teams }) {
  const rows = challengeStats(teams);
  const solved = rows.filter((r) => r.solves.length > 0).length;

  return (
    <>
      <PageHead
        cmd="ctfctl challenges --stats"
        title="Challenges"
        desc="Qui a résolu quoi, qui a pris le first blood, et où les équipes ont eu besoin d'un indice."
      >
        <span className="adm-page-stat">
          <b>{solved}</b>/{rows.length} résolus au moins une fois
        </span>
      </PageHead>

      <Card title={`challenges (${rows.length})`}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Challenge</th>
                <th>Catégorie</th>
                <th>Difficulté</th>
                <th className="num">Points</th>
                <th className="adm-col-solves">Résolutions</th>
                <th>First blood</th>
                <th className="num">Indices</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const cat = CATEGORIES[c.category] || CATEGORIES.other;
                return (
                  <tr key={c.flagId} className={c.solves.length === 0 ? 'is-muted' : ''}>
                    <td>
                      <span className="adm-chal">{flagLabel(c)}</span>
                      {c.codename && <span className="adm-chal-code">{c.name}</span>}
                    </td>
                    <td>
                      <span className="adm-cat">
                        <span className="th-flag-cat" style={{ background: cat.color, margin: 0 }} />
                        {cat.label}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-diff tone-${DIFF_TONE[c.difficulty] || 'ok'}`}>{c.difficulty}</span>
                    </td>
                    <td className="num mono">{c.points}</td>
                    <td className="adm-col-solves">
                      <div className="adm-solves">
                        <span className="adm-frac">
                          {c.solves.length}
                          <small>/{teams.length}</small>
                        </span>
                        <Bar value={c.solves.length} max={teams.length} tone="ok" />
                      </div>
                    </td>
                    <td>
                      {c.firstBlood ? (
                        <span className="adm-fb" title={fmtClock(c.firstBlood.at)}>
                          <span className="adm-fb-drop">
                            <IconDrop size={11} />
                          </span>
                          <span className="adm-team">{c.firstBlood.team}</span>
                          <span className="text-dim mono">{fmtClock(c.firstBlood.at)}</span>
                        </span>
                      ) : (
                        <span className="text-dim mono">non résolu</span>
                      )}
                    </td>
                    <td className="num">
                      {c.hints > 0 ? (
                        <span className="chip">
                          <IconBulb size={13} />
                          {c.hints}
                        </span>
                      ) : (
                        <span className="text-dim">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
