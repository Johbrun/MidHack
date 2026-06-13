import { useState } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { NantesHackLogo } from '../lib/branding';

const steps = [
  {
    number: '01',
    title: 'Lis les instructions du QG',
    description: 'Prends le temps de lire toutes les informations sur l\'académie du Hacking QG avant de continuer.',
    action: null,
  },
  {
    number: '02',
    title: 'Entre le flag de démarrage',
    description: 'Tu trouveras le flag à la fin du guide Burp. Entre-le pour débloquer la cible.',
    action: null,
  },
];

export default function OnboardingModal() {
  const { unlocked, unlock } = useOnboarding();
  const [flag, setFlag] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (unlocked) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = unlock(flag);
    if (!ok) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-dark-light border border-white/10 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <NantesHackLogo className="h-8 w-auto" />
          <div>
            <p className="text-sm text-white/30 uppercase tracking-widest font-mono">Atelier sécurité web</p>
            <h1 className="text-xl font-heading font-extrabold text-white leading-tight">
              Avant de commencer
            </h1>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-px mb-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 bg-white/[0.03] border border-white/[0.06] first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="text-3xl font-heading font-black text-white/10 leading-none mt-0.5 w-10 shrink-0">
                {step.number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-heading font-semibold text-white/80 mb-1">{step.title}</p>
                <p className="text-sm text-white/40 font-body leading-relaxed">{step.description}</p>
                {step.action && (
                  <a
                    href={step.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-accent hover:text-accent/70 transition-colors font-mono"
                  >
                    {step.action.label}
                  </a>
                )}
                {i === 2 && (
                  <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={flag}
                      onChange={(e) => { setFlag(e.target.value); setError(false); }}
                      placeholder="ASY{...}"
                      autoComplete="off"
                      spellCheck={false}
                      className={`flex-1 h-10 px-3 rounded bg-white/[0.06] border text-sm font-mono text-white placeholder-white/20 outline-none focus:border-accent/60 transition-colors ${
                        error ? 'border-red-500/60' : 'border-white/10'
                      } ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded bg-accent text-dark text-sm font-heading font-bold hover:bg-accent/80 transition-colors shrink-0"
                    >
                      Débloquer
                    </button>
                  </form>
                )}
                {i === 2 && error && (
                  <p className="mt-1.5 text-sm text-red-400 font-mono">Flag incorrect. Vérifie le guide Burp.</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-white/20 font-mono">
          🍌 BananaCTF
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
