import type { APIRoute } from 'astro'
import { askAgent } from '@lib/server/agent'
import {
  currentAccount,
  jsonResponse,
  readJsonBody,
} from '@lib/server/dashboard-account'
import { HttpError } from '@lib/server/http'
import { consumeRateLimit } from '@lib/server/rate-limit'
import { logger } from '@helpers/logger.ts'

/** POST: ask the rates assistant, for the dashboard chat. */
export const POST: APIRoute = async ({ request }) => {
  const account = await currentAccount(request)
  if (!account) return jsonResponse({ error: 'Unauthorized' }, 401)
  const body = await readJsonBody(request)
  if (!body) return jsonResponse({ error: 'Expected a JSON body' }, 400)
  // Each question costs OpenAI API usage.
  if (!(await consumeRateLimit(`assistant:${account.id}`, 60, 60 * 60))) {
    return jsonResponse({ error: 'Too many questions, try again later' }, 429)
  }
  try {
    return jsonResponse(await askAgent(body))
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status)
    }
    logger.error({ err }, 'Assistant request failed')
    return jsonResponse({ error: 'Internal Server Error' }, 500)
  }
}
