import { getAuthInitData } from '@lib/server/admins'
import { getSessionRole } from '@lib/server/auth'
import { handler, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(async ({ request }) =>
  getAuthInitData(await getSessionRole(request)),
)
