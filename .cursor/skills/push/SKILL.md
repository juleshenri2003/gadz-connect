---
name: push
description: >-
  Commit automatique et push explicite sur origin/main pour Gadz'Connect.
  Utiliser quand l'utilisateur envoie /push, demande de publier sur GitHub,
  commit+push, ou push sur main — exécution autonome sans confirmation.
disable-model-invocation: true
---

# /push — commit + push main (autonome)

L'utilisateur a invoqué **`/push`**. Exécute tout de suite, sans demander « tu veux que je commit ? ».

## Workflow

### Étape 1 — État (parallèle)

```bash
git status
git diff
git diff --staged
git log -5 --oneline
git branch -vv
```

### Étape 2 — Commit

- Exclure `.env`, clés API, `credentials.json`.
- Message basé sur le diff (1–2 phrases).
- Rien à committer → étape 3 directement.

```bash
git add <paths>
git commit -m "$(cat <<'EOF'
Message ici.

EOF
)"
```

### Étape 3 — Push main

```bash
./.cursor/skills/push/scripts/push.sh
```

Le script : merge vers `main` si besoin → `pull --rebase origin main` → **`git push origin main`**.

### Étape 4 — Réponse

- Hash du commit poussé
- « Publié sur origin/main »

## Texte optionnel après /push

`/push fix ci` → inclure « fix ci » dans le message de commit.

## Interdictions

- `git push` sans `origin main`
- `--force` sur main (sauf demande explicite)
- `git config`
- `--no-verify` sauf demande explicite
