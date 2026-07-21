# Plan de test — Double confirmation post-séance

Objectif : vérifier qu’un prof **n’est payé qu’après** confirmation élève **et** prof que le cours a eu lieu.

URL locale typique : http://localhost:5174/ (ou `:5173`) · API : http://localhost:3001

---

## Prérequis (une fois)

1. App lancée :
   ```bash
   pnpm dev
   ```
2. Migration 030 appliquée :
   ```bash
   pnpm --filter @gadz-connect/api apply-migration-030
   ```
3. Stripe en local (recommandé pour voir le Transfer) :
   ```bash
   pnpm --filter @gadz-connect/api stripe-listen
   ```
4. Prof avec **Stripe Connect** terminé (`prof.martin@ensam.eu` en principe).

### Comptes

| Rôle | Email | Mot de passe |
|------|--------|--------------|
| Élève | `eleve.dupont@ensam.eu` | `Eleve-Dupont!` |
| Prof | `prof.martin@ensam.eu` | `Prof-Martin!` |
| Admin | `jules.henri@ensam.eu` | `Pilotage-RH!` |

Astuce : 3 fenêtres de navigation privée (élève / prof / admin).

---

## Cas 1 — Parcours heureux (double validation → paiement)

### Étape A — Réserver et payer (élève)

1. Connexion **élève**.
2. Marketplace → **Prof Martin** → réserver un créneau.
3. Payer en carte test : `4242 4242 4242 4242` · date future · CVC quelconque.
4. Vérifier : cours **confirmé** (`scheduled`), créneau bloqué.

**Attendu**
- Paiement OK.
- Le prof **n’a pas encore** reçu le Transfer (fonds sur la plateforme).
- Transaction : `prof_payout_status = pending_session_confirmation`.

### Étape B — Faire passer le cours « dans le passé »

Sans attendre 1 h, dans **Supabase SQL Editor** (remplace `COURSE_ID`) :

```sql
UPDATE courses
SET scheduled_at = now() - interval '1 hour',
    status = 'awaiting_session_confirmation'
WHERE id = 'COURSE_ID';
```

Ou laisse le job le faire :
```bash
pnpm --filter @gadz-connect/api course-session-jobs
```
(si `scheduled_at` est déjà passé).

**Attendu**
- Statut cours : `awaiting_session_confirmation` (« À confirmer (post-séance) » côté admin).
- Notification type *Confirmer le cours* possible.

### Étape C — Une seule confirmation (ne doit PAS payer)

1. Connexion **élève** → Planning / détail du cours passé.
2. Cliquer **« Je confirme que le cours a eu lieu »**.
3. Badges : Élève ✓ · Prof —

**Attendu**
- Pas de Transfer Stripe.
- Toujours `pending_session_confirmation`.
- Message du type « En attente de l’autre partie ».

### Étape D — Deuxième confirmation (doit payer)

1. Connexion **prof** → Planning / détail du même cours.
2. Cliquer **« Je confirme que le cours a eu lieu »**.
3. Badges : Élève ✓ · Prof ✓.

**Attendu**
- Statut → `completed`.
- Message « Séance confirmée par les deux parties ».
- Notification *Séance validée*.
- Transaction → `prof_payout_status = paid` + `prof_payout_transfer_id` renseigné.
- Sur le dashboard Stripe Connect du prof : Transfer ~37 € (si cours à 40 €).

---

## Cas 2 — Ordre inverse (prof d’abord)

1. Même setup (cours passé, `awaiting_session_confirmation`).
2. **Prof** confirme en premier → Élève — · Prof ✓ · pas de paiement.
3. **Élève** confirme ensuite → paiement déclenché.

**Attendu** : même résultat que le cas 1 (l’ordre ne compte pas).

---

## Cas 3 — Litige admin (optionnel)

Sans double confirm pendant 7 jours, le job ouvre un litige. Pour simuler tout de suite :

```sql
UPDATE courses
SET session_dispute_status = 'open',
    status = 'awaiting_session_confirmation',
    scheduled_at = now() - interval '8 days'
WHERE id = 'COURSE_ID';
```

Puis (ou via job) :
```bash
pnpm --filter @gadz-connect/api course-session-jobs
```

### Admin — forcer le paiement

```bash
# Avec un token admin, ou depuis le navigateur (DevTools) si tu ajoutes l’UI plus tard :
curl -X POST http://localhost:3001/api/admin/courses/COURSE_ID/force-session-confirmation \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

**Attendu** : confirmations forcées + payout + `session_dispute_status = resolved_paid`.

### Admin — rembourser

```bash
curl -X POST http://localhost:3001/api/admin/courses/COURSE_ID/refund-session \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

**Attendu** : remboursement Stripe + cours `cancelled` + `resolved_refunded`.

---

## Checklist rapide

| # | Check | OK ? |
|---|--------|------|
| 1 | Réservation + carte OK | ☐ |
| 2 | Après paiement seul, pas de Transfer au prof | ☐ |
| 3 | Cours passé → `awaiting_session_confirmation` | ☐ |
| 4 | 1 seule confirm → pas de paiement | ☐ |
| 5 | 2 confirms → Transfer + `paid` | ☐ |
| 6 | UI badges Élève/Prof cohérents | ☐ |
| 7 | (Option) admin force / refund | ☐ |

---

## Où regarder dans l’UI

| Qui | Où |
|-----|-----|
| Élève | Planning → clic sur le cours passé → bloc **Confirmer que le cours a eu lieu** |
| Prof | Idem planning prof |
| Admin | `/admin` → cours (statut « À confirmer (post-séance) ») |
| Stripe | Dashboard → Connect → Transfers (mode Test) |

---

## Si ça ne marche pas

| Symptôme | Piste |
|----------|--------|
| Pas de bouton post-séance | Cours encore futur, ou migration 030 absente |
| Confirm OK mais pas de Transfer | Stripe Connect du prof incomplet, ou `stripe-listen` / clés manquantes |
| Erreur colonne SQL | Relancer `apply-migration-030` |
| Port 5173 occupé | Utiliser l’URL affichée par Vite (souvent 5174) |

---

## Scénario minimal (5 minutes)

1. Élève réserve + paie Martin.  
2. SQL : `scheduled_at` = il y a 1 h + `awaiting_session_confirmation`.  
3. Élève confirme seul → **pas** de payout.  
4. Prof confirme → **payout**.  
5. Vérifier Stripe Transfer + statut `paid`.
