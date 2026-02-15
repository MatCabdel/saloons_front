export const environment = {
  production: false,
  name: 'staging',
  apiUrl: 'https://staging-api.saloons.fr',
  frontendUrl: 'https://staging.saloons.fr',
  firebase: {
    apiKey: 'AIzaSyCRpCxE31epQAFrXVB6lXbIySPI_L83GX4',
    authDomain: 'saloons-ba99c.firebaseapp.com',
    projectId: 'saloons-ba99c',
    storageBucket: 'saloons-ba99c.firebasestorage.app',
    messagingSenderId: '575950337220',
    appId: '1:575950337220:web:5aa25ba4a77f828a824591',
  },
  google: {
    iOSClientId: '575950337220-ld8lbbqd0fv4dfjp9bfh2u6n07sn6fgo.apps.googleusercontent.com',
    webClientId: '575950337220-753r070cen3jh5l9gonvu7khg3jjmbha.apps.googleusercontent.com', // TODO: Get from Firebase Console > Auth > Sign-in method > Google > Web client ID
  },
};
