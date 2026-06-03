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

## Démarrage

```bash
cd gadz-connect
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
pnpm dev
```

- Frontend : http://localhost:5173
- API : http://localhost:3001
- Simulateur fiscal démo : `GET http://localhost:3001/api/fiscal/calculate/demo`

## Base de données & Auth

Voir [supabase/README.md](./supabase/README.md) :

- Migrations `001` + `002`
- Magic Link (redirect `/auth/callback`)
- Stripe Connect webhooks

## Build production

```bash
pnpm build
docker build -t gadz-connect-api .
```
