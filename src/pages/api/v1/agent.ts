import { askAgent } from '@lib/server/agent'
import { clientIp, handler, HttpError, preflight, readJson } from '@lib/server/http'
import { consumeRateLimit } from '@lib/server/rate-limit'

export const OPTIONS = preflight

// Each question costs OpenAI API usage, so cap it per client.
const LIMIT = 20
const WINDOW_SECONDS = 60 * 60

export const POST = handler(async (ctx) => {
  if (!(await consumeRateLimit(`agent:${clientIp(ctx)}`, LIMIT, WINDOW_SECONDS))) {
    throw new HttpError(429, 'Too many questions, please try again later')
  }
  return askAgent(await readJson(ctx.request))
})
