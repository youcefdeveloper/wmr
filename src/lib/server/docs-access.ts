import { getSession } from 'auth-astro/server'
import { canAccess, roleForEmail } from './access'

/**
 * API docs need a dashboard session and a role allowed to see them. The
 * middleware checks this too; repeating it here keeps the routes safe on
 * their own.
 */
export async function canViewApiDocs(request: Request): Promise<boolean> {
  const email = (await getSession(request))?.user?.email
  if (!email) return false
  return canAccess(await roleForEmail(email), '/api-docs')
}
