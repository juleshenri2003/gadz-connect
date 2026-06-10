#!/usr/bin/env bash
# Aligne sur main et push vers origin/main (jamais git push seul).
set -euo pipefail

TARGET_BRANCH="main"
REMOTE="origin"
SOURCE_BRANCH="$(git branch --show-current)"

echo "→ Branche courante : ${SOURCE_BRANCH}"

if [[ "${SOURCE_BRANCH}" != "${TARGET_BRANCH}" ]]; then
  echo "→ Bascule vers ${TARGET_BRANCH} et merge de ${SOURCE_BRANCH}…"
  git checkout "${TARGET_BRANCH}"
  git merge "${SOURCE_BRANCH}" --no-edit
fi

if git rev-parse --verify "${REMOTE}/${TARGET_BRANCH}" >/dev/null 2>&1; then
  echo "→ Rebase sur ${REMOTE}/${TARGET_BRANCH}…"
  git pull --rebase "${REMOTE}" "${TARGET_BRANCH}"
fi

echo "→ Push explicite vers ${REMOTE} ${TARGET_BRANCH}…"
git push "${REMOTE}" "${TARGET_BRANCH}"

echo "✓ Publié sur ${REMOTE}/${TARGET_BRANCH} ($(git rev-parse --short HEAD))"
