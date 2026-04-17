import { useEffect, useState } from 'react';
import { FLAGS, HINT_PENALTY } from '../flags';

// Receives an incoming events stream from useScoreboard() and renders
// a stack of auto-dismissing toasts matching the vanilla dashboard look.
export default function Toasts({ events, consumeEvent }) {
  const [toasts, setToasts] = useState([]); // { id, msg, kind, visible }

  useEffect(() => {
    if (events.length === 0) return;
    for (const evt of events) {
      const built = buildToast(evt);
      if (built) {
        const toast = { ...built, id: evt.id, visible: false };
        setToasts((prev) => [...prev, toast].slice(-5));
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
        }, 5000);
      }
      consumeEvent(evt.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  return (
    <div className="fixed bottom-8 right-8 flex flex-col-reverse gap-2 z-50">
      {toasts.map((t) => {
        const base =
          'px-6 py-4 rounded-xl font-heading font-semibold text-sm whitespace-nowrap border transition-all duration-400 ease-out';
        const palette =
          t.kind === 'first_blood'
            ? 'bg-red-500/20 border-red-500/40 text-red-300 text-base'
            : t.kind === 'announcement'
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            : t.kind === 'hint'
            ? 'bg-accent/15 border-accent/30 text-accent'
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
        const motion = t.visible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-[120%] opacity-0';
        return (
          <div key={t.id} className={`${base} ${palette} ${motion}`}>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

function buildToast(evt) {
  if (evt.type === 'first_blood') {
    const flagDef = FLAGS.find((f) => f.flagId === evt.payload.flagId);
    const label = flagDef ? flagDef.name : evt.payload.flagId;
    return {
      msg: `🩸 FIRST BLOOD ! ${evt.payload.teamName} — ${label} (+${evt.payload.points}pts dont +${evt.payload.bonus} bonus)`,
      kind: 'first_blood',
    };
  }
  if (evt.type === 'capture') {
    const flagDef = FLAGS.find((f) => f.flagId === evt.payload.flagId);
    const label = flagDef ? flagDef.name : evt.payload.flagId;
    return {
      msg: `🏴 ${evt.payload.teamName} a capturé ${label} ! (+${evt.payload.points}pts)`,
      kind: 'capture',
    };
  }
  if (evt.type === 'hint') {
    return {
      msg: `💡 ${evt.payload.teamName} a utilisé un indice pour ${evt.payload.challengeName} (-${HINT_PENALTY}pts)`,
      kind: 'hint',
    };
  }
  if (evt.type === 'reset') {
    return { msg: '🔄 Scores réinitialisés !', kind: 'hint' };
  }
  if (evt.type === 'announcement') {
    return { msg: `📢 ${evt.payload.message}`, kind: 'announcement' };
  }
  if (evt.type === 'freeze') {
    return {
      msg: evt.payload.frozen ? '🧊 Scoreboard gelé !' : '🔓 Scoreboard dégelé !',
      kind: 'hint',
    };
  }
  return null;
}
