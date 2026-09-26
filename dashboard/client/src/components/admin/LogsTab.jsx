import { useEffect, useState } from 'react';
import { IconRefresh } from '../icons';
import { Card, Empty, PageHead, fmtClock } from './ui';
import { FLAG_BY_ID } from './stats';
import { flagLabel } from '../../flags';

export const KINDS = {
  award: { label: 'flag délivré', tone: 'ok' },
  withheld: { label: 'flag retenu', tone: 'accent' },
  locked: { label: 'verrouillé', tone: 'info' },
  side_effect: { label: 'effet de bord', tone: 'danger' },
  near_miss: { label: 'mauvais endroit', tone: 'dim' },
};

const AUTO_REFRESH_MS = 5000;

// Chemins d'exploitation : ce que les équipes ont réellement fait, et pas
// seulement ce qu'elles ont validé.
export default function LogsTab({ teams, fetchEvents, initialTeam = '' }) {
  const [events, setEvents] = useState(null);
  const [team, setTeam] = useState(initialTeam);
  const [kind, setKind] = useState('');
  const [auto, setAuto] = useState(true);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const data = await fetchEvents(team);
    if (data) setEvents(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!auto) return undefined;
    const id = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, auto]);

  const all = events || [];
  const counts = all.reduce((m, e) => ({ ...m, [e.kind]: (m[e.kind] || 0) + 1 }), {});
  const shown = kind ? all.filter((e) => e.kind === kind) : all;

  return (
    <>
      <PageHead
        cmd={`tail -n 100 paths.log${team ? ` | grep "${team}"` : ''}`}
        title="Journal d'exploitation"
        desc="Ce que les équipes ont fait, pas seulement ce qu'elles ont validé : flag délivré, flag retenu (un autre était déjà tombé sur la requête), challenge verrouillé, effet de bord, ou technique employée au mauvais endroit."
      />

      <Card
        title="paths --all"
        aside={
          <div className="adm-row">
            <select className="input adm-select" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Toutes les équipes</option>
              {teams.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <label className="adm-switch">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              <span className="adm-switch-track" />
              Live
            </label>
            <button className="btn btn-sm" onClick={load} title="Rafraîchir">
              <IconRefresh size={14} className={loading ? 'adm-spin' : ''} />
            </button>
          </div>
        }
      >
        <div className="adm-filters">
          <button className={`adm-filter${kind === '' ? ' is-active' : ''}`} onClick={() => setKind('')}>
            tout <b>{all.length}</b>
          </button>
          {Object.entries(KINDS).map(([k, v]) => (
            <button
              key={k}
              className={`adm-filter adm-filter-${v.tone}${kind === k ? ' is-active' : ''}`}
              onClick={() => setKind(kind === k ? '' : k)}
            >
              <span className="adm-dot" />
              {v.label} <b>{counts[k] || 0}</b>
            </button>
          ))}
        </div>

        {events === null ? (
          <Empty cmd="chargement">Lecture du journal…</Empty>
        ) : shown.length === 0 ? (
          <Empty cmd="grep: aucune correspondance">Aucun événement pour l'instant.</Empty>
        ) : (
          <div className="adm-term">
            {shown.map((e, i) => {
              const k = KINDS[e.kind] || { label: e.kind, tone: 'dim' };
              return (
                <div key={`${e.at}-${i}`} className="adm-term-line">
                  <span className="adm-term-time">{fmtClock(e.at)}</span>
                  <span className={`adm-term-kind is-${k.tone}`}>{k.label}</span>
                  <span className="adm-term-team">{e.teamName}</span>
                  <span className="adm-term-flag">{e.flagId ? FLAG_BY_ID[e.flagId] ? flagLabel(FLAG_BY_ID[e.flagId]) : e.flagId : '—'}</span>
                  <span className="adm-term-proof" title={e.proof || ''}>
                    {e.username && <span className="adm-term-user">@{e.username} </span>}
                    {e.proof || ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
