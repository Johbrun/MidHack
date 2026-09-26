import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountLayout from '../components/AccountLayout';
import { IconArrowRight, IconCard, IconCrown, IconSend, IconWallet } from '../components/Icons';
import { formatCredits } from '../lib/catalog';
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

  const isPremium = subscription === 'premium';

  return (
    <AccountLayout title={`Bonjour, ${user?.username} 👋`} subtitle="Retrouvez ici votre profil, votre solde et votre abonnement.">
      {/* SQLI Flag — visible only for admin */}
      {user?.role === 'admin' && (
        <div className="mb-6 p-5 rounded-2xl border-2 border-cyan/60 bg-cyan/80">
          <p className="text-black text-xs font-heading font-bold uppercase tracking-wider mb-2">
            🚩 SQL Injection - Vous avez réussi à vous connecter en admin en utilisant une injection SQL !
          </p>
          <p className="font-mono text-sm text-black break-all select-all">
            ASY{'{'}4dm1n_s4ns_m0t_d3_p4ss3{'}'}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* Portefeuille */}
        <div className="relative overflow-hidden rounded-3xl bg-ink text-white p-7">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-accent/20" />
          <div className="relative">
            <p className="flex items-center gap-2 text-sm text-white/70"><IconWallet size={18} /> Solde disponible</p>
            <p className="mt-3 font-heading font-extrabold text-5xl text-accent">
              {profile?.balance != null ? formatCredits(profile.balance) : '—'}
              <span className="ml-2 text-lg font-body font-medium text-white/60">crédits</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/send" className="btn-sm btn bg-white/10 text-white hover:bg-white/20"><IconSend size={16} /> Envoyer</Link>
              <Link to="/topup" className="btn-sm btn bg-white/10 text-white hover:bg-white/20"><IconCard size={16} /> Recharger</Link>
            </div>
          </div>
        </div>

        {/* Abonnement */}
        <div className={`rounded-3xl p-7 border ${isPremium ? 'bg-accent-100 border-accent/50' : 'bg-white border-line shadow-soft'}`}>
          <p className="flex items-center gap-2 text-sm text-muted"><IconCrown size={18} /> Abonnement</p>
          <p className="mt-3 font-heading font-extrabold text-3xl text-ink">{isPremium ? 'Club Premium' : 'Formule Gratuite'}</p>
          <p className="mt-1 text-sm text-muted">
            {isPremium ? 'Accès à toutes les fonctionnalités. Vous êtes du sérail.' : 'Fonctionnalités limitées. Le Club vous tend les bras.'}
          </p>
          <Link to="/subscription" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta hover:underline underline-offset-4">
            {isPremium ? 'Gérer mon abonnement' : 'Passer au Premium'} <IconArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Profil */}
      <section className="card">
        <div className="flex flex-wrap items-center gap-4 p-6 sm:p-7 border-b border-line">
          <span className="h-14 w-14 shrink-0 rounded-full bg-accent-100 text-terracotta text-xl font-heading font-extrabold flex items-center justify-center">
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-xl text-ink truncate">{profile?.username}</h2>
            <p className="text-sm text-muted">
              {profile?.role === 'admin' ? 'Administrateur' : 'Client'} · membre depuis le{' '}
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">Modifier le profil</button>
          )}
        </div>

        <div className="p-6 sm:p-7">
          {message && (
            <div className={`mb-6 ${message.startsWith('Échec') ? 'alert-error' : 'alert-success'}`}>{message}</div>
          )}

          {editing ? (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="label" htmlFor="p-username">Nom d'utilisateur</label>
                <input id="p-username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nom d'utilisateur" />
              </div>
              <div>
                <label className="label" htmlFor="p-email">E-mail</label>
                <input id="p-email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="p-bio">Bio</label>
                <textarea id="p-bio" className="input min-h-[110px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} className="btn-dark">Enregistrer</button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
              </div>
            </div>
          ) : (
            <dl className="grid sm:grid-cols-[160px_1fr] gap-x-6 gap-y-5 text-sm">
              <dt className="text-muted">E-mail</dt>
              <dd className="text-ink [overflow-wrap:anywhere]">{profile?.email || 'Non défini'}</dd>
              <dt className="text-muted">Bio</dt>
              <dd
                className="text-ink leading-relaxed [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: profile?.bio || 'Pas encore de bio' }}
              />
            </dl>
          )}
        </div>
      </section>
    </AccountLayout>
  );
}
