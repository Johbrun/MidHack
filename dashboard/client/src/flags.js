// Re-exports the shared flag metadata so components can just import from here.
// Vite resolves the JSON import natively.
import data from '../../../shared/flags.json';

export const DIFFICULTY_POINTS = data.DIFFICULTY_POINTS;
export const CATEGORIES = data.CATEGORIES;
export const FLAGS = data.CHALLENGES.filter(c => c.enabled);
export const MAX_SCORE = FLAGS.reduce((s, f) => s + (DIFFICULTY_POINTS[f.difficulty] ?? 0), 0);
export const HINT_PENALTY = 3;
