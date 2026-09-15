// Small shared helper to register a team on the central dashboard.
// Used by both `server/` and `exploit-server/` at startup.

// `service` ('site' | 'exploit') : chaque démarrage se signale au dashboard, qui
// compte ainsi les redémarrages d'un conteneur sans qu'on ait à lire les logs.
function registerTeam({ dashboardUrl, teamName, service }) {
  return fetch(`${dashboardUrl}/api/teams/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Team-Token': process.env.TEAM_TOKEN || '',
    },
    body: JSON.stringify({ teamName, service }),
  });
}

module.exports = { registerTeam };
