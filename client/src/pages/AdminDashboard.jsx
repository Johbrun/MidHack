import { useState, useEffect } from 'react';
import api from '../api';
import { IconLock } from '../components/Icons';
import { formatCredits } from '../lib/catalog';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [saveMsgError, setSaveMsgError] = useState(false);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => {
        setData(r.data);
        setUsers(r.data.users || []);
      })
      .catch(err => setError(err.response?.data?.error || 'Access denied'));
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
      setSaveMsgError(false);
      setSaveMsg(`Utilisateur #${userId} mis à jour`);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsgError(true);
      setSaveMsg(err.response?.data?.error || 'Erreur lors de la mise à jour');
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="card p-10 max-w-md mx-auto text-center">
          <span className="mx-auto h-14 w-14 rounded-full bg-red-50 text-red-700 flex items-center justify-center">
            <IconLock size={26} />
          </span>
          <h1 className="mt-5 font-heading font-bold text-2xl text-ink">Accès refusé</h1>
          <p className="mt-2 text-red-700 text-sm">{error}</p>
          <p className="mt-1 text-sm text-muted">Cet espace est réservé au staff</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="page-container text-muted">Chargement…</div>;

  const stats = [
    { label: 'Utilisateurs', value: data.stats.users },
    { label: 'Produits', value: data.stats.products },
    { label: 'Transactions', value: data.stats.transactions },
    { label: 'Revenus', value: data.stats.revenue },
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <p className="eyebrow mb-2">Back-office</p>
        <h1 className="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">Tableau de bord Admin</h1>
        <p className="mt-2 text-muted">Vue d'ensemble du système</p>
      </div>

      {/* Super Admin Flag */}
      {data.flag && (
        <div className="mb-8 rounded-2xl border-2 border-cyan/40 bg-cyan-50 p-6">
          <h3 className="font-heading font-bold text-sm text-cyan-700 mb-2">Section Super Admin</h3>
          <p className="font-mono text-cyan-700 text-lg break-all select-all">{data.flag}</p>
          <p className="text-muted text-xs mt-2">{data.secret_message}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="card p-6">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-heading font-extrabold text-3xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Users Management */}
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-heading font-bold text-xl text-ink">Gestion des membres</h2>
        <p className="text-sm text-muted">{users.length} membres</p>
      </div>

      {saveMsg && (
        <div className={`mb-4 ${saveMsgError ? 'alert-error' : 'alert-success'}`}>
          {saveMsg}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-cream/60 text-muted text-xs">
              <th className="text-left font-semibold px-5 py-3">ID</th>
              <th className="text-left font-semibold px-5 py-3">Nom d'utilisateur</th>
              <th className="text-left font-semibold px-5 py-3">E-mail</th>
              <th className="text-left font-semibold px-5 py-3">Rôle</th>
              <th className="text-right font-semibold px-5 py-3">Crédits</th>
              <th className="text-right font-semibold px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-cream/50 transition-colors">
                {editingId === u.id ? (
                  <>
                    <td className="px-5 py-3 text-muted">{u.id}</td>
                    <td className="px-5 py-3">
                      <input
                        className="input !h-9 !text-sm"
                        value={editForm.username}
                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        className="input !h-9 !text-sm"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        className="input !h-9 !text-sm !w-36"
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        className="input !h-9 !text-sm !w-28 text-right ml-auto"
                        value={editForm.balance}
                        onChange={e => setEditForm({ ...editForm, balance: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap space-x-3">
                      <button onClick={() => handleSave(u.id)} className="text-emerald-700 hover:underline font-semibold">
                        Sauver
                      </button>
                      <button onClick={cancelEdit} className="text-muted hover:text-ink">
                        Annuler
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3 text-muted">{u.id}</td>
                    <td className="px-5 py-3 font-semibold text-ink">{u.username}</td>
                    <td className="px-5 py-3 text-muted">{u.email || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${u.role === 'admin'
                          ? 'bg-accent-100 text-terracotta'
                          : 'bg-sand text-muted'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">{formatCredits(u.balance.toFixed(2))}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => startEdit(u)} className="link">
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
