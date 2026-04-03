import { useState, useEffect } from 'react';

const DASHBOARD_WS = import.meta.env.VITE_DASHBOARD_WS || 'ws://localhost:5000/ws';
const DASHBOARD_API = import.meta.env.VITE_DASHBOARD_API || 'http://localhost:5000';

export default function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Fetch initial state
    fetch(`${DASHBOARD_API}/api/scoreboard`)
      .then(r => r.json())
      .then(data => setTeams(data.teams || []))
      .catch(() => {});

    // WebSocket for live updates
    let ws;
    try {
      ws = new WebSocket(DASHBOARD_WS);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'scoreboard') {
          setTeams(data.teams || []);
        } else if (data.type === 'capture') {
          // Re-fetch full state on capture
          fetch(`${DASHBOARD_API}/api/scoreboard`)
            .then(r => r.json())
            .then(d => setTeams(d.teams || []))
            .catch(() => {});
        }
      };
    } catch {
      // Dashboard might not be running
    }

    return () => ws?.close();
  }, []);

  const allFlags = [
    'Data Exposure',
    'IDOR',
    'Reflected XSS',
    'SQL Injection',
    'Business Logic',
    'JWT Forging',
    'Stored XSS',
    'Zero Rating',
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title mb-1">Classement</h1>
          <p className="text-white/40 text-sm">Classement CTF en direct</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="text-xs text-white/30 font-mono">{connected ? 'En direct' : 'Hors ligne'}</span>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-white/30">Aucune équipe inscrite pour le moment. Commencez à hacker !</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left p-4 font-heading font-bold text-white/40 uppercase tracking-wider text-xs">#</th>
                  <th className="text-left p-4 font-heading font-bold text-white/40 uppercase tracking-wider text-xs">Équipe</th>
                  <th className="text-center p-4 font-heading font-bold text-white/40 uppercase tracking-wider text-xs">Score</th>
                  {allFlags.map(f => (
                    <th key={f} className="text-center p-4 font-heading font-bold text-white/40 uppercase tracking-wider text-xs whitespace-nowrap">
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams
                  .sort((a, b) => (b.captures?.length || 0) - (a.captures?.length || 0))
                  .map((team, i) => (
                    <tr key={team.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="p-4 font-mono text-white/30">{i + 1}</td>
                      <td className="p-4 font-heading font-semibold">
                        {i === 0 && teams.length > 1 ? <span className="text-accent">{team.name}</span> : team.name}
                      </td>
                      <td className="p-4 text-center font-heading font-extrabold text-accent">
                        {team.captures?.length || 0}
                      </td>
                      {allFlags.map(f => {
                        const captured = team.captures?.find(c => c.flagName === f);
                        return (
                          <td key={f} className="p-4 text-center">
                            {captured ? (
                              <span className="text-emerald-400">✓</span>
                            ) : (
                              <span className="text-white/10">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
