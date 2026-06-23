# Pull — synchroniser main depuis origin (automatique)

Exécute **immédiatement** tout le workflow ci-dessous. Ne demande pas de confirmation sauf blocage (conflit git, working tree sale).

## 1. Analyser (en parallèle)

```bash
git status
git branch -vv
git log -3 --oneline
git fetch origin main
git log HEAD..origin/main --oneline
```

Si des fichiers sont modifiés non commités → **arrêter** et expliquer (commit, stash ou discard).

## 2. Pull main

```bash
./.cursor/skills/pull/scripts/pull.sh
```

Option : `./.cursor/skills/pull/scripts/pull.sh --ff-only`

## 3. Confirmer

Afficher : hash HEAD, « À jour avec origin/main », commits récupérés s'il y en a.

**Interdit** : `git pull` sans `origin main`, modifier `git config`, reset destructif.
