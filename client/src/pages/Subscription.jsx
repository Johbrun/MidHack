import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
    price: '50',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card w-full max-w-md p-8 border-accent/30 shadow-2xl shadow-accent/10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-2xl">
            🥭
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl leading-tight">Passer au Premium</h2>
            <p className="text-white/40 text-sm">Confirmez votre abonnement</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">Plan</span>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-heading font-bold uppercase tracking-wider">
              Premium
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">Coût</span>
            <span className="font-heading font-extrabold text-accent">
              50 <span className="text-white/30 font-normal text-xs">🥭 mangues</span>
            </span>
          </div>
          <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
            <span className="text-white/50 text-sm">Vos mangues</span>
            <span className="font-mono font-semibold text-sm text-red-400">0 🥭</span>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-600/20 border-2 border-red-500/60">
          <svg className="w-5 h-5 text-red-900 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-red-900 font-heading font-bold text-sm">Mangues insuffisantes</p>
            <p className="text-red-900/80 text-xs mt-0.5">Vous devez obtenir des mangues auprès de notre service client (situé aux îles Bananas)</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary !h-11 !text-xs"
          >
            Annuler
          </button>
          <button
            disabled
            className="flex-1 h-11 rounded-md bg-accent text-black font-heading font-bold text-sm uppercase tracking-wider opacity-30 cursor-not-allowed flex items-center justify-center"
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

  if (loading) return <div className="page-container">Chargement...</div>;

  return (
    <div className="page-container max-w-4xl">
      {pendingPlan && (
        <ConfirmModal
          onCancel={() => setPendingPlan(null)}
        />
      )}
      <div className="text-center mb-12">
        <h1 className="section-title mb-3">Choisissez votre plan</h1>
        <p className="text-white/40">
          Passez au Premium pour bénéficier de réductions exclusives sur vos achats de bananes.
        </p>
      </div>

      {message && (
        <div className="mb-8 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {PLANS.map(plan => {
          const isActive = currentPlan === plan.id;
          const isPremium = plan.id === 'premium';
          return (
            <div
              key={plan.id}
              className={`card relative flex flex-col p-8 transition-all duration-200
                ${isPremium ? 'border-accent/40 shadow-accent/10 shadow-lg' : ''}
                ${isActive ? 'ring-2 ring-accent/60' : ''}
              `}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-black text-xs font-heading font-bold uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h2 className={`font-heading font-extrabold text-2xl mb-1 ${isPremium ? 'text-accent' : 'text-white/70'}`}>
                  {plan.label}
                </h2>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="font-heading font-extrabold text-4xl">{plan.price}</span>
                  <span className="text-white/30 text-sm">{plan.unit}</span>
                </div>
                <p className="text-white/40 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-2 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <svg className={`w-4 h-4 flex-shrink-0 ${isPremium ? 'text-accent' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className="w-full py-2.5 rounded-lg border border-white/10 text-white/30 text-sm text-center font-heading font-bold">
                  Plan actuel
                </div>
              ) : (
                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={processing}
                  className={`w-full py-2.5 rounded-lg text-sm font-heading font-bold transition-all
                    ${isPremium
                      ? 'bg-accent text-black hover:bg-accent/90 disabled:opacity-50'
                      : 'btn-secondary !text-xs'
                    }`}
                >
                  {processing ? '...' : isPremium ? 'S\'abonner au Premium' : 'Résilier l\'abonnement'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-white/20 text-xs">
        *Les réductions s'appliquent sur les futures commandes de BananaBread. Les mangues sont une monnaie exclusive non disponible à l'achat.
      </p>
    </div>
  );
}
