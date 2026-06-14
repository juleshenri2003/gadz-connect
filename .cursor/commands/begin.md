# Begin — lancer Gadz'Connect (automatique)

Exécute **immédiatement** le démarrage local. Ne demande pas de confirmation.

## 1. Lancer les serveurs

```bash
./.cursor/skills/begin/scripts/begin.sh
```

Le script récupère d'abord les derniers commits sur `origin/main` (pratique en binôme), puis démarre les serveurs.

## 2. Confirmer

Afficher les URLs :
- **Site** : http://localhost:5173
- **Login** : http://localhost:5173/login
- **API** : http://localhost:3001

Si les serveurs tournaient déjà et répondent, tu peux seulement ouvrir le navigateur :

```bash
open http://localhost:5173
```

## En cas d'erreur

Consulter le log : `/tmp/gadz-connect-dev.log` (ou `$TMPDIR/gadz-connect-dev.log`).
