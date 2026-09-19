import { handler, intParam, orderParam, preflight } from '@lib/server/http'
import { pageUsWeekly } from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(({ url }) => {
  const q = url.searchParams
  return pageUsWeekly({
    page: intParam(url, 'page', 1),
    size: intParam(url, 'size', 10),
    order: orderParam(url, 'desc'),
    sort: q.get('sort') ?? '',
    start: q.get('start'),
    end: q.get('end'),
    source: q.get('source'),
  })
})
