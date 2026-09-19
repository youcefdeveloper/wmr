import { handler, HttpError, preflight } from '@lib/server/http'
import { getLatestUsWeekly } from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(async () => {
  const latest = await getLatestUsWeekly()
  if (!latest) throw new HttpError(404, 'No data found', { message: 'No data found' })
  return latest
})
