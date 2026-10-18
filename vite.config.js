import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // The video encoder chunk is loaded only when export starts. Keep the
    // warning focused on chunks that affect the initial editor load.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three-vendor';
        },
      },
    },
  },
});
