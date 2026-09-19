/**
 * Scripts run migrations and bulk copies, which should use a direct
 * connection rather than a pooler. Vercel/Neon expose it as
 * DATABASE_URL_UNPOOLED; import this before the db module.
 */
if (process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED
}

const url = process.env.DATABASE_URL
if (url) {
  const { host, pathname } = new URL(url)
  console.log(`Target database: ${host}${pathname}`)
}
