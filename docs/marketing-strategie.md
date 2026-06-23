# Stratégie marketing — Gadz'Connect

> Document de travail. Recommandations issues d'une analyse du projet et du marché — 15 juin 2026.

---

## 1. ANALYSE

### 1.1 Le projet

**En une phrase :** Gadz'Connect est la plateforme fermée des campus Arts et Métiers qui permet à un Gadz' de réserver un cours avec un autre Gadz' du même campus, tout en gérant automatiquement la micro-entreprise du tuteur et les paiements.

| Dimension | Détail |
|-----------|--------|
| **Problème résolu** | Le tutorat intra-école est aujourd'hui fragmenté (Cordées bénévoles, messages WhatsApp, cours « au noir ») ; les étudiants qui veulent tutorater se perdent dans INPI, URSSAF et Stripe ; la RH n'a pas de visibilité sur l'activité ni sur les budgets. |
| **Cible** | **B2B2C** : étudiants Ensam (élèves + tuteurs), pilotés par la RH campus. Extension future : autres grandes écoles (licence). |
| **Différenciation** | Marketplace **fermée** (@ensam.eu, campus cloisonné) + **parcours micro-entreprise intégré** (questionnaire fiscal, guide INPI PDF, SIRET auto-activé, Stripe Connect) + **commission fixe transparente** (5 € sur un cours à 40 €) — ce combo n'existe sur aucune plateforme grand public. |
| **Stade** | **MVP en cours** — modules auth, onboarding micro, marketplace et finances partiellement implémentés. Règle d'or produit : un campus pilote, un cas d'usage (tutorat), 20 tuteurs pilotes avant expansion. |
| **Modèle économique** | Commission SASU fixe de **5 € par séance** + **tarif libre** fixé par chaque tuteur. Ex. à 40 € brut → ~26,84 € net ; à 25 € → ~15,84 € net (après commission et URSSAF 21,1 %). Phase 3 : licence par établissement. Pas d'abonnement élève, pas de Pass mensuel. |

**8 campus dans la base** : Aix, Angers, Bordeaux, Châlons, Cluny, Lille, Metz, Paris.

**Campus pilote confirmé : Aix** (affiché « Aix-en-Provence » dans l'app). Toute la Phase 1 marketing cible ce campus seul.

**Positionnement actuel dans le produit** (page de connexion) : « Plateforme inter-campus — Mise en relation, cours et micro-entreprise pour les campus Arts et Métiers. »

**Point critique marketing :** il n'existe pas de page d'accueil publique ni de landing page. L'entrée est la connexion magic link / e-mail campus. Toute la « communication produit » se fait donc hors plateforme (e-mails RH, bouche-à-oreille, affichage campus).

---

### 1.2 Le marché (sources citées)

#### Taille et dynamique — soutien scolaire / cours particuliers (France)

| Donnée | Source |
|--------|--------|
| Marché global estimé à **~2 milliards €/an** (déclaré + informel) | [Le Parisien](https://www.leparisien.fr/economie/soutien-scolaire-et-cours-a-domicile-comment-le-credit-dimpot-a-dope-le-marche-02-03-2025-UWNTFHFELJGHXOBOQXFV3HGNOU.php), mars 2025 |
| Part officielle/déclarée : **600–800 M€** ; le reste est largement informel (« au noir ») | [L'Express Franchise](https://lexpress-franchise.com/articles/le-soutien-scolaire-un-marche-en-pleine-expansion/), interview Jérôme Mattout (Anacours), 2025 |
| **~1 million d'élèves** accompagnés chaque année, primaire au supérieur | [Le Parisien — rentrée 2025](https://www.leparisien.fr/societe/rentree-scolaire-le-juteux-business-des-cours-particuliers-01-09-2025-QSWNHGZUWFESDBPD2DPSAIWBKM.php), sept. 2025 |
| Croissance structurelle : classes surchargées, pression concours, préparation CPGE/grandes écoles | [GoStudent — statistiques marché](https://www.gostudent.org/fr-fr/blog/statistiques-sur-le-marche-du-soutien-scolaire), 2025–2026 |
| **Maths = 58 %** des heures de cours (matière n°1) | [Le Parisien — rentrée 2025](https://www.leparisien.fr/societe/rentree-scolaire-le-juteux-business-des-cours-particuliers-01-09-2025-QSWNHGZUWFESDBPD2DPSAIWBKM.php) |

**Lecture pour Gadz'Connect :** le marché macro est gigantesque mais **hors périmètre direct** (parents, collégiens, lycéens). L'opportunité est le **segment intra-supérieur** : tutorat entre pairs dans les écoles d'ingénieurs — peu adressé par les pure players, très informel.

#### Concurrents directs et indirects

| Acteur | Type | Positionnement | Prix / modèle | Forces | Failles pour notre cible |
|--------|------|----------------|---------------|--------|--------------------------|
| **Les Sherpas** | Marketplace nationale | Étudiants grandes écoles, concours, CPGE | 14–35 €/h prof ; SAP possible | Sélection, notoriété, 30 000 familles | Hors Ensam, orienté parents/externes, pas de gestion micro intégrée |
| **SuperProf** | Marketplace mondiale | Toutes matières, tous publics | Pass Élève ~29–39 €/mois ; 0 % commission prof | Volume, liberté tarifaire prof | Pass mensuel opaque, frustrations renouvellement auto ([Enseigna](https://enseigna.fr/superprof-vs-completude/), [Que Choisir](https://forum.quechoisir.org/superprof-asso-de-consommateurs-arnaques-t267907-100.html)) ; pas de campus fermé |
| **Dream Team** | Marketplace | Mentors grandes écoles | Variable | Positionnement « excellence » | Externe, pas intra-école |
| **Clevermate** | Agence + plateforme | Prof particulier local | Variable | Ancrage local, sélection | Hors réseau Ensam |
| **GoStudent / Acadomia / Anacours** | Organismes structurés | Soutien scolaire classique | Élevé, forfaits | Qualité, crédit impôt SAP | Hors cible (mineurs, parents), coût |
| **TutorIA** (Paris-Saclay) | Outil open-source intra-université | Créneaux tutorat, LTI Moodle | Gratuit (institution) | Peer tutoring natif, open-source ([GitHub CentraleSupélec](https://github.com/CentraleSupelec/tutorat)) | Pas de paiement, pas de micro-entreprise, pas Ensam |
| **Izystud** | Plateforme étudiants | Partage de notes rémunéré | Gratuit côté lecteur | Communauté étudiante ([izystud.fr](https://izystud.fr/)) | Notes, pas séances live ; pas fiscal |
| **ETRE** (Ensam) | Portail scolarité officiel | Mail, emploi du temps, ressources ([etre.ensam.eu](http://etre.ensam.eu/)) | Institutionnel | Canal officiel, 100 % Gadz' | Pas marketplace, pas paiement |
| **Cordées / PHARES / OPTIM** | Dispositifs campus | Tutorat **bénévole** orientation/réussite ([Arts et Métiers — Cordées Cluny](https://artsetmetiers.fr/fr/actualites/forte-mobilisation-etudiante-du-campus-arts-et-metiers-de-cluny-dans-la-cordee-optim)) | Bénévole | Engagement fort (86 tuteurs Cluny) | Pas monétisé, pas traçabilité financière RH |

#### Micro-entreprise étudiant — contexte réglementaire

| Donnée | Source |
|--------|--------|
| Un étudiant majeur **peut cumuler** statut étudiant + micro-entrepreneur ; tutorat = activité libérale éligible | [Service Public Entreprendre](https://entreprendre.service-public.gouv.fr/vosdroits/F36612) |
| Cotisations URSSAF activité libérale CIPAV : **~21,1 %** du CA | [Autoentrepreneurs.org](https://autoentrepreneurs.org/etudiant-auto-entrepreneur/) |
| Risque : impact bourse / APL si revenus non anticipés | [Autoentrepreneurs.org](https://autoentrepreneurs.org/etudiant-auto-entrepreneur/) |
| Immatriculation via Guichet Unique INPI, délai typique **4–10 semaines** | [URSSAF auto-entrepreneur](https://www.autoentrepreneur.urssaf.fr/portail/accueil/creer-mon-auto-entreprise.html) |

**Lecture :** la complexité administrative est une **barrière réelle** qui pousse beaucoup de tutorat étudiant vers l'informel. Gadz'Connect attaque exactement ce frein — c'est un argument marketing fort pour les tuteurs.

#### Attentes et frustrations de la cible (synthèse terrain + avis en ligne)

**Élèves Gadz' (qui cherchent un tuteur) :**
- Veulent un tuteur qui connaît **le programme Ensam** (pas un prof générique).
- Veulent réserver vite, sans négociation WhatsApp.
- Méfiance envers les plateformes avec abonnements cachés (SuperProf Pass).
- Besoin pic en période de partiels / concours internes.

**Étudiants tuteurs :**
- Veulent gagner de l'argent sans se faire avoir fiscalement.
- INPI / URSSAF / Stripe = anxiogène ; beaucoup repoussent ou restent au noir.
- Parcours express (SIRET existant) ~15 min vs complet (création micro) ~1–15 jours — argument de simplicité.
- Besoin de visibilité sur le net réel (après commission + URSSAF).

**RH / pilotage campus :**
- Besoin de traçabilité, budgets, supervision exceptionnelle.
- Réduction du risque juridique (tutorat non déclaré).
- Alignement avec dispositifs existants (Cordées) sans les remplacer.

**Vocabulaire réel de la cible :** « partiels », « rattrapage », « méthodo », « créneaux », « SIRET », « micro », « URSSAF », « Cordées », « promo », « campus », « Gadz' », « Ensam » — pas « soutien scolaire » ni « parents ».

---

### 1.3 Synthèse & insights

**Opportunité réelle :** Gadz'Connect ne doit pas se battre sur le marché des 2 Md€ du soutien scolaire familial. Son terrain est le **tutorat peer-to-peer intra-école d'ingénieurs** — segment informel, sous-outillé, avec une douleur administrative forte. L'angle vacant : **« le tutorat entre Gadz', légal et payé en 3 clics »**.

**3 insights non évidents :**

1. **Le concurrent n°1 est WhatsApp, pas SuperProf.** Les Gadz' ont déjà des réseaux de entraide ; la bataille est la conversion de l'informel vers le déclaré, pas l'acquisition cold.
2. **INPI est le vrai goulot d'entrée marketing côté tuteurs.** Tant que le parcours micro n'est pas perçu comme « 15 min chrono », les tuteurs ne publient pas de créneaux → la marketplace est vide → les élèves ne reviennent pas. Le marketing tuteur doit vendre la **simplicité légale** avant la marketplace.
3. **Les Cordées sont un levier d'acquisition, pas un rival.** 86 tuteurs bénévoles à Cluny seuls — une partie pourrait devenir tuteurs payants s'ils voient le chemin clair. Co-animation RH + pilote Cordées = crédibilité instantanée.

**Risques :**
- Marketplace vide au lancement (syndrome « app vide ») si les 20 tuteurs pilotes ne sont pas activés en masse.
- Confusion avec ETRE (« encore un portail Ensam »).
- Expansion multi-campus prématurée avant preuve sur un campus.
- Pas de crédit d'impôt 50 % (SAP) — Gadz'Connect cible des étudiants majeurs entre pairs, pas des mineurs avec parents.

---

### 1.4 Hypothèses / questions ouvertes

| Paramètre | Valeur confirmée | Impact marketing |
|-----------|------------------|------------------|
| Campus pilote | **Aix** (Aix-en-Provence) | Toute la Phase 1 cible ce campus ; mails, affichage, session live sur site Aix |
| Tarif cours | **Libre par tuteur** | Message = liberté tarifaire (comme SuperProf côté prof) + simulateur net dans l'app ; pas d'accroche « 40 € » |
| Objectif MVP | **20 tuteurs actifs** avec créneaux | KPI d'activation, pas de notoriété nationale |
| Budget marketing | **Quasi nul** (équipe interne / Gadz') | Priorité canaux gratuits et partenariats campus |
| Canal RH | **À clarifier** (voir § 1.4bis) | Plan A = mail RH ; Plan B = BDE + délégués si pas de mailing institutionnel |

### 1.4bis — Canal RH Aix : à clarifier (action immédiate)

**Statut :** inconnu si la RH campus Aix peut envoyer un mail @ensam.eu à toute une promo ou financer l'affichage.

**Ne pas bloquer le lancement** : le playbook fonctionne sans mail RH massif, mais un mail institutionnel multiplie l'impact (×3 à ×5 sur les ouvertures, ordre de grandeur habituel en com interne).

**3 questions à poser à la RH / vie étudiante Aix** (un seul mail, 5 min) :

1. Peut-on envoyer **un mail ciblé** aux étudiants du campus Aix via une liste @ensam.eu (scolarité, vie étudiante) ?
2. Qui signe / valide ce mail (référent RH, directeur campus, BDE) ?
3. Affichage : panneaux autorisés sur le site (BU, hall, résidence U) — qui donne l'autorisation ?

**Contacts types à essayer** (campus Ensam) :
- Service scolarité / vie étudiante du site Aix
- Référent handicap / réussite (souvent lié au tutorat)
- BDE Aix (pas institutionnel, mais canal WhatsApp promo immédiat)

**Modèle mail de cadrage RH** (envoyer avant la campagne) :

```
Objet : Gadz'Connect — pilote tutorat campus Aix : besoin de 15 min

Bonjour,

Nous lançons Gadz'Connect en pilote sur le campus Aix : plateforme
de tutorat entre Gadz' (réservation + micro-entreprise + paiements).

Avant communication étudiante, j'ai 3 questions rapides :
1. Envoi possible d'un mail @ensam.eu aux étudiants Aix ?
2. Qui doit valider le contenu ?
3. Affichage campus (BU / hall) : procédure ?

Objectif pilote : 20 tuteurs actifs, puis activation élèves.
Je peux vous montrer le cockpit RH (/admin) en 15 min si utile.

Merci,
[Signature]
```

**Plan B si pas de mail RH** (dès Semaine 1) :
- 2 ambassadeurs délégués promo → WhatsApp + affichage BDE
- Session live co-organisée avec le BDE (salle + annonce)
- Affichage autonome (5 QR) si BDE autorise les panneaux
- Approche nominative : 20 tuteurs chauds contactés en direct

---

## 2. STRATÉGIE

### Positionnement & angle unique

**Catégorie :** plateforme de tutorat intra-campus pour écoles d'ingénieurs.

**Angle unique (ce que personne ne dit sur le marché grand public) :**
> « Le seul endroit où un Gadz' aide un Gadz' du même campus, en étant payé légalement, sans comprendre l'URSSAF. »

**Place dans la tête de la cible :** pas « une SuperProf Ensam », mais **« l'outil officiel du tutorat entre Gadz' »** — complémentaire aux Cordées (bénévolat/orientation) et à ETRE (scolarité).

---

### Proposition de valeur

**Phrase orientée bénéfice (pas fonctionnalités) :**

> **Réussis tes partiels avec un Gadz' de ton campus — réserve en 2 minutes, il est payé correctement et déclaré sans que tu aies à y penser.**

Variante tuteur :
> **Tutorater à l'Ensam sans galérer avec l'INPI : micro-entreprise, paiements et clients, tout est dans la même app.**

---

### Personas prioritaires

#### Persona 1 — Lucas, élève en difficulté (priorité acquisition élève)

| | |
|---|---|
| **Situation** | 2A Ensam Aix, partiels dans 3 semaines, bloqué en mécanique des fluides |
| **Douleur** | Groupes WhatsApp bruyants, tuteurs injoignables, peur de payer « au noir » |
| **Déclencheur** | Un partiel raté ou une alerte « séance annulée » sur la plateforme |
| **Objection** | « C'est plus simple sur WhatsApp » / « Je ne sais pas si les tuteurs sont bons » |
| **Canal** | Affichage campus, mail promo, bouche-à-oreille, notification app |

#### Persona 2 — Sophie, future tuteuse (priorité activation marketplace)

| | |
|---|---|
| **Situation** | 1A Ensam, excellente en maths, veut arrondir ses fins de mois (~100–200 €/mois) |
| **Douleur** | INPI/URSSAF lui semble un labyrinthe ; elle ne sait pas combien elle touchera vraiment |
| **Déclencheur** | Un ami a publié ses créneaux ; la RH envoie un mail « devenez tuteur » |
| **Objection** | « Ça va prendre des semaines » / « Je vais payer trop de charges » |
| **Canal** | Session live « Devenir tuteur en 15 min », guide PDF, parcours express SIRET |

#### Persona 3 — Marie, référente RH campus (priorité légitimité & scale)

| | |
|---|---|
| **Situation** | Chargée de mission vie étudiante, pilote budget tutorat campus |
| **Douleur** | Tutorat informel invisible, pas d'export, risque juridique, budgets flous |
| **Déclencheur** | Direction demande traçabilité ; budget tutorat à consommer |
| **Objection** | « Encore un outil » / « Les étudiants ne l'utiliseront pas » |
| **Canal** | Démo cockpit admin, reporting budgets, co-signataire des communications |

---

### Canaux retenus (justifiés) & canaux écartés

#### ✅ Canaux retenus

| Canal | Pourquoi ICI | Effort | Impact |
|-------|--------------|--------|--------|
| **E-mail / communication RH campus** | Canal officiel, 100 % cible @ensam.eu, crédibilité institutionnelle | Faible | Très élevé |
| **Bouche-à-oreille structuré** (ambassadeurs promo) | Culture Gadz' = réseaux forts ; WhatsApp déjà actif | Faible | Élevé |
| **Sessions live campus** (30 min, amphi / salle BDE) | Démo parcours micro + réservation live ; répond à l'objection « c'est compliqué » | Moyen | Élevé |
| **Affichage physique + QR** (fablab, BU, résidence) | Pic avant partiels ; rappel offline | Faible | Moyen |
| **Coordinateurs Cordées / PHARES** | 86+ tuteurs bénévoles Cluny = pipeline tuteurs chauds | Moyen | Élevé sur campus avec Cordées |
| **Cockpit admin comme outil de vente RH** | La RH devient prescriptrice si elle voit les budgets | Faible | Élevé (B2B interne) |

#### ❌ Canaux écartés (et pourquoi)

| Canal | Raison |
|-------|--------|
| **Instagram / TikTok grand public** | Cible absente (pas de parents) ; effort contenu élevé ; pas de conversion directe vers login fermé |
| **SEO « cours particuliers »** | Mots-clés = parents/externes ; plateforme fermée sans landing publique |
| **Google Ads** | CAC (coût d'acquisition client) incompatible MVP sans budget ; mauvaise cible |
| **SuperProf / Sherpas comme canal** | Concurrents indirects ; positionnement intra-campus incompatible |
| **Newsletter nationale** | Pas de liste ; risque dilution avant preuve campus pilote |
| **Salons éducation / EdTech** | Trop tôt ; MVP non lancé publiquement |

---

### Messages clés

| Persona | Message | Canal |
|---------|---------|-------|
| Lucas (élève) | « Un Gadz' de ta promo, dispo cette semaine, réservable en 2 min. » | Affichage, mail |
| Lucas | « Pas d'abonnement, pas de Pass mensuel — tu payes le cours, c'est tout. » | Session live, affichage |
| Sophie (tuteur) | « SIRET déjà ? Active ton compte en 15 min. Pas de SIRET ? On t'accompagne étape par étape. » | Mail RH, session live |
| Sophie | « Tu fixes ton tarif — le simulateur te montre ton net avant de publier. » | Guide tuteur, onboarding |
| Marie (RH) | « Visibilité totale sur les cours, budgets et tuteurs — sans Excel. » | Démo admin |
| Tous | « Complémentaire aux Cordées : ici, le tutorat académique est payé et déclaré. » | Mail RH, Cordées |

**Accroches courtes (affichage / slide) :**
- « Ton partiel, ton Gadz', ton campus. »
- « Tutorater sans URSSAF-phobie. »
- « Légal. Local. Gadz'. »

---

### Idées créatives originales

1. **« Simulateur net tuteur » en affichage campus** — Affiche avec curseur tarif (ex. 20–50 €) + « X cours/mois » → net estimé (tarif − 5 € commission − URSSAF 21,1 %). Met en avant la **liberté tarifaire** + transparence. Concret, différenciant vs SuperProf.
2. **« Tuteur express » — concours du 1er créneau publié** — Les 5 premiers tuteurs qui publient 3 créneaux gagnent un goodies BDE / mise en avant marketplace 2 semaines. Mécanique de scarcity pour remplir la marketplace.
3. **« Cordées → Connect »** — Session co-animée RH + pilote Cordées : « Vous aidez déjà des élèves — voici comment le faire légalement et être payé. » Pont bénévolat → monétisé.
4. **« Partiel Rescue » (2 semaines avant partiels)** — Push mail + affichage « 3 matières les plus demandées ce mois » (données marketplace). Urgence naturelle, pas artificielle.
5. **Badge « Tuteur vérifié Gadz'Connect »** sur profil LinkedIn / CV** — Les tuteurs actifs reçoivent un texte LinkedIn prêt à poster (« Je tutorateur officiellement sur Gadz'Connect »). Bouche-à-oreille professionnel.

---

### Priorisation (impact vs effort)

| Priorité | Action | Impact | Effort | Timing |
|----------|--------|--------|--------|--------|
| **P0** | Mail cadrage RH Aix + mail tuteurs (ou Plan B BDE) + 2 ambassadeurs promo | Très élevé | Faible | Semaine 0–1 |
| **P0** | Session live « Devenir tuteur » (15 tuteurs cible) | Très élevé | Moyen | Semaine 1–2 |
| **P0** | Affichage QR + simulateur net | Élevé | Faible | Semaine 1 |
| **P1** | Activation élèves (mail + Partiel Rescue) | Élevé | Faible | Semaine 2–3 |
| **P1** | Partenariat pilote Cordées (1 campus) | Élevé | Moyen | Semaine 2–4 |
| **P2** | Page landing publique minimale (1 page) | Moyen | Moyen | Semaine 4–6 |
| **P2** | Extension campus 2 (Lille ou Cluny) | Moyen | Moyen | Mois 2 |
| **P3** | LinkedIn badges tuteurs | Faible–moyen | Faible | Mois 2+ |
| **Optionnel** | Vidéo 60 s tutoriel | Moyen | Élevé | Plus tard |

---

## 3. GUIDE D'EXÉCUTION

### Vue d'ensemble (calendrier par phases)

| Phase | Durée | Objectif | KPI principal |
|-------|-------|----------|---------------|
| **Phase 1 — Amorçage tuteurs** | Semaines 1–2 | 15–20 tuteurs avec créneaux publiés | ≥ 15 tuteurs `active` + créneaux |
| **Phase 2 — Activation élèves** | Semaines 3–4 | Premières réservations | ≥ 30 séances bookées |
| **Phase 3 — Rétention & preuve** | Semaines 5–8 | Boucle qui tourne, données RH | ≥ 50 % tuteurs avec 2+ séances |
| **Phase 4 — Expansion campus** | Mois 3+ | Réplication playbook | 2e campus live |

---

### Phase 0 — Cadrage RH Aix (Semaine 0, en parallèle)

- [ ] **Quoi faire :** Envoyer le mail de cadrage RH (§ 1.4bis) et obtenir une réponse sous 7 jours.
- [ ] **Comment :** Identifier le bon interlocuteur (scolarité Aix, vie étudiante, ou RH que vous connaissez déjà pour le pilote produit).
- [ ] **Temps :** 30 min
- [ ] **Résultat :** Canal confirmé (mail RH **oui/non**) + date possible session live + règle affichage.

**Si réponse positive mail RH** → exécuter Phase 1 avec mails § modèles ci-dessous.
**Si réponse négative ou silence > 7 jours** → activer Plan B (BDE + nominatif) sans attendre.

---

### Phase 1 — Amorçage tuteurs Aix (Semaines 1–2)

#### Étape 1.1 — Préparer le kit de lancement

- [ ] **Quoi faire :** Rassembler 4 assets réutilisables.
- [ ] **Comment :**
  1. **Slide deck 5 slides** (Canva gratuit) : problème → solution → parcours 15 min → simulateur net → QR login.
  2. **Affiche A4** (même contenu + QR vers `https://[votre-domaine]` — campus **Aix-en-Provence**).
  3. **Mail type RH** (voir modèles ci-dessous).
  4. **Script session live 30 min** (voir modèle).
- [ ] **Temps :** 4–6 h
- [ ] **Résultat :** Kit partageable sur Drive/Notion, prêt pour RH et ambassadeurs.

#### Étape 1.2 — Identifier 20 tuteurs pilotes

- [ ] **Quoi faire :** Constituer une liste nominative de 20 profils « tuteurs chauds ».
- [ ] **Comment :**
  1. Demander à la RH / vie étudiante **Aix** la liste des étudiants déjà tutorateurs (Cordées, aides aux devoirs, mentoring).
  2. Croiser avec les promos où les tuteurs WhatsApp sont connus (demander aux délégués).
  3. Prioriser : matières maths/mécanique/physique (58 % de la demande marché).
  4. Contacter personnellement (message individuel, pas mail générique).
- [ ] **Temps :** 2–3 h
- [ ] **Résultat :** Tableau avec nom, matière, SIRET oui/non, contact.

#### Étape 1.3 — Mail RH #1 « Tuteurs »

- [ ] **Quoi faire :** Envoyer le mail officiel campus **Aix** aux étudiants ciblés + délégués.
- [ ] **Comment :** Via messagerie RH ou délégué promo (plus crédible). Demander à RH de signer.
- [ ] **Temps :** 1 h (rédaction + validation RH)
- [ ] **Résultat :** ≥ 30 % ouverture (si mail RH), ≥ 10 clics login.

#### Étape 1.4 — Session live « Devenir tuteur en 15 min »

- [ ] **Quoi faire :** Organiser 1 session de 30 min en salle campus (ou visio ETRE si dispo).
- [ ] **Comment :**
  1. Réserver salle via BDE ou vie étudiante.
  2. Annoncer 7 jours avant (mail + affichage + WhatsApp délégués).
  3. Démo live : connexion → profil → questionnaire → (SIRET express) → Stripe → publier 1 créneau.
  4. Fin : « Publiez votre 1er créneau maintenant, on reste 10 min pour aider. »
  5. Outil visio si besoin : **Google Meet** (gratuit) ou **Zoom** (gratuit 40 min).
- [ ] **Temps :** 2 h prep + 30 min session
- [ ] **Résultat :** ≥ 8 participants, ≥ 5 créneaux publiés le jour même.

#### Étape 1.5 — Affichage campus + QR

- [ ] **Quoi faire :** Poser 5 affiches dans les lieux à fort trafic étudiant.
- [ ] **Comment :**
  1. Générer QR avec [qr-code-generator.com](https://www.qr-code-generator.com/) → URL login.
  2. Imprimer 5 copies (BU, cafétéria, fablab, résidence U, hall entrée).
  3. Demander autorisation affichage à vie étudiante.
- [ ] **Temps :** 2 h
- [ ] **Résultat :** Affiches visibles 2 semaines minimum.

**Indicateurs Phase 1 :**
| Métrique | Bon | À corriger |
|----------|-----|------------|
| Tuteurs `active` avec créneaux | ≥ 15 | < 8 → relancer session live + appels perso |
| Tuteurs bloqués sur INPI | < 30 % des inscrits | > 50 % → session dédiée « INPI only » |
| Créneaux disponibles (total) | ≥ 45 (3/tuteur) | < 20 → incitation « Tuteur express » |

---

### Phase 2 — Activation élèves (Semaines 3–4)

#### Étape 2.1 — Mail RH #2 « Trouver mon tuteur »

- [ ] **Quoi faire :** Annoncer que la marketplace est peuplée.
- [ ] **Comment :** Mail à toutes les promos **Aix**. Insister : pas d'abonnement, réservation directe, tarifs affichés par tuteur.
- [ ] **Temps :** 1 h
- [ ] **Résultat :** ≥ 50 élèves connectés, ≥ 10 réservations.

#### Étape 2.2 — « Partiel Rescue »

- [ ] **Quoi faire :** Campagne 10 jours avant partiels.
- [ ] **Comment :**
  1. Identifier les 3 matières avec le plus de tuteurs (données admin).
  2. Affiche + story WhatsApp délégués : « Maths / Méca / Physique — X tuteurs dispos ».
  3. Lien direct vers marketplace filtrée par matière.
- [ ] **Temps :** 3 h
- [ ] **Résultat :** Pic de réservations la semaine avant partiels.

#### Étape 2.3 — Ambassadeurs promo (2 par campus)

- [ ] **Quoi faire :** Recruter 2 délégués « ambassadeurs Gadz'Connect ».
- [ ] **Comment :** Mandat simple : 1 message WhatsApp promo/semaine pendant 4 semaines + relance avant partiels. Pas de rémunération — goodies BDE ou reconnaissance RH.
- [ ] **Temps :** 30 min setup
- [ ] **Résultat :** Messages réguliers sans charge équipe produit.

**Indicateurs Phase 2 :**
| Métrique | Bon | À corriger |
|----------|-----|------------|
| Réservations totales | ≥ 30 | < 10 → vérifier créneaux vides ou prix |
| Taux conversion login → réservation | ≥ 15 % | < 5 % → UX ou marketplace vide |
| Séances complétées (vs annulées) | ≥ 70 % | < 50 % → problème matching ou qualité |

---

### Phase 3 — Rétention & preuve (Semaines 5–8)

#### Étape 3.1 — Boucle tuteur : 2e séance

- [ ] **Quoi faire :** Réactiver les tuteurs qui ont fait 1 séance mais n'ont pas republié.
- [ ] **Comment :** Mail/notif automatique J+3 après 1ère séance : « Republiez vos créneaux — X élèves cherchent [matière]. »
- [ ] **Temps :** 1 h (setup message)
- [ ] **Résultat :** ≥ 50 % tuteurs avec 2+ séances.

#### Étape 3.2 — Bilan RH (cockpit admin)

- [ ] **Quoi faire :** Présenter les données au management campus.
- [ ] **Comment :** Export cockpit admin : nb séances, volume, commissions, campus breakdown. 1 slide « preuve sociale interne ».
- [ ] **Temps :** 2 h
- [ ] **Résultat :** Validation expansion campus 2.

#### Étape 3.3 — Collecter 3 témoignages

- [ ] **Quoi faire :** Obtenir 1 témoignage tuteur + 1 élève + 1 RH (3 phrases chacun).
- [ ] **Comment :** Message perso post-séance. Demander permission pour réutilisation.
- [ ] **Temps :** 1 h
- [ ] **Résultat :** Témoignages pour mail campus 2 et future landing.

**Indicateurs Phase 3 :**
| Métrique | Bon | À corriger |
|----------|-----|------------|
| Tuteurs récurrents (2+ séances) | ≥ 50 % | < 30 % → problème expérience tuteur |
| NPS interne (question 1–5) | ≥ 4 | < 3 → interview 5 utilisateurs |
| Budget RH consommé (si applicable) | Traçable dans cockpit | Non → problème reporting |

---

### Phase 4 — Expansion campus (Mois 3+)

- [ ] Répliquer le playbook Phase 1–3 sur campus 2 (recommandation : **Cluny** — culture Cordées forte, 86 tuteurs bénévoles).
- [ ] Adapter le mail RH avec témoignages campus **Aix**.
- [ ] Ne pas lancer campus 2 tant que **Aix** n'a pas ≥ 15 tuteurs actifs et ≥ 30 séances.

---

### Modèles de contenu prêts à l'emploi

#### Mail RH #1 — Appel tuteurs

```
Objet : [Campus Aix] Devenez tuteur Gadz'Connect — légal, payé, en 15 min

Bonjour,

Vous excellez en maths, mécanique, physique ou une autre matière ?
Gadz'Connect permet aux Gadz' d'Aix-en-Provence de tutorater des élèves
de votre campus en étant payés et déclarés — sans galérer avec l'INPI seul.

✓ SIRET déjà ? Compte activé en ~15 minutes.
✓ Pas de SIRET ? Guide pas-à-pas intégré (INPI, URSSAF, Stripe).
✓ Tu fixes ton tarif — le simulateur affiche ton net avant publication
  (ex. 30 € → ~19 € net · 40 € → ~27 € net · 50 € → ~35 € net).

Session live : [DATE] [HEURE] — [LIEU campus Aix]
Connexion : [URL] — choisir campus Aix-en-Provence

Complémentaire aux dispositifs bénévoles : ici, le tutorat académique est monétisé et tracé.

[Lien RH / Gadz'Connect]
```

#### Mail RH #2 — Activation élèves

```
Objet : [Campus Aix] Trouvez un Gadz' tuteur sur votre campus

Bonjour,

Des Gadz' d'Aix-en-Provence proposent déjà des créneaux de tutorat
sur Gadz'Connect : maths, mécanique, physique…

→ Pas d'abonnement. Pas de Pass mensuel.
→ Vous réservez, vous payez le cours, c'est tout.
→ Votre tuteur connaît le programme Ensam.

Partiels dans [X] semaines ? Réservez maintenant :
[URL marketplace]

Besoin d'aide ? [contact RH]
```

#### Message WhatsApp délégué (copier-coller)

```
📚 Gadz'Connect est live sur le campus Aix !

Tuteurs : devenez tuteur légal en 15 min — tu fixes ton tarif
→ [URL] (campus Aix-en-Provence)

Élèves : réservez un Gadz' tuteur de ta promo
→ [URL]

Pas d'abonnement, pas de superprof. Juste des Gadz' qui aident des Gadz'.
```

#### Script session live 30 min

```
0–5 min  : « Qui a déjà tutoraté ? Au noir ou déclaré ? » (sondage mains)
5–10 min : Problème (INPI, WhatsApp, pas de visibilité RH)
10–20 min: Démo live connexion → profil → micro → Stripe → créneau
20–25 min: Simulateur net — 3 exemples tarifs libres (25 € / 40 € / 50 €)
25–30 min: « Publiez maintenant, on aide »
```

#### Affiche (texte)

```
TON PARTIEL. TON GADZ'. TON CAMPUS.

Tutorater ou être tutoré — légalement, sur ton campus.

SIRET ? 15 min pour être actif.
Pas de SIRET ? On t'accompagne.
Tu fixes ton tarif.

Campus Aix-en-Provence
[QR CODE]
gadzconnect.[domaine]
```

---

### Indicateurs de succès à suivre

| Métrique | Définition simple | Outil | Bon (MVP) |
|----------|-------------------|-------|-----------|
| **Tuteurs actifs** | Tuteurs avec statut `active` + ≥ 1 créneau publié | Cockpit admin | ≥ 15 |
| **Créneaux dispo** | Total créneaux ouverts sur marketplace | Cockpit / API | ≥ 45 |
| **Réservations** | Séances bookées (toutes statuts) | Cockpit admin | ≥ 30 en 8 semaines |
| **Taux complétion** | % séances `completed` vs `cancelled` | Cockpit admin | ≥ 70 % |
| **Délai activation tuteur** | Jours entre 1er login et 1er créneau publié | Export profils | < 7 jours |
| **Taux blocage INPI** | % tuteurs `pending_siret` > 14 jours | Cockpit admin | < 30 % |

---

### Plan B (si ça ne marche pas)

| Problème | Signal | Action |
|----------|--------|--------|
| **Personne ne s'inscrit** | < 5 tuteurs après mail RH | Session live obligatoire + appels perso 10 tuteurs chauds |
| **Tuteurs bloqués INPI** | > 50 % `pending_siret` | Session « INPI only » + binôme avec tuteur express qui a fini |
| **Marketplace vide côté élève** | 0 réservations après mail #2 | Réduire à 3 matières pilotes + garantir 5 créneaux/matière |
| **Élèves ne reviennent pas** | 1 réservation puis churn | Notif « ton tuteur a republié » + Partiel Rescue |
| **RH ne relance pas** | Pas de mail #2 | Proposer à RH un slide bilan auto-généré (cockpit) comme justification |
| **Confusion avec ETRE** | Feedback « c'est quoi la diff » | Ajouter ligne fixe dans tous les mails : « Gadz'Connect = tutorat payé. ETRE = scolarité. » |

---

## Sources

- [Le Parisien — Soutien scolaire, crédit d'impôt et marché 2 Md€](https://www.leparisien.fr/economie/soutien-scolaire-et-cours-a-domicile-comment-le-credit-dimpot-a-dope-le-marche-02-03-2025-UWNTFHFELJGHXOBOQXFV3HGNOU.php) — mars 2025
- [Le Parisien — Rentrée, business des cours particuliers](https://www.leparisien.fr/societe/rentree-scolaire-le-juteux-business-des-cours-particuliers-01-09-2025-QSWNHGZUWFESDBPD2DPSAIWBKM.php) — sept. 2025
- [L'Express Franchise — Marché soutien scolaire en expansion](https://lexpress-franchise.com/articles/le-soutien-scolaire-un-marche-en-pleine-expansion/) — 2025
- [GoStudent — Statistiques marché soutien scolaire France](https://www.gostudent.org/fr-fr/blog/statistiques-sur-le-marche-du-soutien-scolaire) — 2025–2026
- [GoStudent — Alternatives SuperProf](https://www.gostudent.org/fr-fr/blog/alternatives-superprof) — 2026
- [Les Sherpas](https://sherpas.com/) — 2026
- [Enseigna — SuperProf vs Complétude](https://enseigna.fr/superprof-vs-completude/) — fév. 2026
- [SuperProf — Business model](https://www.superprof.com/blog/how-superprof-works/) — 2025
- [Service Public — Étudiant + micro-entrepreneur](https://entreprendre.service-public.gouv.fr/vosdroits/F36612) — 2025
- [Autoentrepreneurs.org — Étudiant auto-entrepreneur](https://autoentrepreneurs.org/etudiant-auto-entrepreneur/) — 2025
- [URSSAF — Créer auto-entreprise](https://www.autoentrepreneur.urssaf.fr/portail/accueil/creer-mon-auto-entreprise.html) — 2025
- [Arts et Métiers — Cordées OPTIM Cluny](https://artsetmetiers.fr/fr/actualites/forte-mobilisation-etudiante-du-campus-arts-et-metiers-de-cluny-dans-la-cordee-optim) — 2023
- [ETRE Ensam](http://etre.ensam.eu/) — 2026
- [TutorIA / GitHub CentraleSupélec](https://github.com/CentraleSupelec/tutorat) — open-source Paris-Saclay
- [Izystud](https://izystud.fr/) — plateforme étudiants France
- Documentation interne : `docs/PLAN.md`, `apps/web/src/pages/auth/LoginPage.tsx`
