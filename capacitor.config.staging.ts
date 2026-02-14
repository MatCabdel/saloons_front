import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saloons.app',
  appName: 'Saloons',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: ['*.firebaseapp.com', '*.googleapis.com', 'accounts.google.com'],
  },
};

export default config;
