import Stars from './Stars';

export default function ReviewCard({ review }) {
  return (
    <article className="py-6 border-b border-line last:border-0">
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 shrink-0 rounded-full bg-cyan-50 text-cyan-700 font-heading font-bold flex items-center justify-center">
          {String(review.username ?? '?')[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{review.username}</p>
          <p className="text-xs text-muted">
            Achat vérifié · {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Stars value={review.rating} size={15} className="ml-auto" />
      </div>
      {/* VULNERABLE: renders review content as raw HTML - enables Stored XSS */}
      <div
        className="mt-3 text-ink/80 leading-relaxed [overflow-wrap:anywhere]"
        dangerouslySetInnerHTML={{ __html: review.content }}
      />
    </article>
  );
}
