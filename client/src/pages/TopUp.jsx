import { useState } from 'react';
import api from '../api';

export default function TopUp() {
  const [amount, setAmount] = useState('100');
  const [cardNumber, setCardNumber] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    try {
      const { data } = await api.post('/credits/topup', { amount, cardNumber });
      setResult({ type: 'success', data });
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Échec du rechargement' });
    }
  };

  return (
    <div className="page-container max-w-lg">
      <h1 className="section-title mb-2">Recharger des crédits</h1>
      <p className="text-white/40 text-sm mb-8">Ajoutez des crédits à votre compte</p>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Montant (1-1000)</label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="1000"
              placeholder="100"
            />
          </div>

          <div>
            <label className="label">Numéro de carte</label>
            <input
              type="text"
              className="input"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
            <p className="text-white/20 text-xs mt-2">N'importe quel numéro de carte fonctionne (ceci est une démo)</p>
          </div>

          <button type="submit" className="btn-primary w-full">
            Recharger
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg text-sm ${
            result.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {result.type === 'success' ? (
              <p>{result.data.message} — Nouveau solde : {result.data.balance?.toFixed(2)} crédits</p>
            ) : (
              <p>{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
