import { getAuthInitData } from '@lib/server/admins'
import { handler, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(() => getAuthInitData())
