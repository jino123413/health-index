import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'health-index',
  plugins: [
    appsInToss({
      brand: {
        displayName: '헬스인덱스',
        primaryColor: '#00BFA5',
        icon: 'https://raw.githubusercontent.com/jino123413/health-index/main/assets/logo.png',
        bridgeColorMode: 'basic',
      },
      permissions: [],
    }),
    router(),
    hermes(),
  ],
});
