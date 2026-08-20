import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pgsetu.app',
  appName: 'PG-SETU',
  webDir: 'out',
  server: {
    // If testing on a physical mobile device on local Wi-Fi, set your local IP here
    // or point to your production deployment URL.
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
