import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

/* Keystatic's admin UI (/keystatic) is a React app whose API routes need a
   server. The public site doesn't need any of that, so the CMS is only mounted
   while `astro dev` is running and the deployed build stays fully static. */
const isDev = process.argv.includes('dev') || process.env.NODE_ENV === 'development';

export default defineConfig({
  site: 'https://aniposada.com',
  output: 'static',
  ...(isDev ? { adapter: node({ mode: 'standalone' }) } : {}),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } } }),
    ...(isDev ? [react(), keystatic()] : []),
  ],
});
