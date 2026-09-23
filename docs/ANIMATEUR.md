# Guide Animateur - MidHack BananaShop CTF

Document réservé aux animateurs. **Ne pas partager avec les participants.**

## Avant l'atelier

### Prérequis techniques

- VPS 2GB RAM + 512MB RAM / équipe
- Docker et Docker Compose  installés
- Un écran/projecteur pour le dashboard live
- Chaque équipe a besoin d'un navigateur + Burp Suite Community installé. inutile d'installer FoxyProxy ou proxy intégré, les participants utiliseront le navigateur intégré à Burp. 

### Installation et lancement

**Toute la configuration se fait dans le fichier `.env`.** Copiez le modèle, ajustez-le, puis déployez :

```bash
# 1. Créer la config à partir du modèle
cp .env.example .env

# 2. Éditer .env (nombre d'équipes, port de départ, titre, pénalité, branding…)
nano .env

# 3. Générer et lancer
./setup.sh deploy
```

`setup.sh` est un script d'**actions** (un argument est obligatoire) :

| Commande | Effet |
|----------|-------|
| `./setup.sh deploy` | Génère `docker-compose.yml` + credentials, puis build & démarre |
| `./setup.sh passwords` | Réaffiche les mots de passe générés (lus depuis `credentials.json`) |
| `./setup.sh reset` | Arrête et supprime conteneurs, volumes et fichiers générés |
| `./setup.sh --help` | Aide complète |

Le déploiement vérifie automatiquement :
- Présence de Docker et Docker Compose
- Que le daemon Docker tourne
- RAM et espace disque suffisants
- Disponibilité des ports nécessaires

Puis génère :
- `docker-compose.yml` avec healthchecks, limites mémoire et volumes persistants
- `credentials.json` — identifiants au format JSON
- `credentials.html` — cartes imprimables à découper (ouvrir dans un navigateur, imprimer)

Le mot de passe admin du dashboard est affiché dans le résumé et sauvegardé dans `credentials.json`.

### Configuration de l'événement

Tous les paramètres se règlent dans le fichier **`.env`** (modèle : `.env.example`). Modifiez-les **avant** `./setup.sh deploy` :

```bash
# ── Équipes ──
TEAMS=4                                  # nombre d'équipes
TEAM_NAMES="Alpha Bravo Charlie Delta"   # noms (le nombre de noms = max d'équipes)

# ── Réseau ──
START_PORT=44001                         # port de départ exposé (allocation contiguë)

# ── Dashboard ──
EVENT_TITLE="BananaShop CTF"             # titre affiché sur le dashboard
HINT_PENALTY=3                           # points retirés par indice

# ── Branding / gameplay (rebuild nécessaire) ──
VITE_NANTES_HACK=1                       # 1 = branding Nantes@Hack activé, 0 = désactivé
VITE_PROGRESSIVE_UNLOCK=false            # true = déblocage progressif des niveaux
VITE_UNLOCK_THRESHOLD=2                  # captures requises par palier
```

> Le `docker-compose.yml` est **auto-généré** à partir du `.env` : ne l'éditez pas à la main. Pour changer un paramètre, modifiez le `.env` puis relancez `./setup.sh deploy`.

### Vérification des services

```bash
# Vérifier que tous les conteneurs sont healthy
docker compose ps
```

| Service | URL | Vérification |
|---------|-----|--------------|
| Dashboard | <http://localhost:5000> | Le tableau de scores s'affiche |
| Site Team N | <http://localhost:300N> | La boutique BananaShop s'affiche |
| Exploit Team N | <http://localhost:400N> | Page de login |

### Mots de passe des serveurs d'exploit

Les mots de passe sont **générés aléatoirement** à chaque exécution de `setup.sh`. Ils sont affichés dans le terminal et sauvegardés dans :
- `credentials.json` — pour un usage programmatique
- `credentials.html` — cartes imprimables à distribuer aux équipes

### Comptes utilisateurs sur le site

| Utilisateur | Mot de passe | Rôle | Notes |
|-------------|-------------|------|-------|
| `admin` | `SuperSecretAdmin123!` | admin | Compte admin principal |
| `john` | `john123` | user | Compte utilisateur standard |
| `flag_holder` | `unfindable_password_42!` | user | Bio contient le flag IDOR |

### Secret JWT

Le secret JWT est `secret-pass-to-change` (chaîne littérale). Il figure dans la wordlist « JWT Secrets » fournie aux participants.

Deux chemins mènent donc au challenge **Go superadmin** :
- **Secret faible** : re-signer un token en `HS256` avec `secret-pass-to-change` et `super_admin: true`
- **`alg: none`** : le serveur accepte volontairement les tokens non signés (`middleware/auth.js`), il suffit de forger l'en-tête et le payload

---

## Vulnérabilités volontaires (et ce qui n'en est pas)

Certains comportements ressemblent à des bugs mais sont **le challenge lui-même**.
Un testeur comme un animateur doit pouvoir trancher sans lire le code.

| Comportement observé | Statut | Challenge concerné |
|----------------------|--------|--------------------|
| `GET /api/users/:id` renvoie le profil et le solde de **n'importe quel** utilisateur | ✅ Volontaire | IDOR — l'absence de contrôle d'accès est la faille à trouver |
| `GET /api/config` expose mot de passe de base et identifiants | ✅ Volontaire | Sensitive Data Exposure |
| `PUT /api/users/:id` accepte `role` depuis le body | ✅ Volontaire | Make Me Admin (mass assignment / élévation de privilège) |
| `PUT /api/users/:id/subscription` facture le `price` envoyé par le client | ✅ Volontaire | Free Premium (parameter tampering) |
| Le formulaire de connexion concatène la saisie dans le SQL | ✅ Volontaire | SQL Injection (Login Bypass) |
| La recherche produits renvoie une **erreur SQL** sur une apostrophe | ✅ Volontaire | SQL Injection (UNION) — le message est le signal de départ |
| Le cookie `token` est lisible par `document.cookie` (pas de `httpOnly`) | ✅ Volontaire | Vol de cookie |
| Le cookie `ctf_secret` accompagne la session | ✅ Volontaire | Vol de cookie — jeton opaque, ce n'est pas le flag |
| `X-Frame-Options: ALLOW`, CSP permissive, `Referrer-Policy: unsafe-url` | ✅ Volontaire | En-têtes mal configurés, support de plusieurs challenges |
| Le panneau admin permet de fixer le solde de n'importe qui | ✅ Volontaire | Conséquence d'un accès admin obtenu — ne valide **aucun** challenge |
| Un rôle inconnu (`tartanpion`) est refusé | ⛔ Bordé | Le mass assignment reste exploitable vers `admin` uniquement |
| `/api/internal/flag` en accès direct depuis le navigateur | ⛔ Bordé | Réservé au loopback : le flag SSRF exige une vraie SSRF via `POST /api/products/<id>/image-url` |
| Un flag obtenu sans l'exploitation attendue | ⛔ Bordé | Chaque flag exige une preuve d'acte (`server/src/award.js`) |

**L'académie n'est pas un corrigé** : ses exemples portent sur une application
fictive (`shop.example`, `/api/members`, `/api/avatars`…). La technique est
enseignée, la transposition vers BananaShop reste l'exercice.

**Deux flags sur la même requête** : impossible par construction. Si deux
conditions se déclenchent, la plus spécifique l'emporte et l'autre challenge
reste à trouver — la décision est tracée dans la table `challenge_events` du
site de l'équipe.

---

## Panel d'administration

Le dashboard dispose d'un panneau d'administration accessible via le bouton **Admin** en haut à droite du scoreboard.

Le mot de passe admin est affiché lors du `setup.sh` et sauvegardé dans `credentials.json`.

### Fonctionnalités du panel admin

| Fonction | Description |
|----------|-------------|
| **Timer** | Démarrer/arrêter un compte à rebours (en minutes) |
| **Annonces** | Envoyer un message en direct à toutes les équipes (toast sur les exploit-servers + scoreboard) |
| **Geler le scoreboard** | Le classement public ne se met plus à jour et les fronts des équipes se verrouillent. Les flags soumis pendant le gel sont **mis en file d'attente** et comptabilisés au dégel (suspense pour les dernières minutes) |
| **Dégeler le scoreboard** | Révéler le classement final |
| **Réinitialiser les scores** | Remet tous les scores à zéro |
| **Export JSON/CSV** | Télécharger les résultats complets |

---

## Déroulement de l'atelier (2h)

### Phase 1 - Introduction (15 min)

1. Présenter le contexte : sécurité offensive, OWASP Top 10
2. Montrer les outils : DevTools, Burp Suite, extension JWT de Burp
3. Distribuer les cartes d'accès imprimées (`credentials.html`) à chaque équipe
4. Demander aux équipes de **se connecter sur leur Hacking QG** — la modale d'onboarding s'affiche automatiquement et les guide à travers l'installation de Burp, un premier exercice d'interception, et la saisie du flag de démarrage qui déverrouille l'interface
5. Expliquer les règles :
   - Chaque flag trouvé rapporte des points
   - Les indices coûtent -3 pts (configurable)
   - **First Blood** : +5 pts bonus pour la première équipe à capturer un flag
   - Si `VITE_PROGRESSIVE_UNLOCK=true` : les challenges se déverrouillent progressivement (2 Faciles → Moyens, 2 Moyens → Difficiles)
6. **Lancer le timer** depuis le panel admin du dashboard

### Phase 2 - CTF libre (1h30)

- Les équipes exploitent les vulnérabilités à leur rythme
- Le dashboard projète le scoreboard en temps réel.
- Les participants peuvent consulter l'Académie dans leur serveur d'exploit
- Circuler entre les équipes pour débloquer si besoin (donner des indices oraux)
- Le dashboard indique si une équipe n'a pas trouvé de flag depuis 10 minutes. C'est un bon indicateur pour aller les aider. 
- Utiliser les **annonces** pour donner des indices globaux ou marquer les étapes ("Plus que 30 min !")
- **Geler le scoreboard** 15 minutes avant la fin pour maintenir le suspense

### Phase 3 - Debrief (15 min)

- **Dégeler le scoreboard** pour la révélation du classement final (les captures mises en file pendant le gel sont rejouées à ce moment-là)
- Walkthrough de chaque vulnérabilité avec les participants
- Montrer le code vulnérable vs. le code corrigé via le bouton **Fix-It** sur la page Challenges (disponible pour chaque flag capturé)
- Discuter des remédiations et bonnes pratiques

### Phase 4 - Démo CSRF en live (5-10 min)

Terminer l'atelier par une démonstration concrète d'attaque CSRF pour marquer les esprits.

1. **Préparer la démo** : sur le serveur d'exploit d'une équipe, créer une page HTML piégée contenant un formulaire caché qui effectue un transfert de crédits :

   ```html
   <h1>🎁 Vous avez gagné des bananes gratuites !</h1>
   <form id="csrf" action="http://localhost:44002/api/credits/send" method="POST">
     <input type="hidden" name="recipientUsername" value="admin" />
     <input type="hidden" name="amount" value="500" />
   </form>
   <script>document.getElementById('csrf').submit();</script>
   ```

   > ⚠️ Deux détails qui font échouer la démo si on les rate :
   > - le champ s'appelle **`recipientUsername`** (un nom d'utilisateur), pas un id ;
   > - l'`action` doit pointer sur **l'URL du BananaShop de l'équipe** (`START_PORT + 2N − 1`, ex. `http://localhost:44002`), servie depuis le **même hôte** que la page piégée. Les cookies sont en `SameSite=Lax` : ils ne partent sur un POST que si la page piégée est *same-site* (même domaine, le port n'entre pas en compte). Héberger la page ailleurs (fichier local `file://`, autre domaine) fait échouer la démo pour une raison qui n'a rien à voir avec le CSRF.

2. **Scénario** : se connecter en tant que `john` sur le site BananaShop, puis ouvrir la page piégée dans un autre onglet du même navigateur
3. **Résultat** : montrer que le transfert s'exécute sans aucune action de la victime, car le cookie de session est envoyé automatiquement et aucun token CSRF ne protège l'endpoint
4. **Leçon** : expliquer les protections (token CSRF synchronisé, attribut `SameSite` sur les cookies, vérification de l'en-tête `Origin`/`Referer`)

---

## Nouvelles fonctionnalités pour les participants

### Déverrouillage progressif des challenges

Activé via `VITE_PROGRESSIVE_UNLOCK=true` dans le `.env` (désactivé par défaut). Quand actif, les challenges ne sont pas tous visibles dès le départ :
- **Facile** : toujours visibles
- **Moyen** : se débloquent après avoir capturé 2 flags Faciles
- **Difficile** : se débloquent après avoir capturé 2 flags Moyens

Les challenges verrouillés apparaissent en grisé avec "???".

### Orientation gratuite puis indice payant

Deux niveaux d'aide : l'**orientation** (🧭) dit *où* chercher, ne coûte rien et
n'est pas diffusée au classement ; elle s'ouvre après `VITE_NUDGE_DELAY_MIN`
minutes sans nouvelle capture. L'**indice** (💡) donne la technique, coûte
`HINT_PENALTY` points et reste visible de toutes les équipes.

### Chemins d'exploitation (panel admin)

Le panel admin liste ce que les équipes ont réellement fait : flag délivré, flag
retenu (un autre était déjà tombé sur la requête), challenge verrouillé par ses
prérequis, effet de bord, technique employée au mauvais endroit. C'est l'outil
pour repérer une validation non prévue **pendant** l'atelier.

Il signale aussi les **redémarrages de services** : un conteneur qui redémarre
se voit sans ouvrir les logs Docker.

### Réinitialiser une seule équipe

```bash
./setup.sh reset-team Alpha   # base du site recréée + webhook vidé, score conservé
```

### Mode Fix-It

Après avoir capturé un flag, un bouton **🔧 Fix-It** apparaît sur la page Challenges. Il ouvre une modale avec :
- La description du danger
- La correction recommandée
- La référence OWASP
- Un diff side-by-side du code vulnérable vs. corrigé

### Mots de passe des phases défensives

Certaines pages du Hacking QG révèlent les failles (code vulnérable, correctifs, modélisation) : elles restent masquées derrière un mot de passe que **l'animateur communique au moment d'ouvrir la phase**, pour ne pas divulguer les solutions pendant le CTF offensif.

| Page | Mot de passe |
| --- | --- |
| **Blue Team** (choisir le bon correctif) | `banana` |
| **Threat Model** (STRIDE à rebours) | `diamant` |

La saisie est insensible à la casse et l'état est mémorisé en `localStorage` par navigateur.

### First Blood

La première équipe à capturer un flag spécifique reçoit un bonus de **+5 points**. Un toast rouge "FIRST BLOOD" s'affiche sur le scoreboard projeté.

### Confetti

Une animation confetti se déclenche à chaque soumission de flag réussie pour récompenser visuellement les participants.

---

## Réinitialisation

### Reset complet (recommandé)

```bash
# Supprime conteneurs, volumes et fichiers générés
./setup.sh reset

# Puis relancer (selon le .env)
./setup.sh deploy
```

### Réinitialiser une équipe (base de données)

Chaque équipe a sa propre base de données SQLite. Pour réinitialiser :

```bash
docker compose exec site-team1 rm /app/server/banana_shop.db
docker compose restart site-team1
```

La base sera recréée automatiquement au démarrage avec les données initiales.

### Réinitialiser le scoreboard

Utiliser le bouton **Réinitialiser les scores** dans le panel admin, ou :

```bash
docker compose exec dashboard rm /app/dashboard/data/scoreboard.json
docker compose restart dashboard
```

### Données persistantes

Les données suivantes survivent à un `docker compose restart` grâce aux volumes Docker :
- `dashboard-data` : scoreboard
- `exploit-teamN-data` : logs webhook par équipe

Un `docker compose down -v` ou `./setup.sh reset` supprime ces volumes.

### Réinitialisation en développement local

```bash
rm server/banana_shop.db
rm dashboard/data/scoreboard.json
npm run dev
```

---

## Problèmes courants

| Problème | Solution |
|----------|----------|
| Le dashboard n'affiche pas les équipes | Les équipes s'enregistrent au démarrage de leur exploit-server. Vérifier que les conteneurs exploit sont lancés (`docker compose ps`) |
| Un conteneur n'est pas "healthy" | `docker compose logs <service>` pour diagnostiquer. Les healthchecks utilisent `wget` sur les endpoints principaux |
| Une équipe ne peut plus se connecter | Réinitialiser la base de données de l'équipe (voir section Réinitialisation) |
| Le timer ne se lance pas | Utiliser le panel admin (bouton Admin sur le dashboard) ou vérifier le mot de passe admin |
| Les flags ne sont pas validés | Vérifier la connexion entre exploit-server et dashboard (réseau Docker) |
| Les annonces ne s'affichent pas chez les équipes | Vérifier que l'exploit-server est connecté au WebSocket du dashboard (voir les logs) |
| Port déjà utilisé | Changer `START_PORT` dans `.env`, ou `./setup.sh reset` puis relancer |
| Mots de passe perdus | `./setup.sh passwords` (ou consulter `credentials.json`). ⚠️ `./setup.sh deploy` régénère de nouveaux mots de passe |
| Données perdues après redémarrage | Les volumes Docker persistent les données. Un `docker compose down -v` les supprime |
