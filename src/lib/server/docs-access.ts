import { getSession } from 'auth-astro/server'

/** API docs need a dashboard session, in development as well as production. */
export async function canViewApiDocs(request: Request): Promise<boolean> {
  return !!(await getSession(request))?.user
}
