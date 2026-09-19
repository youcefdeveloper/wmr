import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm'
import {
  db,
  devices,
  pushTokens,
  userUpdateHistory,
  type Device,
} from './db'
import {
  DASHBOARD_TZ,
  easternDayBounds,
  easternDayRange,
  easternPeriods,
  formatDateTime,
  parseYmd,
  zonedToUtc,
} from './dates'
import { getLocationFromIp } from './geo'
import { getLanguageName } from './languages'
import { badRequest, paginate } from './http'

type Order = 'asc' | 'desc'
const direction = (o: Order) => (o === 'desc' ? desc : asc)

/** Timestamp parameter for hand-written SQL fragments. */
const ts = (d: Date) => sql`${d.toISOString()}::timestamptz`

// Correlated sub-queries shared by the filters and sort options.
const historyCount = sql<number>`(select count(*) from ${userUpdateHistory} where ${userUpdateHistory.userId} = ${devices.id})`
const lastTokenUpdate = sql`(select max(${pushTokens.updatedAt}) from ${pushTokens} where ${pushTokens.userId} = ${devices.id})`
const hasHistory = (from?: Date, to?: Date) =>
  sql`exists (select 1 from ${userUpdateHistory} where ${userUpdateHistory.userId} = ${devices.id}${
    from ? sql` and ${userUpdateHistory.updatedAt} >= ${ts(from)}` : sql``
  }${to ? sql` and ${userUpdateHistory.updatedAt} <= ${ts(to)}` : sql``})`

const platformIs = (platform: string) =>
  sql`lower(${devices.platform}) = lower(${platform})`

/** Local calendar day (Eastern) of a history record. */
// The zone is inlined (a constant) so GROUP BY and ORDER BY see one expression.
const easternDay = sql`(${userUpdateHistory.updatedAt} at time zone ${sql.raw(`'${DASHBOARD_TZ}'`)})::date`

/** Serialises devices with their push tokens and visit counts. */
async function serializeDevices(rows: Device[]) {
  const ids = [...new Set(rows.map((d) => d.id))]
  if (ids.length === 0) return []

  const [tokens, counts] = await Promise.all([
    db
      .select()
      .from(pushTokens)
      .where(inArray(pushTokens.userId, ids))
      .orderBy(asc(pushTokens.id)),
    db
      .select({ userId: userUpdateHistory.userId, total: count() })
      .from(userUpdateHistory)
      .where(inArray(userUpdateHistory.userId, ids))
      .groupBy(userUpdateHistory.userId),
  ])
  const countByUser = new Map(counts.map((c) => [c.userId, c.total]))

  return rows.map((d) => {
    const visits = countByUser.get(d.id) ?? 0
    return {
      id: d.id,
      deviceId: d.deviceId,
      platform: d.platform,
      model: d.model,
      ipAddress: d.ipAddress,
      location: getLocationFromIp(d.ipAddress),
      // The app doesn't store a per-device language; history rows carry it.
      lang: 'en',
      language: getLanguageName('en'),
      notify: d.notify,
      createdAt: formatDateTime(d.createdAt),
      updatedAt: formatDateTime(d.updatedAt),
      pushTokens: tokens
        .filter((t) => t.userId === d.id)
        .map((t) => ({
          id: t.id,
          createdAt: formatDateTime(t.createdAt),
          updatedAt: formatDateTime(t.updatedAt),
          updatedAtHistoryCount: visits,
        })),
    }
  })
}

function parseInstant(value: string, label: string): Date {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? `${value.trim()}T00:00:00Z` : value,
  )
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`Invalid ${label} date format`)
  }
  return date
}

/** GET /users — every device, optionally filtered. */
export async function listDevices(q: {
  platform?: string | null
  start?: string | null
  end?: string | null
  order: Order
}) {
  const filters: SQL[] = []
  if (q.platform) filters.push(platformIs(q.platform))
  if (q.start) filters.push(gte(devices.createdAt, parseInstant(q.start, 'start')))
  if (q.end) filters.push(lte(devices.createdAt, parseInstant(q.end, 'end')))

  const rows = await db
    .select()
    .from(devices)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(direction(q.order)(devices.createdAt))
  return serializeDevices(rows)
}

export type DevicesPagingQuery = {
  page: number
  size: number
  platform: string
  model: string
  visit: string
  visitBy: string
  start: string | null
  end: string | null
  order: Order
  /** Sort by last push-token update (any non-empty value enables it). */
  uOrder: string
  /** Sort by number of visits ('asc' | 'desc'). */
  vOrder: string
}

/** GET /users/paging — dashboard device list. */
export async function pageDevices(q: DevicesPagingQuery) {
  const page = Math.max(1, q.page)
  const size = q.size > 0 ? q.size : 10
  const visit = q.visit.toLowerCase()
  const visitBy = q.visitBy.toLowerCase()

  if (visit && !['returning', 'onetime', 'all'].includes(visit)) {
    return { ...paginate(page, size, 0), data: [] }
  }

  const platformFilter =
    q.platform && q.platform.toLowerCase() !== 'all'
      ? platformIs(q.platform)
      : undefined
  const modelFilter =
    q.model && q.model.toLowerCase() !== 'all'
      ? q.model.toLowerCase() === 'unknown'
        ? isNull(devices.model)
        : eq(devices.model, q.model)
      : undefined

  const periods = easternPeriods()

  // "Last week" lists one row per device per day it visited, so the same
  // device can appear several times.
  if (visitBy === 'last_week') {
    const firstVisit = sql`min(${userUpdateHistory.updatedAt})`
    const appearances = await db
      .select({ userId: userUpdateHistory.userId })
      .from(userUpdateHistory)
      .innerJoin(devices, eq(devices.id, userUpdateHistory.userId))
      .where(
        and(
          gte(userUpdateHistory.updatedAt, periods.lastWeekStart),
          lte(userUpdateHistory.updatedAt, periods.now),
          platformFilter,
        ),
      )
      .groupBy(userUpdateHistory.userId, easternDay)
      .orderBy(easternDay, firstVisit)

    const pageIds = appearances
      .slice((page - 1) * size, page * size)
      .map((a) => a.userId)
    const found = pageIds.length
      ? await db.select().from(devices).where(inArray(devices.id, pageIds))
      : []
    const byId = new Map(found.map((d) => [d.id, d]))
    const rows = pageIds.flatMap((id) => byId.get(id) ?? [])

    return {
      ...paginate(page, size, appearances.length),
      data: await serializeDevices(rows),
    }
  }

  const filters: (SQL | undefined)[] = [platformFilter, modelFilter]
  const range = easternDayRange(q.start, q.end)
  if (range.start) filters.push(gte(devices.createdAt, range.start))
  if (range.end) filters.push(lte(devices.createdAt, range.end))

  if (visitBy === 'today') {
    filters.push(hasHistory(periods.todayStart, periods.now))
  } else if (visitBy === 'yesterday') {
    filters.push(hasHistory(periods.yesterdayStart, periods.yesterdayEnd))
  } else if (visitBy === 'all_time') {
    filters.push(hasHistory())
  }

  const visitFilter =
    visit === 'returning'
      ? hasHistory()
      : visit === 'onetime'
        ? sql`not ${hasHistory()}`
        : undefined
  const where = and(...filters, visitFilter)

  const orderBy: SQL[] = []
  const vOrder = q.vOrder.toLowerCase()
  if (vOrder === 'asc' || vOrder === 'desc') {
    orderBy.push(direction(vOrder)(historyCount))
  }
  if (q.uOrder) {
    orderBy.push(
      direction(q.uOrder.toLowerCase() === 'asc' ? 'asc' : 'desc')(
        lastTokenUpdate,
      ),
    )
  }
  if (orderBy.length < 2) {
    orderBy.push(direction(q.order)(devices.createdAt))
  }

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(devices)
      .where(where)
      .orderBy(...orderBy)
      .limit(size)
      .offset((page - 1) * size),
    db
      .select({ total: count() })
      .from(devices)
      .where(where),
  ])

  return { ...paginate(page, size, total), data: await serializeDevices(rows) }
}

type PeriodCounts = {
  today: number
  yesterday: number
  last_week: number
  all_time: number
}

/** GET /users/stats — install, returning and comeback stats per platform. */
export async function getDeviceStats() {
  const p = easternPeriods()
  const todayEnd = easternDayBounds(p.today).end
  const between = (from: Date, to: Date) =>
    sql`${userUpdateHistory.updatedAt} >= ${ts(from)} and ${userUpdateHistory.updatedAt} <= ${ts(to)}`
  // Sum over each day of the unique devices seen that day.
  const dailyUsers = (from: Date, to: Date) =>
    sql<number>`count(distinct (${userUpdateHistory.userId}, ${easternDay})) filter (where ${between(from, to)})::int`

  const [tokenRows, historyRows] = await Promise.all([
    db
      .select({
        platform: devices.platform,
        firstTokenId: sql<number>`min(${pushTokens.id})`,
        total: count(),
        returning: sql<number>`count(*) filter (where ${pushTokens.updatedAt} > ${pushTokens.createdAt})::int`,
      })
      .from(pushTokens)
      .innerJoin(devices, eq(devices.id, pushTokens.userId))
      .groupBy(devices.platform)
      .orderBy(sql`min(${pushTokens.id})`),
    db
      .select({
        platform: devices.platform,
        sessionToday: sql<number>`count(*) filter (where ${between(p.todayStart, p.now)})::int`,
        sessionYesterday: sql<number>`count(*) filter (where ${between(p.yesterdayStart, p.yesterdayEnd)})::int`,
        sessionLastWeek: sql<number>`count(*) filter (where ${between(p.lastWeekStart, p.now)})::int`,
        sessionAllTime: count(),
        userToday: dailyUsers(p.todayStart, todayEnd),
        userYesterday: dailyUsers(p.yesterdayStart, p.yesterdayEnd),
        userLastWeek: dailyUsers(p.lastWeekStart, todayEnd),
        userAllTime: sql<number>`count(distinct ${userUpdateHistory.userId})::int`,
      })
      .from(userUpdateHistory)
      .innerJoin(devices, eq(devices.id, userUpdateHistory.userId))
      .groupBy(devices.platform),
  ])

  const history = new Map(historyRows.map((h) => [h.platform, h]))
  const zero = (): PeriodCounts => ({
    today: 0,
    yesterday: 0,
    last_week: 0,
    all_time: 0,
  })

  const all = {
    platform: 'all',
    total: 0,
    returning: 0,
    oneTime: 0,
    comeback: { session: zero(), user: zero() },
  }

  const stats = tokenRows.map((t) => {
    const h = history.get(t.platform)
    const session: PeriodCounts = {
      today: h?.sessionToday ?? 0,
      yesterday: h?.sessionYesterday ?? 0,
      last_week: h?.sessionLastWeek ?? 0,
      all_time: h?.sessionAllTime ?? 0,
    }
    const user: PeriodCounts = {
      today: h?.userToday ?? 0,
      yesterday: h?.userYesterday ?? 0,
      last_week: h?.userLastWeek ?? 0,
      all_time: h?.userAllTime ?? 0,
    }
    const row = {
      platform: t.platform,
      total: t.total,
      returning: t.returning,
      oneTime: t.total - t.returning,
      comeback: { session, user },
    }
    all.total += row.total
    all.returning += row.returning
    all.oneTime += row.oneTime
    for (const key of Object.keys(session) as (keyof PeriodCounts)[]) {
      all.comeback.session[key] += session[key]
      // A device has a single platform, so per-platform unique counts add up.
      all.comeback.user[key] += user[key]
    }
    return row
  })

  return [...stats, all]
}

/** GET /users/stats-by-model — install counts grouped by platform and model. */
export async function getDeviceStatsByModel() {
  const rows = await db
    .select({
      platform: devices.platform,
      model: devices.model,
      total: count(),
    })
    .from(devices)
    .groupBy(devices.platform, devices.model)
    .orderBy(asc(devices.platform), sql`${devices.model} asc nulls first`)

  const grouped: Record<string, { model: string; total: number }[]> = {}
  for (const r of rows) {
    ;(grouped[r.platform] ??= []).push({
      model: r.model ?? 'Unknown',
      total: r.total,
    })
  }
  return grouped
}

/** GET /users/comeback-range — sessions and daily unique devices in a range. */
export async function getComebackRange(
  start: string | null,
  end: string | null,
) {
  if (!start || !end) throw badRequest('Missing start or end date')
  const from = zonedToUtc(parseYmd(start, 'start'))
  const to = easternDayBounds(parseYmd(end, 'end')).end

  const rows = await db
    .select({
      platform: sql<string>`lower(${devices.platform})`,
      sessions: count(),
      users: sql<number>`count(distinct (${userUpdateHistory.userId}, ${easternDay}))::int`,
    })
    .from(userUpdateHistory)
    .innerJoin(devices, eq(devices.id, userUpdateHistory.userId))
    .where(
      and(
        gte(userUpdateHistory.updatedAt, from),
        lte(userUpdateHistory.updatedAt, to),
      ),
    )
    .groupBy(sql`lower(${devices.platform})`)

  const pick = (platform: string, key: 'sessions' | 'users') =>
    rows.find((r) => r.platform === platform)?.[key] ?? 0
  const sum = (key: 'sessions' | 'users') =>
    rows.reduce((total, r) => total + r[key], 0)

  return {
    session: {
      all: sum('sessions'),
      ios: pick('ios', 'sessions'),
      android: pick('android', 'sessions'),
    },
    user: {
      all: sum('users'),
      ios: pick('ios', 'users'),
      android: pick('android', 'users'),
    },
  }
}
