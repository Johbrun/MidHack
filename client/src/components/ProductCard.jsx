import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { tierMeta, productImageUrl, formatCredits } from '../lib/catalog';
import { IconCart, IconCheck } from './Icons';
import Stars from './Stars';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const tier = tierMeta(product.tier);
  const stock = Number(product.stock);
  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock <= 10;

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group card overflow-hidden flex flex-col hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200">
      <Link to={`/product/${product.id}`} className="flex-1 flex flex-col">
        <div className={`relative aspect-square ${tier.tint} flex items-center justify-center overflow-hidden`}>
          {imgFailed ? (
            <img src="/banana.svg" alt="" className="w-1/3 h-1/3 object-contain opacity-30" />
          ) : (
            <img
              src={productImageUrl(product)}
              alt={String(product.name ?? '')}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="w-3/4 h-3/4 object-contain group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {tier.label && <span className={`badge ${tier.badge}`}>{tier.label}</span>}
            {lowStock && <span className="badge bg-white text-terracotta border border-terracotta/20">Plus que {stock} !</span>}
          </div>
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="badge bg-ink text-white">Victime de son succès</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col p-4">
          <h3 className="font-heading font-semibold text-[15px] leading-snug text-ink line-clamp-2 group-hover:text-terracotta transition-colors">
            {String(product.name ?? '')}
          </h3>
          {product.avg_rating != null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Stars value={product.avg_rating} size={13} />
              <span className="text-xs text-muted">({product.review_count})</span>
            </div>
          )}
          <p className="mt-auto pt-3 font-heading font-bold text-lg text-ink">
            {formatCredits(product.price)} <span className="text-sm font-body font-medium text-muted">cr</span>
          </p>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`w-full btn-sm btn ${added ? 'bg-emerald-600 text-white' : 'bg-ink text-white hover:bg-ink/85'}`}
        >
          {added ? <><IconCheck size={16} /> Ajouté au panier</> : <><IconCart size={16} /> Ajouter au panier</>}
        </button>
      </div>
    </div>
  );
}
