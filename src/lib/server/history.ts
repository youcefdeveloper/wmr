import { and, asc, count, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm'
import { db, devices, userUpdateHistory, type UserUpdateHistory } from './db'
import { easternDayRange, formatDateTime } from './dates'
import { getLocationFromIp, parseLocation } from './geo'
import { getLanguageName } from './languages'
import { notFound, paginate } from './http'

type Order = 'asc' | 'desc'

export type HistoryQuery = {
  order: Order
  source: string | null
  start: string | null
  end: string | null
}

const serialize = (h: UserUpdateHistory) => ({
  id: h.id,
  updatedAt: formatDateTime(h.updatedAt),
  source: h.source,
  ipAddress: h.ipAddress,
  location: getLocationFromIp(h.ipAddress),
  lang: h.lang,
  language: getLanguageName(h.lang),
})

async function findDevice(id: number) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.id, id))
    .limit(1)
  if (!device) throw notFound('User not found')
  return device
}

/** Source defaults to `register-push-token`; `all` disables the filter. */
function resolveSource(source: string | null): string | null {
  if (source === null || source === '') return 'register-push-token'
  if (source.toLowerCase() === 'all') return null
  return source.trim()
}

function historyWhere(userId: number, q: HistoryQuery) {
  const source = resolveSource(q.source)
  const range = easternDayRange(q.start, q.end)
  const filters: SQL[] = [eq(userUpdateHistory.userId, userId)]
  if (source !== null) filters.push(eq(userUpdateHistory.source, source))
  if (range.start) filters.push(gte(userUpdateHistory.updatedAt, range.start))
  if (range.end) filters.push(lte(userUpdateHistory.updatedAt, range.end))
  return { where: and(...filters), source }
}

const byUpdatedAt = (order: Order) =>
  order === 'asc'
    ? asc(userUpdateHistory.updatedAt)
    : desc(userUpdateHistory.updatedAt)

function deviceSummary(userId: number, device: Awaited<ReturnType<typeof findDevice>>) {
  return {
    userId,
    deviceId: device.deviceId,
    platform: device.platform,
    model: device.model,
    createdAt: formatDateTime(device.createdAt),
  }
}

/** GET /users/{id}/update-history — paginated visits of one device. */
export async function pageDeviceHistory(
  userId: number,
  q: HistoryQuery & { page: number; size: number },
) {
  const device = await findDevice(userId)
  const page = Math.max(1, q.page)
  const size = q.size > 0 && q.size <= 100 ? q.size : 10
  const { where, source } = historyWhere(userId, q)

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(userUpdateHistory)
      .where(where)
      .orderBy(byUpdatedAt(q.order))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ total: count() }).from(userUpdateHistory).where(where),
  ])

  return {
    ...deviceSummary(userId, device),
    ...paginate(page, size, total),
    filter: {
      source: source ?? 'all',
      order: q.order,
      page,
      size,
      start: q.start,
      end: q.end,
    },
    data: rows.map(serialize),
  }
}

/** GET /users/{id}/update-history/all — every visit of one device. */
export async function listDeviceHistory(userId: number, q: HistoryQuery) {
  const device = await findDevice(userId)
  const { where, source } = historyWhere(userId, q)
  const rows = await db
    .select()
    .from(userUpdateHistory)
    .where(where)
    .orderBy(byUpdatedAt(q.order))

  return {
    ...deviceSummary(userId, device),
    total: rows.length,
    filter: {
      source: source ?? 'all',
      order: q.order,
      start: q.start,
      end: q.end,
    },
    data: rows.map(serialize),
  }
}

/**
 * Visit counts per IP: every history record plus each device's first
 * registration, in order of first appearance.
 */
async function visitsByIp(): Promise<{ ip: string | null; visits: number }[]> {
  const [history, registrations] = await Promise.all([
    db
      .select({
        ip: userUpdateHistory.ipAddress,
        visits: count(),
      })
      .from(userUpdateHistory)
      .groupBy(userUpdateHistory.ipAddress)
      .orderBy(sql`min(${userUpdateHistory.id})`),
    db
      .select({ ip: devices.ipAddress, visits: count() })
      .from(devices)
      .groupBy(devices.ipAddress)
      .orderBy(sql`min(${devices.id})`),
  ])
  return [...history, ...registrations]
}

const byKey = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Sorts object keys alphabetically, moving "Unknown" to the end. */
function sortKeys<T>(record: Record<string, T>, unknownLast = true) {
  const keys = Object.keys(record).sort(byKey)
  if (unknownLast && keys.includes('Unknown')) {
    keys.splice(keys.indexOf('Unknown'), 1)
    keys.push('Unknown')
  }
  return Object.fromEntries(keys.map((k) => [k, record[k]]))
}

type StateStats = { name: string; total: number; cities: Record<string, number> }
type CountryStats = { name: string; total: number; states: Record<string, StateStats> }

/** GET /update-history/location-stats — visits by country → state → city. */
export async function getLocationStats(countryFilter: string | null) {
  const countries: Record<string, CountryStats> = {}

  for (const { ip, visits } of await visitsByIp()) {
    const { city, state, country } = parseLocation(getLocationFromIp(ip))
    if (countryFilter && country.toLowerCase() !== countryFilter.toLowerCase()) {
      continue
    }
    const c = (countries[country] ??= { name: country, total: 0, states: {} })
    c.total += visits
    const s = (c.states[state] ??= { name: state, total: 0, cities: {} })
    s.total += visits
    s.cities[city] = (s.cities[city] ?? 0) + visits
  }

  return Object.values(sortKeys(countries)).map((c) => ({
    ...c,
    states: Object.fromEntries(
      Object.entries(sortKeys(c.states)).map(([key, s]) => [
        key,
        { ...s, cities: sortKeys(s.cities, false) },
      ]),
    ),
  }))
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

/**
 * GET /update-history/us-states-chart — Google GeoChart rows of US visits by
 * state, with an HTML tooltip listing cities.
 */
export async function getUsStatesChart(cityOrder: string) {
  const states: Record<string, { total: number; cities: Record<string, number> }> = {}

  for (const { ip, visits } of await visitsByIp()) {
    const { city, state, country } = parseLocation(getLocationFromIp(ip))
    const name = country.toLowerCase()
    if (name !== 'united states' && name !== 'usa') continue
    const s = (states[state] ??= { total: 0, cities: {} })
    s.total += visits
    s.cities[city] = (s.cities[city] ?? 0) + visits
  }

  const chart: unknown[] = [
    [
      'State',
      'Total Visits',
      { type: 'string', role: 'tooltip', p: { html: true } },
    ],
  ]
  for (const [stateName, s] of Object.entries(sortKeys(states))) {
    const cities = Object.entries(s.cities)
    if (cityOrder === 'count') cities.sort((a, b) => b[1] - a[1])
    else cities.sort((a, b) => byKey(a[0], b[0]))

    const items = cities
      .filter(([city]) => city !== 'Unknown')
      .map(([city, total]) => `<li>${escapeHtml(city)}: ${total}</li>`)
      .join('')
    chart.push([
      stateName,
      s.total,
      `<div style="padding:8px 0; min-width:160px;">Total Visits (${s.total})<ul style="margin:8px 0 0 0;padding-left:18px">${items}</ul></div>`,
    ])
  }
  return chart
}
