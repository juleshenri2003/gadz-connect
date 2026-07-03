# Plan de test du guide INPI — onboarding auto-entrepreneur

Protocole de test manuel pour vérifier, en conditions réelles sur `procedures.inpi.fr`, que le guide d'immatriculation micro-entreprise de Gadz'Connect est complet et exact.

> Test **à blanc** : on parcourt le Guichet Unique jusqu'au récapitulatif / brouillon, **sans signer ni payer**. La signature est irréversible ; le brouillon reste accessible 1 an via « Accéder à mes brouillons ». Aucun risque, aucune entreprise créée.

## Source du guide testé

| Élément | Fichier |
|---------|---------|
| Contenu des 8 étapes (`INPI_STEPS`) | [`apps/web/src/features/onboarding/guide/content.ts`](../apps/web/src/features/onboarding/guide/content.ts) |
| Rendu accordéon des étapes | [`apps/web/src/features/onboarding/guide/OnboardingInpiStepGuide.tsx`](../apps/web/src/features/onboarding/guide/OnboardingInpiStepGuide.tsx) |
| Panneau page Micro-entreprise | [`apps/web/src/features/onboarding/MicroEnterpriseInpiGuidePanel.tsx`](../apps/web/src/features/onboarding/MicroEnterpriseInpiGuidePanel.tsx) |
| PDF personnalisé | [`apps/api/src/lib/pdf/inpi-guide.ts`](../apps/api/src/lib/pdf/inpi-guide.ts) |

Référence officielle : [INPI — Créer en tant que micro-entrepreneur](https://www.inpi.fr/realiser-demarches/formalites-dentreprises/creer-en-tant-que-micro-entrepreneur)

## Pré-requis

- [ ] Compte sur `procedures.inpi.fr` (ou FranceConnect) — gratuit.
- [ ] Documents PDF de test sous la main (CNI scannée, justificatif de domicile) pour vérifier l'étape pièces jointes.
- [ ] Navigateur **Firefox** (le guide signale que Safari pose problème pour la synthèse — à confirmer).
- [ ] Guide de la plateforme ouvert en parallèle (page Micro-entreprise) pour comparer chaque écran.

---

## Protocole solo INPI (~30 min)

Session à faire **seul**, même si tu es déjà auto-entrepreneur. Objectif : parcourir le Guichet Unique en **test à blanc** et comparer chaque écran au guide Gadz'Connect. **Tu t'arrêtes au récapitulatif — tu ne signes pas, tu ne paies pas.**

### Avant de commencer (5 min)

1. Ouvre **deux fenêtres côte à côte** :
   - **Gauche** : `https://procedures.inpi.fr/`
   - **Droite** : Gadz'Connect en local → connexion `prof.complet@ensam.eu` / `Prof-Complet!` → `/app/micro-entreprise#inpi-guide`
2. Ouvre aussi la [doc officielle INPI](https://www.inpi.fr/realiser-demarches/formalites-dentreprises/creer-en-tant-que-micro-entrepreneur) dans un 3ᵉ onglet (référence).
3. Prépare un bloc-notes (ou la grille en bas de ce doc) pour noter **libellés exacts**, **écrans manquants**, **messages d'erreur**.
4. Nomme ton brouillon de test : `TEST-GADZ-CONNECT` (tu pourras le retrouver 1 an).

> **Si tu es déjà immatriculé** : tu peux quand même parcourir presque tout le formulaire. À un moment l'INPI peut te signaler que tu as déjà une entreprise (souvent au n° de sécu). Ce n'est pas grave — note le message et continue à comparer les écrans **jusqu'où ça va**. L'objectif est de valider le **guide**, pas de créer une 2ᵉ entreprise.

### Étape 1 — Connexion (`connect`) — ~3 min

| # | Action sur l'INPI | Vérifier vs guide |
|---|-------------------|-------------------|
| 1 | Va sur `procedures.inpi.fr` | Le lien du guide fonctionne |
| 2 | Connecte-toi (compte INPI ou FranceConnect) | FranceConnect bien proposé |
| 3 | Si question « **Devenir compte administrateur de mon entreprise** » → réponds **NON** | Cette question existe-t-elle vraiment ? Libellé exact ? |
| 4 | Si demande d'un « nom de dossier » → mets `TEST-GADZ-CONNECT` | Confirmer que c'est bien un libellé interne |

**À noter** : captures ou copie des libellés si différents du guide.

### Étape 2 — Lancer la création (`begin`) — ~5 min

| # | Action sur l'INPI | Vérifier vs guide |
|---|-------------------|-------------------|
| 1 | Clique **« Créer, modifier ou cesser une entreprise »** (rubrique Entreprises) | Libellé exact du bouton |
| 2 | **« Création d'entreprise »** → **« Créer une entreprise »** | Chemin identique ? |
| 3 | Lis **« Préparez votre démarche »** → **« Continuer »** | Écran présent ? |
| 4 | **« Quelle forme d'entreprise ? »** → **Entrepreneur individuel** | |
| 5 | **« Souhaitez-vous opter pour le statut micro-entrepreneur ? »** → **Oui** | |
| 6 | Nomme le brouillon `TEST-GADZ-CONNECT` | Retrouvable via « Accéder à mes brouillons » ? |

**STOP si message** : « Vous avez déjà une entreprise » → note le texte exact et l'écran où ça bloque. Sinon continue.

### Étape 3 — Identité et établissement (`identity`) — ~5 min

Remplis les champs obligatoires (*) avec des **données fictives cohérentes** (pas besoin de ta vraie identité pour un test à blanc, sauf si l'INPI l'exige pour avancer).

| Rubrique INPI | Action | Vérifier vs guide |
|---------------|--------|-------------------|
| **Identité de l'entreprise** | Infos perso, **date de début d'activité**, **n° sécu** | Le n° sécu est-il demandé ici ? |
| **Composition** | Laisse vide si facultatif | Bien skippable pour un tutorat solo ? |
| **Insaisissabilité** | Laisse vide si facultatif | Idem |
| **Établissements** | Adresse = domicile fictif (ex. `1 rue Test, 13100 Aix`) | Champs obligatoires manquants dans le guide ? |

**À noter** : liste des champs obligatoires (*) que le guide ne mentionne pas.

### Étape 4 — Activité soutien scolaire (`activity`) — ~3 min

Dans **Établissements → Activité(s)**, suis le chemin du guide :

```
Activités de services → Enseignement → Autres enseignements → Soutien scolaire
```

| # | Vérifier |
|---|----------|
| 1 | Chaque libellé existe-t-il **exactement** comme dans le guide ? |
| 2 | Y a-t-il des niveaux intermédiaires en plus ? |
| 3 | Le code APE affiché est-il **85.59W** (ou autre) ? → note-le |
| 4 | Le bouton « copier le chemin » sur Gadz'Connect correspond-il ? |

### Étape 5 — Options fiscales (`fiscal`) — ~3 min

Toujours dans l'Étape 3 INPI (le guide la présente comme étape séparée — **note où elle apparaît réellement**).

| # | Action | Vérifier vs guide |
|---|--------|-------------------|
| 1 | Ouvre **« Options fiscales »** | Emplacement réel dans le parcours |
| 2 | Choisis **trimestrielle** (recommandation Gadz'Connect) | Mensuelle / trimestrielle proposées ? |
| 3 | Regarde l'option **versement libératoire** | Case présente ? Libellé exact ? |
| 4 | Cherche une case **ACRE** | **Point clé** : existe-t-elle encore ? Si oui, libellé exact. Si non, le guide est obsolète |

### Étape 6 — Pièces jointes (`documents`) — ~5 min

Tu n'as pas besoin d'uploader de vrais documents pour le test — **regarde seulement ce qui est demandé**.

| # | Vérifier |
|---|----------|
| 1 | Format **PDF, 10 Mo max** indiqué ? |
| 2 | **Pièce d'identité** listée ? |
| 3 | **Justificatif de domicile** listé ? |
| 4 | **Déclaration de non-condamnation** listée pour soutien scolaire ? |
| 5 | Rubrique **« Pièces supplémentaires »** présente ? (non mentionnée par le guide) |
| 6 | Mention **anonymisation des données** (depuis août 2025) visible ? |

**Optionnel** : uploade un PDF bidon (1 page blanche) pour voir si l'interface accepte le format.

### Étape 7 — Récapitulatif (`validate`) — ~3 min — **STOP ICI**

| # | Action | Vérifier vs guide |
|---|--------|-------------------|
| 1 | Passe par **Observations** (commentaire facultatif) | Ordre : Observations → Correspondance → Récapitulatif ? |
| 2 | Remplis **Correspondance** (coordonnées de contact) | Champs obligatoires ? |
| 3 | Ouvre **Récapitulatif** → vérifie chaque section | Cohérent avec ce que tu as saisi ? |
| 4 | Repère le bouton **« Valider le dossier »** | Libellé exact |
| 5 | Note le **tarif affiché** pour soutien scolaire (souvent 0 €) | Montant réel : _______ € |
| 6 | Repère les boutons **« Signer »** et **« Payer »** sans cliquer | Libellés exacts |

### **NE PAS FAIRE**

- Ne clique **pas** sur « Signer la demande » / « Signer la demande de création ».
- Ne clique **pas** sur « Payer » / module de paiement.
- La signature est **irréversible** et créerait une vraie formalité.

### Étape 8 — Suivi (`followup`) — contrôle rapide sans dossier signé — ~2 min

Sans dossier envoyé, tu ne peux pas tester la réception du SIRET. Fais seulement :

| # | Action | Vérifier |
|---|--------|----------|
| 1 | Retourne à l'accueil INPI → **« Suivi des formalités »** → **« État d'avancement des formalités »** | Ces libellés existent-ils ? |
| 2 | Vérifie **« Accéder à mes brouillons »** → ton brouillon `TEST-GADZ-CONNECT` est là | |
| 3 | Compare la description du guide (SIRET, régularisation, e-mail) avec ce que tu vois | Cohérent ? |

### Après la session (~5 min)

1. Remplis la **grille de résultats** en bas de ce doc.
2. Envoie-moi les écarts (ou remplis la grille toi-même) → on corrige `content.ts`.
3. Garde le brouillon INPI : tu pourras reprendre plus tard ou le supprimer.

### Récap visuel du parcours

```
procedures.inpi.fr
    │
    ├─ Connexion (+ compte admin ?)
    │
    ├─ Créer une entreprise
    │     └─ EI + micro-entrepreneur Oui
    │
    ├─ Étape 3 : formulaire
    │     ├─ Identité (*)
    │     ├─ Composition (facultatif)
    │     ├─ Insaisissabilité (facultatif)
    │     ├─ Établissements + Activité(s) → Soutien scolaire
    │     └─ Options fiscales (périodicité, libératoire, ACRE ?)
    │
    ├─ Étape 4 : Pièces jointes (PDF)
    │
    ├─ Étape 5-7 : Observations → Correspondance → Récapitulatif
    │     └─ ■ STOP — ne pas Signer / Payer
    │
    └─ (plus tard) Suivi → SIRET → Gadz'Connect
```

---

## Mapping guide Gadz'Connect ↔ étapes officielles INPI

| Étape guide (`INPI_STEPS`) | Étape(s) officielle(s) INPI |
|----------------------------|-----------------------------|
| `connect` + `begin` | Étape 1 (connexion) et Étape 2 (forme EI + micro, brouillon) |
| `identity` | Étape 3 — Identité / Composition / Insaisissabilité / Établissements |
| `activity` | Étape 3 — Établissements → Activité(s) |
| `fiscal` | Étape 3 — sous-rubrique **Options fiscales** (le guide en fait une étape séparée) |
| `documents` | Étape 4 — pièces jointes |
| `validate` | Étapes 5, 6, 7 — Observations/Correspondance/Récapitulatif → Valider → Signer → Payer |
| `followup` | Section « Après l'envoi » — Suivi, immatriculation, SIRET |

## Checklist de test par étape

Pour chaque écran INPI, contrôler :
- (a) l'écran existe-t-il tel que décrit par le guide ?
- (b) les libellés / boutons cités sont-ils exacts ?
- (c) le guide oublie-t-il un champ obligatoire ?
- (d) le guide mentionne-t-il un écran / une case qui n'existe plus ?

### 1. `connect` — Se connecter au Guichet Unique
- [ ] Le portail `procedures.inpi.fr` s'ouvre comme décrit.
- [ ] L'option **FranceConnect** est bien proposée.
- [ ] La question « **Devenir compte administrateur de mon entreprise → NON** » apparaît réellement (absente de la doc officielle : à confirmer).
- [ ] Le « nom de dossier » est bien un libellé interne sans impact.

### 2. `begin` — Débuter la formalité
- [ ] Chemin exact : « Créer, modifier ou cesser une entreprise » (rubrique Entreprises).
- [ ] « Création d'entreprise » → « Créer une entreprise ».
- [ ] Écran « Préparez votre démarche » → bouton « Continuer ».
- [ ] Question « Quelle forme d'entreprise ? » → **Entrepreneur individuel**.
- [ ] Case « Souhaitez-vous opter pour le statut micro-entrepreneur ? » → **Oui**.
- [ ] Possibilité de nommer le brouillon + « Accéder à mes brouillons » (1 an).

### 3. `identity` — Identité et établissement
- [ ] Rubrique « Identité de l'entreprise » (informations personnelles).
- [ ] **Date de début d'activité** demandée.
- [ ] **Numéro de sécurité sociale** demandé à cette étape (à confirmer).
- [ ] Rubriques « Composition » et « Insaisissabilité » bien **facultatives**.
- [ ] Rubrique « Établissements » → adresse (domicile).
- [ ] Le formulaire adresse Gadz'Connect invite à recopier la **même adresse**.

### 4. `activity` — Catégoriser l'activité
- [ ] Chemin exact dans l'arbre INPI : `Activités de services → Enseignement → Autres enseignements → Soutien scolaire`.
- [ ] Chaque libellé existe et est orthographié comme dans le guide (susceptible d'avoir changé).
- [ ] Le bouton « copier le chemin » de la plateforme correspond aux libellés réels.

### 5. `fiscal` — Options fiscales URSSAF & ACRE
- [ ] Rubrique « Options fiscales » présente **où** dans le parcours (dans l'Étape 3 selon l'INPI, alors que le guide en fait une étape distincte n°5).
- [ ] Choix de la **périodicité** (mensuelle / trimestrielle).
- [ ] Option **versement libératoire** présente.
- [ ] **Point clé** : l'INPI propose-t-il encore une case **ACRE** à la création, ou l'ACRE se demande-t-elle uniquement côté URSSAF ? (le guide dit « cocher NON à l'ACRE sur l'INPI » — confirmer que cette case existe encore).

### 6. `documents` — Pièces jointes obligatoires
- [ ] Format **PDF, 10 Mo max** par fichier.
- [ ] **Pièce d'identité** (CNI / passeport) demandée.
- [ ] **Justificatif de domicile** demandé.
- [ ] **Déclaration sur l'honneur de non-condamnation** demandée pour le soutien scolaire (activité non réglementée : à confirmer).
- [ ] Mention manuscrite de conformité sur la CNI : ajout du guide, **pas une exigence INPI officielle** — évaluer sa pertinence / son caractère bloquant réel.
- [ ] Présence d'une rubrique « Pièces supplémentaires » (non mentionnée par le guide).

### 7. `validate` — Vérifier (STOP avant signature)
- [ ] Rubriques « Observations » puis « Correspondance » puis « Récapitulatif » (vérifier l'ordre — l'INPI liste Observations → Correspondance → Récapitulatif).
- [ ] Bouton « Valider le dossier ».
- [ ] Message d'avertissement « Valider ≠ démarche terminée ».
- [ ] Info tarif affichée pour le soutien scolaire (souvent gratuit — **noter le montant réel**).
- [ ] **NE PAS** cliquer sur « Signer » ni « Payer » → arrêter le test ici.

### 8. `followup` — Suivi INSEE et SIRET (contrôle descriptif)
- [ ] « Suivi des formalités → État d'avancement des formalités » existe.
- [ ] Régularisation en cas de dossier incomplet (notification e-mail) cohérente.
- [ ] Description de la réception du SIRET (14 chiffres) et du retour sur Gadz'Connect cohérente.
- [ ] Astuce Firefox pour télécharger la synthèse encore valable ?

## Annexes du guide à contrôler

- [ ] **ACRE après coup** (section PDF) : parcours `autoentrepreneur.urssaf.fr → Demander l'ACRE` toujours valide.
- [ ] **CFE / formulaire 1447-C-K** : mention exonération 1re année et modalités de remplissage cohérentes.
- [ ] **Alerte arnaques** et **points de réassurance** (bourse, APL 6 000 €, taux 11 / 19 / 22 %) : cohérence (pas de test terrain).
- [ ] **Formulaire adresse Gadz'Connect** injecté sous l'étape identité : invite bien à recopier l'adresse INPI.
- [ ] **PDF personnalisé** : générer depuis la plateforme et vérifier que son récapitulatif (activité, périodicité, versement libératoire, ACRE) correspond aux choix du questionnaire fiscal.

## Écarts déjà pressentis (à confirmer sur le site)

1. **Options fiscales** : classées sous l'Étape 3 par l'INPI, mais présentées comme étape distincte n°5 par le guide.
2. **Question « compte administrateur → NON »** et **mention manuscrite CNI** : ajouts Gadz'Connect non présents dans la doc INPI — utiles mais à valider en réel.
3. **Gestion ACRE à la création INPI vs demande séparée URSSAF** : formulation du guide potentiellement datée.
4. **Ordre Observations / Correspondance / Récapitulatif** : vérifier qu'il correspond à l'écran réel.

## Grille de résultats (à remplir pendant le test)

| Étape | Écran conforme ? (Oui / Partiel / Non) | Écart constaté | Gravité (bloquant / moyen / mineur) | Correction proposée dans `content.ts` |
|-------|----------------------------------------|----------------|-------------------------------------|----------------------------------------|
| 1. `connect` | | | | |
| 2. `begin` | | | | |
| 3. `identity` | | | | |
| 4. `activity` | | | | |
| 5. `fiscal` | | | | |
| 6. `documents` | | | | |
| 7. `validate` | | | | |
| 8. `followup` | | | | |
| Annexe ACRE | | | | |
| Annexe CFE | | | | |
| Annexe arnaques / réassurance | | | | |
| PDF personnalisé | | | | |

## Prochaines actions après le test

À partir de la grille remplie :
1. Corriger la constante `INPI_STEPS` dans [`content.ts`](../apps/web/src/features/onboarding/guide/content.ts).
2. Si besoin, aligner le walkthrough du PDF dans [`inpi-guide.ts`](../apps/api/src/lib/pdf/inpi-guide.ts).
3. Mettre à jour `INPI_GUIDE_META.lastVerifiedAt` avec la date du test.
