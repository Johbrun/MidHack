import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NantesHackLogo } from '../lib/branding';

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
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <NantesHackLogo className="h-8 w-auto" />
          <span className="text-2xl">🍌</span>
          <span className="font-heading font-extrabold text-lg tracking-tight group-hover:text-accent transition-colors">
            BananaShop
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/shop"
            className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
          >
            Boutique
          </Link>

          {user ? (
            <>
              <Link
                to="/me"
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Voir mon profil
              </Link>
              <Link
                to="/send"
                className="px-4 py-2 text-sm text-white/60 hover:text-cyan transition-colors font-body"
              >
                Envoyer des crédits
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-2 text-sm text-accent hover:text-accent/80 transition-colors font-heading font-semibold"
                >
                  Admin
                </Link>
              )}
            </>
          ) : null}

          {/* Cart */}
          <Link to="/cart" className="relative px-3 py-2 text-white/60 hover:text-accent transition-colors">
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
    </nav>
  );
}
