import { handler, orderParam, preflight } from '@lib/server/http'
import { getUsWeeklyRange } from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(({ url }) =>
  getUsWeeklyRange(
    url.searchParams.get('start'),
    url.searchParams.get('end'),
    orderParam(url),
  ),
)
