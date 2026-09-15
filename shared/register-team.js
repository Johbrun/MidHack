// Small shared helper to register a team on the central dashboard.
// Used by both `server/` and `exploit-server/` at startup.

function registerTeam({ dashboardUrl, teamName }) {
  return fetch(`${dashboardUrl}/api/teams/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Team-Token': process.env.TEAM_TOKEN || '',
    },
    body: JSON.stringify({ teamName }),
  });
}

module.exports = { registerTeam };
