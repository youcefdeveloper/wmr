/**
 * Imports new weeks from the Freddie Mac PMMS workbook and notifies app users
 * about the latest one (replaces `bin/console app:import-excel`).
 *
 *   npm run import:rates [-- <url>] [-- --no-push]
 */
import { db } from '../src/lib/server/db'
import {
  DEFAULT_RATES_SOURCE_URL,
  importAndNotify,
} from '../src/lib/server/importer'

const args = process.argv.slice(2)
const url = args.find((a) => !a.startsWith('--')) ?? DEFAULT_RATES_SOURCE_URL
const push = !args.includes('--no-push')

console.log(`Importing from ${url}${push ? '' : ' (no push)'}`)

importAndNotify({ url }, push)
  .then((result) => {
    console.log(`Imported ${result.newRates.length} new week(s).`)
    for (const r of result.newRates) {
      console.log(`  ${r.date.slice(0, 10)}  30y ${r.us30_yr_frm}  15y ${r.us15_yr_frm}`)
    }
    console.log(result.notification.message)
  })
  .catch((err) => {
    console.error('Import failed:', err)
    process.exitCode = 1
  })
  .finally(() => db.$client.end())
