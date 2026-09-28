import { and, asc, desc, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod/v4'
import { db, weeklyData } from '../db'
import { parseYmd } from '../dates'
import { getUsWeeklyRange, listUsYearly } from '../rates'
import { searchKnowledge } from './knowledge'

// The Retriever in AI/WMR_AI_Agent.png: tools the agent calls to read the
// rates database and the knowledge store. Thrown errors (e.g. a bad date) are
// returned to the model as the tool's output.

export type AgentTool = {
  name: string
  description: string
  inputSchema: z.ZodObject
  run: (input: any) => Promise<string>
}

/** Keeps `run`'s argument typed from the schema. */
const defineTool = <S extends z.ZodObject>(tool: {
  name: string
  description: string
  inputSchema: S
  run: (input: z.infer<S>) => Promise<string>
}): AgentTool => tool

/** Past this many weeks the model is pointed at the summary tool instead. */
const MAX_WEEKS = 160

const ymd = z.string().describe('Date as YYYY-MM-DD')

const toJson = (data: unknown) => JSON.stringify(data)

const latestRates = defineTool({
  name: 'get_latest_rates',
  description:
    'The most recent weekly rates (30-year and 15-year fixed) and the previous weeks, newest first. ' +
    'Use for "what are rates now" and "how did rates change this week".',
  inputSchema: z.object({
    weeks: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('How many recent weeks to return (default 2)'),
  }),
  run: async ({ weeks = 2 }) => {
    const rows = await db
      .select({
        week: weeklyData.week,
        us30_yr_frm: weeklyData.us30YrFrm,
        us15_yr_frm: weeklyData.us15YrFrm,
      })
      .from(weeklyData)
      .orderBy(desc(weeklyData.week))
      .limit(weeks)
    return toJson(rows)
  },
})

const weeklyRates = defineTool({
  name: 'get_weekly_rates',
  description:
    `Every weekly 30-year and 15-year fixed rate between two dates (inclusive), oldest first. ` +
    `Returns at most ${MAX_WEEKS} weeks; for longer periods use get_rate_summary or get_yearly_averages.`,
  inputSchema: z.object({ start: ymd, end: ymd }),
  run: async ({ start, end }) => {
    const rows = await getUsWeeklyRange(start, end, 'asc')
    if (rows.length > MAX_WEEKS) {
      throw new Error(
        `${rows.length} weeks in that range; the limit is ${MAX_WEEKS}. ` +
          'Narrow the range or use get_rate_summary / get_yearly_averages.',
      )
    }
    return toJson(
      rows.map(({ week, us30_yr_frm, us15_yr_frm }) => ({
        week,
        us30_yr_frm,
        us15_yr_frm,
      })),
    )
  },
})

const rateSummary = defineTool({
  name: 'get_rate_summary',
  description:
    'Statistics for the 30-year and 15-year fixed rates over any period: first and last week, ' +
    'average, lowest and highest (with the week each occurred). Omit dates for all history. ' +
    'Use for "lowest since", "highest ever", "average in 2023" and trend questions.',
  inputSchema: z.object({ start: ymd.optional(), end: ymd.optional() }),
  run: async ({ start, end }) => {
    const range = and(
      start ? gte(weeklyData.week, parseYmd(start, 'start')) : undefined,
      end ? lte(weeklyData.week, parseYmd(end, 'end')) : undefined,
    )
    const summarize = async (
      column: typeof weeklyData.us30YrFrm | typeof weeklyData.us15YrFrm,
    ) => {
      const where = and(range, sql`${column} is not null`)
      const pick = (order: 'asc' | 'desc', by: 'week' | 'rate') =>
        db
          .select({ week: weeklyData.week, rate: column })
          .from(weeklyData)
          .where(where)
          .orderBy(
            by === 'week'
              ? (order === 'asc' ? asc : desc)(weeklyData.week)
              : (order === 'asc' ? asc : desc)(column),
            // Ties go to the most recent week.
            desc(weeklyData.week),
          )
          .limit(1)
      const [[stats], [first], [last], [lowest], [highest]] = await Promise.all([
        db
          .select({
            weeks: sql<number>`count(*)::int`,
            average: sql<string | null>`round(avg(${column})::numeric, 2)`,
          })
          .from(weeklyData)
          .where(where),
        pick('asc', 'week'),
        pick('desc', 'week'),
        pick('asc', 'rate'),
        pick('desc', 'rate'),
      ])
      if (!stats.weeks) return null
      return {
        weeks: stats.weeks,
        average: Number(stats.average),
        first,
        last,
        lowest,
        highest,
      }
    }
    const [us30, us15] = await Promise.all([
      summarize(weeklyData.us30YrFrm),
      summarize(weeklyData.us15YrFrm),
    ])
    return toJson({ us30_yr_frm: us30, us15_yr_frm: us15 })
  },
})

const yearlyAverages = defineTool({
  name: 'get_yearly_averages',
  description:
    'Yearly averages of the weekly 30-year and 15-year fixed rates, oldest first. ' +
    'Use to compare years or describe long-term trends.',
  inputSchema: z.object({
    from_year: z.number().int().min(1971).optional(),
    to_year: z.number().int().optional(),
  }),
  run: async ({ from_year, to_year }) => {
    const rows = await listUsYearly('asc')
    return toJson(
      rows
        .filter(
          (r) =>
            (from_year === undefined || Number(r.year) >= from_year) &&
            (to_year === undefined || Number(r.year) <= to_year),
        )
        .map(({ year, us30_yr_frm, us15_yr_frm }) => ({
          year,
          us30_yr_frm,
          us15_yr_frm,
        })),
    )
  },
})

const knowledge = defineTool({
  name: 'search_knowledge',
  description:
    'Search reference notes about the data and mortgages: where the rates come from and when they are ' +
    'published, the loan products, points, rate vs APR, what moves rates, the payment formula, and the ' +
    'Weekly Mortgage Rates app. Use for questions that are not about specific rate values.',
  inputSchema: z.object({ query: z.string().min(1) }),
  run: async ({ query }) => {
    const docs = searchKnowledge(query)
    return docs.length
      ? toJson(docs.map(({ title, text }) => ({ title, text })))
      : 'No matching notes.'
  },
})

export const retrieverTools: AgentTool[] = [
  latestRates,
  weeklyRates,
  rateSummary,
  yearlyAverages,
  knowledge,
]
