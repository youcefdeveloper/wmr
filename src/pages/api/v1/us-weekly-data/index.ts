import { handler, orderParam, preflight } from '@lib/server/http'
import { listUsWeekly } from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(({ url }) => listUsWeekly(orderParam(url)))
