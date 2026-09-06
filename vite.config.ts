import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 30', 'android >= 4.4', 'ios >= 9', 'safari >= 9'],
      additionalLegacyPolyfills: [
        'regenerator-runtime/runtime',
        'whatwg-fetch',
        'fast-text-encoding',
        'abortcontroller-polyfill/dist/abortcontroller-polyfill-only',
      ],
      renderModernChunks: true,
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/sql': {
        target: 'https://ep-super-field-au3e58we-pooler.c-10.us-east-1.aws.neon.tech',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/sql/, '/sql'),
      },
    },
  },
});
