import { Link } from 'react-router-dom';
import { TIER_KEYS } from '../lib/catalog';
import { IconRefresh, IconShield, IconTruck } from './Icons';

// Les colonnes « Aide » et « La maison » sont du texte : aucun lien ne pointe
// vers une page qui n'existe pas (pas de fausse piste pour les participants).
export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2 max-w-sm">
          <div className="flex items-center gap-2">
            <img src="/banana.svg" alt="" className="h-8 w-8" />
            <span className="font-heading font-extrabold text-xl text-white">
              Banana<span className="text-accent">Shop</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            Maison fondée en 2019 par trois amis et un bananier en pot. Nous sélectionnons les
            bananes les plus exclusives de la planète (et d’un peu au-delà).
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {['Crédits', 'Mangues 🥭', 'Troc de régimes'].map((m) => (
              <span key={m} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80">{m}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white font-heading font-semibold mb-4">Boutique</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="hover:text-accent transition-colors">Toutes les bananes</Link></li>
            {TIER_KEYS.map((t) => (
              <li key={t}><Link to={`/shop?tier=${t}`} className="hover:text-accent transition-colors">Gamme {t}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-heading font-semibold mb-4">Mon espace</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/dashboard" className="hover:text-accent transition-colors">Mon profil</Link></li>
            <li><Link to="/cart" className="hover:text-accent transition-colors">Mon panier</Link></li>
            <li><Link to="/subscription" className="hover:text-accent transition-colors">Club Premium</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-heading font-semibold mb-4">Nos engagements</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5"><IconTruck size={18} className="text-accent shrink-0" /> Livraison en 67h, montre en main</li>
            <li className="flex gap-2.5"><IconRefresh size={18} className="text-accent shrink-0" /> Satisfait ou re-mûri</li>
            <li className="flex gap-2.5"><IconShield size={18} className="text-accent shrink-0" /> Paiement 100 % sécurisé*</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-2 justify-between text-xs text-white/45">
          <p>© {new Date().getFullYear()} BananaShop SAS · Capital social : 3 régimes · Siège social : îles Bananas</p>
          <p>*Sécurisé selon nos propres critères, audités par nous-mêmes.</p>
        </div>
      </div>
    </footer>
  );
}
