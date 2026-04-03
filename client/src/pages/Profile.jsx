import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/users/${id}`).then(r => {
      setProfile(r.data);
      setUsername(r.data.username || '');
      setEmail(r.data.email || '');
      setBio(r.data.bio || '');
    }).catch(() => {});
  }, [id]);

  const handleSave = async () => {
    try {
      const { data } = await api.put(`/users/${id}`, { username, email, bio });
      setProfile(data);
      setEditing(false);
      setMessage('Profil mis à jour');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Échec de la mise à jour');
    }
  };

  if (!profile) return <div className="page-container">Chargement...</div>;

  return (
    <div className="page-container max-w-2xl">
      <h1 className="section-title mb-8">Profil utilisateur</h1>

      <div className="card p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/30 to-cyan/30 flex items-center justify-center text-3xl font-heading font-extrabold">
            {profile.username[0].toUpperCase()}
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
              <h2 className="font-heading font-extrabold text-xl">{profile.username}</h2>
            )}
            <p className="text-white/40 text-sm font-mono">{profile.role}</p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="label">E-mail</label>
            {editing ? (
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            ) : (
              <p className="text-white/70 font-mono text-sm">{profile.email || 'Non défini'}</p>
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
                className="text-white/70 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: profile.bio || 'Pas encore de bio' }}
              />
            )}
          </div>

          <div>
            <label className="label">Solde</label>
            <p className="text-2xl font-heading font-extrabold text-accent">
              {profile.balance?.toFixed(2)} <span className="text-sm text-white/30">crédits</span>
            </p>
          </div>

          <div>
            <label className="label">Membre depuis</label>
            <p className="text-white/70 font-mono text-sm">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
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
    </div>
  );
}
