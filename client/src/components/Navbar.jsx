import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { NantesHackLogo } from '../lib/branding';

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="p-2 text-white/40 hover:text-accent transition-colors"
      title={isDark ? 'Mode jour' : 'Mode nuit'}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-white/[0.08]">
      {/* Barre principale */}
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <NantesHackLogo className="h-8 w-auto" />
          <span className="text-2xl">🍌</span>
          <span className="font-heading font-extrabold text-lg tracking-tight group-hover:text-accent transition-colors">
            BananaShop
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Cart */}
          <Link to="/cart" className="relative p-2 text-white/60 hover:text-accent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-dark text-[10px] font-heading font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div className="ml-2 pl-3 border-l border-white/10 flex items-center gap-3">
              <span className="text-sm font-mono text-accent">{user.username}</span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                <span className="text-accent/60 text-xs leading-none">◈</span>
                <span className="text-xs font-mono font-semibold text-accent/80">
                  {user.balance != null ? Math.floor(user.balance) : '—'} cr
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-white/40 hover:text-red-400 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary !h-9 !text-xs !px-4 ml-2">
              Connexion
            </Link>
          )}
        </div>
      </div>

      {/* Sous-barre contextuelle — uniquement connecté */}
      {user && (
        <div className="border-t border-white/[0.05] bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-6 h-9 flex items-center gap-1">
            <Link
              to="/shop"
              className="px-3 py-1 text-xs text-white/50 hover:text-cyan transition-colors font-body rounded hover:bg-white/[0.05]"
            >
              Boutique
            </Link>
            <Link
              to="/dashboard"
              className="px-3 py-1 text-xs text-white/50 hover:text-cyan transition-colors font-body rounded hover:bg-white/[0.05]"
            >
              Tableau de bord
            </Link>
            <Link
              to="/subscription"
              className="px-3 py-1 text-xs text-white/50 hover:text-accent transition-colors font-body rounded hover:bg-white/[0.05]"
            >
              Abonnement
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="px-3 py-1 text-xs text-accent hover:text-accent/80 transition-colors font-heading font-semibold rounded hover:bg-accent/[0.08]"
              >
                ⚡ Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
