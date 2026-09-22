import type { APIRoute } from 'astro'
import { pushConfigured, sendTestNotification } from '@lib/server/admin-notify'
import { canUseNotifications } from '@lib/server/access'
import { consumeRateLimit } from '@lib/server/rate-limit'
import { currentAccount, jsonResponse } from '@lib/server/dashboard-account'

/** POST: send a sample notification to every browser of this account. */
export const POST: APIRoute = async ({ request }) => {
  const account = await currentAccount(request)
  if (!account) return jsonResponse({ error: 'Unauthorized' }, 401)
  if (!canUseNotifications(account.role)) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonResponse({ error: 'Expected a JSON body' }, 400)
  }
  if (!pushConfigured()) {
    return jsonResponse(
      {
        error:
          "The server can't send notifications: VAPID_PRIVATE_KEY or PUBLIC_VAPID_PUBLIC_KEY is missing. Add both, then restart the server.",
      },
      503,
    )
  }
  if (!(await consumeRateLimit(`admin-notify-test:${account.id}`, 5, 60))) {
    return jsonResponse({ error: 'Too many test notifications' }, 429)
  }
  return jsonResponse(await sendTestNotification(account.id))
}
