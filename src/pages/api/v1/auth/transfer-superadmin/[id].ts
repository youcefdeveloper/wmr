import { transferSuperadmin } from '@lib/server/admins'
import { requireRole } from '@lib/server/auth'
import { handler, idParam, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const POST = handler(async ({ request, params }) => {
  await requireRole(
    request,
    ['superadmin'],
    'Forbidden: Only superadmin can perform this action.',
  )
  return transferSuperadmin(idParam(params.id))
})
