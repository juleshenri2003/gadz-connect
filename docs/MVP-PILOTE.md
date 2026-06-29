# MVP pilote Gadz'Connect — checklist locale

> Hors déploiement prod. Objectif : valider le parcours complet sur 1 campus pilote.

## Prérequis `.env` (`apps/api`)

| Variable | Rôle |
|---|---|
| `SUPABASE_*` | Base + auth |
| `STRIPE_*` | Paiements Connect |
| `RESEND_API_KEY` | E-mails (factures parent + relances Stripe Connect) |
| `GADZ_PLATFORM_EMAIL_FROM` | Expéditeur prod (domaine vérifié Resend) |
| `GADZ_APP_URL` | URL HTTPS du front (liens dans les e-mails) |
| `GADZ_SAP_NUMBER`, `GADZ_PLATFORM_*` | En-tête PDF factures |

## Démarrage

```bash
pnpm install
pnpm dev                    # web :5173 + API :3001
pnpm --filter @gadz-connect/api stripe-listen   # terminal séparé — webhooks
```

## Parcours à valider

### 1. Professeur (onboarding)

1. Connexion `prof.enattente@ensam.eu` ou `prof.complet@ensam.eu`
2. Setup profil + CV
3. Questionnaire fiscal + SIRET (ou attente RH)
4. Adresse auto-entreprise (`/app/micro-entreprise`)
5. Stripe Connect onboarding
6. Publication de créneaux

### 2. Validation RH

1. Connexion `jules.henri@ensam.eu` → `/admin/users`
2. **Activer manuellement** un prof `pending_siret` avec SIRET
   - Active le compte, `is_autoentrepreneur_verified`, crée Stripe Connect, notifie le prof

### 3. Réservation + paiement

1. Connexion élève `eleve.dupont@ensam.eu`
2. Marketplace → réserver un créneau → payer `4242 4242 4242 4242`
3. Vérifier webhook : transaction `succeeded` + 2 factures en base

### 4. Centre de facturation

`/admin/budgets` → Centre de facturation

- Aperçu PDF par prof / parent
- **Factures manquantes** — backfill API
- **Export ZIP** — archive mensuelle
- Bouton **Générer** sur une ligne en attente

## Scripts utiles

```bash
pnpm --filter @gadz-connect/api backfill-invoices      # factures oubliées
pnpm --filter @gadz-connect/api repair-demo-billing    # données démo + régénère PDF
pnpm --filter @gadz-connect/api test-invoice-pdf       # PDF démo local
pnpm --filter @gadz-connect/api stripe-check           # vérif clés Stripe
```

## Commission marketplace

**3 € fixes** par cours (`COMMISSION_SASU_EUR` dans `@gadz-connect/types`).

Exemple **40 € TTC** (prof sans ACRE, sans versement libératoire) :

| Poste | Montant |
|---|---|
| Paiement parent | 40,00 € |
| Commission Gadz'Connect | −3,00 € |
| Base cotisations | 37,00 € |
| URSSAF (21,1 %) | −7,81 € |
| **Net prof** | **29,19 €** |

Avec **ACRE** : URSSAF à 10,6 % sur 37 € → net **33,08 €**.

## Données démo

| Compte | Mot de passe | Rôle |
|---|---|---|
| `jules.henri@ensam.eu` | `Pilotage-RH!` | Admin RH |
| `prof.martin@ensam.eu` | `Prof-Martin!` | Prof actif |
| `eleve.dupont@ensam.eu` | `Eleve-Dupont!` | Élève |

## Reste après MVP pilote (hors scope immédiat)

- [ ] Déploiement Cloud Run + webhook Stripe prod
- [ ] Domaine Resend vérifié en prod
- [ ] 20 profs pilotes réels
- [ ] Module planning iCal (V2)
