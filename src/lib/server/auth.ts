import { getSession } from 'auth-astro/server'
import type { Role } from './db'
import { findAuthUserByEmail } from './admins'
import { forbidden } from './http'

/**
 * Resolves the dashboard role of the signed-in user, or null when there is no
 * session or the email isn't a registered dashboard account.
 */
export async function getSessionRole(request: Request): Promise<Role | null> {
  const session = await getSession(request)
  const email = session?.user?.email
  if (!email) return null
  const account = await findAuthUserByEmail(email)
  return account?.role ?? null
}

export async function requireRole(
  request: Request,
  roles: Role[],
  message: string,
): Promise<Role> {
  const role = await getSessionRole(request)
  if (!role || !roles.includes(role)) throw forbidden(message)
  return role
}
