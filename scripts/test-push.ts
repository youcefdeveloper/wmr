/**
 * Sends one test push to a single device (`npm run push:test`).
 *
 *   npm run push:test -- --list
 *   npm run push:test -- --device-id <uuid> --body "Hello"
 *   npm run push:test -- --token "ExponentPushToken[...]" --body "Hello"
 *
 * Unlike POST /api/v1/push-notification, this never fans out: it resolves
 * exactly one token and refuses to send to more.
 */
import './direct-url'
import { eq } from 'drizzle-orm'
import { db, devices, pushTokens } from '../src/lib/server/db'
import {
  sendPushNotification,
  type ExpoTicket,
  type PushRecipient,
} from '../src/lib/server/push'
import { env } from '../src/lib/server/env'

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}

const RECEIPTS_URL = `${env.EXPO_API_BASE_URL.replace(/\/$/, '')}/push/getReceipts`

/** Expo delivers asynchronously; receipts need a moment to exist. */
const RECEIPT_DELAY_MS = 3000

async function list() {
  const rows = await db
    .select({
      deviceId: devices.deviceId,
      platform: devices.platform,
      model: devices.model,
      token: pushTokens.token,
      updatedAt: pushTokens.updatedAt,
    })
    .from(pushTokens)
    .innerJoin(devices, eq(devices.id, pushTokens.userId))
    .orderBy(pushTokens.updatedAt)

  console.log(`${rows.length} registered device(s), oldest first:\n`)
  for (const r of rows.slice(-25)) {
    // Tokens are credentials of a sort — print only enough to recognise one.
    const short = `${r.token.slice(0, 22)}…`
    console.log(
      `${r.deviceId}  ${r.platform.padEnd(8)} ${(r.model ?? '-').padEnd(20)} ` +
        `${short}  ${r.updatedAt.toISOString().slice(0, 10)}`,
    )
  }
  if (rows.length > 25) console.log(`\n(showing the 25 most recently seen)`)
}

async function main() {
  if (process.argv.includes('--list')) return list()

  const deviceId = arg('device-id')
  const rawToken = arg('token')
  if (!deviceId && !rawToken) {
    throw new Error(
      'Pass --device-id <uuid> or --token <ExponentPushToken[...]>, ' +
        'or --list to see registered devices.',
    )
  }

  let recipient: PushRecipient
  if (rawToken) {
    recipient = { token: rawToken, platform: arg('platform') ?? 'ios' }
  } else {
    const rows = await db
      .select({ token: pushTokens.token, platform: devices.platform })
      .from(pushTokens)
      .innerJoin(devices, eq(devices.id, pushTokens.userId))
      .where(eq(devices.deviceId, deviceId!))

    if (rows.length === 0) throw new Error(`No push token for device ${deviceId}`)
    if (rows.length > 1) {
      throw new Error(
        `Device ${deviceId} has ${rows.length} tokens; pass --token to pick one.`,
      )
    }
    recipient = rows[0]
  }

  const title = arg('title') ?? 'U.S. Weekly Average'
  const subtitle = arg('subtitle') ?? 'Test'
  const body = arg('body') ?? 'Single-device test notification.'

  console.log(`Sending to 1 device (${recipient.platform}): ${recipient.token.slice(0, 22)}…`)
  const result = await sendPushNotification([recipient], title, subtitle, body)

  if (result.skipped) {
    throw new Error(
      `Platform "${recipient.platform}" is not push-capable (ios/android only).`,
    )
  }
  if (result.failedBatches || result.recipients === 0) {
    throw new Error('Expo rejected the request; see the logged response above.')
  }

  const [ticket] = result.tickets
  console.log('Ticket:', ticket)
  if (ticket?.status === 'error') {
    throw new Error(`Expo error: ${ticket.message ?? ''} ${ticket.details?.error ?? ''}`)
  }
  if (!ticket?.id) return

  await new Promise((r) => setTimeout(r, RECEIPT_DELAY_MS))
  const res = await fetch(RECEIPTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [ticket.id] }),
    signal: AbortSignal.timeout(10_000),
  })
  const receipts = (await res.json().catch(() => null)) as {
    data?: Record<string, ExpoTicket>
  } | null
  const receipt = receipts?.data?.[ticket.id]
  console.log('Receipt:', receipt ?? '(not ready yet — retry getReceipts shortly)')
  if (receipt?.status === 'error') {
    console.error(
      `Delivery failed: ${receipt.message ?? ''} ${receipt.details?.error ?? ''}`,
    )
    process.exitCode = 1
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => db.$client.end())
