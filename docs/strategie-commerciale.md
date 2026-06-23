# Stratégie commerciale — Gadz'Connect

> Document de travail. Recommandations issues d'une analyse du projet (dépôt + `docs/BUSINESS-PLAN-PROVISOIRE.md`) et du marché réel (recherches web, juin 2026).  
> **Campus pilote confirmé : Aix** (affiché « Aix-en-Provence » dans l'app).

---

## 1. ANALYSE

### 1.1 Le projet (offre, prix, marge, cycle de vente, capacité)

**Ce qui est vendu (en une phrase)**  
Gadz'Connect est une marketplace intra-campus qui met en relation élèves et tuteurs Arts et Métiers, automatise l'onboarding micro-entreprise des tuteurs (SIRET, URSSAF, Stripe Connect) et fournit un cockpit RH gratuit — **Gadz'Connect se rémunère uniquement via une commission sur chaque heure de cours payée**.

**À qui — qui paie vs qui utilise**

| Segment | Utilise | Paie | Rôle commercial |
|---------|---------|------|-----------------|
| **Élèves** | Marketplace, réservation | Le cours (~40 €/h + commission) | **Payeur du GMV** (volume de ventes) — cible activation |
| **Enseignants-tuteurs** | Onboarding ME, créneaux, paiements | Indirectement : 15 % prélevés sur le cours | **Crée l'offre** — levier d'activation n°1 |
| **RH / admin campus** | Cockpit `/admin`, budgets, supervision | **0 €** — outil gratuit | **Canal de distribution**, pas acheteur — facilite le déploiement |
| **SASU Gadz'Connect** | — | Commission **15 %** / heure réalisée | Revenu unique |

**Modèle économique actuel (codé) vs cible**

| Élément | État actuel (code) | Cible (`BUSINESS-PLAN-PROVISOIRE.md`) |
|---------|-------------------|--------------------------------------|
| Commission | **5 € fixe / cours** (`fiscal.ts`) | **15 % du montant horaire** (ex. 6 € sur 40 €/h) |
| Coût campus | — | **0 €** — jamais facturé |
| Licence campus | — | **Écartée** (choix fondateurs) |
| Checkout élève Stripe | **Partiel** (`pending`) | Live fin An 1 (scénario base) |
| Panier moyen hypothèse | 40 €/h | 30–60 €/h selon matière |

**Marge (ce qui reste après les coûts de livraison)**

Sur une heure à 40 € (hypothèse business plan) :

| Poste | Montant |
|-------|---------|
| Commission perçue (15 %) | 6,00 € |
| Coûts variables (infra ~0,05 € + Stripe ~0,89 € si absorbé) | −0,94 € |
| **Marge brute / heure** | **~5,06 € (84 %)** |

**Cycle de vente**

| Type | Durée | Applicabilité |
|------|-------|---------------|
| **Déploiement campus (gratuit)** | 2–4 semaines | Pas de cycle budgétaire — la RH dit oui si l'effort est faible |
| **Activation tuteur** | 15 min (SIRET existant) à 15 jours (création ME) | Cycle court |
| **Premier cours élève** | Quelques jours après publication des créneaux | Dépend de la densité offre/demande |
| **Premier encaissement commission** | Immédiat au paiement Stripe | Bloqué tant que checkout non finalisé |

**Différenciation**

1. **Gratuit pour le campus** — barrière d'adoption quasi nulle côté RH (vs licence SaaS 6–18 k€).
2. **Vertical ENSAM + campus Aix** — confiance, cloisonnement `@ensam.eu`, 8 campus seedés.
3. **Compliance intégrée** — SIRET + URSSAF + Stripe dans un flux unique (Superprof ne le fait pas).
4. **Commission 15 %** — alignée sur le marché ([Superprof ~10–20 %](https://www.superprof.com/help/tutors/tutor-payment/how-to-get-paid/68/)).

**Capacité de livraison (juin 2026)**

| Paramètre | Valeur |
|-----------|--------|
| **Campus pilote** | **Aix-en-Provence** |
| **Objectif An 1 (scénario base)** | 20 tuteurs · 150 élèves · **2 700 h** de cours |
| **CA An 1 cible** | **~16 k€** de commission (15 % × 108 k€ GMV) — déficit −64 k€ vs coûts fixes ~80 k€ |
| **Équipe** | **1–2 fondateurs** An 1–2 ; budget marketing **quasi nul** (canaux gratuits + réseau campus) |
| **Capacité commerciale** | **1 campus à la fois** en Phase 1 — ne pas lancer campus 2 tant qu'Aix n'a pas ≥ 15 tuteurs actifs et ≥ 30 séances |

---

### 1.2 Le marché (acheteurs, pouvoir d'achat, prix concurrents, canaux, objections — sources citées)

#### Qui décide et qui paie vraiment

- **La RH campus Aix** n'est pas l'acheteur — c'est un **sponsor de déploiement** : elle autorise la communication, prête sa crédibilité, facilite l'accès aux listes `@ensam.eu`.
- **L'élève** paie le cours → c'est lui qui génère le GMV et donc votre commission.
- **Le tuteur** choisit de rester sur la plateforme (ou de contourner) → c'est lui qui crée l'offre.

**Pouvoir d'achat élève (supérieur)** : **30–60 €/h** ([Cours Legendre — 2026](https://cours-legendre.fr/tarif-cours-particuliers/)). À 40 €/h, une commission de 15 % (= 6 €) reste dans les standards marketplace.

**Marché global** : ~**2 Md€/an** de soutien scolaire en France ([GoStudent — mars 2026](https://www.gostudent.org/fr-fr/blog/statistiques-sur-le-marche-du-soutien-scolaire)), dont une part importante encore informelle.

#### Comment le tutorat fonctionne aujourd'hui à l'ENSAM

- Tutorat **bénévole** entre pairs (associations type Les Chèvres, Cordées OPTIM — 60–86 tuteurs mobilisés sur certains campus) ([Arts et Métiers](https://artsetmetiers.fr/fr/actualites/forte-mobilisation-etudiante-du-campus-arts-et-metiers-de-cluny-dans-la-cordee-optim), 2025).
- **Superprof** : Pass Élève ~39 €/mois, tarif moyen ~22 €/h, 10 % si paiement en ligne ([Superprof](https://www.superprof.fr/blog/prix-cours-particuliers/), mars 2026).
- **Excel + virement manuel** : status quo admin campus — concurrent n°1 pour l'adoption RH.

#### Objections classiques

| Objection | Qui | Réponse clé |
|-----------|-----|-------------|
| « On a déjà Excel / WhatsApp » | RH Aix | « C'est gratuit pour vous. On automatise SIRET + paiements — vous ne perdez rien. » |
| « Les étudiants se débrouillent gratuitement » | Direction | « On monétise et encadre ceux qui veulent aller plus loin — sans remplacer le bénévolat. » |
| « 15 % c'est cher » | Tuteur | « Superprof prend 10–20 %. Ici vous avez l'onboarding ME complet + visibilité campus qualifiée. » |
| « Encore un outil à adopter » | RH | « 0 €, 1 mail de com' et 1 atelier tuteur d'1 h — c'est tout ce qu'on vous demande. » |
| « Le paiement n'est pas prêt » | Sponsor interne | Bloquant — priorité technique avant toute com' élève |

#### Canaux qui fonctionnent vs à éviter

| Fonctionne | À éviter |
|------------|----------|
| Sponsor RH Aix + mail `@ensam.eu` | Vente de licence / cycle budgétaire 12 mois |
| BDE Aix + WhatsApp promo (Plan B si RH lente) | Google Ads B2C (CAC incompatible avec 6 €/h de commission) |
| Atelier collectif tuteurs (15 min express SIRET) | Expansion campus 2 avant preuve Aix |
| 2 ambassadeurs par promo | Salons EdTech sans pipeline |
| Bouche-à-oreille intra-promotion | Se positionner comme « Superprof de l'ENSAM » |

---

### 1.3 Synthèse & insights

**Meilleurs leviers court terme (campus Aix)**

1. **Sponsor RH / vie étudiante Aix** — débloque le mail officiel et la légitimité.
2. **Tuteurs avec SIRET existant** — parcours express 15 min, conversion rapide.
3. **Élèves en difficulté technique** (mécanique des fluides, maths, thermodynamique) — besoin documenté dans les écoles d'ingénieurs.

**3 insights non évidents**

1. **Vous ne vendez pas à la RH — vous l'enrôlez comme partenaire de distribution.** Le « closing » commercial, c'est un mail campus + un atelier, pas un bon de commande.
2. **Le concurrent n°1 est le gratuit intra-campus**, pas Superprof. Argument : « Cordées → Connect » (pont bénévolat → monétisation légale).
3. **An 1 est structurellement déficitaire** (−64 k€ en scénario base) : l'enjeu commercial An 1 n'est pas le profit mais la **preuve de volume** (2 700 h) pour justifier l'expansion réseau An 2.

---

### 1.4 Cadrage validé (business plan + décision fondateur)

| Question | Réponse |
|----------|---------|
| **Campus pilote** | **Aix-en-Provence** — seul campus cible Phase 1 |
| **Sponsor RH** | À identifier (scolarité Aix, vie étudiante, ou contact produit existant) — statut canal mail `@ensam.eu` : **à clarifier** |
| **Objectif CA An 1** | **~16 k€** de commission (scénario base) — premiers encaissements dès checkout live ; pas de revenu licence |
| **Équipe / capacité** | **1–2 fondateurs** ; budget marketing quasi nul ; canaux gratuits et réseau campus uniquement |
| **KPIs pilote Aix** | 20 tuteurs actifs · 150 élèves · 2 700 h/an · 100+ h réservées à M+3 |
| **Seuil expansion** | Ne pas lancer campus 2 tant qu'Aix < 15 tuteurs actifs ou < 30 séances |

**Action immédiate — 3 questions RH Aix** (mail 5 min) :

1. Peut-on envoyer un mail ciblé aux étudiants Aix via une liste `@ensam.eu` ?
2. Peut-on afficher une affiche A4 dans les salles de TD ?
3. Qui est le bon interlocuteur pour co-animer un atelier tuteur de 1 h ?

---

## 2. STRATÉGIE COMMERCIALE

### Modèle de tarification & justification du prix

**Modèle retenu : marketplace take-rate 15 % — campus gratuits** (`BUSINESS-PLAN-PROVISOIRE.md`).

| Élément | Valeur | Justification |
|---------|--------|---------------|
| **Commission Gadz'Connect** | **15 % du montant horaire** | Comparable Superprof (10–20 %) ; scale avec le tarif (6 € à 40 €/h, 9 € à 60 €/h) |
| **Coût campus** | **0 €** | Élimine le cycle budgétaire ; la RH déploie sans arbitrage financier |
| **Coût tuteur** | 0 € d'abonnement | Frein offre minimal — commission seulement si cours réalisé |
| **Tarif horaire tuteur** | Libre, 30–60 €/h | Cohérent marché supérieur ; 40 €/h = référence simulateur fiscal |

**Pourquoi ne pas vendre de licence campus**

Le business plan écarte explicitement la licence : elle **freine l'adoption** alors que le campus est un **canal de distribution**, pas un client. À 15 % sur 2 700 h An 1, le revenu est faible (−64 k€) — ajouter une friction d'achat B2B ne compense pas.

**Pourquoi migrer de 5 € fixe → 15 %**

À 40 €/h : 5 € = 12,5 % (proche de 15 %). Mais à 60 €/h : 5 € = 8 % seulement — vous sous-monétisez les matières premium. La commission proportionnelle aligne revenus et valeur.

---

### Canaux de vente retenus & écartés

#### Retenus — par effort/revenu

| # | Canal | Pourquoi sur Aix | Effort | Revenu | Cash |
|---|-------|------------------|--------|--------|------|
| **P0** | Mail cadrage + sponsor RH Aix | 0 € pour la RH = oui rapide ; mail `@ensam.eu` = reach massif | Faible | Activation → GMV | Semaines |
| **P0** | Atelier « Devenir tuteur en 15 min » | Le frein est l'admin ME, pas la motivation | 1 h | Offre marketplace | 2–4 sem. |
| **P0** | 2 ambassadeurs par promo | Bouche-à-oreille ciblé, quasi gratuit | Faible | Tuteurs + élèves | Continu |
| **P1** | BDE Aix (Plan B) | WhatsApp promo si RH lente | Faible | Activation | Semaines |
| **P1** | Mail élèves Aix (post-tuteurs) | Demande captée quand offre prête | Faible | GMV → commission | 4–8 sem. |
| **P2** | Réplication campus 2 (An 2) | Preuve Aix comme référence | Moyen | 49 k€ rev. An 2 base | An 2 |

#### Écartés

| Canal | Raison |
|-------|--------|
| Vente licence campus | Écartée par les fondateurs — freine l'adoption |
| Démarchage froid national | 1–2 fondateurs, 1 campus — pas la bande passante |
| Google Ads / Meta B2C | CAC >> LTV à 6 €/h de commission |
| Superprof (y être listé) | Dilue le positionnement intra-campus |
| Campus 2 avant preuve Aix | Dispersion = échec PMF |

---

### Cibles à fort potentiel (Aix)

#### 1. Sponsor RH / vie étudiante Aix

- **Douleur** : tutorat informel, budgets opaques, conformité SIRET.
- **Coût pour elle** : 0 € + 1 mail + 1 atelier.
- **Déclencheur** : rentrée, partiels, pression réussite.
- **Où** : service scolarité Aix, vie étudiante, contact produit existant.

#### 2. Tuteur express SIRET (L3/M1/M2 Aix)

- **Douleur** : veut monétiser sans week-end administratif.
- **Déclencheur** : atelier collectif, besoin d'argent, demande de sa promo.
- **Où** : BDE, délégués, anciens tuteurs Cordées/bénévoles.

#### 3. Élève 2A bloqué avant partiels

- **Douleur** : mécanique des fluides, maths, thermodynamique.
- **Budget** : 40 €/h acceptable (marché 30–60 €).
- **Déclencheur** : partiels dans 3 semaines, recommandation parrain/ambassadeur.

---

### Argumentaire de vente

**Proposition de valeur (RH)**  
« Gadz'Connect est gratuit pour le campus Aix. En un mail et un atelier d'1 h, vos étudiants accèdent à un tutorat encadré, conforme et traçable — sans charge Excel pour votre équipe. »

**Proposition de valeur (tuteur)**  
« Publiez vos créneaux en 15 min, on gère le SIRET et les paiements. Vous fixez votre tarif, on prend 15 % seulement quand un cours a lieu. »

**Proposition de valeur (élève)**  
« Des Gadz' d'Aix certifiés, sur votre campus, avec réservation et paiement en ligne — pas d'abonnement, pas de Pass mensuel. »

**Preuves à construire**

- [ ] 1ère transaction Stripe `succeeded` en prod
- [ ] 20 tuteurs actifs Aix avec créneaux publiés
- [ ] Simulateur fiscal « 40 € → net tuteur » (déjà en place)
- [ ] Témoignage 1 tuteur + 1 élève Aix
- [ ] Dashboard admin : heures, GMV, commissions

**Réponses aux objections**

| Objection | Réponse |
|-----------|---------|
| « C'est trop cher » (tuteur) | « À 40 €/h, 15 % = 6 €. Superprof prend pareil sans gérer votre micro-entreprise. » |
| « Excel suffit » (RH) | « Gratuit pour vous. Si ça ne marche pas, vous n'avez rien perdu. » |
| « Gratuit entre nous » (élève) | « Ici c'est encadré, payé légalement, avec créneaux garantis et suivi. » |
| « Pas le temps » (RH) | « 1 mail + 1 atelier. On fait le reste. » |

---

### Leviers de conversion

| Levier | Application Aix |
|--------|-----------------|
| **Gratuit campus** | Supprime tout frein d'achat RH |
| **Atelier collectif tuteurs** | Réduit friction offre |
| **Ambassadeurs promo** | Confiance pair-à-pair |
| **Affiche + QR code TD** | Capture demande passive |
| **1re heure offerte** (si budget vie étudiante) | Déclenche essai élève — coût ~40 €/élève |
| **Urgence partiels** | Com' ciblée 3 semaines avant examens |

---

### Tactiques originales (peu exploitées)

1. **« Cordées → Connect »** — Session co-animée RH + tuteurs bénévoles : monétisation légale du tutorat déjà pratiqué.
2. **« Simulateur net tuteur » en affichage campus** — Curseur tarif 20–50 € + « X cours/mois » → net estimé. Concret, différenciant.
3. **« Pack partiels S1/S2 »** — Com' 3 semaines avant examens : tuteurs par matière + créneaux urgents.
4. **« Fiche conformité URSSAF » pour la RH** — 1 page : chaque tuteur est immatriculé, déclaré, payé. Argument vs Excel.
5. **« Tuteur ambassadeur »** — 1 par promo ; 1 cours offert (campus ou Gadz') pour chaque nouveau tuteur onboardé.

---

### Priorisation (effort/revenu & rapidité d'encaissement)

| Priorité | Action | Revenu cible | Délai |
|----------|--------|---------------|-------|
| **P0** | Migrer commission 5 € → 15 % (`fiscal.ts`) | Alignement modèle | Semaines |
| **P0** | Finaliser checkout Stripe élève | Commission réelle | Semaines |
| **P0** | Sponsor RH Aix + mail tuteurs | Activation | Sem. 0–1 |
| **P1** | 20 tuteurs actifs Aix | Offre marketplace | Sem. 1–6 |
| **P1** | 150 élèves · 2 700 h → **16 k€** An 1 | GMV → commission | 6–9 mois |
| **P2** | Campus 2 (si Aix ≥ 15 tuteurs, ≥ 30 séances) | Expansion | An 2 |
| **Éviter** | Licence, pub B2C, campus 2 prématuré | — | — |

---

## 3. GUIDE D'EXÉCUTION

### Vue d'ensemble

```
Semaine 0     : Mail cadrage RH Aix + migration 15 % + checkout Stripe
Semaines 1–2  : Atelier tuteurs Aix → 20 profils actifs
Semaines 3–6  : Mail élèves Aix + affiches TD → premières heures payées
Mois 3–6      : Densifier (2 h/élève/mois) → cap vers 2 700 h/an
An 2          : Campus 2 seulement si Aix validé
```

---

### Phase 0 — Cadrage RH Aix (semaine 0)

- [ ] **Quoi** : Obtenir réponses aux 3 questions RH + identifier le sponsor.
- [ ] **Comment** : Mail « Gadz'Connect — pilote tutorat campus Aix » (modèle ci-dessous). Parallèlement : identifier 2 ambassadeurs par promo.
- [ ] **Temps** : 3–5 jours.
- [ ] **Résultat** : Sponsor nommé + accord mail `@ensam.eu` ou Plan B BDE confirmé.

**Contacts prioritaires Aix** : scolarité, vie étudiante, BDE Aix (Plan B WhatsApp).

---

### Phase 1 — Amorcer l'offre : tuteurs Aix (semaines 1–2)

#### Étape 1.1 — Atelier « Devenir tuteur en 15 min »

- [ ] **Quoi** : Onboarder 15–25 tuteurs en 1 session.
- [ ] **Comment** :
  1. RH ou BDE envoie l'invitation (modèle ci-dessous).
  2. Session 1 h sur site Aix : présentation 10 min + parcours sur laptop 40 min + Q&A 10 min.
  3. Prioriser parcours **express SIRET** (`existing_siret`).
  4. Campus sélectionné : **Aix-en-Provence** dans l'app.
- [ ] **Temps** : 1 h + 3 h prep/support.
- [ ] **Résultat** : ≥ 10 tuteurs avec SIRET actif + créneaux publiés.

#### Étape 1.2 — Ambassadeurs promo

- [ ] **Quoi** : 2 étudiants influents par promo identifiés comme relais.
- [ ] **Comment** : Message direct + brief 5 min (« partage le lien, on t'affiche comme tuteur ambassadeur »).
- [ ] **Temps** : 2 h.
- [ ] **Résultat** : Relais WhatsApp/Discord actifs.

---

### Phase 2 — Activer la demande : élèves Aix (semaines 3–8)

#### Étape 2.1 — Communication élèves

- [ ] **Quoi** : Mail campus Aix + affiche TD.
- [ ] **Comment** :
  1. Mail RH ou BDE (modèle ci-dessous) — insister : pas d'abonnement, tarifs affichés, campus Aix.
  2. Affiche A4 avec QR → `/app/cours` (campus Aix-en-Provence).
  3. Cibler 3 matières : mécanique des fluides, maths, thermodynamique.
- [ ] **Temps** : 1 jour prep + diffusion.
- [ ] **Résultat** : ≥ 30 séances réservées cumulées.

#### Étape 2.2 — Pack partiels (si calendrier compatible)

- [ ] **Quoi** : Pousser la réservation 3 semaines avant partiels.
- [ ] **Comment** : Relance WhatsApp ambassadeurs + mail rappel RH.
- [ ] **Temps** : 2 h.
- [ ] **Résultat** : Pic de réservations mesurable.

---

### Phase 3 — Mesurer & décider expansion (mois 3–12)

#### Étape 3.1 — Bilan mensuel (interne + sponsor RH)

- [ ] **Quoi** : Suivre heures, GMV, commission, tuteurs actifs.
- [ ] **Comment** : Export cockpit `/admin` + email sponsor (modèle ci-dessous).
- [ ] **Repères scénario base An 1** :

| Mois | Heures cumulées (cible indicative) | Revenu commission (~6 €/h) |
|------|-----------------------------------|---------------------------|
| M+3 | ≥ 100 h | ~600 € |
| M+6 | ≥ 500 h | ~3 000 € |
| M+9 | ≥ 1 500 h | ~9 000 € |
| M+12 | **2 700 h** | **~16 000 €** |

- [ ] **Résultat** : Décision éclairée pour campus 2.

#### Étape 3.2 — Règle de passage campus 2

- [ ] **Condition** : Aix ≥ **15 tuteurs actifs** ET ≥ **30 séances** réussies.
- [ ] **Sinon** : Densifier Aix (nouvel atelier, nouvelles matières, ambassadeurs).

---

### Fixer & négocier « le prix »

Ici le « prix » = **la commission 15 %** et le **tarif horaire libre du tuteur**.

**Annoncer la commission au tuteur**

> « Gadz'Connect prend **15 % sur chaque heure réalisée** — seulement quand un élève paie. Vous fixez librement votre tarif entre 30 et 60 €/h. À 40 €/h, vous touchez environ 26,84 € net après URSSAF. »

**Si le tuteur négocie**

| Demande | Réponse | Alternative |
|---------|---------|-------------|
| « Réduisez à 10 % » | « C'est le même ordre de grandeur que Superprof, avec l'admin ME en plus. » | Mettre en avant le parcours express gratuit |
| « Je préfère être payé en cash » | « Sans déclaration, vous risquez URSSAF + l'élève n'a pas de garantie. » | Montrer le simulateur net légal |
| « 15 % + URSSAF c'est trop » | « À 40 €/h, net ~27 €/h — comparez avec 0 € du bénévolat ou 15–20 €/h non déclaré avec le risque. » | Proposer un tarif horaire plus élevé (50 €) |

**Ne jamais** : commission 0 %, abonnement tuteur payant, ou promesse de licence campus gratuite « à vie » si le modèle change.

---

### Relancer et conclure (closing)

**Relances**

| Situation | Délai | Action |
|-----------|-------|--------|
| Pas de réponse mail RH Aix | J+5 | Relance courte + « qui est le bon interlocuteur ? » |
| Atelier fait, < 10 tuteurs actifs | J+14 | Atelier #2 ciblé promo spécifique |
| Créneaux publiés, 0 réservation | J+7 | Mail élèves + affiche TD |
| Prospect tuteur bloqué SIRET | J+3 | Message direct + aide 15 min |

**Closing RH (ce n'est pas un achat — c'est un accord de déploiement)**

1. « Pouvons-nous envoyer le mail aux tuteurs **lundi** et tenir l'atelier le **[date]** ? »
2. Silence 5 secondes.
3. « Qu'est-ce qui vous empêcherait de dire oui — c'est gratuit et on s'occupe de tout ? »

**Closing élève** : « Quel créneau vous arrange cette semaine avec [tuteur] ? » — aller directement à la réservation.

**Closing tuteur** : « Vous avez 30 min maintenant pour activer votre SIRET et publier 2 créneaux ? »

---

### Indicateurs à suivre

| Métrique | Définition | Bon (An 1 Aix) | À corriger |
|----------|------------|----------------|------------|
| **Tuteurs actifs** | SIRET actif + ≥ 1 créneau publié | ≥ 20 | < 10 à M+3 |
| **Heures / mois** | Cours `succeeded` | ≥ 300/mois (≈ 2 700/9 mois) | < 50/mois à M+6 |
| **Heures / élève / mois** | Volume / élèves actifs | ≥ 2,0 | < 1,0 |
| **GMV / mois** | Total payé par élèves | ≥ 12 k€/mois à M+9 | < 2 k€/mois à M+6 |
| **Revenu commission** | 15 % du GMV | ~16 k€ cumulé An 1 | < 3 k€ à M+6 |
| **Taux activation tuteur** | Atelier → créneaux publiés | ≥ 60 % | < 30 % |

**Pipeline simple (Google Sheets)**

| Contact | Campus | Étape | Prochaine action | Date |
|---------|--------|-------|------------------|------|
| [Nom RH] | Aix | RDV / Pilote | Atelier tuteurs | [date] |

Étapes : `Contact` → `Accord déploiement` → `Atelier tuteurs` → `Com' élèves` → `Volume OK` → `Expansion`

---

### Modèles prêts à l'emploi (Aix)

#### Mail cadrage RH Aix

```
Objet : Gadz'Connect — pilote tutorat campus Aix : besoin de 15 min

Bonjour [Prénom],

Nous lançons Gadz'Connect en pilote sur le campus Aix : plateforme
gratuite de tutorat entre Gadz', avec gestion automatique des
micro-entreprises et des paiements.

Trois questions pour avancer :
1. Envoi possible d'un mail @ensam.eu aux étudiants Aix ?
2. Affichage d'une affiche A4 dans les salles de TD ?
3. Qui co-anime un atelier tuteur d'1 h avec nous ?

Objectif pilote : 20 tuteurs actifs, puis activation élèves.
L'outil est gratuit pour l'établissement — nous ne facturons rien au campus.

Disponible 15 min la semaine du [date] ?

[Prénom] — Gadz'Connect — [téléphone]
```

#### Invitation atelier tuteur (RH ou BDE Aix)

```
Objet : [Campus Aix] Devenez tuteur Gadz'Connect — légal, payé, en 15 min

Bonjour,

Gadz'Connect permet aux Gadz' d'Aix-en-Provence de donner des cours
à leurs pairs — avec micro-entreprise, SIRET et paiements gérés
automatiquement.

Atelier collectif : [DATE] [HEURE] — [LIEU campus Aix]
Durée : 1 h. Apportez votre laptop.
Inscription : [URL] — choisir campus Aix-en-Provence

[Gadz'Connect]
```

#### Mail élèves Aix

```
Objet : [Campus Aix] Trouvez un Gadz' tuteur sur votre campus

Bonjour,

Des Gadz' d'Aix-en-Provence proposent des créneaux de tutorat
(maths, mécanique, thermodynamique…) sur Gadz'Connect.

→ Consultez les profils et réservez en ligne
→ Pas d'abonnement — vous payez uniquement le cours choisi
→ Lien : [URL] (campus Aix-en-Provence)

Bonne réussite aux partiels,
[Gadz'Connect]
```

#### Relance RH J+5

```
Objet : Re: Pilote tutorat campus Aix — 15 min ?

Bonjour [Prénom],

Je me permets de relancer — seriez-vous disponible 15 min pour
bloquer le pilote Gadz'Connect sur Aix ?

Si ce n'est pas votre périmètre, qui dois-je contacter
(vie étudiante, scolarité) ?

Merci,
[Prénom]
```

#### Bilan mensuel sponsor RH Aix

```
Objet : Gadz'Connect Aix — bilan [mois]

Bonjour [Prénom],

Bilan du pilote :
• Tuteurs actifs : [X]
• Heures réalisées ce mois : [Z]
• Volume total : [€] GMV
• Top matières : [liste]

Prochaine étape : [com' élèves / 2e atelier / affichage]

[Prénom]
```

#### Réponses objections (tuteur / RH / élève)

| Objection | Réponse |
|-----------|---------|
| « 15 % c'est trop » | « À 40 €/h = 6 €. Superprof prend 10–20 % sans gérer votre ME. » |
| « Gratuit pour le campus, c'est louche » | « On se rémunère uniquement sur les cours réalisés — comme Superprof, mais intra-campus. » |
| « Je trouve moins cher ailleurs » | « Sur Superprof, pas de garantie campus ni de tuteur certifié ENSAM Aix. » |

---

## Sources

- `docs/BUSINESS-PLAN-PROVISOIRE.md` — juin 2026 (modèle 15 %, campus gratuits, scénarios An 1–5)
- `docs/marketing-strategie.md` — juin 2026 (cadrage Aix, canaux, modèles)
- `docs/PLAN.md` — roadmap produit
- [GoStudent — Marché soutien scolaire](https://www.gostudent.org/fr-fr/blog/statistiques-sur-le-marche-du-soutien-scolaire) — mars 2026
- [Cours Legendre — Tarifs 2026](https://cours-legendre.fr/tarif-cours-particuliers/) — 2026
- [Superprof — Prix cours particuliers](https://www.superprof.fr/blog/prix-cours-particuliers/) — mars 2026
- [Superprof — Commission 10 %](https://www.superprof.com/help/tutors/tutor-payment/how-to-get-paid/68/) — 2025
- [Arts et Métiers — Cordée OPTIM Cluny](https://artsetmetiers.fr/fr/actualites/forte-mobilisation-etudiante-du-campus-arts-et-metiers-de-cluny-dans-la-cordee-optim) — 2025

---

*Document mis à jour le 15 juin 2026 — campus pilote : Aix-en-Provence · modèle : marketplace 15 %, campus gratuits.*
