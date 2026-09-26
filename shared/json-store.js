// Persistance JSON partagée par le dashboard et le Hacking QG.
//
// Écrire le fichier en place laissait un JSON tronqué si le process mourait
// pendant l'écriture (OOM, docker kill, coupure) ; au redémarrage, la lecture
// échouait et l'état repartait de zéro sans un mot : le classement était perdu.
// On écrit donc dans un fichier temporaire, on le synchronise sur disque, puis
// on le renomme — `rename` est atomique : le fichier cible est soit l'ancien,
// soit le nouveau, jamais un mélange.
//
// Aucune dépendance npm ici : le module est chargé depuis /app/shared dans les
// images, où aucun node_modules n'est résolvable.
const fs = require('fs');
const path = require('path');

function writeJsonAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, JSON.stringify(data, null, 2));
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}

// Lit un fichier JSON. Absent → `fallback`. Illisible ou de forme inattendue →
// le fichier est mis de côté (`<fichier>.corrupt-<date>`) plutôt qu'écrasé à la
// prochaine sauvegarde, pour que l'animateur puisse encore récupérer les données
// à la main, et l'incident est journalisé au lieu d'être avalé.
function readJson(file, { fallback, validate } = {}) {
  if (!fs.existsSync(file)) return fallback;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (validate && !validate(data)) throw new Error('forme inattendue');
    return data;
  } catch (err) {
    const aside = `${file}.corrupt-${Date.now()}`;
    try {
      fs.renameSync(file, aside);
    } catch {
      /* au pire, le fichier sera écrasé à la prochaine sauvegarde */
    }
    console.error(`${path.basename(file)} illisible (${err.message}) : mis de côté dans ${aside}, démarrage à vide`);
    return fallback;
  }
}

module.exports = { writeJsonAtomic, readJson };
