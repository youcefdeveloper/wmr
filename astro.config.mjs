// @ts-check
import { defineConfig } from 'astro/config'

import react from '@astrojs/react'
import vercel from '@astrojs/vercel'

import auth from 'auth-astro'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react(), auth()],
  adapter: vercel({
    // Read at runtime by src/lib/server/geo.ts.
    includeFiles: ['./data/GeoLite2-City.mmdb'],
    // Excel imports download the Freddie Mac workbook and fan out push
    // notifications, which can exceed the default timeout.
    maxDuration: 60,
  }),
  experimental: {},
  security: {
    checkOrigin: false
  }
})
