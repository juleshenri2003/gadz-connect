# Gadz'Connect — Plan fonctionnel et technique

> Plateforme inter-campus Arts et Métiers — tutorat, gestion micro-entreprise, automatisation fiscale  
> Structure juridique : SASU Gadz'Connect — Code APE 85.59W

Document de référence produit. Voir le dépôt pour l'état d'implémentation courant.

## MVP (modules 1 à 4)

| Module | Objectif | Statut implémentation |
|--------|----------|----------------------|
| **1 — Auth & profils** | Magic link, rôles, campus, cloisonnement | En cours — parcours `/app/setup` |
| **2 — Onboarding micro-entreprise** | Questionnaire, PDF INPI, ACRE, attente SIRET | En cours — saisie SIRET + validation RH |
| **3 — Marketplace tutorat** | Recherche, profils, créneaux, réservation | En cours — MVP campus pilote |
| **4 — Gestion financière** | Stripe Connect, commission, URSSAF, net 48h | Partiel — calcul fiscal + réservation |

## V2 / V3

- Module 5 — Planning iCal ADE + remplacement enseignants
- Module 6 — Administration campus (validation SIRET, exports)
- Module 7 — Multi-écoles

## Flux SIRET professeur

1. Questionnaire micro-entreprise → `pending_siret` (si attente INPI)
2. PDF guide + Guichet Unique INPI
3. Prof déclare son SIRET (`PATCH /api/profile/siret`)
4. RH valide dans `/admin/membres` → `active`
5. Stripe Connect + publication de créneaux

Compte test pending : `prof.enattente@ensam.eu` (`pnpm seed-professor-pending`)

## Règle d'or

Un campus pilote, un cas d'usage (tutorat), avant expansion.

## Stack

React 18 + Vite + Express + Supabase + Stripe Connect — monorepo pnpm, déploiement cible Cloud Run.

## Flux financier (exemple 40 €)

Commission SASU 5 € → base 35 € → URSSAF 21,1 % → net ~26,84 € (standard).

## Roadmap

1. **Phase 1 (MVP)** — Modules 1–4, CI/CD, 20 tuteurs pilote
2. **Phase 2** — 8 campus, planning, admin campus, URSSAF auto
3. **Phase 3** — Autres grandes écoles, licence par établissement
