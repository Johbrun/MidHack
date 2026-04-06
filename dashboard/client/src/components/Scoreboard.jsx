import { CATEGORIES, FLAGS, MAX_SCORE, HINT_PENALTY } from '../flags';

const DIFF_COLORS = { Facile: '#10B981', Moyen: '#FABB5C', Difficile: '#f87171' };

export default function Scoreboard({ teams }) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-20 text-white/15">
        <div className="text-6xl mb-4">🍌</div>
        <p>En attente des équipes...</p>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse table-fixed">
      <thead>
        <tr>
          <th className="text-left py-4 px-1 font-heading font-bold text-xs uppercase tracking-wider text-white/85 border-b border-white/5 w-12">
            #
          </th>
          <th className="text-left py-4 px-1 font-heading font-bold text-xs uppercase tracking-wider text-white/85 border-b border-white/5">
            Équipe
          </th>
          <th className="py-4 px-1 font-heading font-bold text-xs uppercase tracking-wider text-white/85 border-b border-white/5">
            Score
          </th>
          {FLAGS.map((f) => {
            const cat = CATEGORIES[f.category] || CATEGORIES.other;
            const diffColor = DIFF_COLORS[f.difficulty] || '#fff';
            return (
              <th
                key={f.flagId}
                className="py-4 px-1 font-heading font-bold text-xs uppercase tracking-wider border-b border-white/5 break-words"
                style={{ borderTop: `3px solid ${cat.color}`, color: diffColor }}
              >
                {f.name}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {teams.map((team, i) => (
          <TeamRow key={team.name} team={team} rank={i + 1} />
        ))}
      </tbody>
    </table>
  );
}

function TeamRow({ team, rank }) {
  const hints = team.hints || [];
  const score =
    team.score !== undefined
      ? team.score
      : team.captures.reduce((s, c) => s + (c.points || 0), 0) -
        hints.length * HINT_PENALTY;

  return (
    <tr className="hover:bg-white/[0.02]">
      <td
        className={`py-4 px-2 font-heading font-extrabold text-xl border-b border-white/5 ${
          rank === 1 ? 'text-accent' : 'text-white/15'
        }`}
      >
        {rank}
      </td>
      <td className="py-4 px-2 border-b border-white/5">
        <span
          className={`font-heading font-bold text-lg ${
            rank === 1 ? 'text-accent' : ''
          }`}
        >
          {team.name}
        </span>
        {hints.length > 0 && (
          <span
            className="ml-2 text-[0.65rem] text-accent/50"
            title={`${hints.length} indice(s) utilisé(s) (-${hints.length * HINT_PENALTY}pts)`}
          >
            💡{hints.length}
          </span>
        )}
      </td>
      <td className="py-4 px-2 text-center border-b border-white/5">
        <span className="font-heading font-black text-2xl text-accent">
          {score}
        </span>
        <span className="text-[0.7rem] text-white/20"> / {MAX_SCORE}</span>
      </td>
      {FLAGS.map((f) => {
        const cap = team.captures.find((c) => c.flagId === f.flagId);
        const hintUsed = hints.some((h) => h.challengeName === f.name);
        return (
          <td
            key={f.flagId}
            className="py-4 px-2 text-center border-b border-white/5 relative"
          >
            {cap ? (
              <>
                <div
                  className="text-3xl animate-flag-pop"
                  style={{ color: hintUsed ? '#FABB5C' : '#10B981' }}
                >
                  ✓
                </div>
                <div className="text-xs text-white/85 font-mono mt-0.5">
                  {new Date(cap.capturedAt).toLocaleTimeString()}
                </div>
              </>
            ) : hintUsed ? (
              <div className="text-3xl opacity-60 text-accent">💡</div>
            ) : (
              <div className="text-3xl opacity-[0.15]">🔒</div>
            )}
          </td>
        );
      })}
    </tr>
  );
}
