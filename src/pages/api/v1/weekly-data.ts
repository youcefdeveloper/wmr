import { handler, orderParam, preflight } from '@lib/server/http'
import { listWeeklyData } from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(({ url }) => listWeeklyData(orderParam(url)))
