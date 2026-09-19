import { sql } from 'drizzle-orm'
import {
  bigint,
  bigserial,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

// Table and column names mirror the original Symfony/Doctrine schema so the
// MySQL data can be copied across 1:1 (see scripts/migrate-from-mysql.ts).

const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()

export const weeklyData = pgTable('weekly_data', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  // Stored as a plain date: every Freddie Mac week is a midnight timestamp.
  week: date('week', { mode: 'string' }).notNull().unique(),
  us30YrFrm: doublePrecision('us30_yr_frm'),
  thirtyYrFeesPoints: doublePrecision('thirty_yr_fees_points'),
  us15YrFrm: doublePrecision('us15_yr_frm'),
  fifteenYrFeesPoints: doublePrecision('fifteen_yr_fees_points'),
  us51Arm: doublePrecision('us5_1_arm'),
  five1FeesPoints: doublePrecision('five_1_fees_points'),
  five1ArmMargin: doublePrecision('five_1_arm_margin'),
  us30YrFrm51ArmSpread: doublePrecision('us30_yr_frm5_1_arm_spread'),
  source: varchar('source', { length: 32 }).notNull().default('auto'),
})

// Mobile app installs ("devices" in the dashboard). Named `user` for parity
// with the original schema.
export const devices = pgTable('user', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  deviceId: varchar('device_id', { length: 36 }).notNull().unique(),
  platform: varchar('platform', { length: 10 }).notNull(),
  model: varchar('model', { length: 50 }),
  notify: boolean('notify').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  ipAddress: varchar('ip_address', { length: 45 }),
})

export const pushTokens = pgTable(
  'push_token',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    deviceId: varchar('device_id', { length: 255 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('idx_push_token_user_id').on(t.userId),
    index('idx_push_token_device_id').on(t.deviceId),
  ],
)

export const userUpdateHistory = pgTable(
  'user_update_history',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    source: varchar('source', { length: 50 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    lang: varchar('lang', { length: 10 }),
  },
  (t) => [
    index('idx_user_id').on(t.userId),
    index('idx_updated_at').on(t.updatedAt),
  ],
)

export const ROLES = ['superadmin', 'admin', 'user'] as const
export type Role = (typeof ROLES)[number]

export const PROVIDERS = [
  'google',
  'github',
  'linkedin',
  'microsoft',
  'apple',
] as const
export type Provider = (typeof PROVIDERS)[number]

// Dashboard accounts allowed to sign in through Auth.js.
export const authUsers = pgTable('auth_user', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 180 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).$type<Role>().notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  providers: jsonb('providers')
    .$type<Provider[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
})

export const importMetadata = pgTable('import_metadata', {
  key: varchar('meta_key', { length: 100 }).primaryKey(),
  value: timestamp('meta_value', { withTimezone: true, mode: 'date' }).notNull(),
})

// Fixed-window request counters (replaces Symfony's rate limiter, which needs
// shared state that serverless instances don't have in memory).
export const rateLimits = pgTable('rate_limit', {
  key: varchar('key', { length: 255 }).primaryKey(),
  windowStart: timestamp('window_start', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  count: integer('count').notNull(),
})

export type WeeklyData = typeof weeklyData.$inferSelect
export type Device = typeof devices.$inferSelect
export type PushToken = typeof pushTokens.$inferSelect
export type UserUpdateHistory = typeof userUpdateHistory.$inferSelect
export type AuthUser = typeof authUsers.$inferSelect
