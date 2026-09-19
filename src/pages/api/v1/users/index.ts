import { listDevices } from '@lib/server/devices'
import { handler, orderParam, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ url }) =>
  listDevices({
    platform: url.searchParams.get('platform'),
    start: url.searchParams.get('start'),
    end: url.searchParams.get('end'),
    order: orderParam(url),
  }),
)
