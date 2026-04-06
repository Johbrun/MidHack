// Shared challenge/flag definitions used by both the dashboard and the exploit-server.
// Single source of truth for flag metadata.

const CATEGORIES = {
  authz:     { label: 'Authz & Authn', color: '#a78bfa' },
  injection: { label: 'Injection',     color: '#f87171' },
  misconfig: { label: 'Misconfig',     color: '#38bdf8' },
  other:     { label: 'Autre',         color: '#9ca3af' },
};

const CHALLENGES = [
  // Authz & Authn
  { flagId: 'IDOR',            name: 'Fuite PII',                  points: 10, difficulty: 'Facile',    category: 'authz',     hint: "L'identité est une question de perspective... et de chiffres." },
  { flagId: 'MASS_ASSIGNMENT', name: 'Go admin',                   points: 15, difficulty: 'Moyen',     category: 'authz',     hint: "Certains champs ne devraient pas être modifiables par tous." },
  { flagId: 'JWT_FORGING',     name: 'Go superadmin',              points: 15, difficulty: 'Moyen',     category: 'authz',     hint: "Un sceau facile à reproduire ne protège rien." },
  // Injection
  { flagId: 'REFLECTED_XSS',   name: 'Reflected XSS',              points: 15, difficulty: 'Moyen',     category: 'injection', hint: "Le miroir renvoie tout ce qu'on lui donne." },
  { flagId: 'SQLI',            name: 'SQL Injection (Login Bypass)', points: 15, difficulty: 'Moyen',   category: 'injection', hint: "La porte d'entrée parle une langue que peu maîtrisent." },
  { flagId: 'SQLI_UNION',      name: 'SQL Injection (UNION)',      points: 20, difficulty: 'Difficile', category: 'injection', hint: "Quand une requête en cache une autre." },
  { flagId: 'STORED_XSS',      name: 'Stored XSS',                 points: 20, difficulty: 'Difficile', category: 'injection', hint: "Les mots déposés ici vivent plus longtemps qu'on ne le croit." },
  { flagId: 'SSRF',            name: 'SSRF',                       points: 20, difficulty: 'Difficile', category: 'injection', hint: "Le serveur fait confiance à vos URLs... même les internes." },
  { flagId: 'COOKIE_THEFT',    name: 'Vol de cookie',              points: 20, difficulty: 'Difficile', category: 'injection', hint: "Voler un cookie, c'est voler une identité." },
  // Misconfig
  { flagId: 'DATA_EXPOSURE',   name: 'Sensitive Data Exposure',    points: 10, difficulty: 'Facile',    category: 'misconfig', hint: "Certaines portes n'ont jamais été fermées." },
  { flagId: 'PATH_TRAVERSAL',  name: 'Exploration fichiers',       points: 10, difficulty: 'Facile',    category: 'misconfig', hint: "Les chemins mènent parfois plus loin que prévu." },
  // Autre
  { flagId: 'ZERO_RATING',     name: 'Review nulle',               points: 10, difficulty: 'Facile',    category: 'other',     hint: "Vous n'êtes vraiment pas satisfaits." },
  { flagId: 'BUSINESS_LOGIC',  name: '1000 crédits',               points: 15, difficulty: 'Moyen',     category: 'other',     hint: "Penser les limites du système." },
  { flagId: 'CSRF',            name: 'CSRF',                       points: 15, difficulty: 'Moyen',     category: 'other',     hint: "Quand un autre site agit en votre nom..." },
];

module.exports = { CATEGORIES, CHALLENGES };
