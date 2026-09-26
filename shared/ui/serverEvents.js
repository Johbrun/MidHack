import { useEffect, useRef, useState } from 'react';

// Flux SSE `/events` du BananaShop et du Hacking QG : annonces de l'animateur,
// gel du CTF et (côté QG) requêtes reçues sur le webhook.
//
// Chaque composant ouvrait jusqu'ici son propre EventSource. Or un navigateur
// en HTTP/1.1 plafonne à 6 connexions par hôte : dès deux ou trois onglets, les
// `fetch` de l'application restaient bloqués derrière les flux ouverts. Une
// seule connexion est donc partagée par onglet, ouverte au premier abonné et
// fermée au départ du dernier.

const listeners = new Set();
let source = null;

function dispatch(e) {
  let data;
  try {
    data = JSON.parse(e.data);
  } catch {
    return;
  }
  for (const listener of listeners) listener(data);
}

function subscribe(listener) {
  listeners.add(listener);
  if (!source) {
    source = new EventSource('/events');
    source.onmessage = dispatch;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && source) {
      source.close();
      source = null;
    }
  };
}

// Appelle `handler(data)` pour chaque événement du flux. Le handler le plus
// récent est toujours utilisé, sans rouvrir d'abonnement à chaque rendu.
export function useServerEvents(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe((data) => ref.current(data)), []);
}

// État du gel du CTF, poussé à la connexion puis à chaque changement.
export function useFrozen() {
  const [frozen, setFrozen] = useState(false);
  useServerEvents((data) => {
    if (data.type === 'freeze') setFrozen(!!data.frozen);
  });
  return frozen;
}

// Annonces de l'animateur reçues depuis l'ouverture de la page.
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  useServerEvents((data) => {
    if (data.type === 'announcement') {
      setAnnouncements((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, message: data.message }]);
    }
  });
  const dismiss = (id) => setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  return [announcements, dismiss];
}
