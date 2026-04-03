import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';

export default function Shop() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearch, setDisplaySearch] = useState('');

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

  const handleSearch = (e) => {
    e.preventDefault();
    window.location.href = `/shop?search=${encodeURIComponent(searchTerm)}`;
  };

  const tierColors = {
    'Organic Banana': 'from-emerald-500/20 to-emerald-900/20',
    'Tropical Banana': 'from-orange-500/20 to-orange-900/20',
    'Silver Banana': 'from-slate-300/20 to-slate-600/20',
    'Golden Banana': 'from-accent/20 to-terracotta/20',
    'Diamond Banana': 'from-cyan/20 to-blue-900/20',
  };

  return (
    <div className="page-container">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="section-title mb-1">Boutique Banana</h1>
          <p className="text-white/40 text-sm">Bananes premium, prix en crédits</p>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
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

      {/* VULNERABLE: Reflected XSS — renders search term as HTML */}
      {displaySearch && (
        <div className="mb-6 p-4 card">
          <span className="text-white/40 text-sm">Résultats pour : </span>
          <span
            className="text-white text-sm font-semibold"
            dangerouslySetInnerHTML={{ __html: displaySearch }}
          />
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="card-hover group relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${tierColors[product.name] || 'from-white/5 to-white/0'} opacity-50`} />
            <div className="relative p-6">
              <div className="text-5xl mb-4 text-center py-6">🍌</div>
              <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-accent transition-colors">
                {product.name}
              </h3>
              <p className="text-white/40 text-sm mb-4 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading font-extrabold text-xl text-accent">
                  {product.price} <span className="text-xs text-white/30">cr</span>
                </span>
                <span className="text-xs text-white/20 font-mono">
                  {product.stock} en stock
                </span>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); addToCart(product); }}
                className="w-full py-2.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 font-heading font-semibold hover:bg-accent/20 hover:text-accent hover:border-accent/30 transition-all"
              >
                Ajouter au panier
              </button>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-white/30">
          <p className="text-4xl mb-4">🍌</p>
          <p>Aucune banane trouvée</p>
        </div>
      )}
    </div>
  );
}
