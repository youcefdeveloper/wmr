import { and, asc, count, desc, eq, gte, lt, lte, sql, type SQL } from 'drizzle-orm'
import { db, weeklyData, type WeeklyData } from './db'
import { parseYmd } from './dates'
import { badRequest, conflict, forbidden, notFound, paginate } from './http'

type Order = 'asc' | 'desc'

const byWeek = (order: Order) =>
  order === 'desc' ? desc(weeklyData.week) : asc(weeklyData.week)

export type UsWeeklyRate = {
  id: number
  week: string
  us30_yr_frm: number | null
  us15_yr_frm: number | null
  source: string
}

const toUsWeekly = (r: WeeklyData): UsWeeklyRate => ({
  id: r.id,
  week: r.week,
  us30_yr_frm: r.us30YrFrm,
  us15_yr_frm: r.us15YrFrm,
  source: r.source,
})

/** GET /weekly-data — every column. */
export async function listWeeklyData(order: Order) {
  const rows = await db.select().from(weeklyData).orderBy(byWeek(order))
  return rows.map((r) => ({
    id: r.id,
    week: r.week,
    us30_yr_frm: r.us30YrFrm,
    thirty_yr_fees_points: r.thirtyYrFeesPoints,
    us15_yr_frm: r.us15YrFrm,
    fifteen_yr_fees_points: r.fifteenYrFeesPoints,
    us5_1_arm: r.us51Arm,
    five_1_fees_points: r.five1FeesPoints,
    five_1_arm_margin: r.five1ArmMargin,
    us30_yr_frm5_1_arm_spread: r.us30YrFrm51ArmSpread,
    source: r.source,
  }))
}

export async function listUsWeekly(order: Order): Promise<UsWeeklyRate[]> {
  const rows = await db.select().from(weeklyData).orderBy(byWeek(order))
  return rows.map(toUsWeekly)
}

export async function getUsWeeklyByYear(
  year: number,
  order: Order,
): Promise<UsWeeklyRate[]> {
  const rows = await db
    .select()
    .from(weeklyData)
    .where(
      and(
        gte(weeklyData.week, `${year}-01-01`),
        lt(weeklyData.week, `${year + 1}-01-01`),
      ),
    )
    .orderBy(byWeek(order))
  return rows.map(toUsWeekly)
}

export async function getLatestUsWeekly(): Promise<UsWeeklyRate | null> {
  const [row] = await db
    .select()
    .from(weeklyData)
    .orderBy(desc(weeklyData.week))
    .limit(1)
  return row ? toUsWeekly(row) : null
}

export async function getUsWeeklyRange(
  start: string | null,
  end: string | null,
  order: Order,
): Promise<UsWeeklyRate[]> {
  if (!start || !end) throw badRequest('Missing start or end date')
  const rows = await db
    .select()
    .from(weeklyData)
    .where(
      and(
        gte(weeklyData.week, parseYmd(start, 'start')),
        lte(weeklyData.week, parseYmd(end, 'end')),
      ),
    )
    .orderBy(byWeek(order))
  return rows.map(toUsWeekly)
}

export type RatesPagingQuery = {
  page: number
  size: number
  order: Order
  sort: string
  start: string | null
  end: string | null
  source: string | null
}

// MySQL sorted NULL rates first ascending / last descending; keep that.
const byRate = (order: Order) =>
  order === 'asc'
    ? sql`${weeklyData.us30YrFrm} asc nulls first`
    : sql`${weeklyData.us30YrFrm} desc nulls last`

export async function pageUsWeekly(q: RatesPagingQuery) {
  const page = Math.max(1, q.page)
  const size = q.size > 0 ? q.size : 10

  const orderBy = {
    newest: desc(weeklyData.week),
    oldest: asc(weeklyData.week),
    lowest: byRate('asc'),
    highest: byRate('desc'),
  }[q.sort.trim().toLowerCase()] ?? byWeek(q.order)
  // Stable pages when several weeks share the same rate.
  const tieBreak = asc(weeklyData.week)

  const filters: SQL[] = []
  if (q.start) filters.push(gte(weeklyData.week, parseYmd(q.start, 'start')))
  if (q.end) filters.push(lte(weeklyData.week, parseYmd(q.end, 'end')))
  const source = q.source?.trim() ?? ''
  if (!['all', 'null', 'none', ''].includes(source.toLowerCase())) {
    filters.push(eq(weeklyData.source, source))
  }
  const where = filters.length ? and(...filters) : undefined

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(weeklyData)
      .where(where)
      .orderBy(orderBy, tieBreak)
      .limit(size)
      .offset((page - 1) * size),
    db.select({ total: count() }).from(weeklyData).where(where),
  ])

  return { ...paginate(page, size, total), data: rows.map(toUsWeekly) }
}

export type YearlyAvgRate = {
  id: number
  year: string
  us30_yr_frm: number | null
  us15_yr_frm: number | null
}

/** Yearly averages of the weekly 30/15-year rates (nulls ignored). */
export async function listUsYearly(order: Order): Promise<YearlyAvgRate[]> {
  const year = sql<string>`to_char(${weeklyData.week}, 'YYYY')`
  const rows = await db
    .select({
      year,
      us30: sql<string | null>`round(avg(${weeklyData.us30YrFrm})::numeric, 2)`,
      us15: sql<string | null>`round(avg(${weeklyData.us15YrFrm})::numeric, 2)`,
    })
    .from(weeklyData)
    .groupBy(year)
    .orderBy(order === 'desc' ? desc(year) : asc(year))

  const toRate = (v: string | null) => {
    const n = v === null ? null : Number(v)
    return n ? n : null // PHP returned null for a 0.0 average
  }
  return rows.map((r, i) => ({
    id: order === 'desc' ? rows.length - i : i + 1,
    year: r.year,
    us30_yr_frm: toRate(r.us30),
    us15_yr_frm: toRate(r.us15),
  }))
}

// --- Manual entries (admin dashboard) ---------------------------------------

export type ManualRate = {
  id: number
  week: string
  us30YrFrm: number | null
  us15YrFrm: number | null
  source: string
}

const toManual = (r: WeeklyData): ManualRate => ({
  id: r.id,
  week: r.week,
  us30YrFrm: r.us30YrFrm,
  us15YrFrm: r.us15YrFrm,
  source: r.source,
})

export type ManualRateInput = {
  week?: unknown
  us30YrFrm?: unknown
  us15YrFrm?: unknown
}

function parseWeek(week: unknown): string {
  if (typeof week !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    throw badRequest("Invalid week format, expected 'YYYY-MM-DD'")
  }
  const [y, m, d] = week.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw badRequest('Invalid week date value')
  }
  return week
}

const isBlank = (v: unknown) => v === null || v === undefined || v === ''

function parsePercent(value: unknown, message: string): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && value.trim() === '') ||
    !Number.isFinite(n) ||
    n < 0 ||
    n > 100
  ) {
    throw badRequest(message)
  }
  return Math.round(n * 1000) / 1000
}

async function findRate(id: number) {
  const [row] = await db
    .select()
    .from(weeklyData)
    .where(eq(weeklyData.id, id))
    .limit(1)
  return row
}

async function assertWeekFree(week: string, exceptId?: number) {
  const [existing] = await db
    .select({ id: weeklyData.id })
    .from(weeklyData)
    .where(eq(weeklyData.week, week))
    .limit(1)
  if (existing && existing.id !== exceptId) {
    throw conflict('The entry for this week already exists')
  }
}

export async function listManualRates(): Promise<ManualRate[]> {
  const rows = await db
    .select()
    .from(weeklyData)
    .where(eq(weeklyData.source, 'manual'))
    .orderBy(desc(weeklyData.week))
  return rows.map(toManual)
}

export async function getManualRate(id: number): Promise<ManualRate> {
  const row = await findRate(id)
  if (!row || row.source !== 'manual') throw notFound()
  return toManual(row)
}

export async function createManualRate(
  input: ManualRateInput,
): Promise<ManualRate> {
  if (isBlank(input.week)) throw badRequest('Missing week')
  const week = parseWeek(input.week)
  await assertWeekFree(week)

  if (isBlank(input.us30YrFrm)) {
    throw badRequest('"30 Yr. Fixed" value is required')
  }
  const us30YrFrm = parsePercent(
    input.us30YrFrm,
    '"30 Yr. Fixed" value must be between 0 and 100',
  )
  if (isBlank(input.us15YrFrm)) {
    throw badRequest('"15 Yr. Fixed" value is required')
  }
  const us15YrFrm = parsePercent(
    input.us15YrFrm,
    '"15 Yr. Fixed" value must be between 0 and 100',
  )

  const [row] = await db
    .insert(weeklyData)
    .values({ week, us30YrFrm, us15YrFrm, source: 'manual' })
    .returning()
  return toManual(row)
}

export async function updateManualRate(
  id: number,
  input: ManualRateInput,
): Promise<ManualRate> {
  const row = await findRate(id)
  if (!row) throw notFound()
  if (row.source === 'auto') {
    throw forbidden('Cannot update auto source entries')
  }

  const changes: Partial<WeeklyData> = {}
  if (input.week != null) {
    changes.week = parseWeek(input.week)
    await assertWeekFree(changes.week, id)
  }
  if (input.us30YrFrm != null) {
    changes.us30YrFrm = parsePercent(
      input.us30YrFrm,
      'us30YrFrm must be between 0 and 100',
    )
  }
  if (input.us15YrFrm != null) {
    changes.us15YrFrm = parsePercent(
      input.us15YrFrm,
      'us15YrFrm must be between 0 and 100',
    )
  }
  if (Object.keys(changes).length === 0) return toManual(row)

  const [updated] = await db
    .update(weeklyData)
    .set(changes)
    .where(eq(weeklyData.id, id))
    .returning()
  return toManual(updated)
}

export async function deleteManualRate(id: number) {
  const row = await findRate(id)
  if (!row) throw notFound()
  if (row.source === 'auto') {
    throw forbidden('Cannot delete auto source entries')
  }
  await db.delete(weeklyData).where(eq(weeklyData.id, id))
  return {
    status: 'deleted',
    message: `Manual weekly data entry with id ${row.id} and week ${row.week} has been deleted.`,
    id: row.id,
    week: row.week,
  }
}
