# Configuration Supabase — Gadz'Connect

## 1. Migrations SQL

Dans **SQL Editor**, exécuter dans l'ordre :

1. `migrations/001_initial_schema.sql`
2. `migrations/002_onboarding_stripe.sql`

## 2. Magic Link (Auth)

### Authentication → Providers

- Activer **Email**
- Désactiver « Confirm email » si vous voulez une connexion immédiate en dev (optionnel)

### Authentication → URL Configuration

| Champ | Valeur dev |
|-------|------------|
| Site URL | `http://localhost:5173` |
| Redirect URLs | `http://localhost:5173/auth/callback` |

Ajouter aussi l'URL de production (`https://votre-domaine/auth/callback`).

### Email templates (optionnel)

Personnaliser le template « Magic Link » avec la marque Gadz'Connect.

## 3. Variables d'environnement

Copier les clés depuis **Project Settings → API** :

- `anon` → `VITE_SUPABASE_ANON_KEY` (web) et `SUPABASE_ANON_KEY` (api)
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (api uniquement, jamais côté client)

## 4. Stripe Connect (dashboard Stripe)

1. Activer **Connect** → type **Express**
2. Webhook endpoint : `https://votre-api.run.app/api/webhooks/stripe`
3. Événements à écouter :
   - `account.updated`
   - `payment_intent.succeeded`
4. Copier `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` dans `apps/api/.env`

En local avec Stripe CLI :

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## 5. Test du parcours

1. `pnpm dev`
2. Connexion Magic Link → `/auth/login`
3. Onboarding → données enregistrées dans `profiles`
4. Stripe Connect → bouton après validation du formulaire
