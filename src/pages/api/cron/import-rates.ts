import type { APIRoute } from 'astro'
import { logger } from '@helpers/logger.ts'
import { env } from '@lib/server/env'
import {
  DEFAULT_RATES_SOURCE_URL,
  importAndNotify,
} from '@lib/server/importer'

/**
 * Scheduled import of the Freddie Mac PMMS workbook (replaces the Symfony
 * `app:import-excel` cron). Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`; it cannot send custom headers, so
 * this route uses that instead of the API key.
 *
 * Weeks already in the database are skipped, so running it more often than
 * Freddie Mac publishes is harmless. Pass `?push=no` to import silently.
 */
export const GET: APIRoute = async ({ request, url }) => {
  const secret = env.CRON_SECRET
  const authorized =
    !!secret &&
    (request.headers.get('authorization') === `Bearer ${secret}` ||
      request.headers.get('x-cron-secret') === secret)
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const push = url.searchParams.get('push') !== 'no'
  const source = {
    url:
      url.searchParams.get('url') ||
      env.IMPORT_RATES_SOURCE_URL ||
      DEFAULT_RATES_SOURCE_URL,
  }

  try {
    const result = await importAndNotify(source, push)
    logger.info(
      { imported: result.newRates.length, notification: result.notification },
      'Scheduled rates import finished',
    )
    // A summary, not the rows: a first import backfills every week since 1971,
    // and cron runners abort responses over a size limit. The weeks themselves
    // are in the log line above.
    const weeks = result.newRates.map((r) => r.date)
    return new Response(
      JSON.stringify({
        success: result.success,
        imported: result.imported,
        count: weeks.length,
        firstWeek: weeks[0] ?? null,
        lastWeek: weeks[weeks.length - 1] ?? null,
        notification: result.notification,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    logger.error({ err }, 'Scheduled rates import failed')
    return new Response(
      JSON.stringify({
        success: false,
        error: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
