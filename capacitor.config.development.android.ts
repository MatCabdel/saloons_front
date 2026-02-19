import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saloons.app',
  appName: 'Saloons',
  webDir: 'dist/frontend/browser',
  server: {
    url: 'http://localhost:4200',
    cleartext: true,
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
