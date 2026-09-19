/**
 * One-off copy of the Symfony MySQL database into Postgres.
 *
 *   MYSQL_URL=mysql://root:@127.0.0.1:3306/wmr_db \
 *   DATABASE_URL=postgres://postgres@127.0.0.1:5432/wmr \
 *   npm run db:import-mysql [-- --reset]
 *
 * Run `npm run db:migrate` first so the tables exist. Without --reset the
 * script refuses to write into tables that already contain rows.
 */
import './direct-url'
import mysql from 'mysql2/promise'
import { sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import {
  authUsers,
  db,
  devices,
  importMetadata,
  pushTokens,
  userUpdateHistory,
  weeklyData,
} from '../src/lib/server/db'

const MYSQL_URL = process.env.MYSQL_URL
if (!MYSQL_URL) throw new Error('MYSQL_URL is not set')
const reset = process.argv.includes('--reset')

// Doctrine stored every datetime as naive UTC.
const utc = (value: string | null) =>
  value === null ? null : new Date(`${value.replace(' ', 'T')}Z`)
const utcRequired = (value: string) => utc(value)!

type Row = Record<string, any>

async function main() {
  const source = await mysql.createConnection({
    uri: MYSQL_URL,
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
  })
  const read = async (query: string) => (await source.query(query))[0] as Row[]

  // Parent tables first so foreign keys resolve.
  const tables: {
    name: string
    table: PgTable
    rows: () => Promise<Record<string, unknown>[]>
    sequence?: string
  }[] = [
    {
      name: 'weekly_data',
      table: weeklyData,
      sequence: 'weekly_data_id_seq',
      rows: async () =>
        (await read('select * from weekly_data order by id')).map((r) => ({
          id: Number(r.id),
          week: String(r.week).slice(0, 10),
          us30YrFrm: r.us30_yr_frm,
          thirtyYrFeesPoints: r.thirty_yr_fees_points,
          us15YrFrm: r.us15_yr_frm,
          fifteenYrFeesPoints: r.fifteen_yr_fees_points,
          us51Arm: r.us5_1_arm,
          five1FeesPoints: r.five_1_fees_points,
          five1ArmMargin: r.five_1_arm_margin,
          us30YrFrm51ArmSpread: r.us30_yr_frm5_1_arm_spread,
          source: r.source,
        })),
    },
    {
      name: 'user',
      table: devices,
      sequence: 'user_id_seq',
      rows: async () =>
        (await read('select * from `user` order by id')).map((r) => ({
          id: Number(r.id),
          deviceId: r.device_id,
          platform: r.platform,
          model: r.model,
          notify: Boolean(r.notify),
          createdAt: utcRequired(r.created_at),
          updatedAt: utcRequired(r.updated_at),
          ipAddress: r.ip_address,
        })),
    },
    {
      name: 'push_token',
      table: pushTokens,
      sequence: 'push_token_id_seq',
      rows: async () =>
        (await read('select * from push_token order by id')).map((r) => ({
          id: Number(r.id),
          userId: Number(r.user_id),
          token: r.token,
          deviceId: r.device_id,
          createdAt: utcRequired(r.created_at),
          updatedAt: utcRequired(r.updated_at),
        })),
    },
    {
      name: 'user_update_history',
      table: userUpdateHistory,
      sequence: 'user_update_history_id_seq',
      rows: async () =>
        (await read('select * from user_update_history order by id')).map(
          (r) => ({
            id: Number(r.id),
            userId: Number(r.user_id),
            updatedAt: utcRequired(r.updated_at),
            source: r.source,
            ipAddress: r.ip_address,
            lang: r.lang,
          }),
        ),
    },
    {
      name: 'auth_user',
      table: authUsers,
      sequence: 'auth_user_id_seq',
      rows: async () =>
        (await read('select * from auth_user order by id')).map((r) => ({
          id: Number(r.id),
          email: r.email,
          name: r.name,
          role: r.role,
          isActive: Boolean(r.is_active),
          createdAt: utcRequired(r.created_at),
          updatedAt: utcRequired(r.updated_at),
          providers:
            typeof r.providers === 'string'
              ? JSON.parse(r.providers)
              : r.providers,
        })),
    },
    {
      name: 'import_metadata',
      table: importMetadata,
      rows: async () =>
        (await read('select * from import_metadata')).map((r) => ({
          key: r.meta_key,
          value: utcRequired(r.meta_value),
        })),
    },
  ]

  await db.transaction(async (tx) => {
    for (const { name } of tables) {
      const [{ count }] = await tx.execute<{ count: number }>(
        sql.raw(`select count(*)::int as count from "${name}"`),
      )
      if (count > 0 && !reset) {
        throw new Error(
          `"${name}" already has ${count} rows. Re-run with --reset to replace the data.`,
        )
      }
    }
    if (reset) {
      await tx.execute(
        sql.raw(
          `truncate ${tables.map((t) => `"${t.name}"`).join(', ')} restart identity cascade`,
        ),
      )
    }

    for (const { name, table, rows, sequence } of tables) {
      const data = await rows()
      for (let i = 0; i < data.length; i += 1000) {
        await tx.insert(table).values(data.slice(i, i + 1000) as any)
      }
      if (sequence) {
        await tx.execute(
          sql.raw(
            `select setval('${sequence}', coalesce((select max(id) from "${name}"), 0) + 1, false)`,
          ),
        )
      }
      console.log(`${name.padEnd(20)} ${data.length} rows`)
    }
  })

  await source.end()
  await db.$client.end()
}

main().catch(async (err) => {
  console.error(err)
  await db.$client.end()
  process.exit(1)
})
