import {
  deleteAuthUser,
  getAuthUser,
  updateAuthUser,
  type AuthUserInput,
} from '@lib/server/admins'
import { requireRole } from '@lib/server/auth'
import { currentAccount } from '@lib/server/dashboard-account'
import { forbidden, handler, idParam, preflight, readJson } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(({ params }) => getAuthUser(idParam(params.id)))

export const PUT = handler(async ({ request, params }) => {
  const role = await requireRole(
    request,
    ['superadmin', 'admin'],
    'Forbidden: Only superadmin or admin can update users.',
  )
  const body = await readJson<AuthUserInput>(request)
  if (role === 'admin' && body.role && body.role !== 'admin') {
    throw forbidden('Forbidden: Admin can only update user role to admin.')
  }
  return updateAuthUser(idParam(params.id), body)
})

export const PATCH = PUT

export const DELETE = handler(async ({ request, params }) => {
  await requireRole(
    request,
    ['superadmin', 'admin'],
    'Forbidden: Only superadmin or admin can delete users.',
  )
  const id = idParam(params.id)
  // Deleting your own account ends your access: `self` tells the dashboard
  // to sign you out instead of refreshing a page you can no longer open.
  const me = await currentAccount(request)
  const result = await deleteAuthUser(id)
  return { ...result, self: me?.id === id }
})
