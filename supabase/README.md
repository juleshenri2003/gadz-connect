# Configuration Supabase — Gadz'Connect

## 1. Migrations SQL

Dans **SQL Editor**, exécuter dans l'ordre :

1. `migrations/001_initial_schema.sql`
2. `migrations/002_onboarding_stripe.sql`
3. `migrations/003_marketplace_setup.sql`
4. `migrations/004_campus_notifications.sql`
5. `migrations/005_onboarding_progress.sql` (jalon INPI onboarding prof)
6. `migrations/006_profile_cv.sql` (CV texte professeur)
7. `migrations/007_cv_pdf_storage.sql` (CV PDF + bucket Storage `cv-pdfs`)
8. `migrations/008_replacement_workflow.sql` (legacy — tables orphelines, workflow remplacement retiré)
9. `migrations/009_student_repository.sql` (répertoire matières élève)
10. `migrations/010_replacement_teacher_responses.sql` (legacy)
11. `migrations/011_registration_path.sql`
12. `migrations/012_cancel_awaiting_replacement.sql` (normalise cours `awaiting_replacement` → `cancelled`)
13. `migrations/013_stripe_payments.sql` (paiement carte + `payment_pending`)
14. `migrations/014_payment_notifications.sql` (notification paiement élève)

Guide détaillé Stripe : [`docs/STRIPE_SETUP.md`](../docs/STRIPE_SETUP.md)

Indisponibilité prof/élève : annulation simple + créneau libéré ; l'élève rebook via la marketplace.

Or en local (avec `DATABASE_URL` dans `apps/api/.env`) :

```bash
pnpm --filter @gadz-connect/api repair-orphan-slots
```

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

## 5. Flux SIRET professeur

1. Onboarding micro-entreprise (statut `pending_siret` si attente INPI)
2. Téléchargement PDF + Guichet Unique
3. Déclaration SIRET par le prof (`PATCH /api/profile/siret`)
4. Validation RH (`/admin/membres` → Valider SIRET)
5. Compte `active` → marketplace + Stripe

Seed test : `pnpm --filter @gadz-connect/api seed-professor-pending` → `prof.enattente@ensam.eu`

## 6. Test du parcours

1. `pnpm dev`
2. Connexion Magic Link → `/auth/login`
3. Onboarding → données enregistrées dans `profiles`
4. Stripe Connect → bouton après validation du formulaire
