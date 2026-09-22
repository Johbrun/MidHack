import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ReviewCard from '../components/ReviewCard';
import Stars from '../components/Stars';
import { IconStar, IconCart, IconCheck, IconChevronRight, IconMinus, IconPlus, IconTruck, IconRefresh, IconShield } from '../components/Icons';
import { tierMeta, productImageUrl, formatCredits } from '../lib/catalog';
import api from '../api';

function StockStatus({ stock }) {
  const n = Number(stock);
  if (n === 0) return <p className="flex items-center gap-2 text-sm font-medium text-red-700"><span className="h-2 w-2 rounded-full bg-red-600" /> Victime de son succès : rupture de stock</p>;
  if (n <= 10) return <p className="flex items-center gap-2 text-sm font-medium text-terracotta"><span className="h-2 w-2 rounded-full bg-terracotta" /> Plus que {n} en stock, faites vite !</p>;
  return <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-600" /> En stock ({n} disponibles)</p>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}`).then(r => setProduct(r.data)).catch(() => {});
    api.get(`/products/${id}/reviews`).then(r => setReviews(r.data)).catch(() => {});
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const { data } = await api.post(`/products/${id}/reviews`, {
        content: reviewContent,
        rating,
      });
      setReviews([data, ...reviews]);
      setReviewContent('');
      setRating(5);
      setReviewSuccess(data.flag
        ? `Avis publié ! 🎉 ${data.message} Flag : ${data.flag}`
        : "Avis publié avec succès !"
      );
    } catch (err) {
      setReviewError(err.response?.data?.error ?? "Échec de la publication de l'avis");
    }
  };

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (!product) {
    return <div className="page-container text-muted">Chargement de la banane…</div>;
  }

  const tier = tierMeta(product.tier);
  const avg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : null;
  const distribution = [5, 4, 3, 2, 1].map(n => ({ n, count: reviews.filter(r => Math.round(r.rating) === n).length }));
  const outOfStock = Number(product.stock) === 0;

  return (
    <div className="page-container">
      {/* Fil d'Ariane */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted mb-6">
        <Link to="/" className="hover:text-ink">Accueil</Link>
        <IconChevronRight size={14} />
        <Link to="/shop" className="hover:text-ink">Boutique</Link>
        {tier.label && (<><IconChevronRight size={14} /><Link to={`/shop?tier=${product.tier}`} className="hover:text-ink">{tier.label}</Link></>)}
        <IconChevronRight size={14} />
        <span className="text-ink truncate">{product.name}</span>
      </nav>

      {/* Produit */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        <div className={`relative aspect-square rounded-[2rem] ${tier.tint} flex items-center justify-center`}>
          {tier.label && <span className={`absolute top-5 left-5 badge ${tier.badge}`}>Gamme {tier.label}</span>}
          <img
            src={productImageUrl(product)}
            alt={product.name}
            className="w-3/4 h-3/4 object-contain"
          />
        </div>

        <div className="lg:py-4">
          <h1 className="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">{product.name}</h1>

          <a href="#avis" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <Stars value={avg ?? 0} size={16} />
            {avg != null
              ? <span><strong className="text-ink">{avg.toFixed(1).replace('.', ',')}</strong> · {reviews.length} avis</span>
              : <span>Aucun avis pour l'instant</span>}
          </a>

          <p className="mt-6 font-heading font-extrabold text-4xl text-ink">
            {formatCredits(product.price)} <span className="text-lg font-body font-medium text-muted">crédits</span>
          </p>

          <p className="mt-6 text-ink/75 leading-relaxed text-[17px]">{product.description}</p>

          <div className="mt-6"><StockStatus stock={product.stock} /></div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center h-12 rounded-full border border-line bg-white">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="h-12 w-12 flex items-center justify-center text-muted hover:text-ink" aria-label="Diminuer la quantité">
                <IconMinus size={18} />
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="h-12 w-12 flex items-center justify-center text-muted hover:text-ink" aria-label="Augmenter la quantité">
                <IconPlus size={18} />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={`btn-lg flex-1 min-w-[220px] ${addedToCart ? 'btn bg-emerald-600 text-white' : 'btn-primary'}`}
            >
              {addedToCart ? <><IconCheck size={18} /> Ajouté au panier</> : <><IconCart size={18} /> Ajouter au panier</>}
            </button>
          </div>

          <ul className="mt-8 rounded-2xl border border-line bg-white divide-y divide-line text-sm">
            <li className="flex items-center gap-3 px-5 py-4">
              <IconTruck size={20} className="text-terracotta shrink-0" />
              <span><strong className="text-ink">Livraison en 67h</strong> <span className="text-muted">· offerte dès 50 cr d'achat</span></span>
            </li>
            <li className="flex items-center gap-3 px-5 py-4">
              <IconRefresh size={20} className="text-terracotta shrink-0" />
              <span><strong className="text-ink">Satisfait ou re-mûri</strong> <span className="text-muted">· on la laisse mûrir avec vous</span></span>
            </li>
            <li className="flex items-center gap-3 px-5 py-4">
              <IconShield size={20} className="text-terracotta shrink-0" />
              <span><strong className="text-ink">Paiement sécurisé</strong> <span className="text-muted">· en crédits BananaShop</span></span>
            </li>
          </ul>
        </div>
      </div>

      {/* Avis */}
      <section id="avis" className="mt-16 lg:mt-24 scroll-mt-40 grid lg:grid-cols-[340px_1fr] gap-10">
        <div className="self-start lg:sticky lg:top-40 space-y-6">
          <div>
            <h2 className="section-title">Avis clients</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className="font-heading font-extrabold text-5xl text-ink">
                {avg != null ? avg.toFixed(1).replace('.', ',') : '–'}
              </span>
              <div>
                <Stars value={avg ?? 0} size={18} />
                <p className="text-sm text-muted mt-1">{reviews.length} avis</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {distribution.map(({ n, count }) => (
                <div key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-3 text-muted">{n}</span>
                  <IconStar size={13} className="text-accent-600" />
                  <div className="flex-1 h-2 rounded-full bg-sand overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : 0 }} />
                  </div>
                  <span className="w-6 text-right text-muted">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {user ? (
            <form onSubmit={handleReview} className="card p-5">
              <h3 className="font-heading font-semibold text-lg text-ink">Donnez votre avis</h3>
              <div className="mt-3">
                <span className="label">Votre note</span>
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                      className={`p-0.5 transition-colors ${n <= (hoverRating || rating) ? 'text-accent-600' : 'text-line'}`}
                    >
                      <IconStar size={26} filled={n <= (hoverRating || rating)} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <label className="label" htmlFor="review">Votre avis</label>
                <textarea
                  id="review"
                  className="input min-h-[110px] resize-none"
                  value={reviewContent}
                  onChange={(e) => { setReviewContent(e.target.value); setReviewError(null); setReviewSuccess(null); }}
                  placeholder="Texture, maturité, courbure… racontez-nous tout."
                />
              </div>
              {reviewError && <p className="mt-3 alert-error">{reviewError}</p>}
              {reviewSuccess && <p className="mt-3 alert-success [overflow-wrap:anywhere]">{reviewSuccess}</p>}
              <button type="submit" className="btn-dark w-full mt-4">Publier mon avis</button>
            </form>
          ) : (
            <div className="rounded-2xl bg-white border border-line p-5 text-sm text-muted">
              Vous avez goûté cette banane ?{' '}
              <Link to="/login" className="link">Connectez-vous</Link> pour laisser un avis.
            </div>
          )}
        </div>

        <div className="card px-6 self-start">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {reviews.length === 0 && (
            <p className="py-16 text-center text-muted">Aucun avis pour le moment. Soyez le premier à croquer !</p>
          )}
        </div>
      </section>
    </div>
  );
}
