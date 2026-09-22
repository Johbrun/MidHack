import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { tierMeta, productImageUrl, formatCredits } from '../lib/catalog';
import { IconArrowRight, IconCart, IconCheck, IconLock, IconMinus, IconPlus, IconTrash, IconTruck } from '../components/Icons';
import api from '../api';

const FREE_SHIPPING = 50;

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, totalPrice } = useCart();
  const { user, updateUser } = useAuth();
  const [purchasing, setPurchasing] = useState(false);
  const [results, setResults] = useState(null);

  const handleCheckout = async () => {
    if (!user) return;
    setPurchasing(true);
    setResults(null);

    try {
      const payload = items.map(item => ({ id: item.id, qty: item.qty }));
      const { data } = await api.post('/products/buy-batch', { items: payload });
      setResults({ success: true, message: data.message, balance: data.balance, items: data.items });
      if (data.balance != null) updateUser({ balance: data.balance });
      clearCart();
    } catch (err) {
      setResults({ success: false, message: err.response?.data?.error || 'Échec de l\'achat' });
    }
    setPurchasing(false);
  };

  const count = items.reduce((s, i) => s + i.qty, 0);

  // Confirmation de commande
  if (results?.success) {
    return (
      <div className="page-container max-w-2xl">
        <div className="card p-8 sm:p-10 text-center">
          <span className="mx-auto h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IconCheck size={32} strokeWidth={2.4} />
          </span>
          <h1 className="mt-5 font-heading font-extrabold text-3xl text-ink">Merci pour votre commande !</h1>
          <p className="mt-2 text-muted">{results.message}</p>
          <p className="mt-1 text-sm text-muted">Vos bananes prennent la route. Rendez-vous dans 67h.</p>

          {results.items && (
            <ul className="mt-8 text-left rounded-2xl border border-line divide-y divide-line">
              {results.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <span className="text-ink">{item.name} <span className="text-muted">× {item.qty}</span></span>
                  <span className="font-semibold text-ink whitespace-nowrap">{formatCredits(item.subtotal)} cr</span>
                </li>
              ))}
            </ul>
          )}
          {results.balance != null && (
            <p className="mt-4 text-sm text-muted">
              Nouveau solde : <strong className="text-ink">{formatCredits(results.balance)} crédits</strong>
            </p>
          )}
          <Link to="/shop" className="btn-dark mt-8">Continuer mes achats</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">Mon panier</h1>
      <p className="mt-1 text-muted">
        {items.length === 0 ? 'Votre panier est vide' : `${count} article${count > 1 ? 's' : ''}`}
      </p>

      {items.length === 0 ? (
        <div className="mt-8 card px-6 py-16 text-center">
          <span className="mx-auto h-16 w-16 rounded-full bg-accent-100 text-terracotta flex items-center justify-center">
            <IconCart size={28} />
          </span>
          <p className="mt-5 font-heading font-bold text-xl text-ink">Votre panier a la banane… vide.</p>
          <p className="mt-1 text-muted">Il ne demande qu'à être rempli.</p>
          <Link to="/shop" className="btn-primary mt-6">Découvrir la boutique</Link>
        </div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Articles */}
          <div className="card divide-y divide-line">
            {items.map(item => {
              const tier = tierMeta(item.tier);
              return (
                <div key={item.id} className="flex gap-4 sm:gap-5 p-4 sm:p-5">
                  <Link to={`/product/${item.id}`} className={`shrink-0 h-24 w-24 sm:h-28 sm:w-28 rounded-xl ${tier.tint} flex items-center justify-center`}>
                    <img src={productImageUrl(item)} alt="" className="h-4/5 w-4/5 object-contain" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        {tier.label && <p className="text-xs font-medium text-muted">Gamme {tier.label}</p>}
                        <Link to={`/product/${item.id}`} className="font-heading font-semibold text-ink hover:text-terracotta line-clamp-2">
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-sm text-muted">{formatCredits(item.price)} cr / pièce</p>
                      </div>
                      <p className="font-heading font-bold text-lg text-ink whitespace-nowrap">
                        {formatCredits(item.price * item.qty)} <span className="text-sm font-body font-medium text-muted">cr</span>
                      </p>
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <div className="flex items-center h-10 rounded-full border border-line">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="h-10 w-10 flex items-center justify-center text-muted hover:text-ink" aria-label="Diminuer">
                          <IconMinus size={16} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="h-10 w-10 flex items-center justify-center text-muted hover:text-ink" aria-label="Augmenter">
                          <IconPlus size={16} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="flex items-center gap-1.5 text-sm text-muted hover:text-red-700 transition-colors">
                        <IconTrash size={16} /> <span className="hidden sm:inline">Retirer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Récapitulatif */}
          <aside className="card p-6 lg:sticky lg:top-40">
            <h2 className="font-heading font-bold text-xl text-ink">Récapitulatif</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total ({count} article{count > 1 ? 's' : ''})</dt>
                <dd className="font-medium text-ink">{formatCredits(totalPrice)} cr</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Livraison en 67h</dt>
                <dd className="font-medium text-emerald-700">Offerte</dd>
              </div>
            </dl>
            {totalPrice < FREE_SHIPPING && (
              <p className="mt-3 flex gap-2 text-xs text-muted">
                <IconTruck size={16} className="shrink-0 text-terracotta" />
                Normalement offerte dès {FREE_SHIPPING} cr. On ferme les yeux pour cette fois.
              </p>
            )}
            <div className="mt-5 pt-5 border-t border-line flex items-baseline justify-between">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-heading font-extrabold text-3xl text-ink">
                {formatCredits(totalPrice)} <span className="text-base font-body font-medium text-muted">cr</span>
              </span>
            </div>
            {user?.balance != null && (
              <p className="mt-1 text-right text-xs text-muted">Solde disponible : {formatCredits(user.balance)} cr</p>
            )}

            {results && !results.success && (
              <p className="mt-5 alert-error">{results.message}</p>
            )}

            {!user ? (
              <div className="mt-6">
                <Link to="/login" className="btn-primary btn-lg w-full">Se connecter pour payer</Link>
                <p className="mt-3 text-center text-sm text-muted">
                  Pas encore client ? <Link to="/register" className="link">Créer un compte</Link>
                </p>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={purchasing}
                className="btn-primary btn-lg w-full mt-6"
              >
                {purchasing ? 'Traitement en cours…' : <>Payer la commande <IconArrowRight size={18} /></>}
              </button>
            )}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <IconLock size={14} /> Paiement sécurisé en crédits BananaShop
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
