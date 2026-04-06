export default function ReviewCard({ review }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading font-semibold text-sm text-cyan">
          {review.username}
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < review.rating ? 'text-accent' : 'text-white/10'}>
              ★
            </span>
          ))}
        </div>
      </div>
      {/* VULNERABLE: renders review content as raw HTML - enables Stored XSS */}
      <div
        className="text-sm text-white/70 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: review.content }}
      />
      <div className="mt-3 text-xs text-white/20 font-mono">
        {new Date(review.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
