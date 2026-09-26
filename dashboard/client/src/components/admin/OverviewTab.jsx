import { FLAGS, MAX_SCORE, flagLabel } from '../../flags';
import {
  IconAlert,
  IconBulb,
  IconClock,
  IconDrop,
  IconFlag,
  IconServer,
  IconSnowflake,
  IconTarget,
  IconUsers,
} from '@shared/ui/icons';
import { Bar, Card, Empty, Kpi, PageHead, fmtClock, fmtCountdown, timeAgo, useNow } from './ui';
import { FLAG_BY_ID, recentCaptures, restartList, teamScore } from './stats';

export default function OverviewTab({ teams, status, online, frozen, timerEndTime, hintPenalty, goTo }) {
  const now = useNow();
  const captures = teams.reduce((n, t) => n + t.captures.length, 0);
  const hints = teams.reduce((n, t) => n + (t.hints || []).length, 0);
  const fallen = new Set(teams.flatMap((t) => t.captures.map((c) => c.flagId))).size;
  const bloods = teams.reduce((n, t) => n + t.captures.filter((c) => c.firstBlood).length, 0);
  const restarts = restartList(status);
  const pending = status?.pendingCaptures || 0;
  const remaining = timerEndTime ? timerEndTime - now : null;
  const recent = recentCaptures(teams, 8);
  const top = teams.slice(0, 5);

  return (
    <>
      <PageHead
        cmd="ctfctl status"
        title="Vue d'ensemble"
        desc="L'état de l'épreuve en un coup d'œil. Les chiffres suivent le tableau projeté en direct."
      />

      <div className="adm-kpis">
        <Kpi label="Équipes" value={teams.length} icon={IconUsers} tone="info" />
        <Kpi label="Flags capturés" value={captures} icon={IconFlag} tone="ok" sub={`${bloods} first blood${bloods > 1 ? 's' : ''}`} />
        <Kpi label="Challenges tombés" value={fallen} max={FLAGS.length} icon={IconTarget} tone="accent" />
        <Kpi label="Indices utilisés" value={hints} icon={IconBulb} tone="accent" sub={`-${hints * hintPenalty} pts au total`} />
        <Kpi
          label="Chrono"
          value={remaining === null ? '--:--' : fmtCountdown(remaining)}
          icon={IconClock}
          tone={remaining === null ? 'neutral' : remaining < 300000 ? 'danger' : 'ok'}
          sub={remaining === null ? 'non démarré' : remaining <= 0 ? 'temps écoulé' : 'restant'}
        />
      </div>

      <div className="adm-grid-2">
        <Card
          title="rank --top 5"
          aside={
            <button className="btn btn-sm btn-ghost" onClick={() => goTo('teams')}>
              Toutes les équipes →
            </button>
          }
        >
          {top.length === 0 ? (
            <Empty cmd="en attente des équipes">Aucune équipe enregistrée.</Empty>
          ) : (
            <ol className="adm-podium">
              {top.map((t, i) => {
                const score = teamScore(t, hintPenalty);
                return (
                  <li key={t.name} className={i === 0 && score > 0 ? 'is-leader' : ''}>
                    <span className={`rank rank-${i + 1}`}>
                      <span className="rank-hash">#</span>
                      {i + 1}
                    </span>
                    <span className="adm-podium-team">
                      <span className="team-name">{t.name}</span>
                      <Bar value={score} max={MAX_SCORE} />
                    </span>
                    <span className="adm-podium-flags">
                      <IconFlag size={14} />
                      {t.captures.length}
                    </span>
                    <span className="adm-podium-score">
                      {score}
                      <small>pts</small>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card title="tail -f captures">
          {recent.length === 0 ? (
            <Empty cmd="tail -f captures">Aucun flag capturé pour l'instant.</Empty>
          ) : (
            <ul className="adm-stream">
              {recent.map((c) => (
                <li key={`${c.team}|${c.flagId}`}>
                  <span className="adm-stream-time" title={fmtClock(c.capturedAt)}>
                    {timeAgo(c.capturedAt, now)}
                  </span>
                  <span className="adm-stream-team">{c.team}</span>
                  <span className="text-dim">→</span>
                  <span className="adm-stream-flag">{FLAG_BY_ID[c.flagId] ? flagLabel(FLAG_BY_ID[c.flagId]) : c.flagId}</span>
                  {c.firstBlood && (
                    <span className="adm-blood-tag">
                      <IconDrop size={11} />
                      FIRST BLOOD
                    </span>
                  )}
                  <span className="adm-stream-pts">+{c.points}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="healthcheck">
        <ul className="adm-health">
          <Health ok={online} label="Diffusion temps réel" detail={online ? 'WebSocket connecté' : 'reconnexion en cours…'} />
          <Health
            ok={!frozen}
            warn={frozen}
            icon={frozen ? IconSnowflake : undefined}
            label="Classement"
            detail={frozen ? `gelé · ${pending} capture${pending > 1 ? 's' : ''} en attente` : 'mis à jour en direct'}
            action={frozen && <button className="btn btn-sm btn-info" onClick={() => goTo('control')}>Gérer</button>}
          />
          <Health
            ok={remaining !== null && remaining > 0}
            warn={remaining === null || remaining <= 0}
            label="Chrono"
            detail={remaining === null ? 'non démarré' : remaining <= 0 ? 'temps écoulé' : `${fmtCountdown(remaining)} restant`}
            action={remaining === null && <button className="btn btn-sm btn-ok" onClick={() => goTo('control')}>Démarrer</button>}
          />
          <Health
            ok={restarts.length === 0}
            warn={restarts.length > 0}
            icon={IconServer}
            label="Services des équipes"
            detail={
              restarts.length === 0
                ? 'aucun redémarrage'
                : restarts.map((r) => `${r.team}/${r.service} ×${r.count}`).join(' · ')
            }
          />
        </ul>
      </Card>
    </>
  );
}

function Health({ ok, warn, label, detail, action, icon: Icon }) {
  const state = ok ? 'ok' : warn ? 'warn' : 'err';
  return (
    <li className={`adm-health-item is-${state}`}>
      <span className="adm-health-dot">{Icon ? <Icon size={14} /> : state === 'ok' ? null : <IconAlert size={14} />}</span>
      <span className="adm-health-label">{label}</span>
      <span className="adm-health-detail">{detail}</span>
      {action || <span className={`adm-health-state is-${state}`}>{state === 'ok' ? 'OK' : state === 'warn' ? 'ATTN' : 'KO'}</span>}
    </li>
  );
}
