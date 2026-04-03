import { useState, useEffect } from 'react';
import api from '../api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [sqliFlag, setSqliFlag] = useState(null);
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Access denied'));

    api.get('/admin/sqli-flag')
      .then(r => setSqliFlag(r.data))
      .catch(() => {});

    api.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => {});
  }, []);

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ username: user.username, email: user.email || '', role: user.role, balance: user.balance });
    setSaveMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}`, editForm);
      setUsers(users.map(u => u.id === userId ? data : u));
      setEditingId(null);
      setSaveMsg(`Utilisateur #${userId} mis à jour`);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="card p-8 max-w-md mx-auto text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-heading font-bold text-xl mb-2">Accès refusé</h1>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="page-container">Chargement...</div>;

  return (
    <div className="page-container">
      <h1 className="section-title mb-2">Tableau de bord Admin</h1>
      <p className="text-white/40 text-sm mb-8">Vue d'ensemble du système</p>

      {/* Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sqliFlag && (
          <div className="card p-6 border-accent/30">
            <h3 className="font-heading font-bold text-sm text-accent mb-2">Flag SQL Injection</h3>
            <p className="font-mono text-accent text-lg">{sqliFlag.flag}</p>
            <p className="text-white/30 text-xs mt-2">{sqliFlag.message}</p>
          </div>
        )}
        <div className="card p-6 border-cyan/30">
          <h3 className="font-heading font-bold text-sm text-cyan mb-2">Flag JWT Forging</h3>
          <p className="font-mono text-cyan text-lg">{data.flag}</p>
          <p className="text-white/30 text-xs mt-2">{data.message}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold text-accent">{data.stats.users}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Utilisateurs</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold text-cyan">{data.stats.products}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Produits</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold">{data.stats.transactions}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Transactions</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold text-emerald-400">{data.stats.revenue}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Revenus</p>
        </div>
      </div>

      {/* Users Management */}
      <h2 className="font-heading font-bold text-xl mb-4">Gestion des membres</h2>

      {saveMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {saveMsg}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 uppercase text-xs tracking-wider">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Nom d'utilisateur</th>
              <th className="text-left p-4">E-mail</th>
              <th className="text-left p-4">Rôle</th>
              <th className="text-right p-4">Crédits</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                {editingId === u.id ? (
                  <>
                    <td className="p-4 font-mono text-white/30">{u.id}</td>
                    <td className="p-4">
                      <input
                        className="input !py-1 !text-sm"
                        value={editForm.username}
                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <input
                        className="input !py-1 !text-sm"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <select
                        className="input !py-1 !text-sm !w-28"
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        className="input !py-1 !text-sm !w-28 text-right"
                        value={editForm.balance}
                        onChange={e => setEditForm({ ...editForm, balance: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleSave(u.id)} className="text-emerald-400 hover:text-emerald-300 text-xs font-heading font-semibold">
                        Sauver
                      </button>
                      <button onClick={cancelEdit} className="text-white/30 hover:text-white/60 text-xs">
                        Annuler
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-mono text-white/30">{u.id}</td>
                    <td className="p-4 font-heading font-semibold">{u.username}</td>
                    <td className="p-4 font-mono text-white/50">{u.email || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-heading font-semibold ${
                        u.role === 'admin'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-white/5 text-white/40'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-accent">{u.balance.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => startEdit(u)} className="text-cyan hover:text-cyan/70 text-xs font-heading font-semibold">
                        Modifier
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
