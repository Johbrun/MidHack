import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AccountLayout from '../components/AccountLayout';
import { IconSend, IconWallet } from '../components/Icons';
import { formatCredits } from '../lib/catalog';

export default function SendCredits() {
  const { user, updateUser } = useAuth();
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
      if (data.balance != null) updateUser({ balance: data.balance });
      setRecipient('');
      setAmount('');
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Échec du transfert' });
    }
  };

  return (
    <AccountLayout title="Envoyer des crédits" subtitle="Faites plaisir à un ami bananophile en lui transférant des crédits.">
      <div className="grid xl:grid-cols-[1fr_300px] gap-6 max-w-4xl items-start">
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label" htmlFor="recipient">Nom d'utilisateur du destinataire</label>
              <input
                id="recipient"
                type="text"
                className="input"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Entrez le nom d'utilisateur"
              />
            </div>

            <div>
              <label className="label" htmlFor="amount">
                Montant
                {balance !== null && (
                  <span className="text-muted font-normal text-xs ml-2">({balance.toFixed(2)} crédits disponibles)</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  className="input pr-12"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Entrez le montant"
                  min="1"
                  max={balance ?? undefined}
                  step="10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">cr</span>
              </div>
            </div>

            <button type="submit" className="btn-dark btn-lg w-full">
              <IconSend size={18} /> Envoyer des crédits
            </button>
          </form>

          {result && (
            <div className={`mt-6 ${result.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {result.type === 'success' ? (
                <div>
                  <p>{result.data.message}</p>
                  <p className="mt-2 font-semibold">Nouveau solde : {result.data.balance?.toFixed(2)} crédits</p>
                  {result.data.flag && (
                    <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-lg text-ink font-mono break-all select-all">
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

        <aside className="rounded-3xl bg-ink text-white p-6">
          <p className="flex items-center gap-2 text-sm text-white/70"><IconWallet size={18} /> Solde disponible</p>
          <p className="mt-2 font-heading font-extrabold text-4xl text-accent">
            {balance !== null ? formatCredits(balance) : '—'} <span className="text-base font-body font-medium text-white/60">cr</span>
          </p>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            Les virements sont instantanés, gratuits et irréversibles. Comme une banane épluchée.
          </p>
        </aside>
      </div>
    </AccountLayout>
  );
}
