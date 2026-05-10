import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const id = user?.id;
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/users/${id}`).then(r => {
      setProfile(r.data);
      setUsername(r.data.username || '');
      setEmail(r.data.email || '');
      setBio(r.data.bio || '');
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/users/${id}/subscription`)
      .then(r => setSubscription(r.data.subscription || 'free'))
      .catch(() => setSubscription('free'));
  }, [id]);

  const handleSave = async () => {
    try {
      const { data } = await api.put(`/users/${id}`, { username, email, bio });
      setProfile(data);
      updateUser({ username: data.username, role: data.role });
      setEditing(false);
      setMessage('Profil mis à jour');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Échec de la mise à jour');
    }
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title mb-1">Tableau de bord</h1>
        <p className="text-white/40 text-sm">Bon retour, {user?.username}</p>
      </div>

      {/* Balance Card */}
      <div className="card p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-white/40 text-sm uppercase tracking-wider font-heading mb-2">Solde disponible</p>
          <p className="text-5xl font-heading font-extrabold gradient-text">
            {profile?.balance?.toFixed(2) || '---'}
            <span className="text-lg text-white/30 ml-2">crédits</span>
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — Profile */}
        <div className="lg:col-span-3 card p-8">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-cyan/30 flex items-center justify-center text-xl font-heading font-extrabold shrink-0">
              {profile?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              {editing ? (
                <input
                  className="input !py-1 !text-xl font-heading font-extrabold mb-1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nom d'utilisateur"
                />
              ) : (
                <h2 className="font-heading font-extrabold text-xl">{profile?.username}</h2>
              )}
              <p className="text-white/40 text-sm font-mono">{profile?.role}</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {message}
            </div>
          )}

          <div className="space-y-5 text-sm">
            <div>
              <label className="label">E-mail</label>
              {editing ? (
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              ) : (
                <p className="font-mono text-white/70">{profile?.email || 'Non défini'}</p>
              )}
            </div>

            <div>
              <label className="label">Bio</label>
              {editing ? (
                <textarea
                  className="input min-h-[100px] resize-none"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              ) : (
                <div
                  className="text-white/70 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: profile?.bio || 'Pas encore de bio' }}
                />
              )}
            </div>

            <div className="flex justify-between">
              <span className="text-white/40">Membre depuis</span>
              <span className="font-mono text-white/60">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {editing ? (
              <>
                <button onClick={handleSave} className="btn-primary">Enregistrer</button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary">Modifier le profil</button>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Subscription Panel */}
          <div className="card p-6">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-white/40 mb-4">Abonnement</h2>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{subscription === 'premium' ? '⭐' : '🆓'}</span>
              <div>
                <p className={`font-heading font-extrabold text-lg ${subscription === 'premium' ? 'text-accent' : 'text-white/60'}`}>
                  {subscription === 'premium' ? 'Premium' : 'Gratuit'}
                </p>
                <p className="text-xs text-white/30">
                  {subscription === 'premium' ? 'Accès à toutes les fonctionnalités' : 'Fonctionnalités limitées'}
                </p>
              </div>
            </div>
            <Link to="/subscription" className="btn-secondary w-full !text-xs">
              {subscription === 'premium' ? 'Gérer mon abonnement' : 'Passer à Premium'}
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-white/40 mb-4">Actions rapides</h2>
            <div className="flex flex-col gap-2">
              <Link to="/shop" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                <span className="text-xl">🍌</span>
                <div>
                  <p className="text-sm font-heading font-bold group-hover:text-accent transition-colors">Boutique</p>
                  <p className="text-xs text-white/30">Achetez des bananes premium</p>
                </div>
              </Link>
              <Link to="/send" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                <span className="text-xl">💸</span>
                <div>
                  <p className="text-sm font-heading font-bold group-hover:text-cyan transition-colors">Envoyer des crédits</p>
                  <p className="text-xs text-white/30">Transférer à un autre utilisateur</p>
                </div>
              </Link>
              <Link to="/topup" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                <span className="text-xl">💳</span>
                <div>
                  <p className="text-sm font-heading font-bold group-hover:text-accent transition-colors">Recharger</p>
                  <p className="text-xs text-white/30">Ajoutez des crédits à votre compte</p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
