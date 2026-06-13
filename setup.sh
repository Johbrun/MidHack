#!/usr/bin/env bash
# Generate docker-compose.yml with N teams and optionally deploy.
# Run "./setup.sh -h" for full usage documentation.

set -e

# ╔══════════════════════════════════════════════════════════════╗
# ║                     CONFIGURATION                              ║
# ║   Modifiez ces variables pour personnaliser l'événement.      ║
# ╚══════════════════════════════════════════════════════════════╝

# Nombre d'équipes par défaut (surchargé par l'argument numérique)
DEFAULT_TEAMS=4

# Titre affiché sur le dashboard
EVENT_TITLE="BananaShop CTF"

# Pénalité de score appliquée à l'utilisation d'un indice
HINT_PENALTY="3"

# Branding Nantes@Hack sur tous les services ("0" = désactivé, "1" = activé)
# Peut aussi être défini via la variable d'environnement VITE_NANTES_HACK
NANTES_HACK=${VITE_NANTES_HACK:-1}

# Port de départ exposé sur l'hôte (surchargé par l'option --port N)
# Les ports sont attribués de façon contiguë à partir de cette valeur :
#   dashboard      = START_PORT
#   team1 site     = START_PORT + 1
#   team1 exploit  = START_PORT + 2
#   team2 site     = START_PORT + 3, etc.
START_PORT=44000

# Noms d'équipes (le nombre de noms détermine le maximum d'équipes possible)
NAMES=(Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliet Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango)

# ───────────────────────── Fin de la configuration ─────────────────────────

# ─────────────────────────── Helpers ───────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

ok()   { printf "  ${GREEN}✔${NC} %s\n" "$1"; }
warn() { printf "  ${YELLOW}⚠${NC} %s\n" "$1"; }
fail() { printf "  ${RED}✖${NC} %s\n" "$1"; exit 1; }
info() { printf "  ${CYAN}ℹ${NC} %s\n" "$1"; }

# ─────────────────────────── Aide ───────────────────────────

usage() {
  local C=$'\033[0;36m' Y=$'\033[1;33m' N=$'\033[0m'
  cat <<EOF
${C}setup.sh${N} — Générateur de docker-compose.yml pour le CTF ${EVENT_TITLE}

${Y}USAGE${N}
  ./setup.sh [nombre_d_equipes] [options]

${Y}ARGUMENT POSITIONNEL${N}
  nombre_d_equipes        Nombre d'équipes à générer (1 à ${#NAMES[@]}).
                          Défaut: ${DEFAULT_TEAMS}.

${Y}OPTIONS${N}
  -h, --help              Affiche cette aide et quitte.

  --port N                Port de départ. Les ports sont attribués de façon
                          contiguë: dashboard=N, team1 site=N+1,
                          team1 exploit=N+2, team2 site=N+3, etc.
                          Défaut: ${START_PORT}.

  --title "TEXTE"         Titre de l'événement affiché sur le dashboard.
                          Défaut: "${EVENT_TITLE}".

  --hint-penalty N        Pénalité de score appliquée à l'usage d'un indice.
                          Défaut: ${HINT_PENALTY}.

  --nantes-hack 0|1       Active (1) ou désactive (0) le branding Nantes@Hack
                          sur tous les services. Défaut: ${NANTES_HACK}.

  --deploy                Build & démarre les conteneurs après génération.

  -p, --passwords         Réaffiche les mots de passe (équipes + admin) lus
                          depuis credentials.json, sans rien régénérer, puis
                          quitte.

  --reset                 Arrête et supprime conteneurs, volumes et fichiers
                          générés, puis quitte.

${Y}FORMAT DES OPTIONS${N}
  Chaque option à valeur accepte les deux formes:
    --port 1000      ou    --port=1000

${Y}EXEMPLES${N}
  ./setup.sh                          # 4 équipes, port 44000, valeurs par défaut
  ./setup.sh 8 --deploy               # 8 équipes et déploiement immédiat
  ./setup.sh --port 1000              # dashboard sur 1000, équipes à partir de 1001
  ./setup.sh --passwords              # réaffiche les mots de passe générés
  ./setup.sh --reset                  # nettoyage complet

  # Commande Nantes@Hack
  ./setup.sh 6 --title "Nantes@Hack CTF" --hint-penalty 5 --nantes-hack 1 --port 44000 --deploy

EOF
}

# ─────────────────────────── Affichage des mots de passe ───────────────────────────

# Réaffiche les mots de passe (équipes + admin) en relisant credentials.json,
# sans régénérer la configuration ni toucher aux conteneurs.
show_passwords() {
  local file="credentials.json"
  [ -f "$file" ] || fail "credentials.json introuvable — lancez d'abord ./setup.sh pour générer la configuration."

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

# ─────────────────────────── Parse args ───────────────────────────

TEAMS=$DEFAULT_TEAMS
DEPLOY=false
RESET=false

# Affecte la valeur d'une option à la variable nommée, gérant les deux formes
# "--opt value" et "--opt=value". Consomme l'argument suivant si nécessaire
# (incrémente OPT_SHIFT) et échoue proprement si la valeur manque.
OPT_SHIFT=0
set_opt() {
  local var="$1" arg="$2" next="$3" has_next="$4"
  OPT_SHIFT=0
  case "$arg" in
    *=*)
      printf -v "$var" '%s' "${arg#*=}"
      ;;
    *)
      [ "$has_next" = "1" ] || fail "L'option ${arg%%=*} attend une valeur (ex: ${arg%%=*} <valeur>)"
      printf -v "$var" '%s' "$next"
      OPT_SHIFT=1
      ;;
  esac
}

while [ $# -gt 0 ]; do
  arg="$1"
  has_next=0; [ $# -ge 2 ] && has_next=1
  case "$arg" in
    -h|--help)
      usage
      exit 0
      ;;
    -p|--passwords|--show-passwords)
      show_passwords
      exit 0
      ;;
    --deploy) DEPLOY=true ;;
    --reset)  RESET=true ;;
    --port|--port=*)         set_opt START_PORT   "$arg" "${2-}" "$has_next"; shift "$OPT_SHIFT" ;;
    --title|--title=*)       set_opt EVENT_TITLE  "$arg" "${2-}" "$has_next"; shift "$OPT_SHIFT" ;;
    --hint-penalty|--hint-penalty=*) set_opt HINT_PENALTY "$arg" "${2-}" "$has_next"; shift "$OPT_SHIFT" ;;
    --nantes-hack|--nantes-hack=*)   set_opt NANTES_HACK  "$arg" "${2-}" "$has_next"; shift "$OPT_SHIFT" ;;
    [0-9]*) TEAMS="$arg" ;;
    *) fail "Argument inconnu: '$arg' (voir ./setup.sh -h)" ;;
  esac
  shift
done

# Valide les valeurs surchargeables
if ! [[ "$HINT_PENALTY" =~ ^[0-9]+$ ]]; then
  fail "Pénalité d'indice invalide: '$HINT_PENALTY' (doit être un entier positif)"
fi
if [ "$NANTES_HACK" != "0" ] && [ "$NANTES_HACK" != "1" ]; then
  fail "Valeur --nantes-hack invalide: '$NANTES_HACK' (doit être 0 ou 1)"
fi

# Valide le port de départ
if ! [[ "$START_PORT" =~ ^[0-9]+$ ]] || [ "$START_PORT" -lt 1 ] || [ "$START_PORT" -gt 65535 ]; then
  fail "Port de départ invalide: '$START_PORT' (doit être entre 1 et 65535)"
fi

# Ports dérivés du port de départ (schéma contigu)
DASHBOARD_PORT=$START_PORT
TEAM_PORT_BASE=$((START_PORT + 1))

# Vérifie que le plus haut port ne dépasse pas 65535
MAX_PORT=$((TEAM_PORT_BASE + TEAMS * 2 - 1))
if [ "$MAX_PORT" -gt 65535 ]; then
  fail "La plage de ports dépasse 65535 (départ $START_PORT, $TEAMS équipes → max $MAX_PORT)"
fi

# ─────────────────────────── Reset mode ───────────────────────────

if $RESET; then
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
  exit 0
fi

# ─────────────────────────── Prerequisites ───────────────────────────

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
TOTAL_RAM_MB=$(free -m 2>/dev/null | awk '/Mem:/{print $2}' || echo 0)
REQUIRED_RAM_MB=$(( TEAMS * 512 ))
if [ "$TOTAL_RAM_MB" -gt 0 ]; then
  if [ "$TOTAL_RAM_MB" -lt "$REQUIRED_RAM_MB" ]; then
    warn "RAM disponible: ${TOTAL_RAM_MB}MB — recommandé: ${REQUIRED_RAM_MB}MB pour $TEAMS équipes"
  else
    ok "RAM suffisante (${TOTAL_RAM_MB}MB disponible, ${REQUIRED_RAM_MB}MB recommandé)"
  fi
fi

# Disk space check (need at least 2GB)
AVAILABLE_DISK_MB=$(df -m . 2>/dev/null | awk 'NR==2{print $4}' || echo 0)
if [ "$AVAILABLE_DISK_MB" -gt 0 ]; then
  if [ "$AVAILABLE_DISK_MB" -lt 2048 ]; then
    warn "Espace disque faible: ${AVAILABLE_DISK_MB}MB — recommandé: 2048MB minimum"
  else
    ok "Espace disque suffisant (${AVAILABLE_DISK_MB}MB disponible)"
  fi
fi

# Port availability check
check_port() {
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":$1 " && return 1
  elif command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | grep -q ":$1 " && return 1
  fi
  return 0
}

PORTS_BUSY=()
# Dashboard
check_port $DASHBOARD_PORT || PORTS_BUSY+=($DASHBOARD_PORT)
# Team ports
for i in $(seq 1 "$TEAMS"); do
  check_port $((TEAM_PORT_BASE + (i - 1) * 2)) || PORTS_BUSY+=($((TEAM_PORT_BASE + (i - 1) * 2)))
  check_port $((TEAM_PORT_BASE + 1 + (i - 1) * 2)) || PORTS_BUSY+=($((TEAM_PORT_BASE + 1 + (i - 1) * 2)))
done

if [ ${#PORTS_BUSY[@]} -gt 0 ]; then
  warn "Ports déjà utilisés: ${PORTS_BUSY[*]} — les conteneurs existants seront remplacés"
else
  ok "Tous les ports nécessaires sont disponibles"
fi

# ─────────────────────────── Validate team count ───────────────────────────

if [ "$TEAMS" -lt 1 ] || [ "$TEAMS" -gt ${#NAMES[@]} ]; then
  fail "Nombre d'équipes entre 1 et ${#NAMES[@]}"
fi

echo ""
echo "⚙️  Génération de docker-compose.yml pour $TEAMS équipe(s)..."
echo ""

# ─────────────────────────── Generate docker-compose.yml ───────────────────────────

FILE="docker-compose.yml"
ADMIN_PWD=$(head -c 100 /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 8)

cat > "$FILE" <<EOF
# Auto-generated by setup.sh — $TEAMS equipe(s)
# ─── Configuration de l'événement (modifiable avant docker compose up) ───
# Branding Nantes@Hack sur tous les services ("0" = désactivé, "1" = activé)
x-build-args: &build-args
  VITE_NANTES_HACK: "$NANTES_HACK"

# Variables partagées pour le dashboard (modifiables ici)
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
declare -a PASSWORDS
for i in $(seq 1 "$TEAMS"); do
  PASSWORDS[$i]=$(head -c 100 /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 5)
done

for i in $(seq 1 "$TEAMS"); do
  NAME=${NAMES[$((i - 1))]}
  SITE_PORT=$((TEAM_PORT_BASE + (i - 1) * 2))
  EXPLOIT_PORT=$((TEAM_PORT_BASE + 1 + (i - 1) * 2))
  TEAM_PWD=${PASSWORDS[$i]}

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
      args: *build-args
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

# ─────────────────────────── Volumes ───────────────────────────

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

# ─────────────────────────── Generate credentials files ───────────────────────────

# JSON
CREDS_JSON="credentials.json"
echo "{" > "$CREDS_JSON"
echo "  \"admin_password\": \"$ADMIN_PWD\"," >> "$CREDS_JSON"
echo "  \"dashboard_url\": \"http://localhost:$DASHBOARD_PORT\"," >> "$CREDS_JSON"
echo "  \"teams\": [" >> "$CREDS_JSON"
for i in $(seq 1 "$TEAMS"); do
  NAME=${NAMES[$((i - 1))]}
  COMMA=","
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
CREDS_HTML="credentials.html"
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
  NAME=${NAMES[$((i - 1))]}
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

# ─────────────────────────── Summary ───────────────────────────

echo ""
echo "📋 Résumé de la configuration"
echo ""
echo "  Dashboard:  http://localhost:$DASHBOARD_PORT"
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

# ─────────────────────────── Deploy ───────────────────────────

if $DEPLOY; then
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
  ALL_OK=true
  for i in $(seq 1 "$TEAMS"); do
    if ! docker compose ps "site-team${i}" 2>/dev/null | grep -q "running"; then
      warn "site-team${i} ne semble pas démarré"
      ALL_OK=false
    fi
    if ! docker compose ps "exploit-team${i}" 2>/dev/null | grep -q "running"; then
      warn "exploit-team${i} ne semble pas démarré"
      ALL_OK=false
    fi
  done
  if ! docker compose ps dashboard 2>/dev/null | grep -q "running"; then
    warn "dashboard ne semble pas démarré"
    ALL_OK=false
  fi

  if $ALL_OK; then
    echo ""
    ok "Tous les services sont en cours d'exécution !"
  else
    echo ""
    warn "Certains services ne sont pas encore prêts. Vérifiez: docker compose ps"
  fi
else
  echo ""
  echo "Lancez: docker compose up --build -d"
  echo "   ou : ./setup.sh $TEAMS --deploy"
fi

echo ""
