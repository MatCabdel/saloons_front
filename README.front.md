# Saloon Frontend (Angular 18)

Application frontend Angular pour la plateforme Saloon (matching et interaction dans des “saloons”).

## Sommaire
1. Stack & Outils
2. Structure du code
3. Fonctionnalités clés
4. Authentification & Profil
5. QR Code & Connexion Saloon
6. Scripts NPM
7. Environnements
8. Qualité & Conventions (ESLint / Prettier / Husky)
9. Tests (Jest & Cypress)
10. Documentation (Compodoc)
11. CI/CD
12. Ajout de nouvelles fonctionnalités
13. Dépannage rapide

---

## 1. Stack & Outils

- Angular 18 (Standalone Components)
- TypeScript
- RxJS
- Formulaires réactifs
- Jest (unit & integration)
- Cypress (E2E)
- Husky (pré-commit: lint + format + tests)
- Compodoc (documentation)
- Docker (build & déploiement)
- Environnements: development / staging / production

---

## 2. Structure du code (extraits)

```
src/
  app/
    features/
      auth/
        login/
        register/
      profil/
        components/
          my-profil/
          visitor-profil/
      qrcode/
      user/
        services/
        store/
      saloon/ (ex: navigation /mysaloon/:id)
    core/
      interceptors/
    environments/
scripts/
  env-scripts/
  husky-scripts/
```

Exemples:
- Formulaire d’inscription multi-étapes: [`register-profil.component.html`](src/app/features/auth/register/register-profil/register-profil.component.html)
- Login: [`login-form.component.html`](src/app/features/auth/login/components/login-form/login-form.component.html)
- Profil utilisateur connecté: [`my-profil.component.ts`](src/app/features/profil/components/my-profil/my-profil.component.ts)
- Profil visiteur: [`visitor-profil.component.ts`](src/app/features/profil/components/visitor-profil/visitor-profil.component.ts)
- Store utilisateur: [`user-store.service.ts`](src/app/features/user/store/user-store.service.ts)
- QR Scan: [`qr-scanner.service.ts`](src/app/features/qrcode/services/qr-scanner.service.ts)

---

## 3. Fonctionnalités clés

- Authentification JWT (token stocké localStorage).
- Inscription avec upload image + champs profil (ville, description, date de naissance).
- Calcul de l’âge (front, dérivé de birthDate).
- Matching / “wink” (ex: méthode `createLike`).
- Connexion à un “saloon” via QR code puis redirection dynamique.
- Interceptor gestion d’erreurs HTTP.

---

## 4. Authentification & Profil

Flux:
1. Inscription (multipart/form-data) => `/auth/register`
2. Login (JSON) => `/auth/login` => réponse enrichie (token + profil)
3. Stockage: token + objet utilisateur dans localStorage
4. Accès profil connecté: observable `getUserConnected$()`
5. Profil visiteur: récupération par ID + calcul âge si nécessaire

Champs utilisateur présents dans le modèle: [`userDTO.ts`](src/app/features/user/models/userDTO.ts)

---

## 5. QR Code & Connexion Saloon

Service: [`qr-scanner.service.ts`](src/app/features/qrcode/services/qr-scanner.service.ts)
- Normalise une URL scannée (remplace localhost → `environment.frontendUrl`)
- Extrait l’ID de saloon
- Appelle `connectUserToSaloon`
- Redirige vers `/mysaloon/:id`

---

## 6. Scripts NPM (principaux)

| Commande | Effet |
|----------|-------|
| `npm start` | Dev server (env par défaut dev) |
| `npm run build` | Build production par défaut |
| `npm run build --env=staging` | Build staging (via scripts custom) |
| `npm run test` | Tests Jest |
| `npm run e2e:ui:staging` | Cypress UI sur build staging |
| `npm run lint` | ESLint |
| `npm run prettier` | Formatage |
| `npm run doc` | Génère doc Compodoc |
| `npm run prepare` | Active Husky |

Scripts shell utiles:
- [`scripts/env-scripts/e2e-ui-with-env.sh`](scripts/env-scripts/e2e-ui-with-env.sh)

---

## 7. Environnements

Variables gérées côté Angular (`environment.*`). Usage:
- Définir API backend (ex: `environment.apiUrl`)
- `environment.frontendUrl` utilisé dans la normalisation QR

---

## 8. Qualité & Conventions

Husky (pré-commit) exécute:
1. Validation fichiers conf (Eslint / Prettier intacts)
2. Lint (`ng lint`)
3. Prettier (`prettier --write .`)
4. Tests (`npm run test`)

Scripts Husky: [`scripts/husky-scripts`](scripts/husky-scripts)

Ne pas modifier:
- `.prettierrc.json`
- `eslint.config.js`
- Scripts Husky (sinon commit bloqué)

---

## 9. Tests

- Unitaire / intégration: Jest (`npm run test`)
- E2E: Cypress (`e2e:*` scripts) — uniquement sur build (staging / production)
- Execution CI automatique sur push selon branche

---

## 10. Documentation

Compodoc: `npm run doc`
- Sert une doc locale interactive
- Regénérer après modifications

---

## 11. CI/CD

Flux (résumé):
- Push (branche ≠ staging/prod): tests (Jest)
- Push staging: tests + E2E + build + image Docker → déploiement via webhook
- Push production: même pipeline (pré-requis PR validée)

---

## 12. Ajout d’une fonctionnalité

Checklist rapide:
1. Créer un dossier dans `features/<domain>`
2. Utiliser Standalone Components
3. Modèle DTO dans `features/<domain>/models`
4. Service API (si appel backend)
5. Ajouter tests unitaires (composant + service)
6. Respecter ESLint + Prettier
7. Vérifier couverture (optionnel) avant commit

---

## 13. Dépannage rapide

| Problème | Piste |
|----------|-------|
| 400 login staging | Vérifier payload (email/password), Content-Type JSON |
| Champs profil vides | Vérifier réponse `/auth/login` inclut city/description/birthDate |
| Age manquant visiteur | Calcul côté composant (`computeAge`) si backend ne renvoie pas `age` |
| Upload image échoue | Ne pas forcer `Content-Type` sur FormData |
| QR invalide | Vérifier format URL & extraction `extractSaloonIdFromUrl` |

---

## 14. Sécurité basique

- Token uniquement en localStorage (considérer plus tard interceptor refresh / logout sécurisé).
- Ne jamais committer de secrets d’environnement.

---

## 15. À faire (suggestions évolutives)

- Guard route authentifiée
- Interceptor token (Authorization header)
- Refresh token
- Lazy loading des features
- State management plus avancé (Signals, Akita, NgRx selon besoin)

---

## Licence

Projet interne Saloon. Usage restreint.

---
Bonne continuation. Contributions bienvenues (PR + respect pipeline). 