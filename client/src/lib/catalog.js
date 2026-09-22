// Métadonnées d'affichage des gammes. Les clés correspondent à la colonne
// `tier` renvoyée par l'API ; une ligne sans gamme connue (recherche, UNION…)
// retombe sur le style neutre.
export const TIERS = {
  Organic: {
    label: 'Organic',
    tagline: 'Bio, terroir & sans chichis',
    description: "Des bananes cultivées à l'ancienne, par des gens qui parlent à leurs bananiers.",
    tint: 'bg-[#EEF5E9]',
    badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    dot: 'bg-emerald-600',
    image: 'organic.svg',
  },
  Tropical: {
    label: 'Tropical',
    tagline: 'Exotiques & aventurières',
    description: "Importées des quatre coins des tropiques, avec leurs anecdotes de voyage.",
    tint: 'bg-[#FBEEE1]',
    badge: 'bg-terracotta-50 text-terracotta border border-terracotta/20',
    dot: 'bg-terracotta',
    image: 'tropical.svg',
  },
  Artificial: {
    label: 'Artificial',
    tagline: 'Innovation & haute couture',
    description: "Nos ingénieurs repoussent les limites de la banane. Le comité d'éthique, lui, recule.",
    tint: 'bg-[#E6F2F4]',
    badge: 'bg-cyan-50 text-cyan-700 border border-cyan/20',
    dot: 'bg-cyan',
    image: 'golden.svg',
  },
};

export const TIER_KEYS = Object.keys(TIERS);

const NEUTRAL = {
  label: null,
  tint: 'bg-sand/70',
  badge: 'bg-sand text-muted border border-line',
  dot: 'bg-muted',
};

export const tierMeta = (tier) => TIERS[tier] || NEUTRAL;

// Les images produits passent par /api/products/image?file=<nom du fichier>.
export const productImageUrl = (product) =>
  `/api/products/image?file=${String(product?.image_url ?? '').split('/').pop()}`;

export const formatCredits = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
};
