/**
 * Lists the browsers set up for dashboard notifications and the account each
 * one belongs to (`npm run notify:subs`, or `notify:subs:vercel` for
 * production). Read-only.
 *
 * A browser keeps one push subscription across sign-ins, so a browser can be
 * sending to an account other than the one signed in there now: that is what
 * to look for when someone turns both switches off and still gets notified.
 */
import './direct-url'
import { asc, eq } from 'drizzle-orm'
import { adminPushSubscriptions, authUsers, db } from '../src/lib/server/db'

const rows = await db
  .select({
    id: adminPushSubscriptions.id,
    email: authUsers.email,
    role: authUsers.role,
    isActive: authUsers.isActive,
    newUsers: authUsers.notifyNewUsers,
    returningUsers: authUsers.notifyReturningUsers,
    endpoint: adminPushSubscriptions.endpoint,
    userAgent: adminPushSubscriptions.userAgent,
    createdAt: adminPushSubscriptions.createdAt,
  })
  .from(adminPushSubscriptions)
  .innerJoin(authUsers, eq(authUsers.id, adminPushSubscriptions.authUserId))
  .orderBy(asc(adminPushSubscriptions.id))

if (!rows.length) {
  console.log('No browser is set up for notifications.')
} else {
  console.table(
    rows.map((r) => ({
      id: r.id,
      account: r.email,
      role: r.role,
      active: r.isActive,
      new: r.newUsers,
      returning: r.returningUsers,
      // The host is all that identifies the push service; the rest is a secret.
      service: new URL(r.endpoint).host,
      browser: (r.userAgent ?? '').slice(0, 40),
      since: r.createdAt?.toISOString().slice(0, 10),
    })),
  )
  const live = rows.filter((r) => r.isActive && (r.newUsers || r.returningUsers))
  console.log(
    live.length
      ? `\nReceiving now: ${live.map((r) => `${r.email} (#${r.id})`).join(', ')}`
      : '\nNo browser is receiving: every account above has both switches off.',
  )
}
process.exit(0)
