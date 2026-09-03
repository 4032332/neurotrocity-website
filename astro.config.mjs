import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://neurotrocity.com',
  build: { format: 'directory' },   // /rewire/landing/ not /rewire/landing.html
  trailingSlash: 'always',
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
          },
        },
      },
    },
  },
});
