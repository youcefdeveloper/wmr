import { and, count, eq } from 'drizzle-orm'
import webpush from 'web-push'
import { logger } from '@helpers/logger.ts'
import {
  adminPushSubscriptions,
  authUsers,
  db,
  userUpdateHistory,
  type AdminPushSubscription,
} from './db'
import { env } from './env'
import { getLocationFromIp } from './geo'
import { getLanguageName } from './languages'

/**
 * Browser notifications for dashboard accounts (web push), sent when the
 * mobile app registers a new device or a known one comes back. Each account
 * opts in per event in My Account; each browser it allowed is a subscription.
 */

export type AdminEvent = 'new' | 'returning'

type Payload = { title: string; body: string; url: string }

let vapidSet = false
/**
 * Whether the server can sign notifications. Both keys are required: a
 * server with only the public one lets browsers subscribe but can't send.
 * Only success is cached, so keys added later are picked up.
 */
export function pushConfigured(): boolean {
  if (vapidSet) return true
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
  vapidSet = true
  return true
}

/** Sends to each subscription; drops the ones the browser has revoked. */
async function deliver(subs: AdminPushSubscription[], payload: Payload) {
  const body = JSON.stringify(payload)
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        // Worthless once stale: a visit from an hour ago isn't news.
        { TTL: 60 * 60 },
      ),
    ),
  )
  let sent = 0
  for (const [i, r] of results.entries()) {
    if (r.status === 'fulfilled') {
      sent++
      continue
    }
    const status = (r.reason as { statusCode?: number })?.statusCode
    // 404/410: the user revoked permission or the browser dropped the
    // subscription. It will never work again.
    if (status === 404 || status === 410) {
      await db
        .delete(adminPushSubscriptions)
        .where(eq(adminPushSubscriptions.id, subs[i].id))
    } else {
      logger.error({ err: r.reason, status }, 'Admin notification failed')
    }
  }
  return sent
}

export type DeviceEvent = {
  id: number
  platform: string
  model: string | null
  /** The IP the dashboard records for this visit, for the location line. */
  ipAddress: string | null
  /** The app's language code, e.g. `ar`, when it reported a supported one. */
  lang: string | null
}

/**
 * Notifies every active account that opted in to `event`. Never throws: it
 * runs after the app's registration has already been answered.
 */
export async function notifyAdmins(event: AdminEvent, device: DeviceEvent) {
  try {
    if (!pushConfigured()) return
    const pref =
      event === 'new' ? authUsers.notifyNewUsers : authUsers.notifyReturningUsers
    const subs = await db
      .select({ sub: adminPushSubscriptions })
      .from(adminPushSubscriptions)
      .innerJoin(authUsers, eq(authUsers.id, adminPushSubscriptions.authUserId))
      .where(and(eq(authUsers.isActive, true), eq(pref, true)))
    if (!subs.length) return

    const what = `${device.model || 'Unknown model'} · ${platformName(device.platform)}`
    // Second line: where the user is and the app's language. The location
    // uses the dashboard's lookup so the two always agree; private or
    // unresolvable addresses are left out rather than shown vaguely.
    const location = getLocationFromIp(device.ipAddress)
    const about = [
      location && location !== 'Local Network' ? location : null,
      getLanguageName(device.lang),
    ]
      .filter(Boolean)
      .join(' · ')
    const aboutLine = about ? `\n${about}` : ''
    let payload: Payload
    if (event === 'new') {
      payload = {
        title: 'New user',
        body: what + aboutLine,
        url: `/dashboard/devices/${device.id}`,
      }
    } else {
      // Registration itself is visit #1; every history row is a return.
      const [{ n }] = await db
        .select({ n: count() })
        .from(userUpdateHistory)
        .where(eq(userUpdateHistory.userId, device.id))
      payload = {
        title: 'Returning user',
        body: `${what} · visit ${n + 1}${aboutLine}`,
        url: `/dashboard/devices/${device.id}`,
      }
    }
    await deliver(
      subs.map((s) => s.sub),
      payload,
    )
  } catch (err) {
    logger.error({ err, event, deviceId: device.id }, 'Admin notification failed')
  }
}

/** Sends a sample notification to every browser of one account. */
export async function sendTestNotification(authUserId: number) {
  const subs = await db
    .select()
    .from(adminPushSubscriptions)
    .where(eq(adminPushSubscriptions.authUserId, authUserId))
  const sent = await deliver(subs, {
    title: 'Test notification',
    body: 'Browser notifications are working for this dashboard account.',
    url: '/dashboard/my-account',
  })
  return { sent, subscriptions: subs.length }
}

const platformName = (p: string) =>
  ({ ios: 'iOS', android: 'Android' })[p] ?? p
