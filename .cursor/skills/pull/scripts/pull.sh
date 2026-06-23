#!/usr/bin/env bash
# Synchronise main local avec origin/main (jamais git pull seul sans remote/branche).
set -euo pipefail

TARGET_BRANCH="main"
REMOTE="origin"
SOURCE_BRANCH="$(git branch --show-current)"
FF_ONLY=false

for arg in "$@"; do
  if [[ "${arg}" == "--ff-only" ]]; then
    FF_ONLY=true
  fi
done

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ Working tree sale — committez, stash ou annulez avant /pull." >&2
  git status -sb
  exit 1
fi

echo "→ Branche courante : ${SOURCE_BRANCH}"

if [[ "${SOURCE_BRANCH}" != "${TARGET_BRANCH}" ]]; then
  echo "→ Bascule vers ${TARGET_BRANCH}…"
  git checkout "${TARGET_BRANCH}"
fi

echo "→ Fetch ${REMOTE}/${TARGET_BRANCH}…"
git fetch "${REMOTE}" "${TARGET_BRANCH}"

BEHIND="$(git rev-list --count HEAD.."${REMOTE}/${TARGET_BRANCH}" 2>/dev/null || echo 0)"
AHEAD="$(git rev-list --count "${REMOTE}/${TARGET_BRANCH}"..HEAD 2>/dev/null || echo 0)"

if [[ "${BEHIND}" -eq 0 && "${AHEAD}" -eq 0 ]]; then
  echo "✓ Déjà à jour avec ${REMOTE}/${TARGET_BRANCH} ($(git rev-parse --short HEAD))"
  exit 0
fi

if [[ "${AHEAD}" -gt 0 ]]; then
  echo "⚠ main locale en avance de ${AHEAD} commit(s) sur ${REMOTE}/${TARGET_BRANCH}"
fi

if [[ "${FF_ONLY}" == true ]]; then
  echo "→ Pull ff-only ${REMOTE} ${TARGET_BRANCH}…"
  git pull --ff-only "${REMOTE}" "${TARGET_BRANCH}"
else
  echo "→ Pull rebase ${REMOTE} ${TARGET_BRANCH}…"
  git pull --rebase "${REMOTE}" "${TARGET_BRANCH}"
fi

echo "✓ À jour avec ${REMOTE}/${TARGET_BRANCH} ($(git rev-parse --short HEAD))"
