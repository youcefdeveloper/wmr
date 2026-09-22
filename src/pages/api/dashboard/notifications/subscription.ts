import type { APIRoute } from 'astro'
import { and, eq } from 'drizzle-orm'
import { adminPushSubscriptions, db } from '@lib/server/db'
import { canUseNotifications } from '@lib/server/access'
import {
  currentAccount,
  jsonResponse,
  readJsonBody,
} from '@lib/server/dashboard-account'

type Subscription = {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

const isHttps = (url: string) => {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

/** POST <PushSubscription JSON>: allow this browser to receive notifications. */
export const POST: APIRoute = async ({ request }) => {
  const account = await currentAccount(request)
  if (!account) return jsonResponse({ error: 'Unauthorized' }, 401)
  if (!canUseNotifications(account.role)) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  const body = await readJsonBody<Subscription>(request)
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const auth = body?.keys?.auth
  if (
    typeof endpoint !== 'string' ||
    !isHttps(endpoint) ||
    typeof p256dh !== 'string' ||
    typeof auth !== 'string' ||
    p256dh.length > 255 ||
    auth.length > 255
  ) {
    return jsonResponse({ error: 'Invalid push subscription' }, 400)
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 255) ?? null
  // The same browser re-subscribing, possibly after signing in as someone
  // else, moves to the current account rather than duplicating.
  await db
    .insert(adminPushSubscriptions)
    .values({ authUserId: account.id, endpoint, p256dh, auth, userAgent })
    .onConflictDoUpdate({
      target: adminPushSubscriptions.endpoint,
      set: { authUserId: account.id, p256dh, auth, userAgent },
    })
  return jsonResponse({ subscribed: true })
}

/** DELETE { endpoint }: stop sending to this browser. */
export const DELETE: APIRoute = async ({ request }) => {
  const account = await currentAccount(request)
  if (!account) return jsonResponse({ error: 'Unauthorized' }, 401)
  if (!canUseNotifications(account.role)) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  const body = await readJsonBody<{ endpoint?: unknown }>(request)
  if (typeof body?.endpoint !== 'string') {
    return jsonResponse({ error: 'Expected { endpoint }' }, 400)
  }
  await db
    .delete(adminPushSubscriptions)
    .where(
      and(
        eq(adminPushSubscriptions.endpoint, body.endpoint),
        eq(adminPushSubscriptions.authUserId, account.id),
      ),
    )
  return jsonResponse({ subscribed: false })
}
