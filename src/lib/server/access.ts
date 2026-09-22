import { findAuthUserByEmail } from './admins'
import type { Role } from './db'

/**
 * Pages the `user` role may not open. Each entry also covers everything
 * below it, e.g. `/dashboard/devices/42` and `/api-docs/openapi.json`.
 */
const USER_BLOCKED = ['/dashboard/settings', '/dashboard/devices', '/api-docs']

/**
 * The dashboard role for a signed-in email. Roles live in `auth_user`, not in
 * the session token, so they reflect changes made in Settings immediately.
 */
export async function roleForEmail(
  email: string | null | undefined,
): Promise<Role | null> {
  if (!email) return null
  const user = await findAuthUserByEmail(email)
  return user?.isActive ? user.role : null
}

/**
 * Whether `role` may open `pathname`. A missing role (deleted or deactivated
 * account with a live session) gets the most restricted access.
 */
export function canAccess(role: Role | null, pathname: string): boolean {
  if (role === 'admin' || role === 'superadmin') return true
  return !USER_BLOCKED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
