# Gadz'Connect

Plateforme inter-campus — monorepo pnpm (React + Express + Supabase).

## Arborescence

```
gadz-connect/
├── apps/
│   ├── web/          → React 18, Vite, Tailwind v4, shadcn/ui
│   └── api/          → Express, TypeScript
├── packages/
│   ├── ui/           → Design system (shadcn)
│   ├── types/        → Types partagés
│   └── config/       → ESLint, tsconfig
├── supabase/
│   └── migrations/   → Schéma PostgreSQL + RLS
├── pnpm-workspace.yaml
├── Dockerfile
└── package.json
```

## Prérequis

- Node.js ≥ 20
- pnpm ≥ 9
- Projet Supabase

## Les 3 couches du projet

| Couche | Où ça tourne | À lancer en local ? |
|--------|----------------|---------------------|
| **Frontend** | `apps/web` → port **5173** | Oui |
| **Backend API** | `apps/api` → port **3001** | Oui |
| **Base de données** | **Supabase** (PostgreSQL dans le cloud) | **Non** — déjà en ligne sur [supabase.com](https://supabase.com) |

Le backend se connecte à Supabase via les clés dans `apps/api/.env`. Vous n’avez pas de PostgreSQL à démarrer sur votre machine (sauf si vous installez [Supabase CLI + Docker](https://supabase.com/docs/guides/cli) pour du 100 % local, ce qui n’est pas le setup actuel).

## Démarrage

```bash
cd gadz-connect
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
# Renseigner SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY dans apps/api/.env
```

### Option A — tout en une commande (recommandé)

```bash
pnpm dev
```

Lance **frontend + backend** en parallèle.

### Option B — deux terminaux séparés

```bash
# Terminal 1 — Backend
pnpm dev:api

# Terminal 2 — Frontend
pnpm dev:web
```

### URLs locales

- Frontend : http://localhost:5173
- API : http://localhost:3001
- Pilotage RH : http://localhost:5173/admin
- Santé API : http://localhost:3001/health

## Base de données & Auth

Voir [supabase/README.md](./supabase/README.md) :

- Migrations `001` + `002` + `003` (marketplace & inscription)
- Magic Link (redirect `/auth/callback`)
- Stripe Connect webhooks

## Build production

```bash
pnpm build
docker build -t gadz-connect-api .
```
