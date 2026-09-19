/** Applies pending SQL migrations from ./drizzle (`npm run db:migrate`). */
import './direct-url'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '../src/lib/server/db'

migrate(db, { migrationsFolder: './drizzle' })
  .then(() => console.log('Migrations applied.'))
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$client.end())
