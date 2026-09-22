import { useState } from 'react';
import Header, { EnvBar } from './components/Header';
import { useTheme } from './lib/useTheme';
import Scoreboard from './components/Scoreboard';
import ActivityFeed from './components/ActivityFeed';
import Toasts from './components/Toasts';
import AdminPanel from './components/AdminPanel';
import { useScoreboard } from './useScoreboard';
import { useConfetti } from './lib/useConfetti';

// Écran projeté : bandeau d'environnement, en-tête (titre, chrono, compteurs),
// tableau des scores qui prend toute la hauteur restante, fil d'activité.
export default function App() {
  const { teams, status, online, frozen, timerEndTime, events, consumeEvent, config } =
    useScoreboard();
  const [showAdmin, setShowAdmin] = useState(false);
  useConfetti(events);
  const { isDark, toggle: toggleTheme } = useTheme();

  return (
    <div className="app">
      <EnvBar
        online={online}
        status={status}
        frozen={frozen}
        onAdmin={() => setShowAdmin(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <main className="app-main">
        <Header teams={teams} timerEndTime={timerEndTime} eventTitle={config.eventTitle} />
        <Scoreboard teams={teams} hintPenalty={config.hintPenalty} frozen={frozen} />
        <ActivityFeed teams={teams} hintPenalty={config.hintPenalty} />
      </main>
      <Toasts events={events} consumeEvent={consumeEvent} hintPenalty={config.hintPenalty} />
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
