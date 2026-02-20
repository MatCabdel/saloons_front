# Configuration Firebase pour iOS

Ce fichier `GoogleService-Info.plist` est nécessaire pour le bon fonctionnement de Firebase sur iOS.

## Où obtenir ce fichier ?

1. Connectez-vous à la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez le projet **Saloons** (saloons-ba99c)
3. Allez dans **Paramètres du projet** > **Vos applications**
4. Sélectionnez l'application iOS (Bundle ID: `com.saloons.app`)
5. Téléchargez le fichier `GoogleService-Info.plist`
6. Placez-le dans ce répertoire (`ios/App/App/`)

## Important

⚠️ **Ce fichier contient des clés API sensibles et ne doit JAMAIS être committé dans Git.**

Le fichier est ignoré par `.gitignore` pour des raisons de sécurité.

## Structure attendue

Le fichier doit contenir les clés suivantes :

- `API_KEY`
- `GCM_SENDER_ID`
- `PROJECT_ID`
- `STORAGE_BUCKET`
- `GOOGLE_APP_ID`
- `CLIENT_ID`
- `REVERSED_CLIENT_ID`

## En cas de clé compromise

Si une clé API a été exposée publiquement :

1. Allez dans [Google Cloud Console](https://console.cloud.google.com/)
2. Naviguez vers **APIs & Services** > **Credentials**
3. Regénérez la clé compromise
4. Téléchargez le nouveau `GoogleService-Info.plist` depuis Firebase
5. Remplacez le fichier local
6. Ajoutez des restrictions API si nécessaire
