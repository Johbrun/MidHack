import { useState } from 'react';
import {
  IconMegaphone,
  IconPlay,
  IconSnowflake,
  IconStop,
  IconTrash,
  IconUnlock,
} from '../icons';
import { Bar, Card, PageHead, fmtClock, fmtCountdown, useNow } from './ui';

const PRESETS = [30, 45, 60, 90, 120];
const RESET_WORD = 'RESET';

// Pilotage de l'épreuve : chrono, gel du classement, annonces, remise à zéro.
export default function ControlTab({ frozen, timerEndTime, status, teamCount, action }) {
  return (
    <>
      <PageHead
        cmd="ctfctl control"
        title="Pilotage de l'épreuve"
        desc="Tout ce qui s'affiche dans la salle : le chrono, le gel du classement et les annonces."
      />
      <div className="adm-grid-2">
        <TimerCard timerEndTime={timerEndTime} status={status} action={action} />
        <FreezeCard frozen={frozen} pending={status?.pendingCaptures || 0} action={action} />
      </div>
      <AnnounceCard action={action} />
      <DangerCard teamCount={teamCount} action={action} />
    </>
  );
}

function TimerCard({ timerEndTime, status, action }) {
  const now = useNow();
  const [minutes, setMinutes] = useState(status?.timer?.duration || 90);
  const running = !!timerEndTime;
  const remaining = running ? timerEndTime - now : 0;
  const duration = (status?.timer?.duration || 0) * 60000;
  const state = !running ? 'idle' : remaining <= 0 ? 'over' : remaining < 300000 ? 'warning' : 'running';
  const label = { idle: 'En attente', running: 'En cours', warning: 'Dernières minutes', over: 'Temps écoulé' }[state];

  return (
    <Card
      title="timer"
      aside={<span className={`adm-state adm-state-${state === 'running' ? 'ok' : state === 'idle' ? 'dim' : 'danger'}`}>{label}</span>}
    >
      <div className="adm-card-body">
        <div className={`adm-clock is-${state}`}>
          <span className="adm-clock-value">{running ? fmtCountdown(remaining) : '--:--'}</span>
          {running && (
            <span className="adm-clock-meta">
              fin prévue à {fmtClock(timerEndTime)}
              {duration > 0 && ` · ${status.timer.duration} min au total`}
            </span>
          )}
        </div>
        {running && duration > 0 && (
          <Bar value={duration - remaining} max={duration} tone={state === 'running' ? 'ok' : 'danger'} />
        )}

        <div className="adm-field">
          <span className="adm-field-label">Durée</span>
          <div className="adm-seg">
            {PRESETS.map((p) => (
              <button key={p} className={minutes === p ? 'is-active' : ''} onClick={() => setMinutes(p)}>
                {p}
              </button>
            ))}
            <label className="adm-seg-input">
              <input
                type="number"
                min={1}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                aria-label="Durée en minutes"
              />
              min
            </label>
          </div>
        </div>

        <div className="adm-row">
          <button
            className="btn btn-ok btn-grow"
            disabled={!minutes || minutes <= 0}
            onClick={() => action('/api/timer/start', { duration: minutes }, `Chrono lancé : ${minutes} min`)}
          >
            <IconPlay size={16} />
            {running ? 'Relancer' : 'Démarrer'}
          </button>
          <button className="btn btn-danger" disabled={!running} onClick={() => action('/api/timer/stop', {}, 'Chrono arrêté')}>
            <IconStop size={16} />
            Arrêter
          </button>
        </div>
      </div>
    </Card>
  );
}

function FreezeCard({ frozen, pending, action }) {
  return (
    <Card
      title="freeze"
      tone={frozen ? 'info' : undefined}
      aside={<span className={`adm-state adm-state-${frozen ? 'info' : 'ok'}`}>{frozen ? 'Gelé' : 'En direct'}</span>}
    >
      <div className="adm-card-body adm-freeze">
        <div className={`adm-freeze-icon${frozen ? ' is-frozen' : ''}`}>
          {frozen ? <IconSnowflake size={36} /> : <IconUnlock size={36} />}
        </div>
        <div className="adm-freeze-text">
          {frozen ? (
            <>
              <strong>Classement figé.</strong> Les équipes continuent de soumettre leurs flags, mais
              l'écran ne bouge plus.
              <span className="adm-freeze-pending">
                <b>{pending}</b> capture{pending > 1 ? 's' : ''} en attente, rejouée{pending > 1 ? 's' : ''} au dégel
              </span>
            </>
          ) : (
            <>
              <strong>Classement en direct.</strong> Gelez-le pour les dernières minutes : le suspense reste
              entier jusqu'à la révélation finale.
            </>
          )}
        </div>
        {frozen ? (
          <button
            className="btn btn-primary btn-block"
            onClick={() => action('/api/scoreboard/unfreeze', {}, `Classement dégelé · ${pending} capture(s) rejouée(s)`)}
          >
            <IconUnlock size={16} />
            Dégeler et révéler
          </button>
        ) : (
          <button className="btn btn-info btn-block" onClick={() => action('/api/scoreboard/freeze', {}, 'Classement gelé')}>
            <IconSnowflake size={16} />
            Geler le classement
          </button>
        )}
      </div>
    </Card>
  );
}

const QUICK_MESSAGES = [
  'Plus que 15 minutes !',
  'Pause de 10 minutes, on reprend bientôt.',
  'Fin de l\'épreuve, posez les claviers !',
];

function AnnounceCard({ action }) {
  const [text, setText] = useState('');
  const [history, setHistory] = useState([]);

  async function send(message) {
    const msg = message.trim();
    if (!msg) return;
    if (await action('/api/announce', { message: msg }, 'Annonce diffusée')) {
      setHistory((h) => [{ msg, at: new Date().toISOString() }, ...h].slice(0, 5));
      setText('');
    }
  }

  return (
    <Card title="broadcast">
      <div className="adm-card-body adm-announce">
        <div className="adm-announce-form">
          <textarea
            className="input adm-textarea"
            rows={2}
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            placeholder="Message affiché en bandeau sur le scoreboard pendant 15 s…"
          />
          <div className="adm-row adm-row-between">
            <div className="adm-quick">
              {QUICK_MESSAGES.map((q) => (
                <button key={q} className="adm-quick-btn" onClick={() => setText(q)}>
                  {q}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" disabled={!text.trim()} onClick={() => send(text)}>
              <IconMegaphone size={16} />
              Diffuser
            </button>
          </div>
        </div>
        <div className="adm-announce-side">
          <span className="adm-field-label">Aperçu</span>
          <div className={`adm-announce-preview${text.trim() ? '' : ' is-empty'}`}>
            <IconMegaphone size={18} />
            <span>{text.trim() || 'Votre message ici'}</span>
          </div>
          {history.length > 0 && (
            <>
              <span className="adm-field-label">Envoyées pendant cette session</span>
              <ul className="adm-history">
                {history.map((h) => (
                  <li key={h.at}>
                    <span className="adm-stream-time">{fmtClock(h.at)}</span>
                    <span className="adm-history-msg">{h.msg}</span>
                    <button className="adm-quick-btn" onClick={() => setText(h.msg)} title="Réutiliser">
                      ↺
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// La remise à zéro efface le classement : on fait taper le mot plutôt que de
// se contenter d'un clic, pour qu'aucun geste réflexe ne la déclenche.
function DangerCard({ teamCount, action }) {
  const [word, setWord] = useState('');
  const armed = word === RESET_WORD;

  return (
    <Card title="rm -rf ./scores" tone="danger" className="adm-danger">
      <div className="adm-card-body adm-danger-body">
        <div>
          <strong>Réinitialiser les scores</strong>
          <p className="text-muted">
            Supprime les {teamCount} équipe{teamCount > 1 ? 's' : ''}, leurs captures, leurs indices et les
            captures en attente. Irréversible : pensez à exporter le classement avant.
          </p>
        </div>
        <div className="adm-row">
          <input
            className="input adm-confirm"
            value={word}
            onChange={(e) => setWord(e.target.value.toUpperCase())}
            placeholder={`Tapez ${RESET_WORD}`}
            aria-label={`Tapez ${RESET_WORD} pour confirmer`}
          />
          <button
            className="btn btn-danger-solid"
            disabled={!armed}
            onClick={async () => {
              if (await action('/api/reset', {}, 'Scores réinitialisés')) setWord('');
            }}
          >
            <IconTrash size={16} />
            Réinitialiser
          </button>
        </div>
      </div>
    </Card>
  );
}
