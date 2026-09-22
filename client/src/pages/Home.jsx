import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import Stars from '../components/Stars';
import { TIERS, TIER_KEYS, productImageUrl, formatCredits } from '../lib/catalog';
import {
  IconArrowRight, IconCheck, IconLeaf, IconRefresh, IconShield, IconTruck,
} from '../components/Icons';

const reassurance = [
  { icon: IconTruck, title: 'Livraison en 67h', desc: 'Offerte dès 50 cr, sans jamais se presser' },
  { icon: IconLeaf, title: 'Cueillies à maturité', desc: 'Par des producteurs qui les appellent par leur prénom' },
  { icon: IconRefresh, title: 'Satisfait ou re-mûri', desc: 'Pas assez mûre ? On attend avec vous' },
  { icon: IconShield, title: 'Paiement sécurisé', desc: 'En crédits, et bientôt en mangues' },
];

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);

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

  const bestSellers = useMemo(
    () => [...products]
      .sort((a, b) => (b.review_count || 0) - (a.review_count || 0) || (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 4),
    [products],
  );

  const hero = products.find(p => /or 24/i.test(p.name)) || bestSellers[0];

  const tierStats = useMemo(() => Object.fromEntries(TIER_KEYS.map(t => {
    const items = products.filter(p => p.tier === t);
    return [t, { count: items.length, from: items.length ? Math.min(...items.map(p => p.price)) : null }];
  })), [products]);

  return (
    <div>
      {/* 1. Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 lg:pt-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-accent-100">
          <div className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-accent/40" />
          <div className="absolute right-40 -bottom-32 w-[280px] h-[280px] rounded-full bg-white/40" />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center px-6 py-12 sm:px-12 lg:px-16 lg:py-16">
            <div>
              <span className="badge bg-white text-terracotta shadow-sm">🍂 Nouvelle récolte d'automne</span>
              <h1 className="mt-5 font-heading font-extrabold tracking-tight text-ink text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
                Des bananes d'exception, livrées en&nbsp;67h.
              </h1>
              <p className="mt-5 text-lg text-ink/70 max-w-lg leading-relaxed">
                Du régime bio de Mémé Paulette à la banane quantique, on sélectionne les meilleures
                bananes de la planète. Et d'un peu au-delà.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop" className="btn-dark btn-lg">
                  Découvrir la boutique <IconArrowRight size={18} />
                </Link>
                {!user && <Link to="/register" className="btn-secondary btn-lg">Créer un compte</Link>}
              </div>
              <div className="mt-8 flex items-center gap-3 text-sm text-ink/70">
                <Stars value={5} size={16} />
                <span><strong className="text-ink">4,8/5</strong> · plus de 10 000 bananophiles conquis</span>
              </div>
            </div>

            {hero && (
              <Link to={`/product/${hero.id}`} className="group relative justify-self-center lg:justify-self-end w-full max-w-sm">
                <div className="card p-6 shadow-lift rotate-[1.5deg] group-hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <span className="badge bg-ink text-white">N°1 des ventes</span>
                    {hero.avg_rating != null && (
                      <span className="flex items-center gap-1 text-sm text-muted">
                        <Stars value={hero.avg_rating} size={13} /> {hero.review_count}
                      </span>
                    )}
                  </div>
                  <div className="my-4 aspect-[4/3] rounded-2xl bg-[#E6F2F4] flex items-center justify-center">
                    <img src={productImageUrl(hero)} alt={hero.name} className="h-5/6 object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <p className="font-heading font-semibold text-lg text-ink">{hero.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-heading font-bold text-2xl text-ink">
                      {formatCredits(hero.price)} <span className="text-sm font-body font-medium text-muted">cr</span>
                    </p>
                    <span className="flex items-center gap-1 text-sm font-semibold text-terracotta">
                      Voir <IconArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Réassurance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {reassurance.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4">
              <span className="h-11 w-11 shrink-0 rounded-xl bg-white border border-line flex items-center justify-center text-terracotta">
                <Icon size={22} />
              </span>
              <div>
                <p className="font-semibold text-ink text-sm">{title}</p>
                <p className="text-muted text-sm leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Gammes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow mb-2">Nos gammes</p>
            <h2 className="section-title">Une banane pour chaque tempérament</h2>
          </div>
          <Link to="/shop" className="hidden sm:flex link items-center gap-1">Tout voir <IconArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TIER_KEYS.map(key => {
            const tier = TIERS[key];
            const stats = tierStats[key];
            return (
              <Link
                key={key}
                to={`/shop?tier=${key}`}
                className={`group relative overflow-hidden rounded-3xl ${tier.tint} p-7 min-h-[260px] flex flex-col hover:shadow-lift transition-shadow`}
              >
                <img
                  src={productImageUrl({ image_url: tier.image })}
                  alt=""
                  className="absolute -right-6 -bottom-6 w-48 h-48 object-contain group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300"
                />
                <span className={`badge self-start ${tier.badge}`}>{stats.count} variétés</span>
                <h3 className="mt-4 font-heading font-bold text-2xl text-ink">{tier.label}</h3>
                <p className="mt-1 text-ink/70 max-w-[14rem]">{tier.tagline}</p>
                <p className="mt-auto pt-6 text-sm font-semibold text-ink flex items-center gap-1">
                  {stats.from != null ? `Dès ${formatCredits(stats.from)} cr` : 'Découvrir'}
                  <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Meilleures ventes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow mb-2">Meilleures ventes</p>
            <h2 className="section-title">Les chouchous de nos clients</h2>
          </div>
          <Link to="/shop" className="hidden sm:flex link items-center gap-1">Voir la boutique <IconArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {bestSellers.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* 5. Club Premium */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink text-white">
          <div className="absolute -left-20 -bottom-40 w-[420px] h-[420px] rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute right-0 top-0 w-[360px] h-[360px] rounded-full bg-accent/15 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center p-8 sm:p-12 lg:p-14">
            <div>
              <span className="badge bg-accent text-ink">Club Premium</span>
              <h2 className="mt-4 font-heading font-bold text-3xl sm:text-4xl tracking-tight">
                {subscription === 'premium'
                  ? <>Vous faites partie du <span className="text-accent">Club</span> 🍌</>
                  : <>Rejoignez le <span className="text-accent">Club Premium</span></>}
              </h2>
              <p className="mt-3 text-white/70 max-w-md">
                Le cercle très fermé des amateurs de bananes. On dit qu'il faut connaître quelqu'un
                aux îles Bananas pour y entrer.
              </p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
                {['Accès aux gammes exclusives', 'Livraison prioritaire en 24h', 'Réductions membres (-10 %)', 'Support dédié 24/7'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white/85">
                    <span className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center"><IconCheck size={13} strokeWidth={2.5} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8 text-center">
              <p className="text-white/60 text-sm">À partir de</p>
              <p className="mt-1 font-heading font-extrabold text-5xl text-accent">50 🥭</p>
              <p className="text-white/60 text-sm mt-1">mangues par mois</p>
              <Link to="/subscription" className="btn-primary w-full mt-7">
                {subscription === 'premium' ? 'Gérer mon abonnement' : 'Devenir membre'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Avis clients */}
      {recentReviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">Avis clients</p>
            <h2 className="section-title">Ils ont croqué, ils racontent</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {recentReviews.map(review => (
              <figure key={review.id} className="card p-6 flex flex-col">
                <Stars value={review.rating} size={16} />
                <blockquote className="mt-4 text-ink/80 leading-relaxed flex-1 line-clamp-5 [overflow-wrap:anywhere]">“{review.content}”</blockquote>
                <figcaption className="mt-5 pt-4 border-t border-line flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full bg-cyan-50 text-cyan-700 font-heading font-bold flex items-center justify-center">
                    {review.username?.[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm leading-tight">
                    <span className="block font-semibold text-ink">{review.username}</span>
                    <span className="text-muted">a acheté {review.product_name}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* 7. Inscription */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="rounded-[2rem] border border-line bg-white px-6 py-12 sm:px-12 text-center">
            <h2 className="section-title">100 crédits offerts à l'inscription</h2>
            <p className="mt-3 text-muted max-w-lg mx-auto">
              De quoi s'offrir une douzaine de bananes bio, ou 1 % de la Banane Diamant Légendaire.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-primary btn-lg">Créer mon compte</Link>
              <Link to="/shop" className="btn-secondary btn-lg">Explorer la boutique</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
