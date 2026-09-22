// Re-exports the shared flag metadata so components can just import from here.
// Vite resolves the JSON import natively.
import data from '../../../shared/flags.json';

export const DIFFICULTY_POINTS = data.DIFFICULTY_POINTS;
export const CATEGORIES = data.CATEGORIES;
export const FLAGS = data.CHALLENGES.filter(c => c.enabled);
export const MAX_SCORE = FLAGS.reduce((s, f) => s + (DIFFICULTY_POINTS[f.difficulty] ?? 0), 0);

// Libellés courts des colonnes du tableau : projetés, les noms complets
// débordent sur trois ou quatre lignes. Un challenge absent de cette table
// retombe sur son nom complet.
const SHORT_NAMES = {
  IDOR: 'IDOR',
  DATA_EXPOSURE: 'Data Exposure',
  PATH_TRAVERSAL: 'Path Traversal',
  ZERO_RATING: 'BFLA',
  REFLECTED_XSS: 'Reflected XSS',
  MASS_ASSIGNMENT: 'Mass Assign.',
  PRIV_ESC_ROLE: 'Priv Esc',
  JWT_FORGING: 'JWT Forging',
  SQLI: 'SQLi Auth',
  BUSINESS_LOGIC: 'Logic Flaw',
  CSRF: 'CSRF',
  SQLI_UNION: 'SQLi UNION',
  STORED_XSS: 'Stored XSS',
  SSRF: 'SSRF',
  COOKIE_THEFT: 'Session Hijacking',
};

export const shortName = (flag) => SHORT_NAMES[flag.flagId] ?? flag.name;

// Les colonnes sont regroupées par difficulté : c'est elle qui fixe les points.
export const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'];
export const DIFF_TONE = { Facile: 'ok', Moyen: 'accent', Difficile: 'danger' };
