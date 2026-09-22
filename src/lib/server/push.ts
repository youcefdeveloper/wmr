import { isIP } from 'node:net'
import { eq, sql } from 'drizzle-orm'
import { logger } from '@helpers/logger.ts'
import { db, devices, pushTokens, userUpdateHistory } from './db'
import { env } from './env'
import { HttpError, badRequest } from './http'
import { isSupportedLanguage } from './languages'
import { consumeRateLimit } from './rate-limit'
import { notifyAdmins, type DeviceEvent } from './admin-notify'
import { waitUntil } from '@vercel/functions'

export const PLATFORMS = ['ios', 'android', 'web', 'macos', 'windows'] as const

const DEVICE_ID_RE = /^[A-Fa-f0-9-]{36}$/

export type RegisterPushTokenInput = {
  token?: unknown
  deviceId?: unknown
  platform?: unknown
  model?: unknown
  ipAddress?: unknown
  lang?: unknown
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/**
 * POST /register-push-token — called by the mobile app on every launch.
 * Registers new devices, records a visit for known ones and stores the
 * latest Expo push token.
 */
export async function registerPushToken(
  input: RegisterPushTokenInput,
  clientIp: string,
) {
  const token = str(input.token)
  const deviceId = str(input.deviceId)
  const errors: Record<string, string> = {}
  if (!token.trim()) errors.token = 'Token is required'
  else if (token.length > 255) errors.token = 'Token is too long'
  if (!deviceId.trim()) errors.deviceId = 'This value should not be blank.'
  else if (!DEVICE_ID_RE.test(deviceId)) {
    errors.deviceId = 'Invalid device ID format.'
  }
  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Validation failed', { errors })
  }

  if (!(await consumeRateLimit(`register-push-token:${clientIp}`, 10, 60))) {
    throw new HttpError(429, 'Too many requests')
  }

  const platform = str(input.platform)
  if (!platform) throw badRequest('Missing token, deviceId or platform')

  const model = typeof input.model === 'string' ? input.model : null
  const ipAddress = typeof input.ipAddress === 'string' ? input.ipAddress : null
  const lang = typeof input.lang === 'string' ? input.lang : null

  const event = await db.transaction(async (tx) => {
    const now = new Date()
    const [existing] = await tx
      .select()
      .from(devices)
      .where(eq(devices.deviceId, deviceId))
      .limit(1)

    let userId: number
    let isNew: boolean
    if (!existing) {
      const invalid: { field: string; message: string }[] = []
      if (!(PLATFORMS as readonly string[]).includes(platform)) {
        invalid.push({ field: 'platform', message: 'Choose a valid platform.' })
      }
      if (model && model.length > 50) {
        invalid.push({
          field: 'model',
          message: 'This value is too long. It should have 50 characters or less.',
        })
      }
      if (invalid.length) {
        throw new HttpError(400, 'Validation failed', { errors: invalid })
      }
      const [created] = await tx
        .insert(devices)
        .values({
          deviceId,
          platform,
          model,
          ipAddress,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: devices.id })
      userId = created.id
      isNew = true
    } else {
      userId = existing.id
      isNew = false
      await tx.insert(userUpdateHistory).values({
        userId,
        updatedAt: now,
        source: 'register-push-token',
        ipAddress: ipAddress && isIP(ipAddress) ? ipAddress : null,
        lang: lang && isSupportedLanguage(lang) ? lang : null,
      })
      await tx
        .update(devices)
        .set({
          updatedAt: now,
          ...(model !== null && model !== existing.model ? { model } : {}),
        })
        .where(eq(devices.id, userId))
    }

    const [pushToken] = await tx
      .select({ id: pushTokens.id })
      .from(pushTokens)
      .where(eq(pushTokens.deviceId, deviceId))
      .limit(1)
    if (pushToken) {
      await tx
        .update(pushTokens)
        .set({ token, updatedAt: now })
        .where(eq(pushTokens.id, pushToken.id))
    } else {
      await tx.insert(pushTokens).values({
        userId,
        deviceId,
        token,
        createdAt: now,
        updatedAt: now,
      })
    }

    const device: DeviceEvent = {
      id: userId,
      platform: existing?.platform ?? platform,
      model: model ?? existing?.model ?? null,
      // The app reports its public IP; the request's own IP is the fallback.
      ipAddress: ipAddress && isIP(ipAddress) ? ipAddress : clientIp,
      lang: lang && isSupportedLanguage(lang) ? lang : null,
    }
    return { isNew, device }
  })

  // After the response, so the app never waits on push services. Outside
  // Vercel there is no request context and the promise simply runs.
  waitUntil(notifyAdmins(event.isNew ? 'new' : 'returning', event.device))

  return { success: true }
}

const EXPO_PUSH_URL = `${env.EXPO_API_BASE_URL.replace(/\/$/, '')}/push/send`

// Expo accepts at most 100 messages per request.
const EXPO_BATCH_SIZE = 100

type ExpoMessage = {
  to: string
  title: string
  subtitle: string
  body: string
  badge: number
  sound: string
  channelId: string
}

export type BroadcastResult = {
  recipients: number
  skipped: number
  failedBatches: number
}

/** A push token plus the platform of the device it belongs to. */
export type PushRecipient = { token: string; platform: string }

/** Expo returns one ticket per message, in request order. */
export type ExpoTicket = {
  status?: string
  id?: string
  message?: string
  details?: { error?: string }
}

/**
 * Sends one notification to the given recipients, in batches. Non-mobile
 * platforms are skipped. Android has no subtitle, so it's appended to the
 * title there.
 */
export async function sendPushNotification(
  recipients: PushRecipient[],
  title: string,
  subtitle: string,
  body: string,
): Promise<BroadcastResult & { tickets: ExpoTicket[] }> {
  const messages: ExpoMessage[] = []
  let skipped = 0
  for (const { token, platform } of recipients) {
    if (platform !== 'ios' && platform !== 'android') {
      skipped++
      continue
    }
    messages.push({
      to: token,
      title: platform === 'android' && subtitle ? `${title} — ${subtitle}` : title,
      subtitle,
      body,
      badge: 0,
      sound: 'default',
      channelId: 'default',
    })
  }

  let failedBatches = 0
  const tickets: ExpoTicket[] = []
  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_BATCH_SIZE)
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(10_000),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok) {
        failedBatches++
        logger.error({ status: res.status, result }, 'Expo push batch failed')
      } else {
        if (Array.isArray(result?.data)) tickets.push(...result.data)
        logger.info({ count: batch.length, result }, 'Expo push batch sent')
      }
    } catch (err) {
      failedBatches++
      logger.error({ err }, 'Expo push batch failed')
    }
  }

  return { recipients: messages.length, skipped, failedBatches, tickets }
}

/** Every registered push token, one row per token. */
export function listPushRecipients() {
  return db
    .select({
      token: pushTokens.token,
      platform: sql<string>`min(${devices.platform})`,
    })
    .from(pushTokens)
    .innerJoin(devices, eq(devices.id, pushTokens.userId))
    .groupBy(pushTokens.token)
}

/**
 * Sends a notification to every registered iOS/Android push token.
 */
export async function broadcastPushNotification(
  title: string,
  subtitle: string,
  body: string,
): Promise<BroadcastResult> {
  const tokens = await listPushRecipients()
  // Destructured so the tickets stay internal: this is a public API response.
  const { recipients, skipped, failedBatches } = await sendPushNotification(
    tokens,
    title,
    subtitle,
    body,
  )
  return { recipients, skipped, failedBatches }
}
