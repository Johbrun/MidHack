import { useEffect, useState } from 'react';
import { FLAGS } from '../flags';
import { IconBulb, IconDrop, IconFlag, IconMegaphone, IconRefresh, IconSnowflake, IconUnlock } from './icons';

// Receives an incoming events stream from useScoreboard() and renders it for
// the room, each kind at the size it deserves: first blood full screen,
// announcements as a top banner, everything else as a stack of toasts.
// La pénalité vient du serveur (config du scoreboard) : la constante locale
// annonçait -3 même quand l'événement était configuré autrement.
const DURATION = { first_blood: 5000, announcement: 15000 };
const DEFAULT_DURATION = 5000;

export default function Toasts({ events, consumeEvent, hintPenalty = 3 }) {
  const [toasts, setToasts] = useState([]); // { id, kind, visible, ... }

  useEffect(() => {
    if (events.length === 0) return;
    for (const evt of events) {
      const built = buildToast(evt, hintPenalty);
      if (built) {
        const toast = { ...built, id: evt.id, visible: false };
        setToasts((prev) => [...prev, toast].slice(-6));
        // Next frame: mark visible to trigger CSS transition
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            setToasts((prev) =>
              prev.map((t) => (t.id === evt.id ? { ...t, visible: true } : t))
            )
          )
        );
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === evt.id ? { ...t, visible: false } : t))
          );
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== evt.id));
          }, 400);
        }, DURATION[built.kind] ?? DEFAULT_DURATION);
      }
      consumeEvent(evt.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const hidden = (t) => (t.visible ? '' : ' is-hidden');
  // Un seul first blood et une seule annonce à l'écran : le plus récent.
  const blood = toasts.filter((t) => t.kind === 'first_blood').at(-1);
  const announce = toasts.filter((t) => t.kind === 'announcement').at(-1);
  const stack = toasts.filter((t) => t.kind !== 'first_blood' && t.kind !== 'announcement');

  return (
    <>
      {announce && (
        <div className={`announce${hidden(announce)}`} role="status">
          <IconMegaphone />
          <span>{announce.message}</span>
        </div>
      )}

      {blood && (
        <div className={`blood${hidden(blood)}`} role="status">
          <div className="blood-card">
            <span className="blood-kicker">
              <IconDrop />
              FIRST BLOOD
            </span>
            <span className="blood-team">{blood.team}</span>
            <span className="blood-flag">{blood.flag}</span>
            <span className="blood-pts">
              +{blood.points} pts <span>dont +{blood.bonus} de bonus</span>
            </span>
          </div>
        </div>
      )}

      <div className="toasts">
        {stack.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className={`toast toast-${t.tone}${hidden(t)}`}>
              <Icon size={22} />
              <span>
                {t.msg}
                {t.pts && <span className="toast-pts"> {t.pts}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function flagLabel(flagId) {
  const flagDef = FLAGS.find((f) => f.flagId === flagId);
  return flagDef ? flagDef.name : flagId;
}

function buildToast(evt, hintPenalty) {
  if (evt.type === 'first_blood') {
    return {
      kind: 'first_blood',
      team: evt.payload.teamName,
      flag: flagLabel(evt.payload.flagId),
      points: evt.payload.points,
      bonus: evt.payload.bonus,
    };
  }
  if (evt.type === 'capture') {
    return {
      kind: 'capture',
      tone: 'ok',
      icon: IconFlag,
      msg: `${evt.payload.teamName} a capturé ${flagLabel(evt.payload.flagId)}`,
      pts: `+${evt.payload.points} pts`,
    };
  }
  if (evt.type === 'hint') {
    return {
      kind: 'hint',
      tone: 'accent',
      icon: IconBulb,
      msg: `${evt.payload.teamName} a pris un indice pour ${evt.payload.challengeName}`,
      pts: `−${hintPenalty} pts`,
    };
  }
  if (evt.type === 'reset') {
    return { kind: 'reset', tone: 'info', icon: IconRefresh, msg: 'Scores réinitialisés' };
  }
  if (evt.type === 'announcement') {
    return { kind: 'announcement', message: evt.payload.message };
  }
  if (evt.type === 'freeze') {
    return evt.payload.frozen
      ? { kind: 'freeze', tone: 'info', icon: IconSnowflake, msg: 'CTF gelé' }
      : { kind: 'freeze', tone: 'info', icon: IconUnlock, msg: 'CTF dégelé' };
  }
  return null;
}
