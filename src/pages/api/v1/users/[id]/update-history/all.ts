import { listDeviceHistory } from '@lib/server/history'
import { handler, idParam, orderParam, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ params, url }) =>
  listDeviceHistory(idParam(params.id), {
    order: orderParam(url, 'desc'),
    source: url.searchParams.get('source'),
    start: url.searchParams.get('start'),
    end: url.searchParams.get('end'),
  }),
)
