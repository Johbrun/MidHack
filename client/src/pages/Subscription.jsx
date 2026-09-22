import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccountLayout from '../components/AccountLayout';
import { IconCheck } from '../components/Icons';
import api from '../api';

const PLANS = [
  {
    id: 'free',
    label: 'Gratuit',
    price: '0',
    unit: 'token / mois',
    description: 'Accès de base à la boutique BananaShop.',
    features: ['Achat de bananes', 'Profil public', 'Support communautaire'],
    badge: null,
  },
  {
    id: 'premium',
    label: 'Premium',
    price: '100 000 000',
    unit: '🥭 mangues / mois',
    description: "L'expérience banane ultime avec des avantages exclusifs.",
    features: [
      'Tout du plan Gratuit',
      'Réductions sur les achats*',
      'Accès aux bananes exclusives',
      'Livraison prioritaire en 24h',
      'Support dédié 24/7',
    ],
    badge: 'Populaire',
  },
];

function ConfirmModal({ onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card w-full max-w-md p-7 shadow-lift animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent-100 flex items-center justify-center text-2xl">
            🥭
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-ink leading-tight">Passer au Premium</h2>
            <p className="text-muted text-sm">Confirmez votre abonnement</p>
          </div>
        </div>

        {/* Details */}
        <dl className="rounded-2xl bg-cream p-5 mb-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted">Formule</dt>
            <dd className="badge bg-accent text-ink">Premium</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">Coût</dt>
            <dd className="font-semibold text-ink">50 🥭 mangues</dd>
          </div>
          <div className="border-t border-line pt-3 flex items-center justify-between">
            <dt className="text-muted">Vos mangues</dt>
            <dd className="font-semibold text-red-700">0 🥭</dd>
          </div>
        </dl>

        <div className="mb-6 flex items-start gap-3 alert-error">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="font-semibold">Mangues insuffisantes</p>
            <p className="mt-0.5 opacity-80">Vous devez obtenir des mangues auprès de notre service client (situé aux îles Bananas)</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Annuler
          </button>
          <button
            disabled
            className="flex-1 btn-primary"
          >
            Confirmer l'achat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Subscription() {
  const { user, updateUser } = useAuth();
  const id = user?.id;
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingPlan, setPendingPlan] = useState(null);
  const balance = user?.balance ?? 0;

  useEffect(() => {
    if (!id) return;
    api.get(`/users/${id}/subscription`)
      .then(r => setCurrentPlan(r.data.subscription || 'free'))
      .catch(() => setCurrentPlan('free'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async (planId) => {
    if (planId === currentPlan || processing) return;
    if (planId === 'premium') {
      setPendingPlan('premium');
      return;
    }
    await confirmSelect(planId);
  };

  const confirmSelect = async (planId) => {
    setProcessing(true);
    setMessage('');
    setPendingPlan(null);
    try {
      const { data } = await api.put(`/users/${id}/subscription`, { plan: planId });
      setCurrentPlan(data.subscription);
      if (data.balance != null) updateUser({ balance: data.balance });
      setMessage(planId === 'free' ? 'Abonnement résilié.' : 'Bienvenue dans le Premium !');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err?.response?.data?.error || "Une erreur est survenue. Réessayez.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <AccountLayout><p className="text-muted">Chargement…</p></AccountLayout>;

  return (
    <AccountLayout
      title="Choisissez votre formule"
      subtitle="Passez au Premium pour bénéficier de réductions exclusives sur vos achats de bananes."
    >
      {pendingPlan && (
        <ConfirmModal
          onCancel={() => setPendingPlan(null)}
        />
      )}

      {message && (
        <div className="mb-8 alert-success text-center">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 max-w-4xl">
        {PLANS.map(plan => {
          const isActive = currentPlan === plan.id;
          const isPremium = plan.id === 'premium';
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl p-7 sm:p-8 transition-all duration-200
                ${isPremium ? 'bg-ink text-white shadow-lift' : 'bg-white border border-line shadow-soft'}
                ${isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-cream' : ''}
              `}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-8 badge bg-accent text-ink shadow-sm">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h2 className={`font-heading font-bold text-xl mb-3 ${isPremium ? 'text-accent' : 'text-ink'}`}>
                  {plan.label}
                </h2>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
                  <span className="font-heading font-extrabold text-4xl">{plan.price}</span>
                  <span className={`text-sm ${isPremium ? 'text-white/60' : 'text-muted'}`}>{plan.unit}</span>
                </div>
                <p className={`text-sm ${isPremium ? 'text-white/70' : 'text-muted'}`}>{plan.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-center gap-3 text-sm ${isPremium ? 'text-white/85' : 'text-ink/80'}`}>
                    <span className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center ${isPremium ? 'bg-accent/20 text-accent' : 'bg-sand text-muted'}`}>
                      <IconCheck size={13} strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className={`w-full h-11 rounded-full border text-sm font-semibold flex items-center justify-center ${isPremium ? 'border-white/20 text-white/60' : 'border-line text-muted'}`}>
                  Formule actuelle
                </div>
              ) : (
                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={processing}
                  className={`w-full ${isPremium ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {processing ? '…' : isPremium ? 'S\'abonner au Premium' : 'Résilier l\'abonnement'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-muted text-xs max-w-4xl">
        *Les réductions s'appliquent sur les futures commandes de BananaBread. Les mangues sont une monnaie exclusive non disponible à l'achat.
      </p>
    </AccountLayout>
  );
}
