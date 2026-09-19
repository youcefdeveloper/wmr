import { pageDevices } from '@lib/server/devices'
import { handler, intParam, orderParam, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ url }) => {
  const param = (name: string) => url.searchParams.get(name)?.trim() ?? ''
  return pageDevices({
    page: intParam(url, 'page', 1),
    size: intParam(url, 'size', 10),
    platform: param('platform'),
    model: param('model'),
    visit: param('visit'),
    visitBy: param('visitBy'),
    start: url.searchParams.get('start'),
    end: url.searchParams.get('end'),
    order: orderParam(url, 'desc'),
    uOrder: param('uOrder'),
    vOrder: param('vOrder'),
  })
})
