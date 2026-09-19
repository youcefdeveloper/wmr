import { getComebackRange } from '@lib/server/devices'
import { handler, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ url }) =>
  getComebackRange(url.searchParams.get('start'), url.searchParams.get('end')),
)
