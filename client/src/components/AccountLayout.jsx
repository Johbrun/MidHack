import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCard, IconCrown, IconSend, IconSettings, IconUser } from './Icons';

export default function AccountLayout({ title, subtitle, children }) {
  const { user } = useAuth();
  const links = [
    { to: '/dashboard', label: 'Mon profil', icon: IconUser },
    { to: '/subscription', label: 'Abonnement', icon: IconCrown },
    { to: '/send', label: 'Envoyer des crédits', icon: IconSend },
    { to: '/topup', label: 'Recharger', icon: IconCard },
  ];
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Administration', icon: IconSettings });

  return (
    <div className="page-container">
      <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
        <aside className="lg:self-start lg:sticky lg:top-40">
          <p className="hidden lg:block eyebrow mb-4">Mon compte</p>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-full lg:rounded-xl text-sm transition-colors ${
                    isActive ? 'bg-ink text-white lg:bg-white lg:text-ink lg:shadow-soft lg:border lg:border-line font-semibold' : 'text-muted hover:text-ink hover:bg-white/70'
                  }`
                }
              >
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {title && (
            <div className="mb-8">
              <h1 className="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">{title}</h1>
              {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
