import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://neurotrocity.com',
  build: { format: 'directory' },   // /rewire/landing/ not /rewire/landing.html
  trailingSlash: 'always',
});
