import Timer from './Timer';
import { NantesHackLogo } from '../lib/branding';

export default function Header({ online, status, timerEndTime, onReset }) {
  return (
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-4">
        <NantesHackLogo className="h-10 w-auto" />
        <div>
          <h1 className="font-heading font-black text-4xl tracking-tight">
            <span className="gradient-text">BananaShop CTF</span>
          </h1>
          <p className="text-white/30 text-sm mt-1">Classement en direct</p>
        </div>
      </div>

      <Timer endTime={timerEndTime} />

      <div className="flex items-center gap-4">
        <button
          onClick={onReset}
          className="font-heading font-bold text-xs uppercase tracking-wider px-4 py-2 border border-red-500/40 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 hover:border-red-500/60 transition"
          title="Réinitialiser tous les scores"
        >
          Reset
        </button>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              online ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500'
            }`}
          />
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
