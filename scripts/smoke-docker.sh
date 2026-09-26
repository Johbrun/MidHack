#!/usr/bin/env bash
# Smoke test du déploiement Docker complet — « est-ce que ça marche le jour J ? »
#
# Les tests Node vérifient chaque service isolément ; celui-ci vérifie ce que
# les animateurs lancent réellement : setup.sh génère le docker-compose, build
# les images, démarre dashboard + site + QG, et la chaîne de bout en bout
# fonctionne (un flag capturé sur le site remonte au scoreboard via le QG).
#
# Isolé : le projet est copié dans un dossier temporaire avec sa propre config
# 1 équipe, ses propres ports et un nom de projet Compose dédié. Le .env, le
# docker-compose.yml et les credentials de l'utilisateur ne sont jamais touchés.
#
# Usage : bash scripts/smoke-docker.sh   (ou : npm run test:smoke-docker)
#         SMOKE_START_PORT=46000 bash scripts/smoke-docker.sh
set -euo pipefail

PROJECT="midhack-smoke"
START_PORT="${SMOKE_START_PORT:-45900}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'
step() { printf "${CYAN}→ %s${NC}\n" "$1"; }
ok()   { printf "  ${GREEN}✔${NC} %s\n" "$1"; }
die()  { printf "  ${RED}✖ %s${NC}\n" "$1"; exit 1; }

cleanup() {
  step "Nettoyage"
  ( cd "$WORK" 2>/dev/null && COMPOSE_PROJECT_NAME="$PROJECT" docker compose down -v --remove-orphans >/dev/null 2>&1 ) || true
  rm -rf "$WORK"
}
trap cleanup EXIT

# ── 1. Copie isolée de l'arbre de travail (hors artefacts lourds/générés) ──
step "Copie du projet dans $WORK"
tar -C "$ROOT" \
  --exclude=node_modules --exclude=.git \
  --exclude=client/dist --exclude=dashboard/client/dist --exclude=exploit-server/client/dist \
  --exclude=dashboard/data --exclude=exploit-server/data \
  --exclude=docker-compose.yml --exclude=credentials.json --exclude=credentials.html \
  -cf - . | tar -xf - -C "$WORK"

# ── 2. Config dédiée : 1 équipe, ports isolés ──
cat > "$WORK/.env" <<EOF
TEAMS=1
TEAM_NAMES="Smoke"
START_PORT=$START_PORT
EVENT_TITLE="Smoke Test"
HINT_PENALTY=5
VITE_NANTES_HACK=0
EOF

# ── 3. Déploiement (build + up) ──
step "Déploiement Docker (build des 3 images, peut prendre quelques minutes)"
cd "$WORK"
export COMPOSE_PROJECT_NAME="$PROJECT"
./setup.sh deploy >/dev/null || die "setup.sh deploy a échoué"
ok "docker compose up terminé"

# ── 4. Ports et mot de passe effectifs, lus depuis les credentials générés ──
read_cred() { node -e "const c=require('./credentials.json');$1"; }
DASH_PORT=$(read_cred 'console.log(new URL(c.dashboard_url).port)')
SITE_PORT=$(read_cred 'console.log(new URL(c.teams[0].site_url).port)')
EXPLOIT_PORT=$(read_cred 'console.log(new URL(c.teams[0].exploit_url).port)')
TEAM_PWD=$(read_cred 'console.log(c.teams[0].password)')

# ── 5. Attente que chaque service réponde ──
wait_http() { # url, name
  local i
  for i in $(seq 1 60); do
    if curl -fsS -o /dev/null "$1"; then ok "$2 prêt"; return 0; fi
    sleep 2
  done
  echo "--- logs ---"; docker compose logs --tail=40 || true
  die "$2 injoignable ($1)"
}
step "Attente des services"
wait_http "http://localhost:$DASH_PORT/api/scoreboard"     "dashboard (:$DASH_PORT)"
wait_http "http://localhost:$SITE_PORT/api/products"        "site (:$SITE_PORT)"
wait_http "http://localhost:$EXPLOIT_PORT/api/auth/check"   "exploit / QG (:$EXPLOIT_PORT)"

# ── 6. Chaîne de bout en bout : capturer un flag et le voir au scoreboard ──
step "Parcours de bout en bout"

# a) Le site fuit le flag DATA_EXPOSURE (challenge sans prérequis) via /api/config
FLAG=$(curl -fsS "http://localhost:$SITE_PORT/api/config" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).flag||"")}catch{console.log("")}})')
[ -n "$FLAG" ] || die "aucun flag exposé par /api/config"
ok "flag DATA_EXPOSURE exposé par le site"

# b) Login sur le QG, puis soumission du flag via son proxy vers le site
JAR="$WORK/cookies.txt"
curl -fsS -c "$JAR" -o /dev/null -X POST "http://localhost:$EXPLOIT_PORT/api/login" \
  -H 'Content-Type: application/json' -d "{\"password\":\"$TEAM_PWD\"}" \
  || die "login QG refusé"
SUBMIT=$(curl -fsS -b "$JAR" -X POST "http://localhost:$EXPLOIT_PORT/api/flags/submit" \
  -H 'Content-Type: application/json' -d "{\"flag\":\"$FLAG\"}")
echo "$SUBMIT" | grep -q '"valid":true' || die "soumission refusée : $SUBMIT"
ok "flag soumis via le QG (proxy → site)"

# c) La capture remonte au dashboard (site → dashboard, jeton d'équipe validé)
for i in $(seq 1 15); do
  if curl -fsS "http://localhost:$DASH_PORT/api/scoreboard" | grep -q 'DATA_EXPOSURE'; then
    ok "capture visible sur le scoreboard"
    printf "\n${GREEN}✅ Smoke Docker OK — la plateforme est déployable de bout en bout.${NC}\n"
    exit 0
  fi
  sleep 1
done
die "la capture n'est pas remontée au scoreboard"
