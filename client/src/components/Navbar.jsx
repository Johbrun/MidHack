import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-2xl">🍌</span>
          <span className="font-heading font-extrabold text-lg tracking-tight group-hover:text-accent transition-colors">
            BananaShop
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/instructions"
            className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
          >
            Instructions CTF
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Tableau de bord
              </Link>
              <Link
                to="/shop"
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Boutique
              </Link>
              <Link
                to="/send"
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Envoyer des crédits
              </Link>
              <Link
                to={`/profile/${user.id}`}
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Profil
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-2 text-sm text-accent hover:text-accent/80 transition-colors font-heading font-semibold"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/scoreboard"
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Classement
              </Link>
              <div className="ml-2 pl-4 border-l border-white/10 flex items-center gap-3">
                <span className="text-sm font-mono text-accent">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-white/40 hover:text-red-400 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/scoreboard"
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Classement
              </Link>
              <Link to="/login" className="btn-primary !h-9 !text-xs !px-4 ml-2">
                Connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
