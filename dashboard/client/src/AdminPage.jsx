import { useEffect, useState } from 'react';
import { EnvBar } from './components/Header';
import LockScreen from './components/LockScreen';
import AdminPanel from './components/AdminPanel';
import { IconShield, IconTrophy } from '@shared/ui/icons';
import { useTheme } from '@shared/ui/useTheme';
import { useScoreboard } from './useScoreboard';

const TOKEN_KEY = 'adminToken';

// Le mot de passe est vérifié par le serveur (ADMIN_PASSWORD) : il renvoie le
// jeton que la console joint ensuite à chaque appel de l'API admin.
async function login(password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) return false;
  const data = await res.json();
  if (!data.ok) return false;
  return data.token;
}

// Console d'administration, sur sa propre page (/admin) : verrouillée par le
// même écran que les phases du QG, puis la console en plein écran.
export default function AdminPage() {
  const { teams, status, online, frozen, timerEndTime, config } = useScoreboard();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  });

  useEffect(() => {
    document.title = 'Administration · Hacking QG';
  }, []);

  function unlock(newToken) {
    try { localStorage.setItem(TOKEN_KEY, newToken); } catch { /* navigation privée */ }
    setToken(newToken);
  }

  function logout() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken('');
  }

  if (token) {
    return (
      <AdminPanel
        token={token}
        onLogout={logout}
        teams={teams}
        online={online}
        frozen={frozen}
        timerEndTime={timerEndTime}
        config={config}
      />
    );
  }

  return (
    <div className="app">
      <EnvBar
        title="Hacking QG · Administration"
        online={online}
        status={status}
        frozen={frozen}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      >
        <a className="icon-btn" href="/" title="Scoreboard" aria-label="Retour au scoreboard">
          <IconTrophy size={15} />
        </a>
      </EnvBar>
      <LockScreen
        command="sudo ctfctl --admin"
        verify={login}
        label="administrateur"
        icon={IconShield}
        submitLabel="Ouvrir la console"
        help="Le mot de passe administrateur est défini côté serveur (ADMIN_PASSWORD)."
        onUnlock={unlock}
      >
        Chrono, gel des scores, annonces, équipes et journal : la console de pilotage du CTF est
        réservée à l'organisation.
      </LockScreen>
    </div>
  );
}
