import { getSession } from 'auth-astro/server'
import { findAuthUserByEmail } from './admins'

/** The active dashboard account behind a request's session, if any. */
export async function currentAccount(request: Request) {
  const email = (await getSession(request))?.user?.email
  if (!email) return null
  const user = await findAuthUserByEmail(email)
  return user?.isActive ? user : null
}

export const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

/**
 * Parses a JSON body, rejecting anything not sent as application/json: a
 * cross-site form can't set that header without a CORS preflight, which
 * these routes never grant.
 */
export async function readJsonBody<T>(request: Request): Promise<T | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return null
  }
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
