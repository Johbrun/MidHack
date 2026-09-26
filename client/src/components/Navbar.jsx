import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOnboarding } from '../context/OnboardingContext';
import { NantesHackLogo } from '../lib/branding';
import { TIER_KEYS, formatCredits } from '../lib/catalog';
import {
  IconCart, IconChevronDown, IconCrown, IconLogout, IconMenu, IconSearch,
  IconSend, IconSettings, IconUser, IconWallet, IconX, IconCard,
} from './Icons';

const PROMOS = [
  'Livraison offerte dès 50 cr d’achat',
  'Livrées en 67h chrono (on ne court pas, on marche vite)',
  'Satisfait ou re-mûri',
];

export function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img src="/banana.svg" alt="" className="h-8 w-8" />
      <span className="font-heading font-extrabold text-xl tracking-tight text-ink">
        Banana<span className="text-terracotta">Shop</span>
      </span>
    </span>
  );
}

function HeaderSearch({ className = '' }) {
  const location = useLocation();
  const [params] = useSearchParams();
  const [term, setTerm] = useState('');

  useEffect(() => {
    setTerm(location.pathname === '/shop' ? params.get('search') || '' : '');
  }, [location.pathname, params]);

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = `/shop?search=${encodeURIComponent(term)}`;
  };

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className="relative">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Rechercher une banane, une gamme, une envie…"
          className="w-full h-11 rounded-full bg-cream border border-line pl-5 pr-12 text-sm placeholder:text-muted/80 focus:outline-none focus:bg-white focus:border-cyan focus:ring-4 focus:ring-cyan/10 transition"
        />
        <button
          type="submit"
          aria-label="Rechercher"
          className="absolute right-1 top-1 h-9 w-9 rounded-full bg-accent text-ink flex items-center justify-center hover:bg-accent-600 transition-colors"
        >
          <IconSearch size={18} />
        </button>
      </div>
    </form>
  );
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

function accountLinks(user) {
  const links = [
    { to: '/dashboard', label: 'Mon profil', icon: IconUser },
    { to: '/subscription', label: 'Abonnement', icon: IconCrown },
    { to: '/send', label: 'Envoyer des crédits', icon: IconSend },
    { to: '/topup', label: 'Recharger', icon: IconCard },
  ];
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Administration', icon: IconSettings });
  return links;
}

function AccountMenu({ user, unlocked, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  useClickOutside(ref, () => setOpen(false));
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 h-11 pl-1.5 pr-3 rounded-full hover:bg-cream transition-colors"
      >
        <span className="h-8 w-8 rounded-full bg-accent-100 text-terracotta font-heading font-bold flex items-center justify-center">
          {user.username?.[0]?.toUpperCase() ?? '?'}
        </span>
        <span className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-[11px] text-muted">Bonjour, {user.username}</span>
          <span className="text-sm font-semibold text-ink">Mon compte</span>
        </span>
        <IconChevronDown size={16} className={`hidden md:block text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 mt-2 w-72 card p-2 z-50">
          <div className="px-3 py-3 mb-1 rounded-xl bg-cream">
            <p className="text-xs text-muted">Connecté en tant que</p>
            <p className="font-semibold text-ink truncate">{user.username}</p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <IconWallet size={16} className="text-terracotta" />
              <span className="text-muted">Solde :</span>
              <span className="font-semibold text-ink">
                {user.balance != null ? `${formatCredits(Math.floor(user.balance))} cr` : '—'}
              </span>
            </div>
          </div>
          {accountLinks(user).map(({ to, label, icon: Icon }) =>
            unlocked ? (
              <Link key={to} to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-cream transition-colors">
                <Icon size={18} className="text-muted" /> {label}
              </Link>
            ) : (
              <span key={to} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted/60 cursor-not-allowed" title="Complète les étapes de démarrage pour débloquer">
                <Icon size={18} /> {label}
              </span>
            ),
          )}
          <div className="my-1 border-t border-line" />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-700 hover:bg-red-50 transition-colors">
            <IconLogout size={18} /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

const navLinks = [
  { to: '/shop', label: 'Toutes les bananes', tier: null },
  ...TIER_KEYS.map((t) => ({ to: `/shop?tier=${t}`, label: t, tier: t })),
];

function useIsActive() {
  const location = useLocation();
  const [params] = useSearchParams();
  return (link) => {
    if (location.pathname !== '/shop') return false;
    return (params.get('tier') || null) === link.tier && !params.get('search');
  };
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { unlocked } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = useIsActive();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItem = (link, extra = '') =>
    unlocked ? (
      <Link
        key={link.to}
        to={link.to}
        className={`${extra} ${isActive(link) ? 'text-ink font-semibold' : 'text-muted hover:text-ink'} transition-colors`}
      >
        {link.label}
      </Link>
    ) : (
      <span key={link.to} className={`${extra} text-muted/50 cursor-not-allowed`} title="Complète les étapes de démarrage pour débloquer">
        {link.label}
      </span>
    );

  return (
    <>
      {/* Bandeau promo */}
      <div className="bg-ink text-white/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-center gap-6">
          {PROMOS.map((promo, i) => (
            <span key={promo} className={`${i > 0 ? 'hidden md:flex' : 'flex'} items-center gap-6`}>
              {i > 0 && <span className="text-accent">●</span>}
              {promo}
            </span>
          ))}
        </div>
      </div>

    <header className="sticky top-0 z-50">
      {/* Barre principale */}
      <div className="bg-white/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center gap-4 lg:gap-8">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden -ml-2 p-2 text-ink"
            aria-label="Menu"
          >
            {mobileOpen ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>

          <Link to="/" className="flex items-center gap-3 shrink-0">
            <NantesHackLogo className="h-8 w-auto hidden sm:block" />
            <Logo />
          </Link>

          <HeaderSearch className="hidden md:block flex-1 max-w-xl mx-auto" />

          <div className="ml-auto md:ml-0 flex items-center gap-1 sm:gap-2">
            {user ? (
              <AccountMenu user={user} unlocked={unlocked} onLogout={handleLogout} />
            ) : (
              <Link to="/login" className="flex items-center gap-2 h-11 px-3 rounded-full hover:bg-cream transition-colors text-sm font-semibold">
                <IconUser size={20} />
                <span className="hidden sm:inline">Se connecter</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="relative flex items-center gap-2 h-11 px-3 rounded-full hover:bg-cream transition-colors text-sm font-semibold"
              aria-label="Panier"
            >
              <IconCart size={22} />
              <span className="hidden sm:inline">Panier</span>
              {totalItems > 0 && (
                <>
                  <span className="sm:hidden absolute top-1 left-6 min-w-[20px] h-5 px-1 rounded-full bg-accent text-ink text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                    {totalItems}
                  </span>
                  <span className="hidden sm:inline-flex min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent text-ink text-xs font-bold items-center justify-center">
                    {totalItems}
                  </span>
                </>
              )}
            </Link>
          </div>
        </div>

        {/* Recherche mobile */}
        <div className="md:hidden px-4 pb-3">
          <HeaderSearch />
        </div>

        {/* Navigation catalogue */}
        <nav className="hidden lg:block border-t border-line/70">
          <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-8 text-sm">
            {navLinks.map((link) => navItem(link))}
            <span className="ml-auto" />
            {navItem({ to: '/subscription', label: 'Club Premium 🥭' }, 'font-semibold !text-terracotta hover:!text-terracotta/80')}
          </div>
        </nav>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-line shadow-lift animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col text-[15px]">
            {navLinks.map((link) => navItem(link, 'py-2.5'))}
            {navItem({ to: '/subscription', label: 'Club Premium 🥭' }, 'py-2.5 font-semibold !text-terracotta')}
            {user && (
              <>
                <div className="my-2 border-t border-line" />
                {accountLinks(user).map((link) => navItem(link, 'py-2.5'))}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
    </>
  );
}
