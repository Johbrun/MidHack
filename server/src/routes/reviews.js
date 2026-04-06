const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { FLAGS } = require('../flags');

const router = express.Router();

// GET /api/products/:id/reviews
router.get('/:productId/reviews', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.productId);

  res.json(reviews);
});

// POST /api/products/:id/reviews
// VULNERABLE: no sanitization of content - enables Stored XSS
router.post('/:productId/reviews', authenticate, (req, res) => {
  const { content, rating } = req.body;
  const productId = req.params.productId;

  if (!content) {
    return res.status(400).json({ error: 'Review content is required' });
  }

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // VULNERABLE: no server-side validation on rating range
  // The frontend select only shows 1-5, but the API accepts any integer including 0
  const ratingValue = parseInt(rating);
  const safeRating = isNaN(ratingValue) ? 5 : ratingValue;

  // VULNERABLE: content is stored as-is, no sanitization
  const result = db.prepare(
    'INSERT INTO reviews (product_id, user_id, content, rating) VALUES (?, ?, ?, ?)'
  ).run(productId, req.user.id, content, safeRating);

  const response = {
    id: result.lastInsertRowid,
    product_id: parseInt(productId),
    user_id: req.user.id,
    username: req.user.username,
    content,
    rating: safeRating,
    created_at: new Date().toISOString(),
  };

  // Flag revealed when a review with rating 0 is submitted via API
  if (safeRating === 0) {
    response.flag = FLAGS.ZERO_RATING;
    response.message = 'Une note de 0 ? Vous avez trouvé une faille de validation !';
  }

  res.json(response);
});

module.exports = router;
