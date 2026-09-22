import type { APIRoute } from 'astro'
import { eq } from 'drizzle-orm'
import { authUsers, db } from '@lib/server/db'
import { env } from '@lib/server/env'
import { pushConfigured } from '@lib/server/admin-notify'
import { canUseNotifications } from '@lib/server/access'
import {
  currentAccount,
  jsonResponse,
  readJsonBody,
} from '@lib/server/dashboard-account'

/** GET: the signed-in account's notification choices. */
export const GET: APIRoute = async ({ request }) => {
  const account = await currentAccount(request)
  if (!account) return jsonResponse({ error: 'Unauthorized' }, 401)
  if (!canUseNotifications(account.role)) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }
  return jsonResponse({
    newUsers: account.notifyNewUsers,
    returningUsers: account.notifyReturningUsers,
    // Null unless the server can also sign (needs the private key too), so
    // the page never lets a browser subscribe to notifications that can't
    // be sent.
    vapidPublicKey: pushConfigured() ? env.VAPID_PUBLIC_KEY ?? null : null,
  })
}

/** PUT { newUsers?, returningUsers? }: update either choice. */
export const PUT: APIRoute = async ({ request }) => {
  const account = await currentAccount(request)
  if (!account) return jsonResponse({ error: 'Unauthorized' }, 401)
  if (!canUseNotifications(account.role)) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  const body = await readJsonBody<{ newUsers?: unknown; returningUsers?: unknown }>(request)
  if (!body) return jsonResponse({ error: 'Expected a JSON body' }, 400)

  const changes: Partial<typeof authUsers.$inferInsert> = {}
  if (typeof body.newUsers === 'boolean') changes.notifyNewUsers = body.newUsers
  if (typeof body.returningUsers === 'boolean') {
    changes.notifyReturningUsers = body.returningUsers
  }
  if (!Object.keys(changes).length) {
    return jsonResponse({ error: 'Nothing to update' }, 400)
  }

  const [updated] = await db
    .update(authUsers)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(authUsers.id, account.id))
    .returning()
  return jsonResponse({
    newUsers: updated.notifyNewUsers,
    returningUsers: updated.notifyReturningUsers,
  })
}
