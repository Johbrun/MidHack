import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ReviewCard from '../components/ReviewCard';
import api from '../api';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}`).then(r => setProduct(r.data)).catch(() => {});
    api.get(`/products/${id}/reviews`).then(r => setReviews(r.data)).catch(() => {});
  }, [id]);

  const handleBuy = async () => {
    try {
      const { data } = await api.post(`/products/${id}/buy`);
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Purchase failed' });
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/products/${id}/reviews`, {
        content: reviewContent,
        rating,
      });
      setReviews([data, ...reviews]);
      setReviewContent('');
      setRating(5);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to post review' });
    }
  };

  if (!product) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container max-w-4xl">
      {/* Product Header */}
      <div className="card p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative flex gap-8 items-start">
          <div className="text-7xl shrink-0 p-8">🍌</div>
          <div className="flex-1">
            <h1 className="text-3xl font-heading font-extrabold mb-3">{product.name}</h1>
            <p className="text-white/50 mb-6 leading-relaxed">{product.description}</p>
            <div className="flex items-center gap-6 mb-6">
              <span className="text-4xl font-heading font-extrabold text-accent">
                {product.price} <span className="text-sm text-white/30">credits</span>
              </span>
              <span className="text-sm text-white/20 font-mono">{product.stock} in stock</span>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  addToCart(product);
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                className="btn-primary"
              >
                {addedToCart ? 'Added!' : 'Add to Cart'}
              </button>
              {user && (
                <button onClick={handleBuy} className="btn-secondary">
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-8">
        <h2 className="font-heading font-bold text-xl mb-6">
          Reviews <span className="text-white/20 text-sm">({reviews.length})</span>
        </h2>

        {/* Review Form */}
        {user && (
          <form onSubmit={handleReview} className="card p-6 mb-6">
            <div className="mb-4">
              <label className="label">Your Review</label>
              <textarea
                className="input min-h-[100px] resize-none"
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Write your review..."
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="label !mb-0">Rating:</label>
                <select
                  className="input !w-20 !py-2"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map(n => (
                    <option key={n} value={n}>{n} ★</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-secondary">Post Review</button>
            </div>
          </form>
        )}

        {/* Review List */}
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {reviews.length === 0 && (
            <p className="text-white/20 text-sm text-center py-8">No reviews yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
