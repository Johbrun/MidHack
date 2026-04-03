import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      api.get(`/users/${user.id}`).then(r => setProfile(r.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="page-container">
      <div className="mb-10">
        <h1 className="section-title mb-1">Tableau de bord</h1>
        <p className="text-white/40 text-sm">Bon retour, {user?.username}</p>
      </div>

      {/* Balance Card */}
      <div className="card p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-white/40 text-sm uppercase tracking-wider font-heading mb-2">Solde disponible</p>
          <p className="text-5xl font-heading font-extrabold gradient-text">
            {profile?.balance?.toFixed(2) || '---'}
            <span className="text-lg text-white/30 ml-2">crédits</span>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link to="/shop" className="card-hover p-6 text-center group">
          <div className="text-3xl mb-3">🍌</div>
          <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-accent transition-colors">Boutique</h3>
          <p className="text-xs text-white/30">Achetez des bananes premium</p>
        </Link>

        <Link to="/send" className="card-hover p-6 text-center group">
          <div className="text-3xl mb-3">💸</div>
          <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-cyan transition-colors">Envoyer des crédits</h3>
          <p className="text-xs text-white/30">Transférer à un autre utilisateur</p>
        </Link>

        <Link to="/topup" className="card-hover p-6 text-center group">
          <div className="text-3xl mb-3">💳</div>
          <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-accent transition-colors">Recharger</h3>
          <p className="text-xs text-white/30">Ajoutez des crédits à votre compte</p>
        </Link>
      </div>

      {/* User Info */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-white/40">Informations du compte</h2>
          <Link to={`/profile/${user?.id}`} className="btn-secondary !text-xs !py-1.5 !px-4">
            Modifier le profil
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Nom d'utilisateur</span>
            <span className="font-mono text-cyan">{profile?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">E-mail</span>
            <span className="font-mono">{profile?.email || 'Non défini'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Rôle</span>
            <span className="font-mono">{profile?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Membre depuis</span>
            <span className="font-mono text-white/60">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
