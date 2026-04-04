# MidHack - BananaShop CTF

Plateforme CTF (Capture The Flag) pour un atelier d'initiation à la sécurité offensive. BananaShop est une application e-commerce **intentionnellement vulnérable** où les participants doivent découvrir et exploiter des failles de sécurité pour capturer des flags.

## Concept

L'atelier se décompose en **trois parties** :

1. **Le site BananaShop** — une application e-commerce React + Express contenant 15 vulnérabilités à exploiter
2. **Le serveur d'exploit** — un espace par équipe avec webhook, générateur CSRF, outils d'exploitation et soumission de flags
3. **Le dashboard live** — un tableau de scores en temps réel (WebSocket) à projeter, affichant la progression de chaque équipe

Une **mini-académie** intégrée au serveur d'exploit propose des slides interactives couvrant les phases du pentest et chaque type de vulnérabilité (explication, détection, exemples de code, remédiation).

## Aperçu

### Application vulnérable

![BananaShop — Site e-commerce](1.png)

### Tableau de classement temps réel

![Dashboard live — Classement en direct](2.png)

## Quick Start

### Docker (recommandé — setup multi-équipes)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Dashboard live (à projeter) | <http://localhost:5000> |
| Site Team 1 | <http://localhost:3001> |
| Site Team 2 | <http://localhost:3002> |
| Site Team 3 | <http://localhost:3003> |
| Site Team 4 | <http://localhost:3004> |
| Exploit Server Team 1 | <http://localhost:4001> |
| Exploit Server Team 2 | <http://localhost:4002> |
| Exploit Server Team 3 | <http://localhost:4003> |
| Exploit Server Team 4 | <http://localhost:4004> |

### Développement local

```bash
npm run install:all
npm run dev
```

Lance les 4 services simultanément (server, client, exploit-server, dashboard) via `concurrently`.

## Architecture

```text
midhack/
├── client/          # Frontend React + Vite + Tailwind CSS
├── server/          # API Express.js + SQLite (vulnérabilités)
├── exploit-server/  # Serveur d'équipe : webhook, académie, outils
├── dashboard/       # Scoreboard live WebSocket (à projeter)
└── docker-compose.yml
```

- **server/** — API Express.js + SQLite, contient les 15 vulnérabilités
- **client/** — SPA React avec Vite et Tailwind CSS
- **exploit-server/** — Webhook receiver, mini-académie, générateur CSRF, soumission de flags
- **dashboard/** — Tableau de scores temps réel via WebSocket, persistance JSON

## Vulnérabilités

| # | Type | Catégorie OWASP | Difficulté |
|---|------|-----------------|------------|
| 1 | Sensitive Data Exposure | Security Misconfiguration | Facile |
| 2 | IDOR | Broken Access Control | Facile |
| 3 | User Enumeration | Identification & Authentication Failures | Facile |
| 4 | Path Traversal | Broken Access Control | Facile |
| 5 | Zero Rating Bypass | Insecure Design | Facile |
| 6 | Reflected XSS | Injection | Facile-Moyen |
| 7 | SQL Injection (Login Bypass) | Injection | Moyen |
| 8 | Business Logic (crédits négatifs) | Insecure Design | Moyen |
| 9 | Mass Assignment | Insecure Design | Moyen |
| 10 | CSRF | Broken Access Control | Moyen |
| 11 | JWT Forging (alg:none) | Cryptographic Failures | Moyen-Difficile |
| 12 | SQL Injection (UNION) | Injection | Difficile |
| 13 | Stored XSS | Injection | Difficile |
| 14 | SSRF | Server-Side Request Forgery | Difficile |
| 15 | Cookie Theft via XSS | Injection + Auth Failures | Difficile |

## Scoring

- Chaque flag rapporte des points selon sa difficulté (10 / 15 / 20 pts)
- Utiliser un indice coûte **-3 points**
- En cas d'égalité : nombre de flags > temps de première capture

## Déroulement suggéré (2h)

| Durée | Activité |
|-------|----------|
| 0:00 - 0:15 | Intro OWASP Top 10 + outils (DevTools, Burp Suite) |
| 0:15 - 1:45 | CTF libre — les équipes exploitent les vulnérabilités |
| 1:45 - 2:00 | Debrief — walkthrough de chaque vuln + remédiations |

## Outils utiles pour les participants

- **Burp Suite Community** pour intercepter et forger des requêtes HTTP
- L'extension **JWT** de Burp Suite pour décoder et modifier des tokens JWT
- L'onglet **Académie** du serveur d'exploit pour apprendre les techniques
