import Header, { EnvBar } from './components/Header';
import { useTheme } from '@shared/ui/useTheme';
import Scoreboard from './components/Scoreboard';
import ActivityFeed from './components/ActivityFeed';
import Toasts from './components/Toasts';
import { IconShield } from '@shared/ui/icons';
import { useScoreboard } from './useScoreboard';
import { useConfetti } from './lib/useConfetti';

// Écran projeté : bandeau d'environnement, en-tête (titre, chrono, compteurs),
// tableau des scores qui prend toute la hauteur restante, fil d'activité.
export default function App() {
  const { teams, status, online, frozen, timerEndTime, events, consumeEvent, config } =
    useScoreboard();
  useConfetti(events);
  const { isDark, toggle: toggleTheme } = useTheme();

  return (
    <div className="app">
      <EnvBar
        online={online}
        status={status}
        frozen={frozen}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      >
        {/* Nouvel onglet : la projection continue pendant qu'on administre. */}
        <a className="icon-btn" href="/admin" target="_blank" rel="noopener" title="Administration" aria-label="Administration">
          <IconShield size={15} />
        </a>
      </EnvBar>
      <main className="app-main">
        <Header teams={teams} timerEndTime={timerEndTime} eventTitle={config.eventTitle} />
        <Scoreboard teams={teams} hintPenalty={config.hintPenalty} frozen={frozen} />
        <ActivityFeed teams={teams} hintPenalty={config.hintPenalty} />
      </main>
      <Toasts events={events} consumeEvent={consumeEvent} hintPenalty={config.hintPenalty} />
    </div>
  );
}
