import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
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
      clearCart();
    } catch (err) {
      setResults({ success: false, message: err.response?.data?.error || 'Échec de l\'achat' });
    }
    setPurchasing(false);
  };

  return (
    <div className="page-container max-w-3xl">
      <h1 className="section-title mb-2">Votre panier</h1>
      <p className="text-white/40 text-sm mb-8">
        {items.length === 0 ? 'Votre panier est vide' : `${items.reduce((s, i) => s + i.qty, 0)} article(s)`}
      </p>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-white/30 mb-6">Rien ici pour le moment</p>
          <Link to="/shop" className="btn-primary inline-flex">Parcourir la boutique</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-8">
            {items.map(item => (
              <div key={item.id} className="card p-5 flex items-center gap-5">
                <div className="text-3xl shrink-0">🍌</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold truncate">{item.name}</h3>
                  <p className="text-accent font-heading font-semibold text-sm">{item.price} cr</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white/60 hover:border-white/20 transition-colors flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono text-sm">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-8 h-8 rounded-md bg-white/5 border border-white/10 text-white/60 hover:border-white/20 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="w-24 text-right">
                  <span className="font-heading font-bold text-accent">
                    {(item.price * item.qty).toFixed(0)} <span className="text-xs text-white/30">cr</span>
                  </span>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-white/20 hover:text-red-400 transition-colors text-lg"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Total + Checkout */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-white/40 uppercase tracking-wider text-sm font-heading">Total</span>
              <span className="text-3xl font-heading font-extrabold text-accent">
                {totalPrice.toFixed(0)} <span className="text-sm text-white/30">crédits</span>
              </span>
            </div>

            {!user ? (
              <div className="text-center">
                <p className="text-white/40 text-sm mb-4">Vous devez avoir un compte pour payer</p>
                <Link to="/login" className="btn-primary inline-flex">Se connecter</Link>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={purchasing}
                className="btn-primary w-full disabled:opacity-50"
              >
                {purchasing ? 'Traitement en cours...' : 'Payer'}
              </button>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className={`mt-6 p-5 rounded-lg text-sm ${
              results.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              <p className="font-heading font-bold text-base mb-2">{results.message}</p>
              {results.success && results.items && (
                <>
                  <ul className="space-y-1 mb-3">
                    {results.items.map((item, i) => (
                      <li key={i} className="text-white/50">
                        {item.name} x{item.qty} — {item.subtotal} cr
                      </li>
                    ))}
                  </ul>
                  <p className="font-mono text-white/30">Nouveau solde : {results.balance.toFixed(2)} crédits</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
