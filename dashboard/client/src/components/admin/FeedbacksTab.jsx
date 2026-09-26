import { useEffect, useState } from 'react';
import { IconDownload, IconRefresh } from '../icons';
import { Card, Empty, PageHead } from './ui';

export default function FeedbacksTab({ feedbacks, reload, token }) {
  const [team, setTeam] = useState('');

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = feedbacks || [];
  const teams = [...new Set(list.map((f) => f.teamName))];
  const shown = team ? list.filter((f) => f.teamName === team) : list;

  return (
    <>
      <PageHead
        cmd="cat feedbacks/*"
        title="Feedbacks"
        desc="Les retours envoyés par les participants depuis leur QG en fin d'atelier."
      >
        <button className="btn" onClick={reload}>
          <IconRefresh size={16} />
          Rafraîchir
        </button>
        <a className="btn" href={`/api/feedback/export?token=${token}`} target="_blank" rel="noopener noreferrer">
          <IconDownload size={16} />
          Exporter (.txt)
        </a>
      </PageHead>

      <Card
        title={`feedbacks (${shown.length})`}
        aside={
          teams.length > 1 && (
            <select className="input adm-select" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Toutes les équipes</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )
        }
      >
        {feedbacks === null ? (
          <Empty cmd="chargement">Lecture des feedbacks…</Empty>
        ) : shown.length === 0 ? (
          <Empty cmd="ls feedbacks/">Aucun feedback pour le moment.</Empty>
        ) : (
          <div className="adm-fb-grid">
            {shown.map((f) => (
              <article key={f.id} className="adm-fb-card">
                <header className="adm-fb-head">
                  <span className="adm-team">{f.teamName}</span>
                  <span className="text-dim mono">{new Date(f.createdAt).toLocaleString('fr-FR')}</span>
                </header>
                {(f.answers || []).map((a, i) => (
                  <div key={a.id || i} className="adm-fb-qa">
                    <p className="adm-fb-q">{a.question}</p>
                    <p className="adm-fb-a">{a.answer}</p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
