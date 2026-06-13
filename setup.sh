#!/usr/bin/env bash
# Script d'actions du CTF BananaShop.
#
# Toute la CONFIGURATION vit dans le fichier .env (voir .env.example).
# Ce script ne fait que des ACTIONS :
#   deploy     génère docker-compose.yml + credentials puis build & démarre
#   passwords  réaffiche les mots de passe générés (credentials.json)
#   reset      arrête et supprime conteneurs, volumes et fichiers générés
#
# Un argument est obligatoire — sans argument, l'aide s'affiche.
# Lancez "./setup.sh --help" pour le détail.

set -e

# ─────────────────────────── Helpers ───────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

ok()   { printf "  ${GREEN}✔${NC} %s\n" "$1"; }
warn() { printf "  ${YELLOW}⚠${NC} %s\n" "$1"; }
fail() { printf "  ${RED}✖${NC} %s\n" "$1"; exit 1; }
info() { printf "  ${CYAN}ℹ${NC} %s\n" "$1"; }

ENV_FILE=".env"

# ─────────────────────────── Chargement de la config (.env) ───────────────────────────

# Source le .env et expose les variables de configuration. Toutes les valeurs
# de l'événement (équipes, ports, titre, pénalité, branding) viennent de là.
load_config() {
  [ -f "$ENV_FILE" ] || fail ".env introuvable — copiez le modèle : cp .env.example .env"

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a

  # Valeurs par défaut si une clé manque dans le .env
  TEAMS="${TEAMS:-4}"
  START_PORT="${START_PORT:-44000}"
  EVENT_TITLE="${EVENT_TITLE:-BananaShop CTF}"
  HINT_PENALTY="${HINT_PENALTY:-3}"
  NANTES_HACK="${VITE_NANTES_HACK:-1}"
  PROGRESSIVE_UNLOCK="${VITE_PROGRESSIVE_UNLOCK:-false}"
  UNLOCK_THRESHOLD="${VITE_UNLOCK_THRESHOLD:-2}"
  read -ra NAMES <<< "${TEAM_NAMES:-Alpha Bravo Charlie Delta}"

  # ── Validation ──
  if ! [[ "$TEAMS" =~ ^[0-9]+$ ]] || [ "$TEAMS" -lt 1 ] || [ "$TEAMS" -gt "${#NAMES[@]}" ]; then
    fail "TEAMS invalide: '$TEAMS' (doit être entre 1 et ${#NAMES[@]} — le nombre de noms dans TEAM_NAMES)"
  fi
  if ! [[ "$HINT_PENALTY" =~ ^[0-9]+$ ]]; then
    fail "HINT_PENALTY invalide: '$HINT_PENALTY' (doit être un entier positif)"
  fi
  if [ "$NANTES_HACK" != "0" ] && [ "$NANTES_HACK" != "1" ]; then
    fail "VITE_NANTES_HACK invalide: '$NANTES_HACK' (doit être 0 ou 1)"
  fi
  if ! [[ "$START_PORT" =~ ^[0-9]+$ ]] || [ "$START_PORT" -lt 1 ] || [ "$START_PORT" -gt 65535 ]; then
    fail "START_PORT invalide: '$START_PORT' (doit être entre 1 et 65535)"
  fi

  # Ports dérivés du port de départ (schéma contigu)
  DASHBOARD_PORT=$START_PORT
  TEAM_PORT_BASE=$((START_PORT + 1))

  MAX_PORT=$((TEAM_PORT_BASE + TEAMS * 2 - 1))
  if [ "$MAX_PORT" -gt 65535 ]; then
    fail "La plage de ports dépasse 65535 (départ $START_PORT, $TEAMS équipes → max $MAX_PORT)"
  fi
}

# ─────────────────────────── Aide ───────────────────────────

usage() {
  local C=$'\033[0;36m' Y=$'\033[1;33m' N=$'\033[0m'
  cat <<EOF
${C}setup.sh${N} — Script d'actions du CTF BananaShop

${Y}USAGE${N}
  ./setup.sh <commande>

${Y}COMMANDES${N}
  deploy            Génère docker-compose.yml + credentials, puis build &
                    démarre les conteneurs (docker compose up --build -d).
  passwords         Réaffiche les mots de passe (équipes + admin) lus depuis
                    credentials.json, sans rien régénérer.
  reset             Arrête et supprime conteneurs, volumes et fichiers générés.
  -h, --help, help  Affiche cette aide.

${Y}CONFIGURATION${N}
  Toute la configuration de l'événement se fait dans le fichier ${C}.env${N}
  (copiez ${C}.env.example${N} en ${C}.env${N} puis ajustez) :

    TEAMS                    nombre d'équipes
    TEAM_NAMES               noms des équipes (séparés par des espaces)
    START_PORT               port de départ exposé sur l'hôte
    EVENT_TITLE              titre affiché sur le dashboard
    HINT_PENALTY             points retirés par indice
    VITE_NANTES_HACK         branding Nantes@Hack (0/1)
    VITE_PROGRESSIVE_UNLOCK  déblocage progressif des niveaux (true/false)
    VITE_UNLOCK_THRESHOLD    challenges à résoudre par palier

  Les mots de passe (équipes + admin) sont générés aléatoirement à chaque
  « deploy » et écrits dans credentials.json / credentials.html.

${Y}EXEMPLES${N}
  cp .env.example .env       # première fois : créer la config
  ./setup.sh deploy          # générer + lancer selon le .env
  ./setup.sh passwords       # réafficher les mots de passe générés
  ./setup.sh reset           # nettoyage complet

EOF
}

# ─────────────────────────── Affichage des mots de passe ───────────────────────────

# Réaffiche les mots de passe (équipes + admin) en relisant credentials.json,
# sans régénérer la configuration ni toucher aux conteneurs.
show_passwords() {
  local file="credentials.json"
  [ -f "$file" ] || fail "credentials.json introuvable — lancez d'abord ./setup.sh deploy pour générer la configuration."

  local admin dash
  admin=$(grep -oE '"admin_password"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" | sed -E 's/.*"([^"]*)"$/\1/')
  dash=$(grep -oE '"dashboard_url"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" | sed -E 's/.*"([^"]*)"$/\1/')

  local pw_names pw_pwds
  mapfile -t pw_names < <(grep -oE '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$file"     | sed -E 's/.*"([^"]*)"$/\1/')
  mapfile -t pw_pwds  < <(grep -oE '"password"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" | sed -E 's/.*"([^"]*)"$/\1/')

  echo ""
  echo "🔑 Mots de passe (relus depuis credentials.json)"
  [ -n "$dash" ] && echo "   Dashboard: $dash"
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║        MOTS DE PASSE DES EQUIPES        ║"
  echo "╠══════════════════════════════════════════╣"
  local i
  for i in "${!pw_names[@]}"; do
    printf "║  %-10s  mdp: %-5s               ║\n" "${pw_names[$i]}" "${pw_pwds[$i]}"
  done
  echo "╠══════════════════════════════════════════╣"
  printf "║  Admin dashboard:  %-20s ║\n" "$admin"
  echo "╚══════════════════════════════════════════╝"
  echo ""
}

# ─────────────────────────── Reset ───────────────────────────

cmd_reset() {
  echo ""
  echo "🧹 Reset de l'environnement CTF..."
  echo ""
  if command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
    if [ -f "docker-compose.yml" ]; then
      docker compose down -v --remove-orphans 2>/dev/null && ok "Conteneurs et volumes supprimés" || warn "Aucun conteneur à arrêter"
    fi
  fi
  rm -f docker-compose.yml && ok "docker-compose.yml supprimé" || true
  rm -f credentials.json credentials.html && ok "Fichiers d'identifiants supprimés" || true
  echo ""
  ok "Reset terminé."
  echo ""
}

# ─────────────────────────── Prérequis ───────────────────────────

check_prerequisites() {
  echo ""
  echo "🔍 Vérification des prérequis..."
  echo ""

  # Docker
  if ! command -v docker &>/dev/null; then
    fail "Docker n'est pas installé. Installez-le: https://docs.docker.com/engine/install/"
  fi
  ok "Docker trouvé ($(docker --version | head -c 50))"

  # Docker daemon
  if ! docker info &>/dev/null 2>&1; then
    fail "Le daemon Docker ne tourne pas. Lancez: sudo systemctl start docker"
  fi
  ok "Daemon Docker actif"

  # Docker Compose
  if ! docker compose version &>/dev/null 2>&1; then
    fail "Docker Compose plugin manquant. Installez-le: https://docs.docker.com/compose/install/"
  fi
  ok "Docker Compose trouvé ($(docker compose version --short 2>/dev/null))"

  # RAM check (recommend 512MB per team minimum)
  local total_ram_mb required_ram_mb
  total_ram_mb=$(free -m 2>/dev/null | awk '/Mem:/{print $2}' || echo 0)
  required_ram_mb=$(( TEAMS * 512 ))
  if [ "$total_ram_mb" -gt 0 ]; then
    if [ "$total_ram_mb" -lt "$required_ram_mb" ]; then
      warn "RAM disponible: ${total_ram_mb}MB — recommandé: ${required_ram_mb}MB pour $TEAMS équipes"
    else
      ok "RAM suffisante (${total_ram_mb}MB disponible, ${required_ram_mb}MB recommandé)"
    fi
  fi

  # Disk space check (need at least 2GB)
  local available_disk_mb
  available_disk_mb=$(df -m . 2>/dev/null | awk 'NR==2{print $4}' || echo 0)
  if [ "$available_disk_mb" -gt 0 ]; then
    if [ "$available_disk_mb" -lt 2048 ]; then
      warn "Espace disque faible: ${available_disk_mb}MB — recommandé: 2048MB minimum"
    else
      ok "Espace disque suffisant (${available_disk_mb}MB disponible)"
    fi
  fi

  # Port availability check
  local ports_busy=()
  check_port $DASHBOARD_PORT || ports_busy+=($DASHBOARD_PORT)
  local i
  for i in $(seq 1 "$TEAMS"); do
    check_port $((TEAM_PORT_BASE + (i - 1) * 2)) || ports_busy+=($((TEAM_PORT_BASE + (i - 1) * 2)))
    check_port $((TEAM_PORT_BASE + 1 + (i - 1) * 2)) || ports_busy+=($((TEAM_PORT_BASE + 1 + (i - 1) * 2)))
  done

  if [ ${#ports_busy[@]} -gt 0 ]; then
    warn "Ports déjà utilisés: ${ports_busy[*]} — les conteneurs existants seront remplacés"
  else
    ok "Tous les ports nécessaires sont disponibles"
  fi
}

check_port() {
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":$1 " && return 1
  elif command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | grep -q ":$1 " && return 1
  fi
  return 0
}

# ─────────────────────────── Génération des fichiers ───────────────────────────

# Variables partagées entre la génération et le résumé.
ADMIN_PWD=""
declare -a PASSWORDS

generate_files() {
  echo ""
  echo "⚙️  Génération de docker-compose.yml pour $TEAMS équipe(s)..."
  echo ""

  local FILE="docker-compose.yml"
  ADMIN_PWD=$(head -c 100 /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 8)

  cat > "$FILE" <<EOF
# Auto-généré par setup.sh — $TEAMS equipe(s)
# ─── Configuration issue du fichier .env (ne pas éditer ici : modifiez .env) ───
# Branding Nantes@Hack sur tous les services ("0" = désactivé, "1" = activé)
x-build-args: &build-args
  VITE_NANTES_HACK: "$NANTES_HACK"

# Variables partagées pour le dashboard
x-event-config: &event-config
  ADMIN_PASSWORD: "$ADMIN_PWD"
  EVENT_TITLE: "$EVENT_TITLE"
  HINT_PENALTY: "$HINT_PENALTY"

services:
  # Central live dashboard (to project on screen)
  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.dashboard
      args: *build-args
    environment:
      <<: *event-config
    ports:
      - "${DASHBOARD_PORT}:5000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/api/scoreboard"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    mem_limit: 256m
    volumes:
      - dashboard-data:/app/dashboard/data
EOF

  # Pre-generate random passwords (5 alphanumeric chars)
  PASSWORDS=()
  local i
  for i in $(seq 1 "$TEAMS"); do
    PASSWORDS[$i]=$(head -c 100 /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 5)
  done

  for i in $(seq 1 "$TEAMS"); do
    local NAME=${NAMES[$((i - 1))]}
    local SITE_PORT=$((TEAM_PORT_BASE + (i - 1) * 2))
    local EXPLOIT_PORT=$((TEAM_PORT_BASE + 1 + (i - 1) * 2))
    local TEAM_PWD=${PASSWORDS[$i]}

    cat >> "$FILE" <<EOF

  # ──────────────────────── Team $i ────────────────────────
  site-team${i}:
    build:
      context: .
      dockerfile: Dockerfile.site
      args: *build-args
    environment:
      - TEAM_NAME=$NAME
      - DASHBOARD_URL=http://dashboard:5000
    ports:
      - "${SITE_PORT}:3000"
    depends_on:
      dashboard:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/products"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    mem_limit: 256m

  exploit-team${i}:
    build:
      context: .
      dockerfile: Dockerfile.exploit
      args:
        VITE_NANTES_HACK: "$NANTES_HACK"
        VITE_PROGRESSIVE_UNLOCK: "$PROGRESSIVE_UNLOCK"
        VITE_UNLOCK_THRESHOLD: "$UNLOCK_THRESHOLD"
        VITE_HINT_PENALTY: "$HINT_PENALTY"
    environment:
      - TEAM_NAME=$NAME
      - TEAM_PASSWORD=$TEAM_PWD
      - SITE_URL=http://site-team${i}:3000
      - DASHBOARD_URL=http://dashboard:5000
    ports:
      - "${EXPLOIT_PORT}:4000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    mem_limit: 128m
    volumes:
      - exploit-team${i}-data:/app/exploit-server/data
EOF
  done

  # ── Volumes ──
  cat >> "$FILE" <<EOF

volumes:
  dashboard-data:
EOF
  for i in $(seq 1 "$TEAMS"); do
    cat >> "$FILE" <<EOF
  exploit-team${i}-data:
EOF
  done

  ok "docker-compose.yml généré"

  generate_credentials
}

# ─────────────────────────── Fichiers d'identifiants ───────────────────────────

generate_credentials() {
  # JSON
  local CREDS_JSON="credentials.json"
  echo "{" > "$CREDS_JSON"
  echo "  \"admin_password\": \"$ADMIN_PWD\"," >> "$CREDS_JSON"
  echo "  \"dashboard_url\": \"http://localhost:$DASHBOARD_PORT\"," >> "$CREDS_JSON"
  echo "  \"teams\": [" >> "$CREDS_JSON"
  local i
  for i in $(seq 1 "$TEAMS"); do
    local NAME=${NAMES[$((i - 1))]}
    local COMMA=","
    [ "$i" -eq "$TEAMS" ] && COMMA=""
    cat >> "$CREDS_JSON" <<EOF
  {
    "team": $i,
    "name": "$NAME",
    "password": "${PASSWORDS[$i]}",
    "site_url": "http://localhost:$((TEAM_PORT_BASE + (i - 1) * 2))",
    "exploit_url": "http://localhost:$((TEAM_PORT_BASE + 1 + (i - 1) * 2))"
  }${COMMA}
EOF
  done
  echo "  ]" >> "$CREDS_JSON"
  echo "}" >> "$CREDS_JSON"
  ok "credentials.json généré"

  # HTML (printable cards)
  local CREDS_HTML="credentials.html"
  cat > "$CREDS_HTML" <<'HTMLHEAD'
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Identifiants CTF</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #f3f4f6; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 800px; margin: 0 auto; }
  .card {
    border: 2px dashed #9ca3af; border-radius: 12px; padding: 24px;
    background: white; page-break-inside: avoid; text-align: center;
  }
  .card h2 { font-size: 1.5rem; margin-bottom: 12px; color: #1f2937; }
  .card .team-emoji { font-size: 2rem; margin-bottom: 8px; }
  .card .field { margin: 8px 0; font-size: 0.9rem; color: #4b5563; }
  .card .field strong { color: #1f2937; }
  .card .password {
    display: inline-block; margin-top: 8px; padding: 8px 20px;
    background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px;
    font-family: monospace; font-size: 1.3rem; font-weight: bold; letter-spacing: 2px;
  }
  .scissors { text-align: center; color: #9ca3af; font-size: 0.8rem; margin: 12px 0; }
  @media print {
    body { background: white; padding: 0; }
    .scissors { display: none; }
    .card { border: 2px dashed #ccc; }
  }
</style>
</head>
<body>
<div class="grid">
HTMLHEAD

  for i in $(seq 1 "$TEAMS"); do
    local NAME=${NAMES[$((i - 1))]}
    cat >> "$CREDS_HTML" <<EOF
  <div class="card">
    <div class="team-emoji">🍌</div>
    <h2>Team $NAME</h2>
    <div class="field"><strong>Site:</strong> http://localhost:$((TEAM_PORT_BASE + (i - 1) * 2))</div>
    <div class="field"><strong>Exploit Server:</strong> http://localhost:$((TEAM_PORT_BASE + 1 + (i - 1) * 2))</div>
    <div class="field"><strong>Mot de passe:</strong></div>
    <div class="password">${PASSWORDS[$i]}</div>
  </div>
EOF
  done

  cat >> "$CREDS_HTML" <<'HTMLFOOT'
</div>
</body>
</html>
HTMLFOOT
  ok "credentials.html généré (ouvrir dans un navigateur pour imprimer)"
}

# ─────────────────────────── Résumé ───────────────────────────

print_summary() {
  echo ""
  echo "📋 Résumé de la configuration"
  echo ""
  echo "  Événement:  $EVENT_TITLE"
  echo "  Dashboard:  http://localhost:$DASHBOARD_PORT"
  local i
  for i in $(seq 1 "$TEAMS"); do
    echo "  Team $i:     http://localhost:$((TEAM_PORT_BASE + (i - 1) * 2)) (site)  http://localhost:$((TEAM_PORT_BASE + 1 + (i - 1) * 2)) (exploit)"
  done
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║        MOTS DE PASSE DES EQUIPES        ║"
  echo "╠══════════════════════════════════════════╣"
  for i in $(seq 1 "$TEAMS"); do
    printf "║  %-10s  mdp: %-5s               ║\n" "${NAMES[$((i - 1))]}" "${PASSWORDS[$i]}"
  done
  echo "╠══════════════════════════════════════════╣"
  printf "║  Admin dashboard:  %-20s ║\n" "$ADMIN_PWD"
  echo "╚══════════════════════════════════════════╝"
}

# ─────────────────────────── Deploy ───────────────────────────

cmd_deploy() {
  load_config
  check_prerequisites
  generate_files
  print_summary

  echo ""
  echo "🚀 Lancement du déploiement..."
  echo ""
  docker compose up --build -d
  echo ""
  ok "Déploiement terminé !"
  echo ""
  info "En attente que les services soient prêts..."
  sleep 5

  # Quick health check
  local all_ok=true
  local i
  for i in $(seq 1 "$TEAMS"); do
    if ! docker compose ps "site-team${i}" 2>/dev/null | grep -q "running"; then
      warn "site-team${i} ne semble pas démarré"
      all_ok=false
    fi
    if ! docker compose ps "exploit-team${i}" 2>/dev/null | grep -q "running"; then
      warn "exploit-team${i} ne semble pas démarré"
      all_ok=false
    fi
  done
  if ! docker compose ps dashboard 2>/dev/null | grep -q "running"; then
    warn "dashboard ne semble pas démarré"
    all_ok=false
  fi

  if $all_ok; then
    echo ""
    ok "Tous les services sont en cours d'exécution !"
  else
    echo ""
    warn "Certains services ne sont pas encore prêts. Vérifiez: docker compose ps"
  fi
  echo ""
}

# ─────────────────────────── Dispatch ───────────────────────────

case "${1:-}" in
  deploy)          cmd_deploy ;;
  passwords)       show_passwords ;;
  reset)           cmd_reset ;;
  -h|--help|help)  usage ;;
  "")              usage; exit 1 ;;
  *)               fail "Commande inconnue: '$1' (voir ./setup.sh --help)" ;;
esac
