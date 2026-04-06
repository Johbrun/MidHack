const jwt = require('jsonwebtoken');
const db = require('../db');

// VULNERABLE: weak, hardcoded secret
const JWT_SECRET = 'secret-pass-to-change';

function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // VULNERABLE: accepts alg:none - allows unsigned token forging
    const parts = token.split('.');
    if (parts.length < 2) return res.status(401).json({ error: 'Invalid token' });

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    let decoded;

    if (header.alg === 'none') {
      // Intentionally vulnerable: trust unsigned tokens
      // Goal : simulate old libraries which accept this
      decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    } else {
      decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, JWT_SECRET };
