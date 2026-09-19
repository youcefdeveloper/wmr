import { handler, orderParam, preflight } from '@lib/server/http'
import { listUsYearly } from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(({ url }) => listUsYearly(orderParam(url)))
