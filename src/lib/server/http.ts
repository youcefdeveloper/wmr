import type { APIContext, APIRoute } from 'astro'
import { logger } from '@helpers/logger.ts'
import { env } from './env'

const allowedOrigins = [
  /^https?:\/\/localhost(:[0-9]+)?$/,
  /^https?:\/\/192\.168\.12\.180(:[0-9]+)?$/,
  /^https?:\/\/([a-z0-9-]+\.)*weeklymortgagerates\.org$/,
  /^https:\/\/wmr-ui-demo\.vercel\.app$/,
]

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin')
  if (!origin || !allowedOrigins.some((re) => re.test(origin))) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'X-API-KEY, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '3600',
    Vary: 'Origin',
  }
}

/** Error with an HTTP status, turned into `{ error }` JSON by `handler`. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export const badRequest = (message: string) => new HttpError(400, message)
export const notFound = (message = 'Not found') => new HttpError(404, message)
export const forbidden = (message: string) => new HttpError(403, message)
export const conflict = (message: string) => new HttpError(409, message)

export function json(request: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  })
}

type ApiKey = 'default' | 'manual'

const API_KEYS: Record<ApiKey, string | undefined> = {
  default: env.PUBLIC_API_KEY,
  manual: env.PUBLIC_API_KEY_WEEKLY_DATA_MANUAL,
}

function checkApiKey(request: Request, key: ApiKey) {
  const expected = API_KEYS[key]
  if (!expected || request.headers.get('x-api-key') !== expected) {
    throw new HttpError(401, 'Unauthorized')
  }
}

type HandlerOptions = {
  /** Which API key the route requires (default: the public API key). */
  apiKey?: ApiKey | false
}

/**
 * Wraps an API route with API-key auth, CORS, JSON serialisation and error
 * handling. The callback returns data (serialised as 200 JSON) or a Response.
 */
export function handler(
  fn: (ctx: APIContext) => Promise<unknown> | unknown,
  { apiKey = 'default' }: HandlerOptions = {},
): APIRoute {
  return async (ctx) => {
    const { request } = ctx
    try {
      if (apiKey) checkApiKey(request, apiKey)
      const result = await fn(ctx)
      return result instanceof Response ? result : json(request, result)
    } catch (err) {
      if (err instanceof HttpError) {
        return json(request, err.body ?? { error: err.message }, err.status)
      }
      logger.error(
        { err, method: request.method, path: ctx.url.pathname },
        'Unhandled API error',
      )
      return json(request, { error: 'Internal Server Error' }, 500)
    }
  }
}

export const preflight: APIRoute = ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request) })

export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw badRequest('Invalid JSON')
  }
}

/** `?order=desc` → 'desc', anything else → the fallback. */
export function orderParam(
  url: URL,
  fallback: 'asc' | 'desc' = 'asc',
  name = 'order',
): 'asc' | 'desc' {
  const value = url.searchParams.get(name)?.trim().toLowerCase()
  if (value === 'asc' || value === 'desc') return value
  return fallback
}

export function intParam(url: URL, name: string, fallback: number): number {
  const n = parseInt(url.searchParams.get(name) ?? '', 10)
  return Number.isNaN(n) ? fallback : n
}

export function paginate(page: number, size: number, total: number) {
  return {
    page,
    size,
    total,
    pages: Math.ceil(total / size),
    from: total > 0 ? (page - 1) * size + 1 : 0,
    to: total > 0 ? Math.min(page * size, total) : 0,
  }
}

export function clientIp(ctx: APIContext): string {
  const forwarded = ctx.request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  try {
    return ctx.clientAddress
  } catch {
    return 'unknown'
  }
}

/** Numeric route param; anything else is a 404 like the original routes. */
export function idParam(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) throw notFound()
  return Number(value)
}

/**
 * Runs a server-side data load for a page, logging failures and returning
 * undefined so the page can render its empty state instead of crashing.
 */
export async function tryLoad<T>(
  label: string,
  load: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await load()
  } catch (err) {
    logger.error({ err }, `Failed to load ${label}`)
    return undefined
  }
}
