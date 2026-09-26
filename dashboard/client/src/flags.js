// Re-exports the shared flag metadata so components can just import from here.
// Vite resolves the JSON import natively.
import data from '@shared/flags.json';

export const DIFFICULTY_POINTS = data.DIFFICULTY_POINTS;
export const CATEGORIES = data.CATEGORIES;
export const FLAGS = data.CHALLENGES.filter(c => c.enabled);
export const MAX_SCORE = FLAGS.reduce((s, f) => s + (DIFFICULTY_POINTS[f.difficulty] ?? 0), 0);

// Nom d'énigme (codename) affiché partout sur le dashboard, plutôt que le nom
// technique de la vulnérabilité. Un challenge sans codename garde son nom.
export const flagLabel = (flag) => flag.codename || flag.name;

// Les colonnes sont regroupées par difficulté : c'est elle qui fixe les points.
export const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'];
export const DIFF_TONE = { Facile: 'ok', Moyen: 'accent', Difficile: 'danger' };
