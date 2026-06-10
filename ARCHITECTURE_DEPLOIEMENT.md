# Architecture et Deploiement Front SALOONS

Ce document resume l'architecture front actuelle de SALOONS, le decoupage landing/app, le deploiement VPS, les builds Docker et les builds mobiles iOS/Android.

## Vue d'ensemble

Le front SALOONS est une application Angular avec deux entrees de build distinctes :

- **App SALOONS** : application connectee actuelle, avec welcome, auth, saloons, map, messages, profil, dashboard.
- **Landing SALOONS** : site public limite a la landing et aux pages publiques legales/contact.

Les deux fronts vivent dans le meme repo `saloons_front`, mais sont servis par deux images Docker differentes.

## Domaines

Production :

```text
https://saloons.fr/              -> landing publique
https://www.saloons.fr/          -> landing publique
https://app.saloons.fr/          -> app SALOONS
https://api.saloons.fr/          -> API backend production
```

Staging :

```text
https://staging.saloons.fr/      -> landing staging
https://staging-app.saloons.fr/  -> app staging
https://staging-api.saloons.fr/  -> API backend staging
```

Important : `staging.saloons.fr` n'est plus l'app. C'est la landing. L'app staging est maintenant `staging-app.saloons.fr`.

## Routing Angular

### App

Le routing app est dans :

```text
src/app/app.routes.ts
```

La racine `/` de l'app reste le comportement historique :

```text
https://app.saloons.fr/          -> WelcomePageComponent
https://staging-app.saloons.fr/  -> WelcomePageComponent
```

Il n'y a pas de route `/welcome`.

Routes app principales :

```text
/                         -> WelcomePageComponent
/auth                     -> AuthPageComponent
/login                    -> AuthPageComponent en mode connexion
/mot-de-passe-oublie      -> ForgotPasswordPageComponent
/onboarding               -> OnboardingPageComponent
/saloons                  -> liste des saloons
/saloons/map              -> map des saloons
/map                      -> redirect vers /saloons/map
/events                   -> evenements
/profil                   -> mon profil
/profil/edit              -> edition profil
/chat                     -> conversations
/messages/:conversationId -> message
/mon-compte               -> mon compte
/contact                  -> contact
/mentions-legales         -> mentions legales
/cgu                      -> CGU
/politique-confidentialite -> confidentialite
/dashboard/...            -> admin
```

### Landing

Le routing landing est dans :

```text
src/app/landing.routes.ts
```

Routes landing :

```text
/                         -> LandingPageComponent
/contact                  -> ContactPageComponent
/mentions-legales         -> LegalNoticesPageComponent
/cgu                      -> TermsPageComponent
/politique-confidentialite -> PrivacyPolicyPageComponent
/**                       -> redirect vers /
```

La landing n'inclut pas les routes privees de l'app.

## Entrypoints Angular

App :

```text
src/main.ts
src/app/app.config.ts
src/app/app.routes.ts
```

Landing :

```text
src/main.landing.ts
src/app/landing-app.component.ts
src/app/landing-app.config.ts
src/app/landing.routes.ts
```

## Environnements front

Production :

```text
src/environments/environment.production.ts
apiUrl: https://api.saloons.fr
frontendUrl: https://app.saloons.fr
```

Staging :

```text
src/environments/environment.staging.ts
apiUrl: https://staging-api.saloons.fr
frontendUrl: https://staging-app.saloons.fr
```

`frontendUrl` represente le domaine applicatif, pas la landing. Il sert notamment aux liens applicatifs et a certaines normalisations.

## Builds locaux

Depuis `saloons_front` :

```bash
npm install
```

Lancer l'app locale :

```bash
npm run start:app
```

URL :

```text
http://localhost:4200/
```

Lancer la landing locale :

```bash
npm run start:landing
```

URL :

```text
http://localhost:4300/
```

Build app staging :

```bash
npm run build:staging
```

Build app production :

```bash
npm run build:production
```

Build landing staging :

```bash
npm run build:landing:staging
```

Build landing production :

```bash
npm run build:landing:production
```

## Docker front

Deux Dockerfiles principaux :

```text
Dockerfile.app      -> image de l'app Angular
Dockerfile.landing  -> image de la landing Angular
```

Les deux utilisent `nginx.conf` pour servir le build Angular en SPA :

```text
nginx.conf
```

Le `.dockerignore` exclut `node_modules`, `dist`, `.angular`, `android`, `ios`, etc. Il evite d'envoyer un contexte Docker enorme.

### Images Docker attendues

Staging :

```text
matcabdel/saloons-app:staging
matcabdel/saloons-landing:staging
```

Production :

```text
matcabdel/saloons-app:production
matcabdel/saloons-landing:production
```

### Build Docker manuel

Depuis `saloons_front`.

Staging app :

```bash
docker build --progress=plain -f Dockerfile.app --build-arg BUILD_CONFIGURATION=staging -t matcabdel/saloons-app:staging .
docker push matcabdel/saloons-app:staging
```

Staging landing :

```bash
docker build --progress=plain -f Dockerfile.landing --build-arg BUILD_CONFIGURATION=staging-landing -t matcabdel/saloons-landing:staging .
docker push matcabdel/saloons-landing:staging
```

Production app :

```bash
docker build --progress=plain -f Dockerfile.app --build-arg BUILD_CONFIGURATION=production -t matcabdel/saloons-app:production .
docker push matcabdel/saloons-app:production
```

Production landing :

```bash
docker build --progress=plain -f Dockerfile.landing --build-arg BUILD_CONFIGURATION=production-landing -t matcabdel/saloons-landing:production .
docker push matcabdel/saloons-landing:production
```

## CI/CD front

Workflow :

```text
.github/workflows/cd.yml
```

Declenchement :

```text
push sur staging    -> tag Docker staging
push sur production -> tag Docker production
```

La CD construit et pousse deux images :

```text
saloons-app:<tag>
saloons-landing:<tag>
```

Puis elle se connecte au VPS et lance :

```bash
cd /home/$VPS_USER/frontend/$TAG
docker compose pull
docker compose down
docker compose up -d
```

`TAG` vaut `staging` ou `production`.

## VPS front

Structure attendue :

```text
/home/ubuntu/frontend/staging/docker-compose.yml
/home/ubuntu/frontend/production/docker-compose.yml
```

### Compose staging front

```yaml
services:
  saloons-landing-staging:
    image: matcabdel/saloons-landing:staging
    container_name: saloons-landing-staging
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.saloons-landing-staging.rule=Host(`staging.saloons.fr`)"
      - "traefik.http.routers.saloons-landing-staging.entrypoints=websecure"
      - "traefik.http.routers.saloons-landing-staging.tls.certresolver=letsencrypt"
      - "traefik.http.services.saloons-landing-staging.loadbalancer.server.port=80"

  saloons-app-staging:
    image: matcabdel/saloons-app:staging
    container_name: saloons-app-staging
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.saloons-app-staging.rule=Host(`staging-app.saloons.fr`)"
      - "traefik.http.routers.saloons-app-staging.entrypoints=websecure"
      - "traefik.http.routers.saloons-app-staging.tls.certresolver=letsencrypt"
      - "traefik.http.services.saloons-app-staging.loadbalancer.server.port=80"

networks:
  traefik:
    external: true
```

### Compose production front

```yaml
services:
  saloons-landing-production:
    image: matcabdel/saloons-landing:production
    container_name: saloons-landing-production
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.saloons-landing-production.rule=Host(`saloons.fr`) || Host(`www.saloons.fr`)"
      - "traefik.http.routers.saloons-landing-production.entrypoints=websecure"
      - "traefik.http.routers.saloons-landing-production.tls.certresolver=letsencrypt"
      - "traefik.http.services.saloons-landing-production.loadbalancer.server.port=80"

  saloons-app-production:
    image: matcabdel/saloons-app:production
    container_name: saloons-app-production
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.saloons-app-production.rule=Host(`app.saloons.fr`)"
      - "traefik.http.routers.saloons-app-production.entrypoints=websecure"
      - "traefik.http.routers.saloons-app-production.tls.certresolver=letsencrypt"
      - "traefik.http.services.saloons-app-production.loadbalancer.server.port=80"

networks:
  traefik:
    external: true
```

## DNS

Les entrees DNS doivent pointer vers l'IP publique du VPS.

Production :

```text
saloons.fr
www.saloons.fr
app.saloons.fr
api.saloons.fr
```

Staging :

```text
staging.saloons.fr
staging-app.saloons.fr
staging-api.saloons.fr
```

Verifier :

```bash
dig +short A staging.saloons.fr
dig +short A staging-app.saloons.fr
dig +short A staging-api.saloons.fr
```

Les certificats HTTPS sont geres automatiquement par Traefik et Let's Encrypt via les labels `tls.certresolver=letsencrypt`.

## Mobile iOS avec Xcode

Le mobile embarque le build app, pas la landing. Il utilise `webDir: dist/frontend/browser`.

Staging iOS :

```bash
cd /Users/mathieuchauveau/Desktop/PROJETS/APPLICATIONS/SALOONSDEV/saloons_front
npm run cap:config:staging
npm run build:staging
npx cap sync ios
npx cap open ios
```

Puis dans Xcode :

1. choisir le scheme `App`;
2. choisir un iPhone ou simulateur;
3. verifier le signing;
4. lancer avec Run.

Production iOS :

```bash
npm run cap:config:production
npm run build:production
npx cap sync ios
npx cap open ios
```

## Mobile Android

Staging Android :

```bash
cd /Users/mathieuchauveau/Desktop/PROJETS/APPLICATIONS/SALOONSDEV/saloons_front
npm run cap:config:staging
npm run build:staging
npx cap sync android
npx cap open android
```

Production Android :

```bash
npm run cap:config:production
npm run build:production
npx cap sync android
npx cap open android
```

## Points de controle mobile

Avant un build mobile staging :

```bash
grep -n "apiUrl\\|frontendUrl" src/environments/environment.staging.ts
```

Attendu :

```text
apiUrl: https://staging-api.saloons.fr
frontendUrl: https://staging-app.saloons.fr
```

Si l'app iOS affiche "Erreur reseau", verifier d'abord que l'API staging tourne :

```bash
curl -I https://staging-api.saloons.fr/auth/login
```

Une reponse `401`, `400` ou `405` venant de Spring est acceptable. Un `404 page not found` en `text/plain` indique souvent que Traefik ne trouve pas le backend staging.

## Ordre normal de livraison staging

1. Merger la branche de feature vers `staging`.
2. La CD front build et push `saloons-app:staging` et `saloons-landing:staging`.
3. La CD front deploie `/home/ubuntu/frontend/staging`.
4. La CD back build et push `saloons-api:staging`.
5. La CD back deploie `/home/ubuntu/backend/staging`.
6. Verifier :

```bash
curl -I https://staging.saloons.fr
curl -I https://staging-app.saloons.fr
curl -I https://staging-api.saloons.fr/auth/login
```

## Commandes VPS utiles

Voir les containers :

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

Relancer le front staging :

```bash
cd ~/frontend/staging
docker compose pull
docker compose down --remove-orphans
docker compose up -d
```

Verifier les labels Traefik :

```bash
docker inspect saloons-landing-staging --format '{{json .Config.Labels}}'
docker inspect saloons-app-staging --format '{{json .Config.Labels}}'
```

Verifier que la landing contient bien le build landing :

```bash
docker exec saloons-landing-staging sh -c "grep -R \"Ici, on ne swipe\" -n /usr/share/nginx/html | head"
```
