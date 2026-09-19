import { getUsStatesChart } from '@lib/server/history'
import { handler, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ url }) =>
  getUsStatesChart(
    (url.searchParams.get('city-order') ?? 'alphabetic').toLowerCase(),
  ),
)
