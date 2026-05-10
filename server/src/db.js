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

  CREATE TABLE IF NOT EXISTS secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT NOT NULL
  );
`);

// Idempotent migrations
const cols = db.prepare("PRAGMA table_info(users)").all();
if (!cols.find(c => c.name === 'subscription')) {
  db.exec("ALTER TABLE users ADD COLUMN subscription TEXT DEFAULT 'free'");
}

const productCols = db.prepare("PRAGMA table_info(products)").all();
if (!productCols.find(c => c.name === 'tier')) {
  db.exec("ALTER TABLE products ADD COLUMN tier TEXT DEFAULT ''");
}

// Seed users (only if empty)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const adminHash = bcrypt.hashSync('SuperSecretAdmin123!', 10);
  const johnHash = bcrypt.hashSync('john123', 10);
  const flagHash = bcrypt.hashSync('unfindable_password_42!', 10);

  db.prepare('INSERT INTO users (username, password_hash, email, bio, role, balance) VALUES (?, ?, ?, ?, ?, ?)').run(
    'admin', adminHash, 'admin@bananashop.local', 'Compte administrateur', 'admin', 999
  );
  db.prepare('INSERT INTO users (username, password_hash, email, bio, role, balance) VALUES (?, ?, ?, ?, ?, ?)').run(
    'john', johnHash, 'john@example.com', 'Amateur de bananes ordinaire', 'user', 500
  );
  db.prepare('INSERT INTO users (username, password_hash, email, bio, role, balance) VALUES (?, ?, ?, ?, ?, ?)').run(
    'flag_holder', flagHash, 'secret@bananashop.local', FLAGS.IDOR, 'user', 0
  );

  db.prepare('INSERT INTO secrets (key, value) VALUES (?, ?)').run('sqli_flag', FLAGS.SQLI_UNION);

  console.log('Utilisateurs seedés avec succès');
}

// Migrate products to new tier system (20 products, 3 gammes : Organic / Tropical / Artificial)
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
const missingTiers = db.prepare("SELECT COUNT(*) as count FROM products WHERE tier IS NULL OR tier = ''").get().count;

if (productCount < 20 || missingTiers > 0) {
  db.pragma('foreign_keys = OFF');
  db.exec('DELETE FROM reviews');
  db.exec('DELETE FROM products');
  try { db.exec("DELETE FROM sqlite_sequence WHERE name IN ('products', 'reviews')"); } catch {}
  db.pragma('foreign_keys = ON');

  // [nom, description, prix, image_url, stock, tier]
  const allProducts = [
    // --- Organic ---
    [
      'La Banane Bio Certifiée',
      'Cultivée sans pesticides, labellisée AB et idéale pour les puristes du bio. Livrée en vélo électrique par un hipster en salopette.',
      10, '/bananas/organic.svg', 73, 'Organic',
    ],
    [
      'La Banane Grand-Mère',
      "Récoltée dans le jardin de Mémé Paulette, qui pleure à chaque vente. Goût authentique et larmes d'authenticité garanties.",
      8, '/bananas/organic.svg', 12, 'Organic',
    ],
    [
      'La Banane Sauvage de la Forêt',
      "Capturée à mains nues par nos équipes en forêt tropicale dense. Zéro transformation, cent pour cent survie. Elle a mordu un stagiaire.",
      12, '/bananas/organic.svg', 8, 'Organic',
    ],
    [
      'La Banane du Paysan Heureux',
      "Notre agriculteur sifflote en la récoltant. Cette bonne humeur se ressent dans chaque bouchée. Taux de bonheur certifié 94 %.",
      14, '/bananas/organic.svg', 47, 'Organic',
    ],
    [
      'La Banane Millésimée 2023',
      "Cru exceptionnel. Les experts notent des arômes de vanille, de nostalgie et de fin de mois difficile. À carafer 15 minutes avant dégustation.",
      18, '/bananas/organic.svg', 23, 'Organic',
    ],
    [
      'La Banane Zéro Carbone',
      "Neutralité carbone certifiée par un cabinet d'audit qui a pris l'avion pour venir vérifier. Pour manger des bananes sans culpabiliser à la COP.",
      20, '/bananas/organic.svg', 61, 'Organic',
    ],
    [
      'La Banane Sans Gluten',
      "Une banane. Sans gluten. Comme toutes les bananes depuis leur création. Mais celle-là a le certificat officiel encadré au mur.",
      11, '/bananas/organic.svg', 89, 'Organic',
    ],
    // --- Tropical ---
    [
      'La Banane des Tropiques',
      "Importée des meilleures régions tropicales. Douce, sucrée et aromatique comme un coucher de soleil sur une plage qu'on ne peut pas se payer.",
      15, '/bananas/tropical.svg', 54, 'Tropical',
    ],
    [
      "La Banane Hawaïenne du Volcan",
      "Poussée sur des terres volcaniques d'Hawaï. La lave lui donne un caractère de feu et une légère saveur de cendres de touriste.",
      22, '/bananas/tropical.svg', 31, 'Tropical',
    ],
    [
      'La Banane Caraïbes Toute Fraîche',
      "Arrachée à son palmier ce matin même. Elle a encore du sable des Caraïbes entre les orteils et un coup de soleil sur le bout.",
      18, '/bananas/tropical.svg', 67, 'Tropical',
    ],
    [
      "La Banane Malgache de l'Extrême",
      "Venue de Madagascar à dos de zébu sur 300 km de piste. Le voyage lui donne du caractère, beaucoup d'anecdotes et une légère rancœur.",
      25, '/bananas/tropical.svg', 19, 'Tropical',
    ],
    [
      'La Banane Brésilienne Carnivore',
      "Pousse dans la jungle amazonienne, là où même les plantes ont des dents. Déconseillée aux végétariens par principe.",
      30, '/bananas/tropical.svg', 28, 'Tropical',
    ],
    [
      'La Banane Thaï aux Épices',
      "Marinée 48h dans un mélange de piments et citronnelle thaïlandais. Pour les palais aventuriers et les estomacs qui ne craignent rien.",
      20, '/bananas/tropical.svg', 42, 'Tropical',
    ],
    // --- Artificial ---
    [
      'La Banane Argentée 2.0',
      "Version améliorée de la banane classique après 3 ans de R&D. Texture soyeuse, goût optimisé par nos ingénieurs en chef de la banane.",
      35, '/bananas/silver.svg', 37, 'Artificial',
    ],
    [
      "La Banane en Or 24 Carats",
      "Notre best-seller absolu. Riche, fondante, dorée à perfection. Contient quelques particules d'or alimentaire pour impressionner vos invités.",
      50, '/bananas/golden.svg', 24, 'Artificial',
    ],
    [
      'La Banane Quantique Schrödinger',
      "Simultanément mûre et pas mûre avant ouverture du colis. Livrée dans une boîte hermétique. Non, il n'y a pas de chat dedans.",
      75, '/bananas/silver.svg', 7, 'Artificial',
    ],
    [
      'La Banane NFT',
      "JPEG haute résolution d'une banane. Vous ne la mangez pas, vous la possédez sur la blockchain. Valeur en crédits non garantie.",
      999, '/bananas/golden.svg', 3, 'Artificial',
    ],
    [
      "La Banane Spatiale ISS",
      "Cultivée en apesanteur à bord de la Station Spatiale Internationale. Forme légèrement courbée dans un sens inhabituel. Les astronautes la réclament.",
      150, '/bananas/silver.svg', 11, 'Artificial',
    ],
    [
      'La Banane Frankenstein',
      "Créée par nos scientifiques à partir d'ADN de 47 fruits différents. Goût inclassifiable. Le comité d'éthique a préféré ne pas se prononcer.",
      60, '/bananas/golden.svg', 18, 'Artificial',
    ],
    [
      'La Banane Diamant Légendaire',
      "La banane ultime. Dix mille crédits. Seuls les plus audacieux osent y goûter. Les autres se contentent de la regarder depuis leur canapé.",
      10000, '/bananas/diamond.svg', 2, 'Artificial',
    ],
  ];

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, image_url, stock, tier) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const p of allProducts) insertProduct.run(...p);

  console.log('Produits migrés vers le nouveau système de gammes (Organic / Tropical / Artificial)');
}

// Migrate stock values if they haven't been randomized yet
const diamondRow = db.prepare("SELECT stock FROM products WHERE name = 'La Banane Diamant Légendaire'").get();
if (diamondRow && diamondRow.stock !== 2) {
  const stockUpdates = [
    ['La Banane Bio Certifiée', 73],
    ['La Banane Grand-Mère', 12],
    ['La Banane Sauvage de la Forêt', 8],
    ['La Banane du Paysan Heureux', 47],
    ['La Banane Millésimée 2023', 23],
    ['La Banane Zéro Carbone', 61],
    ['La Banane Sans Gluten', 89],
    ['La Banane des Tropiques', 54],
    ["La Banane Hawaïenne du Volcan", 31],
    ['La Banane Caraïbes Toute Fraîche', 67],
    ["La Banane Malgache de l'Extrême", 19],
    ['La Banane Brésilienne Carnivore', 28],
    ['La Banane Thaï aux Épices', 42],
    ['La Banane Argentée 2.0', 37],
    ["La Banane en Or 24 Carats", 24],
    ['La Banane Quantique Schrödinger', 7],
    ['La Banane NFT', 3],
    ["La Banane Spatiale ISS", 11],
    ['La Banane Frankenstein', 18],
    ['La Banane Diamant Légendaire', 2],
  ];
  const updateStock = db.prepare('UPDATE products SET stock = ? WHERE name = ?');
  for (const [name, stock] of stockUpdates) updateStock.run(stock, name);
  console.log('Stocks mis à jour');
}

// Seed reviews (only if empty)
const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
if (reviewCount === 0) {
  const reviewerData = [
    ['marie_dupont', 'marie123', 'marie@example.com', 'Amatrice de bananes depuis 2015', 200],
    ['lucas_b', 'lucas123', 'lucas@example.com', 'Fan de la gamme Artificial', 150],
    ['camille_r', 'camille123', 'camille@example.com', 'Nutritionniste, amatrice du bio', 300],
    ['theo_m', 'theo123', 'theo@example.com', 'Sportif, fan de bananes tropicales', 180],
    ['sophie_l', 'sophie123', 'sophie@example.com', 'Collectionneuse de bananes premium', 250],
  ];

  const insertReviewer = db.prepare(
    'INSERT OR IGNORE INTO users (username, password_hash, email, bio, role, balance) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const [username, password, email, bio, balance] of reviewerData) {
    insertReviewer.run(username, bcrypt.hashSync(password, 10), email, bio, 'user', balance);
  }

  const getUser = (username) => db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  const getProduct = (name) => db.prepare('SELECT id FROM products WHERE name = ?').get(name);
  const insertReview = db.prepare(
    'INSERT INTO reviews (product_id, user_id, content, rating, created_at) VALUES (?, ?, ?, ?, ?)'
  );

  const reviewsToSeed = [
    ['marie_dupont', 'La Banane Bio Certifiée', 5, "Parfaites ! Cueillies à maturité et livrées par un hipster souriant. Je commande toutes les semaines depuis 6 mois.", '2026-04-15 10:23:00'],
    ['camille_r', 'La Banane Bio Certifiée', 5, "En tant que nutritionniste, je recommande sans hésiter la Bio Certifiée. Zéro pesticide, goût authentique, label sérieux.", '2026-04-22 14:05:00'],
    ['theo_m', 'La Banane des Tropiques', 5, "La meilleure banane post-entraînement. Douce, sucrée, parfum incroyable. Le hipster de la livraison a l'air moins convaincu.", '2026-04-28 09:17:00'],
    ['lucas_b', 'La Banane des Tropiques', 4, "Très bonne qualité, légèrement plus chère que prévu mais la différence gustative est réelle.", '2026-05-01 16:44:00'],
    ['sophie_l', 'La Banane Argentée 2.0', 5, "Les ingénieurs ont vraiment bien travaillé sur celle-là. Texture soyeuse, goût irréprochable. Version 3.0 confirmée par le SAV ?", '2026-04-10 11:30:00'],
    ['camille_r', 'La Banane Argentée 2.0', 4, "Excellente qualité. C'est devenu mon choix quotidien, parfait équilibre entre innovation et plaisir.", '2026-05-03 08:12:00'],
    ['marie_dupont', "La Banane en Or 24 Carats", 5, "Mérite amplement son titre de best-seller. Riche, fondante, parfaitement mûre à réception. Les particules d'or passent très bien.", '2026-05-05 13:55:00'],
    ['lucas_b', 'La Banane Diamant Légendaire', 5, "J'ai économisé 3 mois pour me l'offrir. Ça valait absolument chaque crédit. Mon compte est vide mais mon âme est pleine.", '2026-05-08 20:01:00'],
  ];

  for (const [username, productName, rating, content, createdAt] of reviewsToSeed) {
    const user = getUser(username);
    const product = getProduct(productName);
    if (user && product) {
      insertReview.run(product.id, user.id, content, rating, createdAt);
    }
  }

  console.log('Avis seedés avec succès');
}

module.exports = db;
