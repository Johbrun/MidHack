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

    const outcomes = [];
    for (const item of items) {
      for (let i = 0; i < item.qty; i++) {
        try {
          const { data } = await api.post(`/products/${item.id}/buy`);
          outcomes.push({ product: item.name, success: true, message: data.message, balance: data.balance });
        } catch (err) {
          outcomes.push({ product: item.name, success: false, message: err.response?.data?.error || 'Purchase failed' });
          break;
        }
      }
    }

    setResults(outcomes);
    if (outcomes.every(o => o.success)) {
      clearCart();
    }
    setPurchasing(false);
  };

  return (
    <div className="page-container max-w-3xl">
      <h1 className="section-title mb-2">Your Cart</h1>
      <p className="text-white/40 text-sm mb-8">
        {items.length === 0 ? 'Your cart is empty' : `${items.reduce((s, i) => s + i.qty, 0)} item(s)`}
      </p>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-white/30 mb-6">Nothing here yet</p>
          <Link to="/shop" className="btn-primary inline-flex">Browse Shop</Link>
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
                {totalPrice.toFixed(0)} <span className="text-sm text-white/30">credits</span>
              </span>
            </div>

            {!user ? (
              <div className="text-center">
                <p className="text-white/40 text-sm mb-4">You need an account to checkout</p>
                <Link to="/login" className="btn-primary inline-flex">Sign In</Link>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={purchasing}
                className="btn-primary w-full disabled:opacity-50"
              >
                {purchasing ? 'Processing...' : 'Checkout'}
              </button>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="mt-6 space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm ${
                    r.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}
                >
                  {r.product}: {r.message}
                  {r.balance !== undefined && (
                    <span className="ml-2 font-mono text-white/30">Balance: {r.balance.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
