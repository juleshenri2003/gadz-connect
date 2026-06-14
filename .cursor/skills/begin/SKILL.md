---
name: begin
description: >-
  Lance Gadz'Connect en local (pnpm dev) et ouvre le site dans le navigateur.
  Utiliser quand l'utilisateur envoie /begin, demande de lancer/démarrer la
  plateforme, ouvrir le site, ou relancer les serveurs de dev.
disable-model-invocation: true
---

# /begin — lancer Gadz'Connect

L'utilisateur a invoqué **`/begin`**. Exécute tout de suite, sans demander confirmation.

## Workflow

### 1. Vérifier si déjà en ligne (optionnel, rapide)

```bash
curl -sf http://localhost:5173 >/dev/null && curl -sf http://localhost:3001/health >/dev/null && echo "RUNNING"
```

Si les deux répondent déjà : ouvrir le navigateur et confirmer les URLs — pas besoin de redémarrer sauf si l'utilisateur a dit « relancer ».

### 2. Démarrer la plateforme

Depuis la racine du monorepo :

```bash
./.cursor/skills/begin/scripts/begin.sh
```

Le script :
- **`git pull --rebase origin main`** si tu es sur `main` (code à jour avec ton pote)
- **`pnpm install`** automatique si le lockfile a changé après le pull
- arrête les processus sur les ports **3001** et **5173**
- lance **`pnpm dev`** en arrière-plan
- attend que web + API répondent
- ouvre **http://localhost:5173** dans le navigateur (macOS)

Si le pull échoue (modifs locales non commitées, conflit), le script **avertit** et lance quand même avec ton code actuel.

### 3. Réponse à l'utilisateur

Indiquer :
- Frontend : http://localhost:5173
- API : http://localhost:3001
- Login : http://localhost:5173/login

## En cas d'échec

- Lire les logs : `$TMPDIR/gadz-connect-dev.log` ou `/tmp/gadz-connect-dev.log`
- Vérifier que `pnpm install` a été fait
- Vérifier `.env` dans `apps/api` (Supabase) si l'API crash au démarrage

## Interdictions

- Ne pas bloquer le terminal indéfiniment avec `pnpm dev` au premier plan si le script `begin.sh` suffit
- Ne pas modifier `git config`
