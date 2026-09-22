import { productImageUrl } from '../lib/catalog';
import { IconCheck } from './Icons';

const perks = [
  '100 crédits offerts à l’inscription',
  'Livraison en 67h, montre en main',
  'Accès au Club Premium (sur cooptation)',
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="page-container">
      <div className="mx-auto max-w-5xl grid lg:grid-cols-2 overflow-hidden rounded-[2rem] bg-white border border-line shadow-soft">
        <div className="relative hidden lg:flex flex-col justify-between bg-accent-100 p-10 overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-accent/40" />
          <div className="relative">
            <p className="eyebrow">BananaShop</p>
            <p className="mt-3 font-heading font-extrabold text-3xl leading-tight text-ink">
              La maison des bananes d’exception depuis 2019.
            </p>
            <ul className="mt-6 space-y-3">
              {perks.map(p => (
                <li key={p} className="flex items-center gap-3 text-ink/80">
                  <span className="h-6 w-6 rounded-full bg-white text-terracotta flex items-center justify-center">
                    <IconCheck size={14} strokeWidth={2.5} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <img
            src={productImageUrl({ image_url: 'golden.svg' })}
            alt=""
            className="relative self-end w-56 h-56 object-contain -mb-4"
          />
        </div>

        <div className="p-8 sm:p-12">
          <h1 className="font-heading font-extrabold text-3xl text-ink">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
