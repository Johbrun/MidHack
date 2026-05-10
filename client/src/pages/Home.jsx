import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const tierColors = {
  'Organic': 'from-emerald-500/20 to-emerald-900/10',
  'Tropical': 'from-orange-500/20 to-orange-900/10',
  'Artificial': 'from-cyan/20 to-blue-900/10',
};

const categories = [
  { tier: 'Organic', emoji: '🌿', desc: 'Bio, naturel & sans chichis', from: 'dès 8 cr', gradient: 'from-emerald-500/30 to-emerald-900/20', border: 'border-emerald-500/20' },
  { tier: 'Tropical', emoji: '🌴', desc: 'Exotique, importé & aventurier', from: 'dès 15 cr', gradient: 'from-orange-500/30 to-orange-900/20', border: 'border-orange-500/20' },
  { tier: 'Artificial', emoji: '⚗️', desc: 'Ingénierie, innovation & audace', from: 'dès 35 cr', gradient: 'from-cyan/30 to-blue-900/20', border: 'border-cyan/30' },
];

const whyItems = [
  { icon: '🌿', title: 'Fraîcheur garantie', desc: 'Nos bananes sont cueillies à maturité optimale et expédiées sous 24h depuis nos partenaires cultivateurs.' },
  { icon: '📦', title: 'Traçabilité totale', desc: "Pour chaque variété, vous connaissez l'origine, la récolte et le producteur. La transparence avant tout." },
  { icon: '💎', title: '5 gammes premium', desc: "De l'Organic accessible à la Diamond légendaire, une gamme pour chaque profil et chaque budget." },
];

const trustItems = [
  { icon: '🍌', stat: '10 000+', label: 'clients satisfaits' },
  { icon: '🚚', stat: '67h', label: 'délai de livraison garanti' },
  { icon: '🌿', stat: '100%', label: 'naturel, sans additifs' },
  { icon: '🔒', stat: 'Sécurisé', label: 'paiement par crédits' },
];

export default function Home() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [addedIds, setAddedIds] = useState({});

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data.products)).catch(() => {});
    api.get('/products/reviews/recent?limit=3').then(r => setRecentReviews(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/users/${user.id}/subscription`)
      .then(r => setSubscription(r.data.subscription || 'free'))
      .catch(() => setSubscription('free'));
  }, [user?.id]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  return (
    <div className="min-h-screen">

      {/* 1. Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan/[0.04] blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight mb-6 leading-[1.1]">
              Les meilleures<br />bananes,{' '}
              <span className="gradient-text">livrées en 67h</span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl mb-10 leading-relaxed">
              Du bio au diamant, BananaShop propose la collection de bananes la plus exclusive du marché. Rechargez vos crédits et commencez vos achats.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link to="/shop" className="btn-primary !px-10">Parcourir la boutique</Link>
              {!user && <Link to="/register" className="btn-secondary !px-10">Créer un compte</Link>}
            </div>
          </div>
          <div className="flex-shrink-0 relative">
            <div className="absolute inset-0 m-auto w-52 h-52 rounded-full bg-accent/10 blur-3xl" />
            <span className="relative text-[140px] leading-none drop-shadow-[0_0_60px_rgba(250,187,92,0.35)]">🍌</span>
          </div>
        </div>
      </section>

      {/* 2. Trust Bar */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-6">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map(({ icon, stat, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="font-heading font-extrabold text-white text-sm">{stat}</div>
                <div className="text-white/40 text-xs">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Category Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-heading font-extrabold tracking-tight mb-1">Nos gammes</h2>
            <p className="text-white/30 text-sm">5 variétés, chacune unique</p>
          </div>
          <Link to="/shop" className="text-cyan text-sm hover:text-cyan/80 transition-colors">Voir tout &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link
              key={cat.tier}
              to="/shop"
              className={`relative overflow-hidden rounded-xl border ${cat.border} bg-gradient-to-br ${cat.gradient} p-8 text-center hover:scale-[1.02] transition-transform duration-200 group`}
            >
              <div className="text-4xl mb-3">{cat.emoji}</div>
              <div className="font-heading font-bold text-lg mb-1 group-hover:text-accent transition-colors">{cat.tier}</div>
              <div className="text-white/40 text-sm mb-3">{cat.desc}</div>
              <div className="font-mono text-xs text-accent font-bold">{cat.from}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured Products */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-heading font-extrabold tracking-tight mb-1">Produits vedettes</h2>
            <p className="text-white/30 text-sm">Les favoris de nos clients</p>
          </div>
          <Link to="/shop" className="text-cyan text-sm hover:text-cyan/80 transition-colors">Voir tout &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.slice(0, 3).map(product => (
            <div key={product.id} className="card-hover group relative overflow-hidden flex flex-col">
              <div className={`absolute inset-0 bg-gradient-to-br ${tierColors[product.tier] || 'from-white/5 to-white/0'} opacity-50`} />
              <Link to={`/product/${product.id}`} className="relative flex-1 p-6 block">
                <div className="mb-4 text-center py-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={`/api/products/image?file=${product.image_url?.split('/').pop()}`}
                    alt={product.name}
                    className="w-20 h-20 object-contain"
                  />
                </div>
                <h3 className="font-heading font-bold text-base mb-1 group-hover:text-accent transition-colors">
                  {product.name}
                </h3>
                {product.avg_rating != null && (
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`text-xs ${i < Math.round(product.avg_rating) ? 'text-accent' : 'text-white/10'}`}>★</span>
                    ))}
                    <span className="text-white/30 text-xs ml-1">{product.avg_rating} ({product.review_count})</span>
                  </div>
                )}
                <p className="text-white/40 text-xs mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-extrabold text-xl text-accent">
                    {product.price} <span className="text-xs text-white/30">cr</span>
                  </span>
                  <span className="text-xs text-white/20 font-mono">{product.stock} en stock</span>
                </div>
              </Link>
              <div className="relative px-6 pb-6">
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className="w-full py-2.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 font-heading font-semibold hover:bg-accent/20 hover:text-accent hover:border-accent/30 transition-all"
                >
                  {addedIds[product.id] ? '✓ Ajouté !' : 'Ajouter au panier'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Why BananaShop */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-extrabold tracking-tight mb-2">Pourquoi BananaShop ?</h2>
            <p className="text-white/30 text-sm max-w-lg mx-auto">Nous ne vendons pas juste des bananes. Nous offrons une expérience premium.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyItems.map(({ icon, title, desc }) => (
              <div key={title} className="card p-8 text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-heading font-bold text-lg mb-3">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      {recentReviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-extrabold tracking-tight mb-2">Ce que disent nos clients</h2>
            <p className="text-white/30 text-sm">Des milliers de bananophiles satisfaits</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReviews.map(review => (
              <div key={review.id} className="card p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < review.rating ? 'text-accent' : 'text-white/10'}>★</span>
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed flex-1">"{review.content}"</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="font-heading font-semibold text-sm text-cyan">{review.username}</span>
                  <span className="text-xs text-white/20">{review.product_name.replace(' Banana', '')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Premium CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/8 to-terracotta/5 p-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-heading font-bold uppercase tracking-wider">Premium</span>
                <span className="text-white/30 text-xs">50 🥭 / mois</span>
              </div>
              <h2 className="text-2xl font-heading font-extrabold mb-6">
                {subscription === 'premium'
                  ? <span>Vous êtes <span className="text-accent">Premium</span> 🍌</span>
                  : <span>Passez au <span className="text-accent">Premium</span></span>}
              </h2>
              <div className="space-y-3">
                {[
                  { included: true, label: 'Accès aux gammes exclusives' },
                  { included: true, label: 'Livraison prioritaire en 24h' },
                  { included: true, label: 'Réductions membres (-10%)' },
                  { included: false, label: 'Boutique standard uniquement (offre Free)' },
                ].map(({ included, label }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className={included ? 'text-emerald-400' : 'text-white/20'}>
                      {included ? '✓' : '✗'}
                    </span>
                    <span className={included ? 'text-white/70' : 'text-white/25'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-8 text-center">
              <div className="text-5xl font-heading font-extrabold text-accent mb-1">50</div>
              <div className="text-white/40 text-sm mb-1">🥭 crédits</div>
              <div className="text-white/20 text-xs mb-6">par mois</div>
              <Link to="/subscription" className="btn-primary block w-full text-center">
                {subscription === 'premium' ? 'Gérer mon abonnement' : 'Passer au Premium'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="relative overflow-hidden border-t border-accent/10 bg-gradient-to-r from-accent/10 via-accent/5 to-cyan/10 py-24 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/[0.06] blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight mb-4">
            Prêt à rejoindre 10 000 amateurs<br />de bananes premium ?
          </h2>
          <p className="text-white/40 mb-10 max-w-lg mx-auto leading-relaxed">
            Créez votre compte, recevez 100 crédits gratuits et commencez votre collection de bananes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user
              ? <Link to="/shop" className="btn-primary !px-12">Explorer la boutique</Link>
              : <>
                  <Link to="/register" className="btn-primary !px-12">Créer un compte gratuit</Link>
                  <Link to="/shop" className="btn-secondary !px-12">Explorer la boutique</Link>
                </>
            }
          </div>
        </div>
      </section>

    </div>
  );
}
