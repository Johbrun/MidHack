import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import { TIERS, TIER_KEYS } from '../lib/catalog';
import { IconChevronRight, IconX } from '../components/Icons';

const PRICE_RANGES = [
  { id: 'all', label: 'Tous les prix', test: () => true },
  { id: 'lt20', label: 'Moins de 20 cr', test: (p) => p < 20 },
  { id: '20to100', label: 'De 20 à 100 cr', test: (p) => p >= 20 && p <= 100 },
  { id: 'gt100', label: 'Plus de 100 cr', test: (p) => p > 100 },
];

function FilterGroup({ title, children }) {
  return (
    <div className="py-5 border-b border-line last:border-0">
      <h3 className="font-heading font-semibold text-ink mb-3">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterOption({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
        active ? 'bg-accent-100 text-ink font-semibold' : 'text-muted hover:bg-cream hover:text-ink'
      }`}
    >
      <span>{children}</span>
      {count != null && <span className="text-xs text-muted">{count}</span>}
    </button>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [displaySearch, setDisplaySearch] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const xssRef = useRef(null);

  const search = searchParams.get('search') || '';
  const activeTier = TIER_KEYS.includes(searchParams.get('tier')) ? searchParams.get('tier') : 'Tous';

  useEffect(() => {
    const url = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
    api.get(url).then(r => {
      setProducts(r.data.products);
      setDisplaySearch(r.data.searchTerm || '');
    }).catch(() => {});
  }, [search]);

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

  const setTier = (tier) => {
    const next = new URLSearchParams(searchParams);
    if (tier === 'Tous') next.delete('tier'); else next.set('tier', tier);
    setSearchParams(next);
  };

  const resetFilters = () => {
    setTier('Tous');
    setPriceRange('all');
    setInStockOnly(false);
    setSortBy('default');
  };

  const range = PRICE_RANGES.find(r => r.id === priceRange);
  let displayProducts = products.filter(p =>
    (activeTier === 'Tous' || p.tier === activeTier)
    && range.test(Number(p.price))
    && (!inStockOnly || Number(p.stock) > 0),
  );
  if (sortBy === 'price_asc') displayProducts.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price_desc') displayProducts.sort((a, b) => b.price - a.price);
  else if (sortBy === 'rating') displayProducts.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

  const tierCount = (tier) => products.filter(p => tier === 'Tous' || p.tier === tier).length;
  const tier = TIERS[activeTier];
  const filtersActive = activeTier !== 'Tous' || priceRange !== 'all' || inStockOnly;

  return (
    <div className="page-container">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-1.5 text-sm text-muted mb-6">
        <Link to="/" className="hover:text-ink">Accueil</Link>
        <IconChevronRight size={14} />
        <Link to="/shop" className="hover:text-ink">Boutique</Link>
        {tier && (<><IconChevronRight size={14} /><span className="text-ink">{tier.label}</span></>)}
      </nav>

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">
          {tier ? `Gamme ${tier.label}` : 'Toutes nos bananes'}
        </h1>
        <p className="mt-2 text-muted max-w-2xl">
          {tier ? tier.description : 'Vingt variétés triées sur le volet, du régime de terroir à la banane expérimentale.'}
        </p>
      </div>

      {/* VULNERABLE: Reflected XSS - renders search term as HTML */}
      {displaySearch && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-line px-5 py-4">
          <p className="text-ink min-w-0 [overflow-wrap:anywhere]">
            <span className="text-muted">Résultats pour : </span>
            <span
              ref={xssRef}
              className="font-semibold"
            />
          </p>
          <Link to="/shop" className="flex items-center gap-1.5 text-sm link">
            <IconX size={16} /> Effacer la recherche
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        {/* Filtres (desktop) */}
        <aside className="hidden lg:block self-start sticky top-36">
          <FilterGroup title="Gammes">
            {['Tous', ...TIER_KEYS].map(t => (
              <FilterOption key={t} active={activeTier === t} onClick={() => setTier(t)} count={tierCount(t)}>
                {t === 'Tous' ? 'Toutes les gammes' : t}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup title="Prix">
            {PRICE_RANGES.map(r => (
              <FilterOption key={r.id} active={priceRange === r.id} onClick={() => setPriceRange(r.id)}>
                {r.label}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup title="Disponibilité">
            <label className="flex items-center gap-3 px-3 py-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0593A7]"
              />
              En stock uniquement
            </label>
          </FilterGroup>
          {filtersActive && (
            <button onClick={resetFilters} className="mt-4 text-sm link">Réinitialiser les filtres</button>
          )}
        </aside>

        <div>
          {/* Filtres (mobile) */}
          <div className="lg:hidden -mx-4 px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
            {['Tous', ...TIER_KEYS].map(t => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium border transition-colors ${
                  activeTier === t ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line'
                }`}
              >
                {t === 'Tous' ? 'Toutes' : t}
              </button>
            ))}
          </div>

          {/* Barre d'outils */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <p className="text-sm text-muted">
              <strong className="text-ink">{displayProducts.length}</strong> produit{displayProducts.length > 1 ? 's' : ''}
            </p>
            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">Trier par</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-full border border-line bg-white px-4 text-sm text-ink focus:outline-none focus:border-cyan"
              >
                <option value="default">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Meilleures notes</option>
              </select>
            </label>
          </div>

          {/* Grille */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayProducts.map((product, i) => (
              <ProductCard key={`${product.id}-${i}`} product={product} />
            ))}
          </div>

          {displayProducts.length === 0 && (
            <div className="card px-6 py-16 text-center">
              <img src="/banana.svg" alt="" className="h-14 w-14 mx-auto opacity-60" />
              <p className="mt-4 font-heading font-bold text-xl text-ink">Aucune banane trouvée</p>
              <p className="mt-1 text-muted">Même en cherchant bien sous les feuilles. Essayez un autre filtre ou une autre recherche.</p>
              <div className="mt-6 flex justify-center gap-3">
                {filtersActive && <button onClick={resetFilters} className="btn-secondary">Réinitialiser les filtres</button>}
                {search && <Link to="/shop" className="btn-dark">Voir toutes les bananes</Link>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
