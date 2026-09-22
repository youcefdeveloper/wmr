// Server configuration. Astro exposes `.env` values on `import.meta.env`;
// standalone scripts (tsx) only have `process.env`, so fall back to it.
const astro = typeof import.meta.env === 'object' ? import.meta.env : undefined

export const env = {
  DATABASE_URL: astro?.DATABASE_URL ?? process.env.DATABASE_URL,
  PUBLIC_API_KEY: astro?.PUBLIC_API_KEY ?? process.env.PUBLIC_API_KEY,
  PUBLIC_API_KEY_WEEKLY_DATA_MANUAL:
    astro?.PUBLIC_API_KEY_WEEKLY_DATA_MANUAL ??
    process.env.PUBLIC_API_KEY_WEEKLY_DATA_MANUAL,
  CRON_SECRET: astro?.CRON_SECRET ?? process.env.CRON_SECRET,
  IMPORT_RATES_SOURCE_URL:
    astro?.PUBLIC_IMPORT_RATES_SOURCE_URL ??
    process.env.PUBLIC_IMPORT_RATES_SOURCE_URL,
  EXPO_API_BASE_URL:
    astro?.EXPO_API_BASE_URL ??
    process.env.EXPO_API_BASE_URL ??
    'https://api.expo.dev/v2',
  // Browser notifications for dashboard accounts. Unset keys turn them off.
  VAPID_PUBLIC_KEY:
    astro?.PUBLIC_VAPID_PUBLIC_KEY ?? process.env.PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: astro?.VAPID_PRIVATE_KEY ?? process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT:
    astro?.VAPID_SUBJECT ??
    process.env.VAPID_SUBJECT ??
    'mailto:contact@weeklymortgagerates.org',
} as const
