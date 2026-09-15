// Canal des messages d'orientation du serveur.
//
// L'intercepteur axios n'est pas un composant React : il publie ici, et la
// bannière s'y abonne.
const listeners = new Set();
let lastMessage = null;

export function showNudge(message) {
  // Le serveur limite déjà la fréquence ; on évite juste le doublon immédiat.
  if (message === lastMessage) return;
  lastMessage = message;
  for (const listener of listeners) listener(message);
}

export function onNudge(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
