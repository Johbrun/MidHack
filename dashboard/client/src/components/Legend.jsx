import { CATEGORIES } from '../flags';

export default function Legend() {
  return (
    <div className="flex gap-5 mb-3 flex-wrap">
      {Object.values(CATEGORIES).map((cat) => (
        <span
          key={cat.label}
          className="flex items-center gap-1.5 text-xs text-white/50 font-heading font-semibold"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: cat.color }}
          />
          {cat.label}
        </span>
      ))}
    </div>
  );
}
