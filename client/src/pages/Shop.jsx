import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';

const TIERS = ['Tous', 'Organic', 'Tropical', 'Artificial'];

const tierColors = {
  'Organic': 'from-emerald-500/20 to-emerald-900/20',
  'Tropical': 'from-orange-500/20 to-orange-900/20',
  'Artificial': 'from-cyan/20 to-blue-900/20',
};

const tierBadgeColors = {
  'Organic': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  'Tropical': 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  'Artificial': 'bg-cyan/20 text-cyan border-cyan/30',
};

export default function Shop() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearch, setDisplaySearch] = useState('');
  const [activeTier, setActiveTier] = useState('Tous');
  const [sortBy, setSortBy] = useState('default');
  const [addedIds, setAddedIds] = useState({});
  const xssRef = useRef(null);

  useEffect(() => {
    const search = searchParams.get('search') || '';
    setSearchTerm(search);

    const url = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
    api.get(url).then(r => {
      setProducts(r.data.products);
      if (r.data.searchTerm) {
        setDisplaySearch(r.data.searchTerm);
      }
    }).catch(() => {});
  }, [searchParams]);

  // VULNERABLE: inject HTML and execute <script> tags for Reflected XSS
  useEffect(() => {
    if (xssRef.current && displaySearch) {
      xssRef.current.innerHTML = displaySearch;
      xssRef.current.querySelectorAll('script').forEach(old => {
        const s = document.createElement('script');
        [...old.attributes].forEach(a => s.setAttribute(a.name, a.value));
        s.textContent = old.textContent;
        old.replaceWith(s);
      });
    }
  }, [displaySearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    window.location.href = `/shop?search=${encodeURIComponent(searchTerm)}`;
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  let displayProducts = [...products];
  if (activeTier !== 'Tous') {
    displayProducts = displayProducts.filter(p => p.tier === activeTier);
  }
  if (sortBy === 'price_asc') displayProducts.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price_desc') displayProducts.sort((a, b) => b.price - a.price);
  else if (sortBy === 'rating') displayProducts.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="section-title mb-1">Boutique Banana</h1>
          <p className="text-white/40 text-sm">
            {displayProducts.length} produit{displayProducts.length > 1 ? 's' : ''} disponible{displayProducts.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            className="input flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des bananes..."
          />
          <button type="submit" className="btn-secondary !px-8">Rechercher</button>
        </div>
      </form>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {TIERS.map(tier => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-4 py-1.5 rounded-full text-sm font-heading font-semibold border transition-all ${
                activeTier === tier
                  ? 'bg-accent/20 text-accent border-accent/40'
                  : 'bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/20 hover:text-white/70'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input !w-auto !py-2 text-sm"
        >
          <option value="default">Trier par défaut</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="rating">Meilleures notes</option>
        </select>
      </div>

      {/* VULNERABLE: Reflected XSS - renders search term as HTML */}
      {displaySearch && (
        <div className="mb-6 p-4 card">
          <span className="text-white/40 text-sm">Résultats pour : </span>
          <span
            ref={xssRef}
            className="text-white text-sm font-semibold"
          />
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {displayProducts.map(product => (
          <div key={product.id} className="product-card group relative bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200">
            <div className={`absolute inset-0 bg-gradient-to-b ${tierColors[product.tier] || 'from-white/5 to-white/0'} opacity-40 pointer-events-none`} />
            <Link to={`/product/${product.id}`} className="relative flex-1 block p-3">
              {/* Image zone */}
              <div className="product-card-img relative mb-3 flex justify-center items-center h-24 bg-white/[0.03] rounded-lg overflow-hidden">
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <span className="text-[10px] font-heading font-bold text-red-400/80 uppercase tracking-wider">Rupture</span>
                  </div>
                )}
                <img
                  src={`/api/products/image?file=${product.image_url?.split('/').pop()}`}
                  alt={product.name}
                  className="h-16 w-16 object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              {/* Badge tier */}
              <div className="mb-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-heading font-bold border ${tierBadgeColors[product.tier] || 'bg-white/10 text-white/50 border-white/10'}`}>
                  {product.tier}
                </span>
              </div>
              {/* Name */}
              <h3 className="font-heading font-bold text-sm leading-tight mb-1 text-white group-hover:text-accent transition-colors line-clamp-2">
                {product.name}
              </h3>
              {/* Rating */}
              {product.avg_rating != null && (
                <div className="flex items-center gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`text-[10px] ${i < Math.round(product.avg_rating) ? 'text-accent' : 'text-white/10'}`}>★</span>
                  ))}
                  <span className="text-white/25 text-[10px] ml-0.5">({product.review_count})</span>
                </div>
              )}
              {/* Price */}
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="font-heading font-extrabold text-base text-accent leading-none">
                  {product.price}
                </span>
                <span className="text-[10px] text-white/30 font-mono">cr</span>
              </div>
            </Link>
            {/* Add to cart */}
            <div className="relative px-3 pb-3">
              <button
                onClick={(e) => handleAddToCart(e, product)}
                disabled={product.stock === 0}
                className={`w-full py-1.5 rounded-lg text-xs font-heading font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                  addedIds[product.id]
                    ? 'bg-accent/25 text-accent border border-accent/40'
                    : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-accent/15 hover:text-accent hover:border-accent/30'
                }`}
              >
                {addedIds[product.id] ? '✓ Ajouté' : '+ Panier'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {displayProducts.length === 0 && (
        <div className="text-center py-20 text-white/30">
          <p className="text-5xl mb-4">🍌</p>
          <p className="text-lg font-heading font-bold mb-2">Aucune banane trouvée</p>
          <p className="text-sm text-white/20 mb-6">Essayez un autre filtre ou terme de recherche</p>
          <button
            onClick={() => { setActiveTier('Tous'); setSortBy('default'); }}
            className="btn-secondary"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
