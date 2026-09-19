import { handler, HttpError, preflight, readJson } from '@lib/server/http'
import { broadcastPushNotification } from '@lib/server/push'

export const OPTIONS = preflight

export const POST = handler(async ({ request }) => {
  const data = await readJson<{ title?: string; subtitle?: string; body?: string }>(request)
  const title = data.title || 'U.S. Weekly Average'
  const { subtitle, body } = data
  if (!subtitle || !body) {
    throw new HttpError(400, 'Missing fields', {
      success: false,
      error: 'Missing required fields: title, subtitle, and body are required.',
    })
  }
  const result = await broadcastPushNotification(title, subtitle, body)
  return { success: true, message: 'Push notification sent.', ...result }
})
