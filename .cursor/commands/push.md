# Push — commit + origin/main (automatique)

Exécute **immédiatement** tout le workflow ci-dessous. Ne demande pas de confirmation sauf blocage (conflit git, secret détecté).

## 1. Analyser (en parallèle)

```bash
git status
git diff
git diff --staged
git log -5 --oneline
```

## 2. Committer si nécessaire

- **Ne pas** ajouter `.env`, credentials, secrets.
- Message court (1–2 phrases, le pourquoi).
- Si aucun changement à committer → passer à l'étape 3.

```bash
git add <fichiers pertinents>
git commit -m "$(cat <<'EOF'
<message>

EOF
)"
```

## 3. Pousser sur main

```bash
./.cursor/skills/push/scripts/push.sh
```

## 4. Confirmer

Afficher : commit hash, `origin/main` à jour, lien GitHub Actions si pertinent.

**Interdit** : `git push` seul, `git push --force` sur main, modifier `git config`.
