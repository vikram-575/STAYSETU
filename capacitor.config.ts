import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pgsetu.app',
  appName: 'PG-SETU',
  webDir: 'out',
  server: {
    url: 'https://pgsetu.onrender.com',
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2563EB',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
}

export default config
