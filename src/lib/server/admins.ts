import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  notInArray,
  sql,
  type SQL,
} from 'drizzle-orm'
import {
  authUsers,
  db,
  PROVIDERS,
  ROLES,
  type AuthUser,
  type Provider,
  type Role,
} from './db'
import { easternDayRange, formatIso } from './dates'
import {
  badRequest,
  conflict,
  forbidden,
  HttpError,
  notFound,
  paginate,
} from './http'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The roles `viewer` may see: its own rank and everything below it, so an
 * admin doesn't list the superadmins it isn't allowed to touch anyway.
 * `ROLES` is ordered most privileged first. A caller with no dashboard
 * session (an API key alone) is not ranked and sees everything.
 */
const visibleRoles = (viewer: Role | null | undefined): Role[] =>
  viewer ? ROLES.slice(ROLES.indexOf(viewer)) : [...ROLES]

const serialize = (u: AuthUser) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  providers: u.providers,
  isActive: u.isActive,
  createdAt: formatIso(u.createdAt),
  updatedAt: formatIso(u.updatedAt),
})

export async function findAuthUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(authUsers)
    // MySQL compared emails case-insensitively; keep that behaviour.
    .where(sql`lower(${authUsers.email}) = lower(${email.trim()})`)
    .limit(1)
  return user ?? null
}

async function findAuthUser(id: number) {
  const [user] = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.id, id))
    .limit(1)
  return user ?? null
}

export async function getAuthUserByEmail(email: string) {
  const value = email.trim()
  if (!value) throw badRequest('Email parameter is required')
  if (!EMAIL_RE.test(value)) throw badRequest('Invalid email format')
  const user = await findAuthUserByEmail(value)
  if (!user) throw notFound('User not found')
  return serialize(user)
}

export async function getAuthUser(id: number) {
  const user = await findAuthUser(id)
  if (!user) throw notFound('User not found')
  return serialize(user)
}

export type AuthUsersQuery = {
  page: number
  size: number
  /** The signed-in account's role, when the request carries a session. */
  viewer?: Role | null
  role?: string | null
  provider?: string | null
  active?: string | null
  start?: string | null
  end?: string | null
  uOrder?: string | null
  eOrder?: string | null
  cOrder?: string | null
  rOrder?: string | null
}

export async function pageAuthUsers(q: AuthUsersQuery) {
  const page = Math.max(1, q.page)
  const size = Math.max(1, Math.min(100, q.size))

  const filters: SQL[] = []
  const hidden = ROLES.filter((r) => !visibleRoles(q.viewer).includes(r))
  if (hidden.length) filters.push(notInArray(authUsers.role, hidden))
  if (q.role) filters.push(eq(authUsers.role, q.role as Role))
  if (q.provider) {
    filters.push(sql`${authUsers.providers} @> ${JSON.stringify([q.provider])}::jsonb`)
  }
  if (q.active != null) {
    const isActive = ['1', 'true', 'yes', 'on'].includes(q.active.toLowerCase())
    filters.push(eq(authUsers.isActive, isActive))
  }
  const range = easternDayRange(q.start, q.end)
  if (range.start) filters.push(gte(authUsers.createdAt, range.start))
  if (range.end) filters.push(lte(authUsers.createdAt, range.end))
  const where = filters.length ? and(...filters) : undefined

  const dir = (v?: string | null) => {
    const d = v?.toLowerCase()
    return d === 'asc' || d === 'desc' ? d : null
  }
  const sortColumns = [
    [dir(q.uOrder), authUsers.name],
    [dir(q.eOrder), authUsers.email],
    [dir(q.cOrder), authUsers.createdAt],
    [dir(q.rOrder), authUsers.role],
  ] as const
  const [sortDir, sortColumn] = sortColumns.find(([d]) => d) ?? [
    'asc',
    authUsers.createdAt,
  ]

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(authUsers)
      .where(where)
      .orderBy(sortDir === 'desc' ? desc(sortColumn) : asc(sortColumn))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ total: count() }).from(authUsers).where(where),
  ])

  return { ...paginate(page, size, total), data: rows.map(serialize) }
}

export type AuthUserInput = {
  email?: unknown
  name?: unknown
  role?: unknown
  isActive?: unknown
  providers?: unknown
}

function cleanProviders(value: unknown): Provider[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value)].filter((p): p is Provider =>
    PROVIDERS.includes(p as Provider),
  )
}

function validate(user: {
  email: string
  name: string
  role: string
  providers: Provider[]
}) {
  if (user.providers.length === 0) {
    throw badRequest('User must have at least one provider')
  }
  const errors: Record<string, string> = {}
  if (!user.email) errors.email = 'This value should not be blank.'
  else if (!EMAIL_RE.test(user.email)) {
    errors.email = 'This value is not a valid email address.'
  }
  if (!user.name) errors.name = 'This value should not be blank.'
  else if (user.name.length < 2 || user.name.length > 100) {
    errors.name = 'This value should have between 2 and 100 characters.'
  }
  if (!ROLES.includes(user.role as Role)) {
    errors.role = 'The value you selected is not a valid choice.'
  }
  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Validation failed', { errors })
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export async function createAuthUser(input: AuthUserInput) {
  const email = str(input.email)
  if (await findAuthUserByEmail(email)) {
    throw conflict('User with this email already exists')
  }
  const role = (str(input.role) || 'user') as Role
  if (role === 'superadmin') {
    const [existing] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.role, 'superadmin'))
      .limit(1)
    if (existing) throw conflict('A superadmin user already exists')
  }

  const values = {
    email,
    name: str(input.name),
    role,
    isActive: input.isActive === undefined ? true : Boolean(input.isActive),
    providers: cleanProviders(input.providers),
  }
  validate(values)

  const [user] = await db.insert(authUsers).values(values).returning()
  return serialize(user)
}

export async function updateAuthUser(id: number, input: AuthUserInput) {
  const user = await findAuthUser(id)
  if (!user) throw notFound('User not found')
  if (user.role === 'superadmin') {
    throw forbidden('Cannot update superadmin user')
  }
  if (input.role === 'superadmin') {
    throw forbidden('Cannot assign superadmin role')
  }

  const next = { ...user }
  if (input.email != null && input.email !== user.email) {
    const taken = await findAuthUserByEmail(str(input.email))
    if (taken && taken.id !== id) {
      throw conflict('User with this email already exists')
    }
    next.email = str(input.email)
  }
  if (input.name != null) next.name = str(input.name)
  if (input.role != null) next.role = str(input.role) as Role
  if (input.isActive != null) next.isActive = Boolean(input.isActive)
  if (Array.isArray(input.providers)) {
    next.providers = cleanProviders(input.providers)
  }
  validate(next)

  const [updated] = await db
    .update(authUsers)
    .set({
      email: next.email,
      name: next.name,
      role: next.role,
      isActive: next.isActive,
      providers: next.providers,
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, id))
    .returning()
  return serialize(updated)
}

export async function deleteAuthUser(id: number) {
  const user = await findAuthUser(id)
  if (!user) throw notFound('User not found')
  if (user.role === 'superadmin') {
    // Holds for the superadmin's own account too: transfer the role first,
    // so the dashboard is never left without one.
    throw forbidden('Cannot delete the superadmin account')
  }
  await db.delete(authUsers).where(eq(authUsers.id, id))
  return { message: 'User deleted successfully' }
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Emails of active dashboard accounts (used to gate sign-in). */
export async function listAllowedEmails(): Promise<string[]> {
  const rows = await db
    .select({ email: authUsers.email })
    .from(authUsers)
    .where(eq(authUsers.isActive, true))
    .orderBy(asc(authUsers.id))
  return rows.map((r) => r.email)
}

export async function getAuthInitData(viewer?: Role | null) {
  return {
    providers: PROVIDERS.map((p) => ({ name: titleCase(p), value: p })),
    // Same rank rule as the list: no filtering by a role you can't see.
    roles: visibleRoles(viewer).map((r) => ({
      name: titleCase(r.replace(/_/g, ' ')),
      value: r,
    })),
    allowed_emails: (await listAllowedEmails()).join(','),
  }
}

export async function getAuthStats() {
  const rows = await db
    .select({ role: authUsers.role, count: count() })
    .from(authUsers)
    .where(eq(authUsers.isActive, true))
    .groupBy(authUsers.role)
  const byRole = Object.fromEntries(rows.map((r) => [r.role, r.count]))
  return {
    totalUsers: rows.reduce((sum, r) => sum + r.count, 0),
    roleDistribution: {
      superadmin: byRole.superadmin ?? 0,
      admin: byRole.admin ?? 0,
      user: byRole.user ?? 0,
    },
  }
}

export async function transferSuperadmin(targetId: number) {
  const target = await findAuthUser(targetId)
  if (!target) throw notFound('Target user not found')
  if (target.role === 'superadmin') {
    throw badRequest('User is already superadmin')
  }
  if (!target.isActive) {
    throw badRequest('Cannot assign superadmin to inactive user')
  }
  const [current] = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.role, 'superadmin'))
    .limit(1)
  if (!current) throw notFound('No existing superadmin found')

  const now = new Date()
  await db.transaction(async (tx) => {
    await tx
      .update(authUsers)
      .set({ role: 'admin', updatedAt: now })
      .where(eq(authUsers.id, current.id))
    await tx
      .update(authUsers)
      .set({ role: 'superadmin', updatedAt: now })
      .where(eq(authUsers.id, target.id))
  })

  return {
    message: 'Superadmin privileges transferred successfully',
    previousSuperadmin: {
      id: current.id,
      email: current.email,
      name: current.name,
      newRole: 'admin',
    },
    newSuperadmin: {
      id: target.id,
      email: target.email,
      name: target.name,
      role: 'superadmin',
    },
  }
}
