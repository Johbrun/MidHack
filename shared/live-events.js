// Flux temps réel des navigateurs, commun au BananaShop et au Hacking QG.
//
// Chaque service expose un endpoint SSE `/events` et relaie vers ses clients
// deux événements du dashboard central : les annonces de l'animateur et le gel
// du CTF. Ce code existait en deux copies (server/ et exploit-server/).
//
// Aucune dépendance npm ici (le module est chargé depuis /app/shared dans les
// images, où aucun node_modules n'est résolvable) : le constructeur WebSocket
// est donc fourni par l'appelant.

const HEARTBEAT_MS = 25000;
const RECONNECT_MS = 5000;

function createSseHub() {
  const clients = new Set();
  let frozen = false;

  const send = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Un commentaire SSE régulier empêche un proxy (ou Burp) de couper une
  // connexion restée muette, et révèle au passage les sockets morts.
  const heartbeat = setInterval(() => {
    for (const res of clients) res.write(': ping\n\n');
  }, HEARTBEAT_MS);
  heartbeat.unref?.();

  function broadcast(data) {
    for (const res of clients) send(res, data);
  }

  return {
    handler(req, res) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      // L'état du gel part tout de suite : une page chargée pendant le gel se
      // verrouille sans attendre le prochain événement.
      send(res, { type: 'freeze', frozen });
      clients.add(res);
      req.on('close', () => clients.delete(res));
    },
    broadcast,
    get frozen() {
      return frozen;
    },
    setFrozen(value) {
      frozen = !!value;
      broadcast({ type: 'freeze', frozen });
    },
  };
}

// Écoute le WebSocket du dashboard et relaie annonces et gel vers le hub.
// Reconnexion automatique : le dashboard peut démarrer après le service.
function relayDashboardEvents({ WebSocket, dashboardUrl, hub }) {
  const url = dashboardUrl.replace(/^http/, 'ws') + '/ws';

  function connect() {
    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      setTimeout(connect, RECONNECT_MS);
      return;
    }
    ws.on('message', (raw) => {
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }
      if (data.type === 'announcement') {
        hub.broadcast({ type: 'announcement', message: data.message });
      } else if (data.type === 'freeze') {
        hub.setFrozen(data.frozen);
      } else if (data.type === 'scoreboard' && typeof data.frozen === 'boolean' && data.frozen !== hub.frozen) {
        // L'instantané envoyé à la connexion porte l'état du gel : un dégel
        // survenu pendant une coupure du WebSocket est ainsi rattrapé.
        hub.setFrozen(data.frozen);
      }
    });
    ws.on('close', () => setTimeout(connect, RECONNECT_MS));
    ws.on('error', () => {});
  }

  connect();
}

module.exports = { createSseHub, relayDashboardEvents };
