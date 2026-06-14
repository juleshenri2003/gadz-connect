#!/usr/bin/env bash
# Synchronise avec origin/main, démarre Gadz'Connect (web + API) et ouvre le navigateur.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

export PATH="/opt/homebrew/bin:$HOME/Library/pnpm:$PATH"

TARGET_BRANCH="main"
REMOTE="origin"
WEB_URL="http://localhost:5173"
API_URL="http://localhost:3001"
LOG_FILE="${TMPDIR:-/tmp}/gadz-connect-dev.log"

echo "→ Projet : $ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "✗ pnpm introuvable — installez Node 20+ et pnpm" >&2
  exit 1
fi

sync_with_main() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return 0
  fi

  local current
  current="$(git branch --show-current 2>/dev/null || true)"

  if [[ "$current" != "$TARGET_BRANCH" ]]; then
    echo "→ Branche « ${current:-détachée} » — pas de pull auto (attendu : ${TARGET_BRANCH})"
    return 0
  fi

  if ! git rev-parse --verify "${REMOTE}/${TARGET_BRANCH}" >/dev/null 2>&1; then
    echo "→ Remote ${REMOTE}/${TARGET_BRANCH} introuvable — skip sync"
    return 0
  fi

  local lock_before=""
  if [[ -f pnpm-lock.yaml ]]; then
    lock_before=$(shasum -a 256 pnpm-lock.yaml 2>/dev/null | cut -d' ' -f1 || true)
  fi

  echo "→ Synchronisation avec ${REMOTE}/${TARGET_BRANCH}…"
  if ! git pull --rebase "${REMOTE}" "${TARGET_BRANCH}"; then
    echo "⚠ Pull échoué (modifs locales ou conflit) — lancement avec le code actuel" >&2
    echo "   Résolvez puis : git pull --rebase ${REMOTE} ${TARGET_BRANCH}" >&2
    return 0
  fi

  echo "✓ Code à jour ($(git rev-parse --short HEAD))"

  if [[ -f pnpm-lock.yaml ]]; then
    local lock_after
    lock_after=$(shasum -a 256 pnpm-lock.yaml | cut -d' ' -f1)
    if [[ "$lock_before" != "$lock_after" ]]; then
      echo "→ Lockfile modifié — pnpm install…"
      pnpm install
    fi
  fi
}

sync_with_main

echo "→ Arrêt des anciens serveurs (3001, 5173)…"
(lsof -ti:3001,5173 2>/dev/null | xargs kill -9 2>/dev/null) || true
sleep 1

echo "→ Lancement de pnpm dev…"
nohup pnpm dev >"$LOG_FILE" 2>&1 &
DEV_PID=$!
echo "   PID $DEV_PID — logs : $LOG_FILE"

echo "→ Attente des serveurs…"
ready=0
for _ in $(seq 1 45); do
  if curl -sf "$WEB_URL" >/dev/null 2>&1 && curl -sf "$API_URL/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "✗ pnpm dev s'est arrêté — dernières lignes du log :" >&2
    tail -20 "$LOG_FILE" >&2 || true
    exit 1
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "✗ Timeout — les serveurs ne répondent pas encore. Voir $LOG_FILE" >&2
  exit 1
fi

if command -v open >/dev/null 2>&1; then
  open "$WEB_URL"
  echo "→ Navigateur ouvert"
fi

echo "✓ Frontend : $WEB_URL"
echo "✓ API      : $API_URL"
echo "✓ Connexion : $WEB_URL/login"
