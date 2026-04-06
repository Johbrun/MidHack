import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function SendCredits() {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (user?.id) {
      api.get(`/users/${user.id}`).then(r => setBalance(r.data.balance));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setResult({ type: 'error', message: 'Le montant doit être supérieur à 0' });
      return;
    }
    if (balance !== null && numAmount > balance) {
      setResult({ type: 'error', message: `Solde insuffisant (${balance.toFixed(2)} crédits disponibles)` });
      return;
    }

    try {
      const { data } = await api.post('/credits/send', {
        recipientUsername: recipient,
        amount: amount,
      });
      setResult({ type: 'success', data });
      setBalance(data.balance ?? (balance - numAmount));
      setRecipient('');
      setAmount('');
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Échec du transfert' });
    }
  };

  return (
    <div className="page-container max-w-lg">
      <h1 className="section-title mb-2">Envoyer des crédits</h1>
      <p className="text-white/40 text-sm mb-8">Transférer des crédits à un autre utilisateur</p>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Nom d'utilisateur du destinataire</label>
            <input
              type="text"
              className="input"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Entrez le nom d'utilisateur"
            />
          </div>

          <div>
            <label className="label">
              Montant
              {balance !== null && (
                <span className="text-white/40 text-xs ml-2">({balance.toFixed(2)} crédits disponibles)</span>
              )}
            </label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Entrez le montant"
              min="1"
              max={balance ?? undefined}
              step="10"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Envoyer des crédits
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg text-sm ${result.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
            {result.type === 'success' ? (
              <div>
                <p>{result.data.message}</p>
                <p className="mt-2 font-mono">Nouveau solde : {result.data.balance?.toFixed(2)} crédits</p>
                {result.data.flag && (
                  <div className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded text-accent font-mono">
                    {result.data.flag}
                  </div>
                )}
              </div>
            ) : (
              <p>{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
