import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://neurotrocity.com',
  build: { format: 'directory', inlineStylesheets: 'always' },   // /rewire/landing/ not /rewire/landing.html
  trailingSlash: 'always',
  // Some links use /terms/; the licence lives at /eula/.
  redirects: { '/beeptest/terms/': '/beeptest/eula/' },
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
