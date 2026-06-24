# Plan de test plateforme — Gadz'Connect

Checklist manuelle + commandes d'exécution automatisée.

## Préparation

```bash
pnpm install
pnpm dev                          # web :5173 + API :3001
pnpm stripe-listen                # terminal séparé (webhooks Stripe)
pnpm seed:demo                    # seeds + align campus Aix + promote RH
```

## Exécution automatisée

```bash
pnpm test:platform              # tests API (sections 1–8)
BASE_URL=http://localhost:5173 pnpm test:e2e   # smoke UI Playwright
VERCEL_API_URL=https://votre-api.vercel.app pnpm test:platform  # smoke staging
```

Rapport généré : [`TEST-EXECUTION-REPORT.md`](./TEST-EXECUTION-REPORT.md)

## Comptes démo (campus Aix)

| Email | Mot de passe | Usage |
|-------|--------------|-------|
| `eleve.dupont@ensam.eu` | `Eleve-Dupont!` | Élève |
| `prof.martin@ensam.eu` | `Prof-Martin!` | Prof actif |
| `prof.enattente@ensam.eu` | `Prof-EnAttente!` | Pending SIRET |
| `prof.suspended@ensam.eu` | `Prof-Suspendu!` | Suspendu |
| `jules.henri@ensam.eu` | `Pilotage-RH!` | Admin RH |

## Checklist manuelle complémentaire

Les tests automatisés ne couvrent pas : paiement Stripe CB réelle, upload CV PDF, wizard fiscal complet, activation RH manuelle, export ZIP factures, déclaration indisponibilité élève.

Voir le plan détaillé (sections 3–7) pour la checklist exhaustive par interface.

### Parcours pilote minimal

1. Prof `prof.enattente@` → onboarding complet → SIRET
2. RH `jules.henri@` → `/admin/utilisateurs` → activer le prof
3. Prof → Stripe Connect + créneaux
4. Élève `eleve.dupont@` → réserver + payer `4242…`
5. RH → `/admin/budgets` → centre de facturation

Référence : [`MVP-PILOTE.md`](./MVP-PILOTE.md)
