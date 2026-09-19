import { getLocationStats } from '@lib/server/history'
import { handler, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ url }) =>
  getLocationStats(url.searchParams.get('country')),
)
