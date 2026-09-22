import { useState } from 'react';
import api from '../api';
import AccountLayout from '../components/AccountLayout';
import { IconCard, IconClock } from '../components/Icons';

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
    <AccountLayout title="Recharger des crédits" subtitle="Ajoutez des crédits à votre compte.">
      <div className="card p-6 sm:p-8 max-w-xl">
        <div className="mb-8 flex items-start gap-3 alert-warning">
          <IconClock size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Le rechargement de crédits est temporairement indisponible.</p>
            <p className="mt-0.5 opacity-80">Notre prestataire de paiement est parti cueillir des bananes. Il revient bientôt.</p>
          </div>
        </div>

        <div className="space-y-6 opacity-60">
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
            <div className="relative">
              <input
                type="text"
                className="input pl-12"
                value={cardNumber}
                disabled
                placeholder="4242 4242 4242 4242"
                maxLength={19}
              />
              <IconCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <button disabled className="btn-dark btn-lg w-full">
            Rechargement désactivé pour le moment
          </button>
        </div>
      </div>
    </AccountLayout>
  );
}
