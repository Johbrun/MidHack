# MidHack - BananaShop CTF

BananaCTF est une plateforme CTF  pour un atelier d'initiation à la sécurité offensive. 

Elle contient principalement une application e-commerce **volontairement vulnérable** où les participants doivent découvrir et exploiter des failles de sécurité pour capturer des flags.

## Concept

La plateforme se décompose en **trois parties** :

1. **Le site BananaShop** - une application e-commerce React + Express contenant une dizaine vulnérabilités à exploiter pour tous niveaux débutants / intermédiaires
2. **Le serveur d'exploit** - un espace par équipe avec webhook, outils d'exploitation et soumission de flags
3. **Le dashboard live** - un tableau de scores en temps réel (WebSocket) à projeter, affichant la progression de chaque équipe

Une **mini-académie** intégrée au serveur d'exploit propose des slides interactives couvrant les phases du pentest et chaque type de vulnérabilité (explication, détection, exemples de code, remédiation).

Un **parcours d'onboarding guidé** s'affiche automatiquement à la première connexion sur le Hacking QG et sur le site BananaShop, pour s'assurer que les participants lisent les instructions et comprennent l'utilisation de Burp Suite avant de commencer.


## TL;DR

```bash
# with docker (to test)
cp .env.example .env     # config de l'événement (équipes, ports, titre…)
./setup.sh deploy        # génère docker-compose.yml + credentials, build & démarre
./setup.sh passwords     # réaffiche les mots de passe des équipes
docker compose logs -f   # suivre les logs
./setup.sh reset         # tout arrêter et nettoyer

# without docker (to dev)
cp .env.example .env     # config locale
npm run install:all      # dépendances des 4 services
npm run dev              # site :5173 · dashboard :5174 · hacking QG :5175
npm test                 # vérifie chaque challenge
```

## Documentation

Toute la documentation se trouve dans le dossier [docs/](docs/) :

| Document | Public | Contenu |
| -------- | ------ | ------- |
| [ANIMATEUR.md](docs/ANIMATEUR.md) | Animateurs | Setup, déroulement de l'atelier, comptes et secrets, panel admin |
| [DEV.md](docs/DEV.md) | Développeurs | Architecture, stack, API, variables d'environnement, Docker, ajout d'un challenge |
| [INSTALLATION-BURP.md](docs/INSTALLATION-BURP.md) | Participants | Installation et configuration de Burp Suite |
| [SOLUTIONS.md](docs/SOLUTIONS.md) | Animateurs | Solution de chaque challenge et flags (⚠️ spoilers, à ne pas partager avec les participants) |

## Démarrage

### Docker (recommandé - setup multi-équipes)

Prérequis sur la machine cible : `git`, `docker` et `docker compose`.

```bash
git clone <url-du-repo> midhack
cd midhack
cp .env.example .env   # créer la config, puis l'éditer (nombre d'équipes, ports, titre…)
./setup.sh deploy      # génère docker-compose.yml + credentials, build & démarre
```

**Toute la configuration de l'événement se fait dans le fichier `.env`** : 

```bash
# Équipes 
TEAMS=4
TEAM_NAMES="Alpha Bravo Charlie Delta"

# Réseau
START_PORT=44001

# Dashboard / événement 
EVENT_TITLE="Nantes@Hack CTF"   # Titre affiché sur le dashboard
HINT_PENALTY=5                  # Points retirés par indice utilisé

# Build frontend (préfixe VITE_ obligatoire) 
VITE_NANTES_HACK=1              # 1 = branding Nantes@Hack activé, 0 = désactivé

VITE_DEV_MODE=true
```

Les ports exposés sont attribués de façon contiguë à partir de `START_PORT` (défaut `44001`, configurable dans `.env`) :

| Service        | Port exposé             |
| -------------- | ----------------------- |
| Dashboard live | `START_PORT`  |
| Site Team N    | `START_PORT + 2N − 1`   |
| Exploit Team N | `START_PORT + 2N`       |

Pensez à ouvrir ces ports dans le firewall du serveur.

Les URLs et mots de passe effectifs de chaque équipe sont écrits dans `credentials.json` / `credentials.html` à la génération.

**Arrêter / nettoyer** :

```bash
docker compose down          # arrête les containers
./setup.sh reset             # arrête + supprime volumes et fichiers générés (reset complet)
```

**Mettre à jour** après un `git pull` :

```bash
./setup.sh reset     
./setup.sh deploy            # régénère le docker-compose.yml et relance
```

### Développement local

```bash
npm run install:all
npm run dev # Lance les 4 services simultanément via `concurrently`
```

**Mode DEV** : avec `VITE_DEV_MODE=true` dans le `.env`, la modale d'onboarding du BananaShop et le verrou de la page Challenges du Hacking QG sont levés : l'interface est déverrouillée d'office, sans avoir à refaire l'exercice Burp ni à saisir le flag de démarrage. 

Ce mode ne concerne que `npm run dev` : la variable n'est jamais transmise aux images Docker, un `./setup.sh deploy` affiche donc toujours l'onboarding. 

Relancez `npm run dev` après avoir modifié la valeur.

## Architecture

```text
midhack/
├── client/          # Frontend React + Vite + Tailwind CSS
├── server/          # API Express.js + SQLite (vulnérabilités)
├── exploit-server/  # Serveur d'équipe : webhook, académie, outils
├── dashboard/       # Scoreboard live WebSocket (à projeter)
└── docker-compose.yml
```

- **server/** - API Express.js + SQLite
- **client/** - SPA React + Tailwind
- **exploit-server/** - Webhook receiver, mini-académie, soumission de flags (Express.js + WebSocket `ws`, front React + Vite + Tailwind CSS, export PDF via pdfmake)
- **dashboard/** - Tableau de scores temps réel via WebSocket, persistance JSON (Express.js + WebSocket `ws`, front React + Vite + Tailwind CSS)

## Autour du CTF

## Public 

Due à la facilité des vulnérabilités, Cette plateforme se classerait dans un niveau facile / moyen, dans les CTF traditionnels. Cette plateforme est utilisée en particulier pour des développeurs ou des étudiants en cyber.

### Guide animateur

Bien que l'application puisse être utilisée par une personne seule, il est fortement conseillé d'utiliser la plateforme avec un public en équipe et un animateur maitrisant la plateforme.

Voir [docs/ANIMATEUR.md](docs/ANIMATEUR.md) pour les instructions de setup, le déroulement de l'atelier, les comptes et secrets, et la gestion du panel admin.

### Pages protégées du Hacking QG

Certaines pages du Hacking QG révèlent le code vulnérable, donc la solution des challenges. Elles restent masquées jusqu'à la saisie d'un mot de passe fixe, que l'animateur donne au moment d'ouvrir l'exercice :

| Page              | Chemin         | Mot de passe |
| ----------------- | -------------- | ------------ |
| Pick the line   | `/code-review` | `line`       |
| Blue Team         | `/blue`        | `banana`     |
| Kill Chain        | `/kill-chain`  | `kill`       |

### Vulnérabilités

<!-- Tableau généré depuis shared/flags.json + server/src/flags.js (owasp) : ne pas éditer à la main, lancer `npm run docs`. -->
<!-- GEN:vuln-table -->
| # | Vulnérabilité | Codename | Catégorie OWASP | Difficulté | Points | Actif |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | IDOR | Not Your Profile | A01:2021 - Broken Access Control | Facile | 10 | ✅ |
| 2 | Sensitive Data Exposure | Hidden Endpoint | A05:2021 - Security Misconfiguration | Facile | 10 | ✅ |
| 3 | Path Traversal | Dot Dot Slash | A01:2021 - Broken Access Control | Facile | 10 | ✅ |
| 4 | Broken Function Level Auth | Very bad review | A04:2021 - Insecure Design | Facile | 10 | ✅ |
| 5 | Reflected XSS | Mirror Search | A03:2021 - Injection (XSS) | Facile | 10 | ✅ |
| 6 | Parameter Tampering | Free Premium | A04:2021 - Insecure Design | Moyen | 15 | ✅ |
| 7 | Privilege Escalation | Make Me Admin | A01:2021 - Broken Access Control | Facile | 10 | ✅ |
| 8 | JWT Forging | Forge n' Sign the Token | A02:2021 - Cryptographic Failures | Moyen | 15 | ✅ |
| 9 | SQL Injection (Auth Bypass) | Login Without a Password | A03:2021 - Injection | Moyen | 15 | ✅ |
| 10 | Business Logic Flaw | Incorrect Transfer | A04:2021 - Insecure Design | Facile | 10 | ✅ |
| 11 | CSRF | Click and Pay | A01:2021 - Broken Access Control | Moyen | 15 | ❌ |
| 12 | SQL Injection (UNION) | Union of Secrets | A03:2021 - Injection | Difficile | 20 | ✅ |
| 13 | Stored XSS | Eternal Message | A03:2021 - Injection (XSS) | Moyen | 15 | ✅ |
| 14 | SSRF | Ask the Server | A10:2021 - Server-Side Request Forgery | Moyen | 15 | ✅ |
| 15 | Session Hijacking | Steal the Cookie | A03:2021 - Injection (XSS) + A07:2021 - Auth Failures | Difficile | 20 | ✅ |
<!-- /GEN:vuln-table -->

## Tests

```bash
npm test     # vérifie chaque challenge : chemin prévu ET absence de chemin non prévu
```

## Scoring

- Chaque flag rapporte des points selon sa difficulté (<!-- GEN:points-slash -->Facile=10 / Moyen=15 / Difficile=20<!-- /GEN:points-slash -->)
- Une **orientation** (où chercher) est gratuite et s'ouvre après quelques minutes sans capture (`VITE_NUDGE_DELAY_MIN`)
- Un **indice** coûte des points (configurable via `HINT_PENALTY` dans le `.env`, défaut : 3)
- En cas d'égalité : nombre de flags > temps de première capture

## Onboarding des participants

Sur le Hacking QG, seule la page **Challenges** est verrouillée : tant que le flag de démarrage n'a pas été soumis, elle affiche un tutoriel en 5 étapes à la place des challenges. Le BananaShop garde sa modale bloquante. Les étapes :

1. **Présentation** — introduction à l'onboarding et à l'outil Burp Suite
2. **Guide Burp** — lien vers le guide d'installation (`/installation-burp.html`)
3. **Exercice Burp** — envoyer une requête et la retrouver dans l'historique HTTP pour la rejouer dans le Repeater avec la bonne valeur, ce qui révèle le flag de démarrage
4. **Déroulement du CTF** — process de recherche de vulnérabilités suggéré
5. **Flag** — soumission du flag de démarrage, directement dans le tutoriel, pour déverrouiller les challenges

Le flag de démarrage est renvoyé par la route `POST /hello-my-flag` lorsque le participant envoie la bonne valeur dans le corps de la requête (exercice guidé à l'étape 03). Une fois le flag soumis, la page Challenges du QG se déverrouille (le flag ne rapporte pas de points) et le BananaShop s'ouvre déjà déverrouillé. L'état est persisté en `localStorage`. En développement local, `VITE_DEV_MODE=true` lève ce verrou (voir [Développement local](#développement-local)).

## Déroulement suggéré (2h)

| Durée | Activité |
|-------|----------|
| 0:00 - 0:15 | Intro OWASP Top 10 + outils (DevTools, Burp Suite) |
| 0:15 - 1:45 | CTF libre - les équipes exploitent les vulnérabilités |
| 1:45 - 2:00 | Debrief - walkthrough de chaque vuln + remédiations |

## Outils pour les participants

- **Burp Suite Community** pour intercepter et forger des requêtes HTTP (voir [le guide d'installation](docs/INSTALLATION-BURP.md))
- L'extension **JWT** de Burp Suite pour décoder et modifier des tokens JWT
- L'onglet **Académie** du serveur d'exploit pour apprendre les techniques

## Licence

Ce projet — code source, documentation et supports pédagogiques — est distribué sous licence **[Creative Commons Attribution - Pas d'Utilisation Commerciale - Partage dans les Mêmes Conditions 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr)**.

Vous êtes libre de **partager**, **réutiliser** et **modifier** ce travail, à condition de :

- **Attribution (BY)** — créditer l'auteur d'origine et indiquer la provenance ;
- **Pas d'Utilisation Commerciale (NC)** — ne pas en faire un usage commercial ;
- **Partage dans les Mêmes Conditions (SA)** — distribuer toute version dérivée sous cette même licence.

Texte légal complet : voir le fichier [LICENSE](LICENSE).

---

Conçu par Johan BRUN

Utilisé dans le cadre des initations à la sécurité offensive de l'association [Nantes@Hack](https://www.meetup.com/nantesathack/).
