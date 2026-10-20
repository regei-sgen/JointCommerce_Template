import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GH_PAGES=1 builds for https://<user>.github.io/JointCommerce_Template/ (project pages subpath).
// ARTIFACT=1 builds with relative asset paths (for static hosts that serve from any path).
const base = process.env.GH_PAGES ? '/JointCommerce_Template/' : process.env.ARTIFACT ? './' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173, strictPort: false },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // long-lived vendor chunks cache independently of app code
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet'],
        },
      },
    },
  },
});
