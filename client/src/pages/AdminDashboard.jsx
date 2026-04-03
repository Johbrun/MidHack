import { useState, useEffect } from 'react';
import api from '../api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [sqliFlag, setSqliFlag] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Access denied'));

    api.get('/admin/sqli-flag')
      .then(r => setSqliFlag(r.data))
      .catch(() => {});
  }, []);

  if (error) {
    return (
      <div className="page-container">
        <div className="card p-8 max-w-md mx-auto text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-heading font-bold text-xl mb-2">Access Denied</h1>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <h1 className="section-title mb-2">Admin Dashboard</h1>
      <p className="text-white/40 text-sm mb-8">System overview</p>

      {/* Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sqliFlag && (
          <div className="card p-6 border-accent/30">
            <h3 className="font-heading font-bold text-sm text-accent mb-2">SQL Injection Flag</h3>
            <p className="font-mono text-accent text-lg">{sqliFlag.flag}</p>
            <p className="text-white/30 text-xs mt-2">{sqliFlag.message}</p>
          </div>
        )}
        <div className="card p-6 border-cyan/30">
          <h3 className="font-heading font-bold text-sm text-cyan mb-2">JWT Forging Flag</h3>
          <p className="font-mono text-cyan text-lg">{data.flag}</p>
          <p className="text-white/30 text-xs mt-2">{data.message}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold text-accent">{data.stats.users}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Users</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold text-cyan">{data.stats.products}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Products</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold">{data.stats.transactions}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Transactions</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-3xl font-heading font-extrabold text-emerald-400">{data.stats.revenue}</p>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Revenue</p>
        </div>
      </div>
    </div>
  );
}
