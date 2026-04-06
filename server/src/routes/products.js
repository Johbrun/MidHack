const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { FLAGS } = require('../flags');

const router = express.Router();

const PORT = process.env.PORT || 3000;

// GET /api/products
router.get('/', (req, res) => {
  const { search } = req.query;

  let products;
  if (search) {
    // VULNERABLE: string interpolation allows UNION-based SQL injection
    // Example: ' UNION SELECT 1,value,3,4,5,6 FROM secrets --
    try {
      products = db.prepare(
        `SELECT id, name, description, price, image_url, stock FROM products WHERE name LIKE '%${search}%' OR description LIKE '%${search}%'`
      ).all();
    } catch {
      products = [];
    }

    // VULNERABLE: reflect search term back unsanitized (used by frontend for Reflected XSS)
    // If the search contains alert(...), inject the flag inside the parentheses
    let reflected = search;
    if (/alert\s*\(/.test(search)) {
      reflected = search.replace(/alert\s*\([^)]*\)/, `alert('${FLAGS.REFLECTED_XSS}')`);
    }
    return res.json({ products, searchTerm: reflected });
  }

  products = db.prepare('SELECT * FROM products').all();
  res.json({ products });
});

// GET /api/products/image?file=banana.svg
// VULNERABLE: Path Traversal — reads arbitrary files from disk
router.get('/image', (req, res) => {
  const { file } = req.query;
  if (!file) {
    return res.status(400).json({ error: 'File parameter is required' });
  }

  try {
    // VULNERABLE: user input is used directly in file path without sanitization
    const filePath = path.join(__dirname, '..', '..', 'public', 'bananas', file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if the content contains the path traversal flag
    if (content.includes(FLAGS.PATH_TRAVERSAL)) {
      return res.json({ content, flag: FLAGS.PATH_TRAVERSAL, message: 'Path Traversal réussi !' });
    }

    // Serve SVG files with proper content-type so <img> tags work
    if (file.endsWith('.svg') || content.trimStart().startsWith('<svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(content);
    }

    res.json({ content });
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
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


// POST /api/products/:id/image-url
// VULNERABLE: SSRF — fetches an arbitrary URL from the server
router.post('/:id/image-url', authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // VULNERABLE: no validation or filtering of the URL — allows requests to internal services
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.json({ status: response.status, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch URL: ' + err.message });
  }
});

module.exports = router;
