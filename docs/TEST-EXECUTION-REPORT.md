# Rapport d'exécution — Plan de test Gadz'Connect

**Date :** 2026-06-26T08:12:10.331Z
**API :** http://localhost:3001
**Résultat :** 43 passés, 2 échoués sur 45

## 1. Préparation

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| PREP-01 | API /health répond 200 | PASS | status 200 |
| PREP-02 | GET /api/auth/demo-accounts (dev login) | PASS | status 200 |
| PREP-03 | GET /api/campus liste campus | PASS | 8 campus |
| PREP-04 | Campus Aix résolu | PASS | 62c0a6d7-ef2c-4380-bbbc-a08e7b22b1a2 |

## 3.1 Élève — Marketplace publique

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| E-PUB-01 | Liste tuteurs campus | PASS | 1 tuteur(s) |
| E-PUB-02 | Filtre bookable=true | PASS | 0 réservable(s) |
| E-PUB-03 | Fiche tuteur publique | PASS | 41fe3a2f-6cef-4984-9cbf-8a967c221ed1 |
| E-PUB-04 | Stats campus publiques | PASS |  |

## 3.2 Élève — Auth

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| E-AUTH-01 | Login élève démo | PASS |  |
| E-AUTH-02 | GET /api/auth/me | PASS |  |
| E-AUTH-03 | Profil student_provider | PASS | student_provider |

## 3.4–3.9 Élève — Espace connecté

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| E-APP-01 | GET /api/schedule/me | PASS |  |
| E-APP-02 | GET /api/notifications | PASS |  |
| E-APP-03 | GET /api/repository/folders | PASS |  |
| E-BOOK-01 | Liste tuteurs (authentifié) | PASS |  |
| E-BOOK-02 | GET /api/tutors/:id/slots (élève) | FAIL | 0 créneau(x) |

## 4. Prof — API

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| P-PROF-01 | Login prof.martin@ensam.eu | PASS |  |
| P-PROF-01-status | Statut prof.martin@ensam.eu | PASS | active |
| P-PROF-02 | Login prof.enattente@ensam.eu | PASS |  |
| P-PROF-02-status | Statut prof.enattente@ensam.eu | PASS | pending_siret |
| P-AUTH-01 | Login prof.suspended@ensam.eu | PASS |  |
| P-AUTH-01-status | Statut prof.suspended@ensam.eu | PASS | suspended |
| P-PROF-03 | Login prof.express@ensam.eu | PASS |  |
| P-PROF-03-status | Statut prof.express@ensam.eu | PASS | pending_siret |
| P-FISC-01 | GET /api/fiscal/calculate/demo | PASS |  |
| P-PAY-01 | GET /api/stripe/connect/status | PASS |  |

## 5. Admin RH — API

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| A-SEC-03 | Élève refusé sur /api/admin/me | PASS | status 403 |
| A-SEC-04 | Login RH | PASS |  |
| A-SEC-05 | GET /api/admin/me admin_general | PASS | admin_general |
| A-DASH-01 | GET /api/admin/dashboard (Dashboard) | PASS |  |
| A-USER-01 | GET /api/admin/profiles (Profils) | PASS |  |
| A-BUDG-01 | GET /api/admin/budgets (Budgets) | PASS |  |
| A-BUDG-02 | GET /api/admin/transactions (Transactions) | PASS |  |
| A-COURS-01 | GET /api/admin/courses (Cours) | PASS |  |
| A-PLAN-01 | GET /api/admin/schedule (Planning) | PASS |  |
| A-CAMP-01 | GET /api/admin/campuses (Campuses) | PASS |  |
| A-INV-01 | GET /api/admin/invoices (Factures) | PASS |  |
| A-USER-02 | Preset pending_siret | PASS | 4 prof(s) |

## 6. Scénarios bout-en-bout (API)

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| E2E-01 | Profs réservables visibles marketplace | FAIL | 0 prof(s) |
| E2E-02 | Pipeline activation RH (profils pending) | PASS | 4 en attente |
| E2E-03 | Élève et profs sur même campus (Aix) | PASS | 62c0a6d7-ef2c-4380-bbbc-a08e7b22b1a2 |

## 7. Cas limites

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| EDGE-01 | Email hors @ensam.eu refusé | PASS | status 401 |
| EDGE-02 | /api/admin/me sans token → 401 | PASS | status 401 |
| EDGE-03 | Campus invalide → liste vide ou 404 | PASS | status 404 |

## 8. Vercel / staging

| ID | Test | Résultat | Détail |
|----|------|----------|--------|
| V-01 | VERCEL_API_URL non défini — skip smoke staging | PASS | définir VERCEL_API_URL pour tester |

