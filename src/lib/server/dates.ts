import { badRequest } from './http'

/** Dashboard filters and "today/yesterday" stats are defined in US Eastern. */
export const DASHBOARD_TZ = 'America/New_York'

const DAY_MS = 24 * 60 * 60 * 1000

const pad = (n: number) => String(n).padStart(2, '0')

/** PHP `Y-m-d H:i:s` in UTC. */
export function formatDateTime(d: Date): string {
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  )
}

/** PHP `c` (ISO 8601) in UTC, e.g. 2025-01-31T10:00:00+00:00. */
export function formatIso(d: Date): string {
  return formatDateTime(d).replace(' ', 'T') + '+00:00'
}

/** `YYYY-MM-DD` of a UTC date. */
export function formatYmd(d: Date): string {
  return formatDateTime(d).slice(0, 10)
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function tzOffset(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/** Wall-clock time in `timeZone` → UTC instant (DST-aware). */
export function zonedToUtc(
  ymd: string,
  time = '00:00:00',
  timeZone = DASHBOARD_TZ,
): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  const [hh, mm, ss] = time.split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, hh, mm, ss)
  // Two passes settle the offset across DST transitions.
  let utc = wall - tzOffset(new Date(wall), timeZone)
  utc = wall - tzOffset(new Date(utc), timeZone)
  return new Date(utc)
}

/** Calendar date (`YYYY-MM-DD`) of an instant in `timeZone`. */
export function zonedYmd(instant: Date, timeZone = DASHBOARD_TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return formatYmd(new Date(Date.UTC(y, m - 1, d) + days * DAY_MS))
}

/**
 * Validates a date query param and returns it as `YYYY-MM-DD`. Accepts a full
 * date-time too (only the date part is used).
 */
export function parseYmd(value: string, label: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (match) {
    const [, y, m, d] = match.map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    if (date.getUTCMonth() === m - 1 && date.getUTCDate() === d) {
      return match[0]
    }
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw badRequest(`Invalid ${label} date format`)
  }
  return formatYmd(parsed)
}

/** Start/end of a dashboard (Eastern) day filter as UTC instants. */
export function easternDayRange(start?: string | null, end?: string | null) {
  return {
    start: start ? zonedToUtc(parseYmd(start, 'start'), '00:00:00') : null,
    end: end ? easternDayBounds(parseYmd(end, 'end')).end : null,
  }
}

/**
 * "today" (midnight → now), "yesterday" and "last_week" (today + 6 previous
 * days) windows in Eastern time, as used by the device statistics.
 */
export function easternPeriods(now = new Date()) {
  const today = zonedYmd(now)
  const yesterday = addDays(today, -1)
  const lastWeekStart = addDays(today, -6)
  return {
    now,
    today,
    todayStart: zonedToUtc(today),
    yesterday,
    yesterdayStart: zonedToUtc(yesterday),
    yesterdayEnd: zonedToUtc(yesterday, '23:59:59'),
    lastWeekStart: zonedToUtc(lastWeekStart),
    lastWeekDays: Array.from({ length: 7 }, (_, i) =>
      addDays(lastWeekStart, i),
    ),
  }
}

/** UTC bounds of an Eastern calendar day (inclusive, second precision). */
export function easternDayBounds(ymd: string) {
  return {
    start: zonedToUtc(ymd, '00:00:00'),
    end: new Date(zonedToUtc(ymd, '23:59:59').getTime() + 999),
  }
}
