import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.ade150.dschat',
  appName: 'DSChat',
  webDir: 'dist',
  backgroundColor: '#121317',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
