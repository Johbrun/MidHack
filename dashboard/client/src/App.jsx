import Header from './components/Header';
import Legend from './components/Legend';
import Scoreboard from './components/Scoreboard';
import Toasts from './components/Toasts';
import { useScoreboard } from './useScoreboard';

export default function App() {
  const { teams, status, online, timerEndTime, events, consumeEvent } =
    useScoreboard();

  function handleReset() {
    if (
      !confirm(
        'Réinitialiser tous les scores et indices ? Cette action est irréversible.'
      )
    )
      return;
    fetch('/api/reset', { method: 'POST' })
      .then((r) => r.json())
      .catch(() => alert('Erreur lors de la réinitialisation'));
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-4 py-10 relative z-10">
        <Header
          online={online}
          status={status}
          timerEndTime={timerEndTime}
          onReset={handleReset}
        />
        <Legend />
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-x-hidden">
          <Scoreboard teams={teams} />
        </div>
      </div>
      <Toasts events={events} consumeEvent={consumeEvent} />
    </>
  );
}
