import { sql } from 'drizzle-orm'
import { db, rateLimits } from './db'

/**
 * Fixed-window limiter backed by Postgres so it holds across serverless
 * instances. Returns false once `limit` hits are exceeded within the window.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const windowOpen = sql`${rateLimits.windowStart} > now() - make_interval(secs => ${windowSeconds})`
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart: sql`now()`, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${windowOpen} then ${rateLimits.count} + 1 else 1 end`,
        windowStart: sql`case when ${windowOpen} then ${rateLimits.windowStart} else now() end`,
      },
    })
    .returning({ count: rateLimits.count })
  return row.count <= limit
}
