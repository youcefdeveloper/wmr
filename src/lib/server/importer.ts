import ExcelJS from 'exceljs'
import { eq } from 'drizzle-orm'
import { db, importMetadata, weeklyData } from './db'
import { formatIso, formatYmd } from './dates'
import { broadcastPushNotification } from './push'

export const DEFAULT_RATES_SOURCE_URL =
  'https://www.freddiemac.com/pmms/docs/historicalweeklydata.xlsx'

// Freddie Mac's sheet has headers on rows 1-7; data starts on row 8 with the
// week in column A followed by 8 numeric columns.
const FIRST_DATA_ROW = 8

type NewRate = { us30_yr_frm: number | null; us15_yr_frm: number | null; date: Date }

export type ImportResult = { hasNewRates: boolean; newRates: NewRate[] }

/** Rounds half away from zero, tolerating binary float noise (13.025 → 13.03). */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  const scaled = Number((Math.abs(value) * factor).toPrecision(15))
  return (Math.sign(value) * Math.round(scaled)) / factor
}

/**
 * Numeric value of a cell as displayed in Excel. The original importer stored
 * formatted values, so a `0.00` cell holding 12.875 is saved as 12.88.
 */
function cellNumber(cell: ExcelJS.Cell): number | null {
  let value = cell.value as unknown
  if (value && typeof value === 'object' && 'result' in value) {
    value = (value as { result: unknown }).result
  }
  if (typeof value === 'string') {
    if (value.trim() === '') return null
    value = Number(value.trim())
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return applyNumFmt(value, cell.numFmt)
}

/** Rounds to the decimals of a `0.00`-style format; other formats as-is. */
function applyNumFmt(value: number, numFmt: string | undefined): number {
  const decimals = /^0\.(0+)/.exec(numFmt ?? '')?.[1].length
  return decimals === undefined ? value : roundTo(value, decimals)
}

/**
 * The spread column (I) is a shared formula `B - F`. Freddie Mac's file omits
 * the cached result when it is 0, so recompute it like PhpSpreadsheet did.
 */
function uncachedSpread(row: ExcelJS.Row): number | null {
  const cell = row.getCell(9)
  const value = cell.value as unknown
  const isUncachedFormula =
    !!value && typeof value === 'object' && !('result' in value)
  if (!isUncachedFormula) return null
  const rate30 = cellNumber(row.getCell(2))
  const arm = cellNumber(row.getCell(6))
  if (rate30 === null || arm === null) return null
  return applyNumFmt(rate30 - arm, cell.numFmt)
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30)

/** Week date of a row, `undefined` for a blank cell, `null` for non-dates. */
function cellDate(cell: ExcelJS.Cell): Date | null | undefined {
  const value = cell.value
  if (value === null || value === undefined || value === '') return undefined
  if (value instanceof Date) return value
  if (typeof value === 'number') {
    return new Date(EXCEL_EPOCH + Math.round(value * 86400) * 1000)
  }
  if (typeof value === 'string') {
    const text = value.trim()
    const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
    const date = us
      ? new Date(Date.UTC(+us[3], +us[1] - 1, +us[2]))
      : new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

async function loadWorksheet(source: ArrayBuffer): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(source)
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('The Excel file has no worksheet')
  return sheet
}

async function download(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) {
    throw new Error(`Failed to download Excel file from ${url} (${res.status})`)
  }
  return res.arrayBuffer()
}

/**
 * Imports weeks that aren't in the database yet from a Freddie Mac PMMS
 * workbook (URL or uploaded file). Existing weeks are never overwritten.
 */
export async function importWeeklyRates(
  source: { url: string } | { file: ArrayBuffer },
): Promise<ImportResult> {
  const sheet = await loadWorksheet(
    'url' in source ? await download(source.url) : source.file,
  )

  const existing = new Set(
    (await db.select({ week: weeklyData.week }).from(weeklyData)).map(
      (r) => r.week,
    ),
  )

  const rows: (typeof weeklyData.$inferInsert)[] = []
  const newRates: NewRate[] = []

  for (let r = FIRST_DATA_ROW; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r)
    const date = cellDate(row.getCell(1))
    if (date === undefined) continue
    if (date === null) break // footer text below the data

    const week = formatYmd(date)
    if (existing.has(week)) continue
    existing.add(week)

    const n = (col: number) => cellNumber(row.getCell(col))
    rows.push({
      week,
      us30YrFrm: n(2),
      thirtyYrFeesPoints: n(3),
      us15YrFrm: n(4),
      fifteenYrFeesPoints: n(5),
      us51Arm: n(6),
      five1FeesPoints: n(7),
      five1ArmMargin: n(8),
      us30YrFrm51ArmSpread: n(9) ?? uncachedSpread(row),
      source: 'auto',
    })
    newRates.push({ us30_yr_frm: n(2), us15_yr_frm: n(4), date })
  }

  if (rows.length) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < rows.length; i += 500) {
        await tx.insert(weeklyData).values(rows.slice(i, i + 500))
      }
    })
  }

  return { hasNewRates: rows.length > 0, newRates }
}

const LAST_NOTIFIED_WEEK = 'last_notified_week'

async function getMeta(key: string): Promise<Date | null> {
  const [row] = await db
    .select()
    .from(importMetadata)
    .where(eq(importMetadata.key, key))
    .limit(1)
  return row?.value ?? null
}

async function setMeta(key: string, value: Date) {
  await db
    .insert(importMetadata)
    .values({ key, value })
    .onConflictDoUpdate({ target: importMetadata.key, set: { value } })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** e.g. "Sep 17, 2026" (PHP `M j, Y`). */
const formatWeekLabel = (d: Date) =>
  `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`

const pct = (v: number | null) => `${(v ?? 0).toFixed(2)}%`

/**
 * Runs an import and, when it brings in a week newer than the last one users
 * were notified about, broadcasts the new rates (if `push` is set).
 */
export async function importAndNotify(
  source: { url: string } | { file: ArrayBuffer },
  push: boolean,
) {
  const result = await importWeeklyRates(source)
  const lastNotified = await getMeta(LAST_NOTIFIED_WEEK)

  let sent = false
  let message: string
  const latest = result.newRates.at(-1)
  if (!latest) {
    message = 'No new rates found.'
  } else if (lastNotified && latest.date <= lastNotified) {
    message = 'New data exists but already notified.'
  } else if (push) {
    await broadcastPushNotification(
      'U.S. Weekly Average',
      formatWeekLabel(latest.date),
      `30 Yr. Fixed: ${pct(latest.us30_yr_frm)} | 15 Yr. Fixed: ${pct(latest.us15_yr_frm)}`,
    )
    await setMeta(LAST_NOTIFIED_WEEK, latest.date)
    sent = true
    message = 'Push notification sent.'
  } else {
    message = 'New data imported, push notification not triggered.'
  }

  return {
    success: true,
    imported: result.hasNewRates,
    newRates: result.newRates.map((r) => ({ ...r, date: formatIso(r.date) })),
    notification: { sent, message },
  }
}
