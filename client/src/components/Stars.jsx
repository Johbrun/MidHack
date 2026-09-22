import { IconStar } from './Icons';

export default function Stars({ value = 0, size = 14, className = '' }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className={`inline-flex items-center gap-0.5 text-accent-600 ${className}`} aria-label={`${value} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStar key={i} size={size} filled={i < rounded} className={i < rounded ? '' : 'text-line'} />
      ))}
    </span>
  );
}
