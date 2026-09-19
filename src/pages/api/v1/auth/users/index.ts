import {
  createAuthUser,
  pageAuthUsers,
  type AuthUserInput,
} from '@lib/server/admins'
import { requireRole } from '@lib/server/auth'
import { handler, intParam, json, preflight, readJson } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ url }) => {
  const q = url.searchParams
  return pageAuthUsers({
    page: intParam(url, 'page', 1),
    size: intParam(url, 'size', 10),
    role: q.get('role'),
    provider: q.get('provider'),
    active: q.get('active'),
    start: q.get('start'),
    end: q.get('end'),
    uOrder: q.get('uOrder'),
    eOrder: q.get('eOrder'),
    cOrder: q.get('cOrder'),
    rOrder: q.get('rOrder'),
  })
})

export const POST = handler(async ({ request }) => {
  await requireRole(
    request,
    ['superadmin', 'admin'],
    'Forbidden: Only superadmin or admin can create users.',
  )
  const user = await createAuthUser(await readJson<AuthUserInput>(request))
  return json(request, user, 201)
})
