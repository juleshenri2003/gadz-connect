---
name: pull
description: >-
  Synchronise la branche main locale avec origin/main (fetch + rebase).
  Utiliser quand l'utilisateur envoie /pull, demande de pull, mettre à jour
  depuis GitHub, ou récupérer le code distant sur main — exécution autonome.
disable-model-invocation: true
---

# /pull — synchroniser main depuis origin (autonome)

L'utilisateur a invoqué **`/pull`**. Exécute tout de suite, sans demander confirmation sauf blocage (conflits, working tree sale).

## Workflow

### Étape 1 — État (parallèle)

```bash
git status
git branch -vv
git log -3 --oneline
git fetch origin main
git log HEAD..origin/main --oneline
```

- **Working tree sale** (fichiers modifiés non commités) → arrêter et indiquer de committer, stasher ou annuler avant de pull.
- **Aucun commit en avance sur origin** → pull quand même (vérifie les mises à jour distantes).

### Étape 2 — Pull main

```bash
./.cursor/skills/pull/scripts/pull.sh
```

Le script : bascule sur `main` si besoin → **`git pull --rebase origin main`**.

### Étape 3 — Réponse

- Branche courante : `main`
- Hash HEAD après pull
- « À jour avec origin/main » ou liste des commits récupérés

## Texte optionnel après /pull

`/pull --ff-only` → si le script reçoit l’argument, utiliser `git pull --ff-only origin main` (refuse si rebase nécessaire).

## Interdictions

- `git pull` sans `origin main`
- `git pull --rebase` sur une autre branche que `main` (sauf demande explicite)
- `git config`
- `--force` / reset destructif (sauf demande explicite)
