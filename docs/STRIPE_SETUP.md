# Configuration Stripe — Gadz'Connect

Guide opérationnel pour activer **Stripe Connect Express** (prof) et le **paiement carte à la réservation** (élève) en local.

## 1. Dashboard Stripe (mode Test)

1. Créer ou ouvrir un compte sur [dashboard.stripe.com](https://dashboard.stripe.com) en **mode Test**.
2. **Connect** → activer **Stripe Connect** → choisir **Express** (`type: express`, `country: FR` dans le code).
3. **Developers → API keys** → copier :
   - **Publishable key** (`pk_test_…`)
   - **Secret key** (`sk_test_…`)

## 2. Variables dans `apps/api/.env`

```env
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_...          # voir étape 3
STRIPE_CONNECT_RETURN_URL=http://localhost:5173/stripe/return
STRIPE_CONNECT_REFRESH_URL=http://localhost:5173/stripe/refresh
```

Pas de variable Stripe côté web : tout passe par l'API (`GET /api/stripe/config` expose la clé publique).

Vérifier la config :

```bash
pnpm --filter @gadz-connect/api stripe-check
```

Redémarrer l'API après modification du `.env`.

## 3. Webhooks en local (Stripe CLI)

```bash
# Installation (macOS)
brew install stripe/stripe-cli/stripe
stripe login

# Forwarding (depuis le monorepo)
pnpm --filter @gadz-connect/api stripe-listen
```

La CLI affiche un secret `whsec_…` → le coller dans `STRIPE_WEBHOOK_SECRET`, puis redémarrer l'API.

Événements gérés par le code :

| Événement | Action |
|-----------|--------|
| `account.updated` | Met à jour `stripe_connect_onboarding_complete` sur le profil |
| `payment_intent.succeeded` | Confirme la réservation (créneau + cours `scheduled`) |
| `payment_intent.payment_failed` | Annule le cours en attente de paiement |

Test manuel : `stripe trigger account.updated`

## 4. Migration base de données

Exécuter dans Supabase SQL Editor :

```sql
-- supabase/migrations/013_stripe_payments.sql
```

Ajoute le statut cours `payment_pending` et `stripe_payment_intent_id` sur `transactions`.

## 5. Tester Connect (prof)

Prérequis : prof **actif** (`account_status === "active"`).

```bash
pnpm --filter @gadz-connect/api seed-professor
# prof.martin@ensam.eu / Prof-Martin!
```

Parcours :

1. Connexion prof → **Paiements** (`/app/paiements`)
2. **Configurer Stripe Connect** → onboarding Stripe hébergé
3. Retour sur `/stripe/return`
4. Vérifier : `GET /api/stripe/connect/status` → `onboardingComplete: true`

En mode Test, utiliser les [données de test Connect](https://stripe.com/docs/connect/testing).

## 6. Tester le paiement élève

1. Prof avec Connect terminé + créneaux publiés
2. Connexion élève (`eleve.dupont@ensam.eu` / `Eleve-Dupont!`)
3. Réserver un créneau → formulaire carte Stripe (Elements)
4. Carte test : `4242 4242 4242 4242`, date future, CVC quelconque

Sans clés Stripe réelles, la réservation fonctionne en mode dégradé (pas de carte, créneau réservé immédiatement).

## 7. Production (aperçu)

| Élément | Valeur |
|---------|--------|
| Clés | `sk_live_…` + `pk_live_…` + webhook live |
| Webhook URL | `https://votre-api.example.com/api/webhooks/stripe` |
| Return / Refresh | URLs HTTPS du front |
| Connect | Même modèle Express, compte plateforme vérifié |

## Dépannage

| Symptôme | Cause probable |
|----------|----------------|
| « Stripe non configuré » | `STRIPE_SECRET_KEY` manquante ou contient encore `...` |
| Pas de formulaire carte | `STRIPE_PUBLISHABLE_KEY` manquante |
| Bouton grisé / 403 | Prof pas `active` ou compte suspendu |
| Onboarding OK mais statut false | Webhook non reçu — vérifier `stripe listen` + secret |
| Paiement OK mais créneau libre | Webhook non reçu ou migration 013 non appliquée |
