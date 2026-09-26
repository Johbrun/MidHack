// Déverrouillage de démarrage, commun au BananaShop et au Hacking QG : le flag
// du tutoriel Burp ouvre les deux interfaces, et l'état est mémorisé sous la
// même clé (en dev, les deux fronts partagent l'hôte).
export const UNLOCK_FLAG = 'BANANES';

const STORAGE_KEY = 'midhack_unlocked';

// Mode DEV (VITE_DEV_MODE=true dans le .env) : l'interface est déverrouillée
// d'office, sans refaire l'exercice Burp.
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export function isUnlockedAtStart() {
  return DEV_MODE || localStorage.getItem(STORAGE_KEY) === 'true';
}

export function rememberUnlocked() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function isUnlockFlag(value) {
  return value.trim() === UNLOCK_FLAG;
}
