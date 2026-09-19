import { handler, idParam, orderParam, preflight } from '@lib/server/http'
import { getUsWeeklyByYear } from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(({ params, url }) =>
  getUsWeeklyByYear(idParam(params.year), orderParam(url)),
)
