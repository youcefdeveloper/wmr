import { pageDeviceHistory } from '@lib/server/history'
import { handler, idParam, intParam, orderParam, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ params, url }) =>
  pageDeviceHistory(idParam(params.id), {
    page: intParam(url, 'page', 1),
    size: intParam(url, 'size', 10),
    order: orderParam(url, 'desc'),
    source: url.searchParams.get('source'),
    start: url.searchParams.get('start'),
    end: url.searchParams.get('end'),
  }),
)
