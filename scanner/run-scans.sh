#!/usr/bin/env bash
#
# run-scans.sh — Lance gitleaks, trivy, semgrep et OWASP ZAP sur le projet
#                et produit un rapport SARIF par outil dans scanner/reports/.
#
# Usage:
#   ./scanner/run-scans.sh [options]
#
# Options:
#   -t, --target URL     Cible DAST pour ZAP (def: http://localhost:3001)
#   -o, --output DIR     Dossier de sortie SARIF (def: scanner/reports)
#   -s, --source DIR     Racine du code à scanner (def: racine du repo)
#       --skip-zap       Ne pas lancer ZAP (scan statique uniquement)
#       --only TOOL      Ne lancer qu'un outil: gitleaks|trivy|semgrep|zap
#   -h, --help           Affiche cette aide
#
# Les outils manquants en local sont automatiquement lancés via Docker.
set -uo pipefail

# --- Résolution des chemins ---------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Valeurs par défaut -------------------------------------------------------
TARGET_URL="http://localhost:3001"
OUTPUT_DIR="$SCRIPT_DIR/reports"
SOURCE_DIR="$REPO_ROOT"
SKIP_ZAP=0
ONLY=""

# --- Couleurs (désactivées si pas un TTY) ------------------------------------
if [ -t 1 ]; then
  C_BLUE="\033[1;34m"; C_GREEN="\033[1;32m"; C_YELLOW="\033[1;33m"
  C_RED="\033[1;31m"; C_RESET="\033[0m"
else
  C_BLUE=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_RESET=""
fi
log()  { printf "${C_BLUE}==>${C_RESET} %s\n" "$*"; }
ok()   { printf "${C_GREEN}  ✓${C_RESET} %s\n" "$*"; }
warn() { printf "${C_YELLOW}  ! ${C_RESET}%s\n" "$*"; }
err()  { printf "${C_RED}  ✗${C_RESET} %s\n" "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }

# --- Parsing des arguments ----------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    -t|--target) TARGET_URL="$2"; shift 2 ;;
    -o|--output) OUTPUT_DIR="$2"; shift 2 ;;
    -s|--source) SOURCE_DIR="$2"; shift 2 ;;
    --skip-zap)  SKIP_ZAP=1; shift ;;
    --only)      ONLY="$2"; shift 2 ;;
    -h|--help)   sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) err "Option inconnue: $1"; exit 2 ;;
  esac
done

mkdir -p "$OUTPUT_DIR"
EXCLUDES=(node_modules .venv venv __pycache__ .git dist build "$OUTPUT_DIR")

want() { [ -z "$ONLY" ] || [ "$ONLY" = "$1" ]; }

# =============================================================================
# Gitleaks — secrets (historique git + working tree) -> SARIF natif
# =============================================================================
run_gitleaks() {
  want gitleaks || return 0
  log "Gitleaks (secrets)"
  local out="$OUTPUT_DIR/gitleaks.sarif"
  if have gitleaks; then
    gitleaks detect --source "$SOURCE_DIR" --redact \
      --report-format sarif --report-path "$out" || true
  elif have docker; then
    docker run --rm -v "$SOURCE_DIR:/repo" zricethezav/gitleaks:latest \
      detect --source /repo --redact \
      --report-format sarif --report-path "/repo/${out#$SOURCE_DIR/}" || true
  else
    err "gitleaks et docker absents — étape ignorée"; return 0
  fi
  [ -f "$out" ] && ok "→ $out"
}

# =============================================================================
# Trivy — dépendances + secrets + misconfig (IaC/Dockerfiles) -> SARIF natif
# =============================================================================
run_trivy() {
  want trivy || return 0
  log "Trivy (deps + secrets + misconfig)"
  local out="$OUTPUT_DIR/trivy.sarif"
  if have trivy; then
    trivy fs --scanners vuln,secret,misconfig \
      --skip-dirs node_modules --skip-dirs .venv \
      --format sarif --output "$out" "$SOURCE_DIR" || true
  elif have docker; then
    docker run --rm -v "$SOURCE_DIR:/src" aquasec/trivy:latest \
      fs --scanners vuln,secret,misconfig \
      --skip-dirs node_modules \
      --format sarif --output "/src/${out#$SOURCE_DIR/}" /src || true
  else
    err "trivy et docker absents — étape ignorée"; return 0
  fi
  [ -f "$out" ] && ok "→ $out"
}

# =============================================================================
# Semgrep — SAST (registre + règles custom du projet) -> SARIF natif
# =============================================================================
run_semgrep() {
  want semgrep || return 0
  log "Semgrep (SAST)"
  local out="$OUTPUT_DIR/semgrep.sarif"
  local args=(--config auto --sarif --output "$out")
  [ -f "$REPO_ROOT/.semgrep/banana-rules.yml" ] && \
    args=(--config "$REPO_ROOT/.semgrep/banana-rules.yml" "${args[@]}")
  local ex=(); for e in "${EXCLUDES[@]}"; do ex+=(--exclude "$e"); done

  if have semgrep; then
    (cd "$SOURCE_DIR" && semgrep scan "${args[@]}" "${ex[@]}" .) || true
  elif have docker; then
    docker run --rm -v "$SOURCE_DIR:/src" semgrep/semgrep:latest \
      semgrep scan --config auto --sarif \
      --output "/src/${out#$SOURCE_DIR/}" /src || true
  else
    err "semgrep et docker absents — étape ignorée"; return 0
  fi
  [ -f "$out" ] && ok "→ $out"
}

# =============================================================================
# OWASP ZAP — DAST. Baseline scan -> JSON, puis conversion -> SARIF
# =============================================================================
run_zap() {
  want zap || return 0
  [ "$SKIP_ZAP" -eq 1 ] && { warn "ZAP ignoré (--skip-zap)"; return 0; }
  log "OWASP ZAP (DAST) sur $TARGET_URL"
  if ! have docker; then
    err "docker requis pour ZAP — étape ignorée"; return 0
  fi

  local json="$OUTPUT_DIR/zap.json"
  local out="$OUTPUT_DIR/zap.sarif"

  # --network host pour atteindre un service exposé sur localhost
  docker run --rm --network host \
    -v "$OUTPUT_DIR:/zap/wrk/:rw" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py -t "$TARGET_URL" -J "$(basename "$json")" -I || true

  if [ -f "$json" ]; then
    if have python3; then
      python3 "$SCRIPT_DIR/zap-to-sarif.py" "$json" "$out" "$TARGET_URL" \
        && ok "→ $out"
    else
      warn "python3 absent — rapport ZAP laissé en JSON: $json"
    fi
  else
    err "ZAP n'a pas produit de rapport (cible injoignable ?)"
  fi
}

# --- Exécution ----------------------------------------------------------------
log "Projet : $SOURCE_DIR"
log "Sortie : $OUTPUT_DIR"
echo

run_gitleaks
run_trivy
run_semgrep
run_zap

echo
log "Rapports SARIF générés :"
ls -1 "$OUTPUT_DIR"/*.sarif 2>/dev/null | sed 's/^/  /' || warn "aucun SARIF produit"
