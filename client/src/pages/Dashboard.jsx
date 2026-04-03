import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user) {
      api.get(`/users/${user.id}`).then(r => setProfile(r.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="page-container">
      <div className="mb-10">
        <h1 className="section-title mb-1">Dashboard</h1>
        <p className="text-white/40 text-sm">Welcome back, {user?.username}</p>
      </div>

      {/* Balance Card */}
      <div className="card p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-white/40 text-sm uppercase tracking-wider font-heading mb-2">Available Balance</p>
          <p className="text-5xl font-heading font-extrabold gradient-text">
            {profile?.balance?.toFixed(2) || '---'}
            <span className="text-lg text-white/30 ml-2">credits</span>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link to="/shop" className="card-hover p-6 text-center group">
          <div className="text-3xl mb-3">🍌</div>
          <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-accent transition-colors">Shop</h3>
          <p className="text-xs text-white/30">Buy premium bananas</p>
        </Link>

        <Link to="/send" className="card-hover p-6 text-center group">
          <div className="text-3xl mb-3">💸</div>
          <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-cyan transition-colors">Send Credits</h3>
          <p className="text-xs text-white/30">Transfer to another user</p>
        </Link>

        <Link to="/topup" className="card-hover p-6 text-center group">
          <div className="text-3xl mb-3">💳</div>
          <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-accent transition-colors">Top Up</h3>
          <p className="text-xs text-white/30">Add credits to your account</p>
        </Link>
      </div>

      {/* Flag Submission */}
      <FlagSubmit />

      {/* User Info */}
      <div className="card p-6 mt-6">
        <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-white/40 mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Username</span>
            <span className="font-mono text-cyan">{profile?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Email</span>
            <span className="font-mono">{profile?.email || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Role</span>
            <span className="font-mono">{profile?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Member since</span>
            <span className="font-mono text-white/60">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlagSubmit() {
  const [flag, setFlag] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    try {
      const { data } = await api.post('/flags/submit', { flag });
      setResult({ success: true, message: data.message });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Invalid flag' });
    }
    setFlag('');
  };

  return (
    <div className="card p-6 border-cyan/20">
      <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-cyan mb-4">
        Submit a Flag
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          className="input flex-1"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="CTF{...}"
        />
        <button type="submit" className="btn-secondary !px-8">
          Submit
        </button>
      </form>
      {result && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          result.success
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
