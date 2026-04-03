const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { FLAGS } = require('./flags');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'banana_shop.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    bio TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    balance REAL DEFAULT 100.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    rating INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    amount REAL NOT NULL,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data (only if empty)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const adminHash = bcrypt.hashSync('SuperSecretAdmin123!', 10);
  const johnHash = bcrypt.hashSync('john123', 10);
  const flagHash = bcrypt.hashSync('unfindable_password_42!', 10);

  db.prepare(`INSERT INTO users (username, password_hash, email, bio, role, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'admin', adminHash, 'admin@bananashop.local', 'Administrator account', 'admin', 99999
  );
  db.prepare(`INSERT INTO users (username, password_hash, email, bio, role, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'john', johnHash, 'john@example.com', 'Just a regular banana lover', 'user', 500
  );
  db.prepare(`INSERT INTO users (username, password_hash, email, bio, role, balance) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'flag_holder', flagHash, 'hidden@bananashop.local', FLAGS.IDOR, 'user', 0
  );

  // Seed products
  const products = [
    ['Organic Banana', 'Naturally grown, pesticide-free banana. Perfect for the health-conscious.', 10, '/bananas/organic.svg'],
    ['Tropical Banana', 'Imported from the finest tropical regions. Sweet and aromatic.', 15, '/bananas/tropical.svg'],
    ['Silver Banana', 'A premium selection with a smooth, creamy texture.', 25, '/bananas/silver.svg'],
    ['Golden Banana', 'Our best seller. Rich flavor and perfectly ripened.', 50, '/bananas/golden.svg'],
    ['Diamond Banana', 'The legendary Diamond Banana. Only the wealthiest can afford this delicacy.', 10000, '/bananas/diamond.svg'],
  ];

  const insertProduct = db.prepare('INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)');
  for (const p of products) {
    insertProduct.run(...p);
  }

  console.log('Database seeded successfully');
}

module.exports = db;
