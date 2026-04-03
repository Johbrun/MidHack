const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/products
router.get('/', (req, res) => {
  const { search } = req.query;

  let products;
  if (search) {
    products = db.prepare(
      'SELECT * FROM products WHERE name LIKE ? OR description LIKE ?'
    ).all(`%${search}%`, `%${search}%`);

    // VULNERABLE: reflect search term back unsanitized (used by frontend for Reflected XSS)
    return res.json({ products, searchTerm: search });
  }

  products = db.prepare('SELECT * FROM products').all();
  res.json({ products });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// POST /api/products/:id/buy
router.post('/:id/buy', authenticate, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

  if (user.balance < product.price) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  if (product.stock <= 0) {
    return res.status(400).json({ error: 'Out of stock' });
  }

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(product.price, req.user.id);
  db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(product.id);

  db.prepare(
    'INSERT INTO transactions (from_user_id, amount, type) VALUES (?, ?, ?)'
  ).run(req.user.id, product.price, 'purchase');

  const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

  res.json({
    message: `You bought ${product.name}!`,
    balance: updatedUser.balance,
    product: product.name,
  });
});

// POST /api/products/buy-batch
// Achète tous les articles en une seule transaction atomique (tout ou rien)
router.post('/buy-batch', authenticate, (req, res) => {
  const { items } = req.body; // [{ id, qty }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide' });
  }

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

  // Calculer le coût total et vérifier le stock
  let totalCost = 0;
  const resolvedItems = [];
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
    if (!product) {
      return res.status(404).json({ error: `Produit introuvable (id: ${item.id})` });
    }
    if (product.stock < item.qty) {
      return res.status(400).json({ error: `Stock insuffisant pour ${product.name} (demandé: ${item.qty}, disponible: ${product.stock})` });
    }
    totalCost += product.price * item.qty;
    resolvedItems.push({ product, qty: item.qty });
  }

  if (user.balance < totalCost) {
    return res.status(400).json({ error: `Solde insuffisant. Total: ${totalCost} crédits, solde: ${user.balance.toFixed(2)} crédits` });
  }

  // Tout est ok — exécuter la transaction
  const buyAll = db.transaction(() => {
    for (const { product, qty } of resolvedItems) {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
      db.prepare(
        'INSERT INTO transactions (from_user_id, amount, type) VALUES (?, ?, ?)'
      ).run(req.user.id, product.price * qty, 'purchase');
    }
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalCost, req.user.id);
  });

  buyAll();

  const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

  res.json({
    message: 'Achat effectué avec succès !',
    balance: updatedUser.balance,
    totalCost,
    items: resolvedItems.map(({ product, qty }) => ({ name: product.name, qty, subtotal: product.price * qty })),
  });
});

module.exports = router;
