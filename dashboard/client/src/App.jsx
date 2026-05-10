import { useState } from 'react';
import Header from './components/Header';
import { useTheme } from './lib/useTheme';
import Legend from './components/Legend';
import Scoreboard from './components/Scoreboard';
import Toasts from './components/Toasts';
import AdminPanel from './components/AdminPanel';
import { useScoreboard } from './useScoreboard';
import { useConfetti } from './lib/useConfetti';

export default function App() {
  const { teams, status, online, frozen, timerEndTime, events, consumeEvent, config } =
    useScoreboard();
  const [showAdmin, setShowAdmin] = useState(false);
  useConfetti(events);
  const { isDark, toggle: toggleTheme } = useTheme();

  return (
    <>
      {frozen && <div className="fixed inset-0 bg-blue-500/10 pointer-events-none z-0 transition-all duration-700" />}
      <div className="max-w-[1600px] mx-auto px-4 py-10 relative z-10">
        <Header
          online={online}
          status={status}
          timerEndTime={timerEndTime}
          eventTitle={config.eventTitle}
          onAdmin={() => setShowAdmin(true)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <Legend />
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-x-hidden">
          <Scoreboard teams={teams} hintPenalty={config.hintPenalty} frozen={frozen} />
        </div>
      </div>
      <Toasts events={events} consumeEvent={consumeEvent} />
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}
