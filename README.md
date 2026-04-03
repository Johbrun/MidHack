# MidHack — BananaShop CTF

Application web e-commerce intentionnellement vulnérable pour un atelier d'initiation à la sécurité offensive (2h).

## Quick Start (Docker)

```bash
docker compose up --build
```

### Ports

| Service | URL |
|---------|-----|
| Dashboard live (projeter) | http://localhost:5000 |
| Site Team 1 | http://localhost:3001 |
| Site Team 2 | http://localhost:3002 |
| Site Team 3 | http://localhost:3003 |
| Site Team 4 | http://localhost:3004 |
| Exploit Server Team 1 | http://localhost:4001 |
| Exploit Server Team 2 | http://localhost:4002 |
| Exploit Server Team 3 | http://localhost:4003 |
| Exploit Server Team 4 | http://localhost:4004 |

### Mots de passe exploit servers

| Team | Password |
|------|----------|
| Team 1 | `team1-banana` |
| Team 2 | `team2-banana` |
| Team 3 | `team3-banana` |
| Team 4 | `team4-banana` |

## Développement local

```bash
# Installer les dépendances
cd server && npm install && cd ..
cd client && npm install && cd ..
cd exploit-server && npm install && cd ..
cd dashboard && npm install && cd ..

# Lancer (4 terminaux)
cd server && npm run dev          # port 3000
cd client && npm run dev          # port 5173 (proxy -> 3000)
cd exploit-server && npm run dev  # port 4000
cd dashboard && npm run dev       # port 5000
```

## Architecture

- **server/** — API Express.js + SQLite (7 vulnérabilités)
- **client/** — React + Tailwind CSS (design inspiré asymis.fr)
- **exploit-server/** — Webhook receiver (1 par équipe)
- **dashboard/** — Scoreboard live WebSocket (à projeter)

## Vulnérabilités

| # | Type | Difficulté |
|---|------|-----------|
| 1 | Sensitive Data Exposure | Facile |
| 2 | IDOR | Facile |
| 3 | Reflected XSS | Facile-Moyen |
| 4 | SQL Injection | Moyen |
| 5 | Business Logic | Moyen |
| 6 | JWT Forging (alg:none) | Moyen-Difficile |
| 7 | Stored XSS | Difficile |

## Déroulement suggéré (2h)

| Durée | Activité |
|-------|----------|
| 0:00-0:15 | Intro OWASP Top 10 + outils (DevTools, curl, jwt.io) |
| 0:15-1:45 | CTF libre — les équipes exploitent les vulnérabilités |
| 1:45-2:00 | Debrief — walkthrough de chaque vuln + mitigations |
