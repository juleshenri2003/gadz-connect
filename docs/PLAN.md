# Gadz'Connect — Plan fonctionnel et technique

> Plateforme inter-campus Arts et Métiers — tutorat, gestion micro-entreprise, automatisation fiscale  
> Structure juridique : SASU Gadz'Connect — Code APE 85.59W

Document de référence produit. Voir le dépôt pour l'état d'implémentation courant.

## MVP (modules 1 à 4)

| Module | Objectif | Statut implémentation |
|--------|----------|----------------------|
| **1 — Auth & profils** | Magic link, rôles, campus, cloisonnement | En cours — parcours `/app/setup` |
| **2 — Onboarding micro-entreprise** | Questionnaire, PDF INPI, ACRE, auto-activation SIRET | En cours — parcours express (5 étapes) et complet (6 étapes) |
| **3 — Marketplace tutorat** | Recherche, profils, créneaux, réservation | En cours — MVP campus pilote |
| **4 — Gestion financière** | Stripe Connect, commission, URSSAF, net 48h | Partiel — calcul fiscal + réservation |

## V2 / V3

- Module 5 — Planning iCal ADE
- Module 6 — Administration campus (supervision exceptionnelle, exports)
- Module 7 — Multi-écoles

## Indisponibilité / annulation de séance

Prof ou élève qui ne peut pas assurer une séance : le cours passe en `cancelled`, le créneau est libéré sur le marketplace. L'élève peut réserver un autre tuteur via `/app/cours` (filtre matière depuis l'alerte).

## Flux SIRET professeur

**Principe : auto-validation maximale.** La RH intervient en exception (suspension, doublon SIRET, échec vérif API).

### Parcours express (`existing_siret`) — ~15 min

1. Setup profil + CV
2. Questionnaire fiscal + saisie SIRET existant → `active` immédiat
3. Stripe Connect + publication de créneaux

### Parcours complet (`new_micro`)

1. Setup profil + CV
2. Questionnaire fiscal → `pending_siret`
3. PDF guide + Guichet Unique INPI (milestone `inpi_sent`)
4. Prof déclare son SIRET (`PATCH /api/profile/siret`) → `active` automatique
5. Stripe Connect + publication de créneaux

Comptes test : `prof.enattente@ensam.eu`, `prof.express@ensam.eu`, `prof.complet@ensam.eu` (`pnpm seed-professor-pending`)

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
