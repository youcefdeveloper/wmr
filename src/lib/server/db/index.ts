import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'

const DATABASE_URL = env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

type Db = PostgresJsDatabase<typeof schema> & { $client: postgres.Sql }

// Reuse one pool across dev-server reloads and warm serverless invocations.
const globalForDb = globalThis as unknown as { __wmrDb?: Db }

export const db: Db =
  globalForDb.__wmrDb ??
  drizzle(
    postgres(DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      // Transaction-mode poolers (Neon, Supabase, PgBouncer) reject prepared
      // statements.
      prepare: false,
    }),
    { schema },
  )

globalForDb.__wmrDb = db

export * from './schema'
