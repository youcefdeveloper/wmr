import { getSession } from 'auth-astro/server'

/** API docs are open in development and need a dashboard session otherwise. */
export async function canViewApiDocs(request: Request): Promise<boolean> {
  if (import.meta.env.DEV) return true
  return !!(await getSession(request))?.user
}
