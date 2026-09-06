import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 30', 'android >= 4.4', 'ios >= 9', 'safari >= 9'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderModernChunks: true,
    }),
  ],
  server: {
    port: 3000,
  },
});
