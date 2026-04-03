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
        <div className="space-y-6 opacity-50">
          <div>
            <label className="label">Montant (1-1000)</label>
            <input
              type="number"
              className="input"
              value={amount}
              disabled
              placeholder="100"
            />
          </div>

          <div>
            <label className="label">Numéro de carte</label>
            <input
              type="text"
              className="input"
              value={cardNumber}
              disabled
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
          </div>

          <button disabled className="btn-primary w-full disabled:opacity-50 cursor-not-allowed">
            Rechargement désactivé pour le moment
          </button>
        </div>

        <div className="mt-6 p-4 rounded-lg text-sm bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <p>Le rechargement de crédits est temporairement indisponible.</p>
        </div>
      </div>
    </div>
  );
}
