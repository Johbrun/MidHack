import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data.products)).catch(() => {});
  }, []);

  const tierColors = {
    'Organic Banana': 'from-emerald-500/20 to-emerald-900/10',
    'Tropical Banana': 'from-orange-500/20 to-orange-900/10',
    'Silver Banana': 'from-slate-300/20 to-slate-600/10',
    'Golden Banana': 'from-accent/20 to-terracotta/10',
    'Diamond Banana': 'from-cyan/20 to-blue-900/10',
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/[0.03] blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan/[0.03] blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-white/40 font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Marketplace de bananes premium
          </div>
          <h1 className="text-6xl md:text-7xl font-heading font-extrabold tracking-tight mb-6 leading-[1.1]">
            Les meilleures bananes,<br />
            <span className="gradient-text">livrées en crédits.</span>
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Du bio au diamant, BananaShop propose la collection de bananes la plus exclusive du marché. Rechargez vos crédits et commencez vos achats.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/shop" className="btn-primary !px-10">
              Parcourir la boutique
            </Link>
            <Link to="/register" className="btn-secondary !px-10">
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-heading font-extrabold tracking-tight mb-1">Notre Collection</h2>
            <p className="text-white/30 text-sm">Bananes premium triées sur le volet</p>
          </div>
          <Link to="/shop" className="text-cyan text-sm hover:text-cyan/80 transition-colors">
            Voir tout &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="card-hover group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tierColors[product.name] || 'from-white/5 to-white/0'} opacity-50`} />
              <div className="relative p-6">
                <div className="text-5xl mb-4 text-center py-6 group-hover:scale-110 transition-transform duration-300">🍌</div>
                <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-accent transition-colors">
                  {product.name}
                </h3>
                <p className="text-white/40 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-extrabold text-xl text-accent">
                    {product.price} <span className="text-xs text-white/30">cr</span>
                  </span>
                  <span className="text-xs text-white/20 font-mono">
                    {product.stock} en stock
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="card p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-cyan/5 translate-y-1/2 -translate-x-1/3" />
          <div className="relative">
            <h2 className="text-2xl font-heading font-extrabold mb-3">Prêt à commencer ?</h2>
            <p className="text-white/40 mb-8 max-w-md mx-auto">
              Créez votre compte, recevez 100 crédits gratuits et commencez votre collection de bananes.
            </p>
            <Link to="/register" className="btn-primary inline-flex !px-10">
              Commencer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
