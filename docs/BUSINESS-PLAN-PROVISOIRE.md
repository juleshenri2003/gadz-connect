# Gadz'Connect — Business plan PROVISOIRE

> **DOCUMENT PROVISOIRE** — toutes les projections ci-dessous sont des **hypothèses de travail**, à challenger et ajuster avec des données réelles (volume de cours, tarifs horaires, coûts effectifs). Ne pas traiter comme un engagement.

---

## 0. Résumé exécutif

| Élément | Contenu |
|---------|---------|
| **Produit** | Plateforme inter-campus pour le tutorat entre élèves et enseignants Arts et Métiers, avec onboarding micro-entreprise automatisé (SIRET, fiscalité) et back-office RH campus. |
| **Business model** | **Marketplace pure** : **gratuit pour les campus** (RH, élèves, tuteurs) · **15 % de commission** prélevée sur chaque heure de cours réalisée. |
| **Pari central** | La douleur admin+fiscale des profs-tuteurs (micro-entreprise, URSSAF, Stripe) est un frein réel à l'offre de tutorat ; Gadz'Connect la supprime gratuitement pour les campus et se rémunère uniquement quand un cours a lieu. |
| **Chiffres clés An 3 (scénario base, hypothèses)** | **~216 k€ ARR** · **~2 000 élèves actifs** · **~10 campus actifs** · **valorisation estimée 1,3–2,2 M€** |

> **Écart code vs modèle cible** : le code implémente aujourd'hui une commission fixe de **5 €/cours** (`apps/api/src/lib/fiscal.ts`). Le modèle retenu est **15 % du montant horaire** — à aligner dans le code avant mise en prod du checkout élève.

---

## 1. Produit et problème

### Problème résolu, pour qui, douleur principale

| Segment | Douleur | Ce que Gadz'Connect apporte |
|---------|---------|----------------------------|
| **Élèves** | Difficulté à trouver un tuteur fiable, même campus, même matière | Marketplace par campus, créneaux, réservation, répertoire par matière |
| **Enseignants-tuteurs** | Création micro-entreprise, SIRET, URSSAF, encaissement — barrière à l'entrée | Parcours express (~15 min) ou complet (6 étapes), PDF INPI/ACRE, Stripe Connect, simulateur fiscal |
| **RH / admin campus** | Supervision informelle du tutorat, budgets opaques, risque conformité | Cockpit `/admin` : utilisateurs, cours, budgets, planning, alertes — **sans coût pour l'établissement** |

### Ce que le produit fait déjà (factuel, base code)

- Auth Magic Link + 4 rôles · 8 campus seedés
- Onboarding micro-entreprise express et complet · auto-activation SIRET
- Marketplace : profils tuteurs, créneaux, réservation, annulation → rebook
- Calcul fiscal : commission **5 € fixe** (à migrer vers 15 %) · URSSAF 21,1 % / 10,6 % ACRE
- Stripe Connect Express (tuteurs) · checkout élève **non finalisé**
- Admin RH : dashboard, utilisateurs, budgets, cours, planning

### Différenciation / moat potentiel

| Avantage | Force | Limite |
|----------|-------|--------|
| **Gratuit pour le campus** | Barrière à l'adoption quasi nulle côté RH | Pas de revenu récurrent si le volume stagne |
| **Vertical ENSAM** | Connaissance métier (campus, rôles, fiscalité prof) | Marché initial étroit |
| **Compliance intégrée** | SIRET + URSSAF + Stripe dans un flux unique | Reproductible par un concurrent bien financé |
| **Réseau campus** | Effet réseau local (offre ↔ demande par campus) | Nécessite densité tuteurs/élèves |
| **Switching cost** | Profs onboardés + historique transactions | Faible avant densité atteinte |

---

## 2. Marché

### TAM / SAM / SOM (hypothèses)

| Niveau | Définition | Hypothèse | Raisonnement |
|--------|------------|-----------|--------------|
| **TAM** | GMV tutorat encadré enseignement supérieur FR | **~800 M€/an** | Marché tutorat privé FR ~2 Md€ ; ~40 % lié au supérieur |
| **SAM** | Grandes écoles avec tutorat peer-to-peer encadré | **~80 M€ GMV/an** | ~200 établissements × ~400 k€ tutorat/an (hyp.) |
| **SOM An 3 (revenus)** | 10 campus actifs, 36 000 h de cours | **~216 k€ ARR** (15 % × 1,44 M€ GMV) | Voir scénario base §5 |

> Toutes les tailles de marché sont des **ordres de grandeur** ; aucune étude de marché primaire n'a été réalisée.

### Segments cibles prioritaires

1. **Campus ENSAM pilote** — 1 campus, 20 tuteurs cible
2. **8 campus ENSAM** — déploiement réseau (gratuit, commission sur usage)
3. **Autres grandes écoles** — même modèle : accès gratuit, take-rate 15 %
4. **Secondaire** : profs vacataires hors tutorat (même stack micro-ME + paiement)

### Concurrents et positionnement

| Concurrent | Type | Positionnement Gadz'Connect |
|------------|------|----------------------------|
| **Superprof, Kelprof** | Marketplace B2C (commission ~15–20 %) | Gadz : intra-campus, confiance école, conformité fiscale prof, **gratuit côté établissement** |
| **Excel + virement manuel** | Status quo campus | Gadz : automatisation, traçabilité, zéro budget IT campus |
| **Solutions LMS** | LMS | Gadz : complément — focus tutorat + micro-ME |

---

## 3. Business model

### Modèle retenu : **Marketplace take-rate 15 % — campus gratuits**

**Principe :** Gadz'Connect ne facture **jamais** les campus. La rémunération vient exclusivement d'une **commission de 15 %** prélevée sur le montant de chaque heure de cours, au moment du paiement élève (Stripe).

**Justification :**

1. **Adoption campus maximale** — pas de cycle budgétaire, pas de procurement : la RH déploie sans arbitrage financier interne.
2. **Alignement total sur l'usage** — revenus proportionnels au volume réel de tutorat ; pas de « shelfware ».
3. **Comparable marché** — Superprof prend ~15–20 % ; 15 % est crédible et accepté par les tuteurs si la valeur admin+fiscale est réelle.
4. **Cohérent avec le produit** — la plateforme facilite le match et encaisse ; le campus est un **canal de distribution**, pas un client payant.

### Pricing (hypothèses)

| Élément | Valeur cible | Exemple (40 €/h) |
|---------|--------------|------------------|
| **Commission Gadz'Connect** | **15 % du montant horaire** | **6,00 €** par heure |
| Tarif horaire tuteur (fixé librement) | 30–60 €/h (hyp.) | 40 €/h |
| Part tuteur avant charges sociales | 85 % du brut | 34,00 € → net ~26,84 € après URSSAF (standard) |
| **Coût campus** | **0 €** | — |
| **Coût élève** | Tarif tuteur + commission incluse ou affichée | 40 € + 6 € = 46 € (selon UX retenue) |

> La commission peut être **incluse dans le prix affiché** (élève paie 46 €, tuteur reçoit sur base 40 €) ou **ajoutée au checkout** — choix UX à trancher.

### Gratuit vs commissionné

| Gratuit (tous utilisateurs) | Commission 15 % (au paiement) |
|-----------------------------|-------------------------------|
| Inscription élève / tuteur | Chaque heure de cours réalisée et payée |
| Marketplace, créneaux, réservation | Prélèvement automatique via Stripe Connect |
| Onboarding micro-entreprise complet | — |
| Cockpit admin RH (budgets, exports, alertes) | — |
| Simulateur fiscal | — |

### Modèles alternatifs envisagés et écartés

| Modèle | Verdict | Raison |
|--------|---------|--------|
| **Licence campus annuelle** | **Écarté** (choix fondateurs) | Freine l'adoption ; le campus n'est pas le payeur |
| **Commission fixe (5 €/cours, code actuel)** | **Écarté** | Ne scale pas avec les tarifs horaires ; 5 € = 12,5 % à 40 € mais seulement 8 % à 60 € |
| **Freemium B2C élève** | Écarté | L'élève paie déjà le cours ; la commission est transparente |
| **Abonnement tuteur** | Écarté | Freine l'offre ; le modèle marketplace standard est le take-rate |

---

## 4. Unit economics

### Coûts variables par heure de cours (hypothèse : 40 €/h)

| Poste | Montant | Notes |
|-------|---------|-------|
| **Revenu commission (15 %)** | **+6,00 €** | Base du calcul |
| Stripe (carte EU, sur GMV total ~46 €) | −0,89 € | 1,4 % + 0,25 € — souvent refacturé ou déduit du flux |
| Supabase + Cloud Run | −0,05 € | Négligeable à l'échelle |
| **Marge brute / heure (Stripe absorbé)** | **~5,06 € (84 %)** | |
| **Marge brute / heure (Stripe refacturé)** | **~5,95 € (99 %)** | |

### Sensibilité au tarif horaire (15 % fixe)

| Tarif tuteur | GMV/h | Commission 15 % | vs ancien modèle 5 € fixe |
|--------------|-------|---------------|---------------------------|
| 30 € | 30 € | **4,50 €** | −10 % |
| 40 € | 40 € | **6,00 €** | +20 % |
| 50 € | 50 € | **7,50 €** | +50 % |
| 60 € | 60 € | **9,00 €** | +80 % |

### Métriques clés (hypothèses An 2–3)

| Métrique | Hypothèse | Valeur |
|----------|-----------|--------|
| **Revenu / heure moyenne** | 40 € × 15 % | **6,00 €** |
| **GMV / campus actif / an** | 3 600 h de cours | **144 000 €** |
| **Revenu / campus actif / an** | 15 % du GMV | **~21 600 €** |
| **CAC campus** | Déploiement réseau ENSAM (gratuit) | **~500 €** (temps commercial + onboarding) |
| **LTV campus (3 ans)** | 21 600 € × 3 × rétention 80 % | **~52 000 €** |
| **LTV/CAC campus** | | **~100×** (hyp. — CAC faible car pas de vente B2B) |
| **Heures / élève / mois** | | **2 h** (hyp.) |
| **Coût onboarding tuteur** | Automatisé | **~5 €** |

> Le **vrai CAC** est le coût d'activation du réseau (tuteurs + élèves), pas la vente campus. Si le campus n'adopte pas la plateforme, LTV = 0 malgré un CAC campus faible.

### Seuil de rentabilité (hypothèses)

| Poste | An 1 | An 3 |
|-------|------|------|
| Coûts fixes | ~80 k€ | ~180 k€ |
| Marge / heure | ~5,50 € | ~5,50 € |
| **Heures nécessaires / an** | **~14 500 h** | **~33 000 h** |
| Équivalent (150 élèves × 2 h/mois × 9 mois) | ~2 700 h → **déficit An 1** | ~36 000 h → **proche breakeven An 3 base** |

---

## 5. Prévisions financières (3 scénarios)

### Hypothèses communes

- Année scolaire : **9 mois actifs** (sept–mai)
- Tarif horaire moyen : **40 €/h**
- Commission : **15 %** → **6 €/h** de revenu Gadz'Connect
- **Aucune licence campus**
- Équipe : 1–2 fondateurs An 1–2 ; +1 dev/support An 3
- Coûts fixes : **~80 k€** An 1 · **~120 k€** An 2 · **~180 k€** An 3

### Tableau consolidé (k€, arrondi)

| Année | Scénario | Campus actifs | Tuteurs | Élèves | Heures/an | GMV | **Rev. (15 %)** | Coûts | **Résultat** | **Cash cumulé** |
|-------|----------|---------------|---------|--------|-----------|-----|-----------------|-------|--------------|-----------------|
| **An 1** | Pessimiste | 1 | 8 | 60 | 540 | 22 | **3** | 90 | −87 | −87 |
| **An 1** | Base | 1 | 20 | 150 | 2 700 | 108 | **16** | 80 | −64 | −64 |
| **An 1** | Optimiste | 2 | 45 | 400 | 7 200 | 288 | **43** | 85 | −42 | −42 |
| **An 2** | Pessimiste | 1 | 15 | 120 | 1 080 | 43 | **6** | 110 | −104 | −191 |
| **An 2** | Base | 3 | 55 | 450 | 8 100 | 324 | **49** | 120 | −71 | −135 |
| **An 2** | Optimiste | 5 | 100 | 900 | 16 200 | 648 | **97** | 130 | −33 | −75 |
| **An 3** | Pessimiste | 2 | 25 | 200 | 1 800 | 72 | **11** | 140 | −129 | −320 |
| **An 3** | Base | 10 | 150 | 2 000 | 36 000 | 1 440 | **216** | 180 | 36 | −99 |
| **An 3** | Optimiste | 15 | 280 | 4 000 | 72 000 | 2 880 | **432** | 200 | 232 | 133 |
| **An 4** | Base | 18 | 250 | 3 500 | 63 000 | 2 520 | **378** | 250 | 128 | 29 |
| **An 5** | Base | 25 | 400 | 6 000 | 108 000 | 4 320 | **648** | 320 | 328 | 357 |
| **An 5** | Optimiste | 40 | 700 | 12 000 | 216 000 | 8 640 | **1 296** | 450 | 846 | 979 |

### Hypothèses clés par scénario

| Paramètre | Pessimiste | Base | Optimiste |
|-----------|------------|------|-----------|
| Heures / élève / mois | 1,0 | 2,0 | 2,5 |
| Nouveaux campus/an (An 2–3) | +0–1 | +3–5 | +6–10 |
| Rétention campus (plateforme utilisée) | 70 % | 85 % | 92 % |
| Checkout Stripe élève live | An 2 | An 1 fin | An 1 |
| Tarif horaire moyen | 35 € | 40 € | 45 € |

---

## 6. Valorisation estimée

> Fourchettes indicatives, **hypothèses** — marketplaces edtech / vertical SaaS : **5–12× revenus annuels** selon croissance GMV et marge.

### Fourchettes par année clé

| Horizon | Scénario | Rev. annuelle | Multiple (hyp.) | **Valorisation** |
|---------|----------|---------------|-----------------|------------------|
| **An 3** | Pessimiste | 11 k€ | 3–5× | **30–55 k€** |
| **An 3** | Base | 216 k€ | 6–10× | **1,3–2,2 M€** |
| **An 3** | Optimiste | 432 k€ | 8–12× | **3,5–5,2 M€** |
| **An 5** | Base | 648 k€ | 5–8× | **3,2–5,2 M€** |
| **An 5** | Optimiste | 1 296 k€ | 8–12× | **10–16 M€** |

### Facteurs valuation ↑ / ↓

| ↑ Valorisation | ↓ Valorisation |
|----------------|----------------|
| GMV croissant > 80 %/an | Volume de cours insuffisant An 1–2 |
| 10+ campus actifs avec densité tuteurs | Checkout élève non finalisé |
| Marge brute > 80 % | Tuteurs contournent la plateforme (tutorat informel) |
| Expansion hors ENSAM | Commission 15 % perçue comme élevée vs Superprof |
| Données rétention élèves solides | Dépendance à 1–2 campus pilotes |
| Commission alignée dans le code | Code encore sur 5 € fixe |

---

## 7. Ambitions pluriannuelles (roadmap business)

| Phase | Horizon | Objectif | Jalons mesurables |
|-------|---------|----------|-------------------|
| **Phase 1 — PMF campus** | An 1 | Valider tutorat + commission sur 1 campus | 20 tuteurs · 150 élèves · 2 700 h · checkout Stripe live · commission 15 % codée |
| **Phase 2 — Réseau ENSAM** | An 2–3 | 8 campus actifs, volume suffisant | 10 campus · 36 000 h/an · 216 k€ rev. · breakeven opérationnel |
| **Phase 3 — Multi-écoles** | An 4–5 | Extension grandes écoles | 25 campus · 648 k€ rev. · modules V2 (planning iCal, URSSAF auto) |
| **Phase 4 — Plateforme** | An 5+ | Référence tutorat encadré supérieur FR | 40+ campus · 1 M€+ rev. · option vacataires |

---

## 8. Scenarios de sortie (exits)

| Scénario | Horizon | Valo indicative | Probabilité | Conditions |
|----------|---------|-----------------|-------------|------------|
| **Acquisition stratégique edtech** | An 4–5 | **3–8 M€** | Moyenne | Rev. > 400 k€, GMV > 3 M€, 15+ campus actifs |
| **Acquisition institutionnelle ENSAM** | An 3–4 | **1–3 M€** | Faible–moyenne | Internalisation outil ; valo plafonnée |
| **Levée + scale** | An 2–3 | Dilution 15–25 % | Moyenne | Seed 300–600 k€ pour accélérer multi-campus |
| **Lifestyle / rentabilité** | An 3+ | Flux 30–80 k€/an fondateurs | **Élevée** | 8–10 campus, équipe 2 personnes, pas de levée — profil naturel du modèle take-rate |
| **Échec / pivot** | An 1–2 | ~0 | Non négligeable | < 10 tuteurs actifs M+6, contournement systématique, checkout jamais live |

---

## 9. Risques et hypothèses critiques

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Volume insuffisant** | Revenus << coûts fixes An 1–2 | **Élevée** | Densifier 1 campus avant expansion ; KPI heures/semaine |
| **Contournement plateforme** | Commission = 0 | Moyenne | Valeur admin ME + paiement sécurisé + visibilité marketplace |
| **Checkout Stripe retardé** | Aucun revenu réel | Élevée (état actuel) | Priorité technique immédiate |
| **Commission 15 % mal acceptée** | Tuteurs partent ou contournent | Moyenne | Benchmark Superprof ; valeur conformité fiscale |
| **Saisonnalité tutorat** | Trésorerie creuse été | Élevée | Trésorerie minimale 12 mois ; pas de coûts fixes lourds |
| **Dépendance 1 campus** | Risque concentration | Élevée An 1 | Sponsor RH + expansion campus 2 dès An 2 |
| **Code fiscal désaligné** | 5 € fixe vs 15 % cible | **Actuel** | Migrer `fiscal.ts` + flux Stripe avant prod |

### Hypothèses qui cassent le modèle si fausses

1. **2 h/élève/mois** en moyenne (sinon revenus ÷2)
2. Les tuteurs **acceptent 15 %** vs tutorat informel cash
3. Les campus **déploient** l'outil même gratuitement (effort RH non nul)
4. Le **checkout Stripe** est live avant fin An 1

---

## 10. Prochaines étapes (90 jours)

| # | Action | Objectif | Critère de succès |
|---|--------|----------|-------------------|
| 1 | **Migrer commission 5 € → 15 %** dans `fiscal.ts` + Stripe | Aligner code et modèle | Tests passent · simulateur affiche 15 % |
| 2 | **Finaliser checkout Stripe élève** | Activer le flux commission réel | 1ère transaction `succeeded` en prod |
| 3 | **Lancer pilote campus avec sponsor RH** | Valider PMF volume | 20 tuteurs · 10+ avec créneaux · 100+ h réservées |
| 4 | **Mesurer heures/élève/mois réelles** | Calibrer les projections | Dashboard GMV + heures sur 90 j |
| 5 | **Déployer CI/CD Cloud Run** | Prod stable | API en prod · monitoring basique |

---

*Document mis à jour le 15 juin 2026 — modèle : campus gratuits, commission 15 %/h.*
