# MidHack - BananaShop CTF

BananaCTF est une plateforme CTF  pour un atelier d'initiation à la sécurité offensive. Elle contient principalement une application e-commerce **volontairement vulnérable** où les participants doivent découvrir et exploiter des failles de sécurité pour capturer des flags.

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

## Public 

Due à la facilité des vulnérabilités, Cette plateforme se classerait dans un niveau facile / moyen, dans les CTF traditionnels. Cette plateforme est utilisée en particulier pour des développeurs ou des étudiants en cyber.

## Guide animateur

Bien que l'application puisse être utilisée par une personne seule, il est fortement conseillé d'utiliser la plateforme avec un public en équipe et un animateur maitrisant la plateforme.

Voir [docs/ANIMATEUR.md](docs/ANIMATEUR.md) pour les instructions de setup, le déroulement de l'atelier, les comptes et secrets, et la gestion du panel admin.

### Pages protégées du Hacking QG

Certaines pages du Hacking QG révèlent le code vulnérable, donc la solution des challenges. Elles restent masquées jusqu'à la saisie d'un mot de passe fixe, que l'animateur donne au moment d'ouvrir l'exercice :

| Page              | Chemin         | Mot de passe |
| ----------------- | -------------- | ------------ |
| Trouve la ligne   | `/code-review` | `line`       |
| Blue Team         | `/blue`        | `banana`     |
| Kill Chain        | `/kill-chain`  | `kill`       |

## Aperçu

### Application vulnérable

![BananaShop - Site e-commerce](1.png)

### Tableau de classement temps réel

![Dashboard live - Classement en direct](2.png)

## Quick Start

### Docker (recommandé - setup multi-équipes)

Prérequis sur la machine cible : `git`, `docker` et `docker compose` (plugin officiel).

```bash
git clone <url-du-repo> midhack
cd midhack
cp .env.example .env   # créer la config, puis l'éditer (nombre d'équipes, ports, titre…)
./setup.sh deploy      # génère docker-compose.yml + credentials, build & démarre
```

**Toute la configuration de l'événement se fait dans le fichier `.env`** : 
- nombre d'équipes (`TEAMS`)
- noms (`TEAM_NAMES`)
- port de départ (`START_PORT`)
- titre (`EVENT_TITLE`)
- pénalité d'indice (`HINT_PENALTY`)
- branding (`VITE_NANTES_HACK`)… 

Le script `setup.sh` ne fait que des **actions** : 
- `deploy`
- `passwords`
- `reset` (voir `./setup.sh --help`). Il lit le `.env` et génère le `docker-compose.yml` en conséquence.

Autre : 
- Vérifier l'état des conteneurs avec `docker compose ps` 
- Suivre les logs avec `docker compose logs -f`.

Les ports exposés sont attribués de façon contiguë à partir de `START_PORT` (défaut `44001`, configurable dans `.env`) :

| Service        | Port exposé             |
| -------------- | ----------------------- |
| Dashboard live | `START_PORT` (ex 44001) |
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

**Mode DEV** : avec `VITE_DEV_MODE=true` dans le `.env`, la modale d'onboarding bloquante n'est plus affichée sur le BananaShop ni sur le Hacking QG — l'interface est déverrouillée d'office, sans avoir à refaire l'exercice Burp ni à saisir le flag de démarrage. Ce mode ne concerne que `npm run dev` : la variable n'est jamais transmise aux images Docker, un `./setup.sh deploy` affiche donc toujours l'onboarding. Relancez `npm run dev` après avoir modifié la valeur.

## Architecture

```text
midhack/
├── client/          # Frontend React + Vite + Tailwind CSS
├── server/          # API Express.js + SQLite (vulnérabilités)
├── exploit-server/  # Serveur d'équipe : webhook, académie, outils
├── dashboard/       # Scoreboard live WebSocket (à projeter)
└── docker-compose.yml
```

- **server/** - API Express.js + SQLite, contient les vulnérabilités
- **client/** - SPA React avec Vite et Tailwind CSS
- **exploit-server/** - Webhook receiver, mini-académie, générateur CSRF, soumission de flags
- **dashboard/** - Tableau de scores temps réel via WebSocket, persistance JSON

## Vulnérabilités

| # | Type | Catégorie OWASP | Difficulté | Actif |
| --- | ------ | --------------- | ---------- | ----- |
| 1 | Sensitive Data Exposure | Security Misconfiguration | Facile | ✅ |
| 2 | IDOR | Broken Access Control | Facile | ✅ |
| 3 | Path Traversal | Broken Access Control | Facile | ✅ |
| 4 | Zero Rating Bypass | Insecure Design | Facile | ✅ |
| 5 | Reflected XSS | Injection | Facile | ✅ |
| 6 | Mass Assignment (Go Premium) | Insecure Design | Moyen | ✅ |
| 7 | Mass Assignment (changement de rôle) | Broken Access Control | Moyen | ✅ |
| 8 | JWT Forging (secret faible) | Cryptographic Failures | Moyen | ✅ |
| 9 | SQL Injection (Login Bypass) | Injection | Moyen | ✅ |
| 10 | Business Logic (crédits négatifs) | Insecure Design | Moyen | ✅ |
| 11 | CSRF | Broken Access Control | Moyen | ❌ |
| 12 | SQL Injection (UNION) | Injection | Difficile | ✅ |
| 13 | Stored XSS | Injection | Difficile | ✅ |
| 14 | SSRF | Server-Side Request Forgery | Difficile | ✅ |
| 15 | Cookie Theft via XSS | Injection + Auth Failures | Difficile | ✅ |

## Garde-fous d'attribution des flags

Un flag n'est jamais délivré sur un état atteint, mais sur l'**acte** qui le
prouve. Tout passe par `server/src/award.js`, qui garantit :

- **preuve obligatoire** — une condition sans preuve d'exploitation ne délivre rien ;
- **un flag par requête** — deux vulnérabilités ne se découvrent pas d'un coup ;
- **prérequis** — les challenges d'un fil rouge (`requires` dans
  `shared/flags.json`) ne se valident pas hors de leur ordre ;
- **journal** — chaque décision est tracée et remontée au dashboard, où
  l'animateur voit le chemin emprunté par chaque équipe.

En complément, `server/src/detect.js` oriente le joueur quand une technique
connue est employée au mauvais endroit — sans jamais délivrer de flag
(`DETECTION_MESSAGES=off` pour un public avancé).

## Tests

```bash
npm test     # vérifie chaque challenge : chemin prévu ET absence de chemin non prévu
```

## Scoring

- Chaque flag rapporte des points selon sa difficulté (Facile=10 / Moyen=15 / Difficile=25)
- Une **orientation** (où chercher) est gratuite et s'ouvre après quelques minutes sans capture (`VITE_NUDGE_DELAY_MIN`)
- Un **indice** coûte des points (configurable via `HINT_PENALTY` dans le `.env`, défaut : 3)
- En cas d'égalité : nombre de flags > temps de première capture

## Onboarding des participants

À la première connexion, une **modale bloquante** s'affiche sur le Hacking QG et sur le site BananaShop. Elle guide les participants en 5 étapes avant de leur donner accès aux outils :

1. **Présentation** — introduction à l'onboarding et à l'outil Burp Suite
2. **Guide Burp** — lien vers le guide d'installation (`/installation-burp.html`)
3. **Exercice Burp** — envoyer une requête et la retrouver dans l'historique HTTP pour la rejouer dans le Repeater avec la bonne valeur, ce qui révèle le flag de démarrage
4. **Déroulement du CTF** — process de recherche de vulnérabilités suggéré
5. **Flag** — saisie du flag de démarrage pour déverrouiller l'interface

Le flag de démarrage est renvoyé par la route `POST /hello-my-flag` lorsque le participant envoie la bonne valeur dans le corps de la requête (exercice guidé à l'étape 03). Une fois le flag soumis, tous les menus du QG et du BananaShop se déverrouillent. L'état est persisté en `localStorage`. En développement local, `VITE_DEV_MODE=true` désactive cette modale (voir [Développement local](#développement-local)).

## Déroulement suggéré (2h)

| Durée | Activité |
|-------|----------|
| 0:00 - 0:15 | Intro OWASP Top 10 + outils (DevTools, Burp Suite) |
| 0:15 - 1:45 | CTF libre - les équipes exploitent les vulnérabilités |
| 1:45 - 2:00 | Debrief - walkthrough de chaque vuln + remédiations |

## Outils pour les participants

- **Burp Suite Community** pour intercepter et forger des requêtes HTTP
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
