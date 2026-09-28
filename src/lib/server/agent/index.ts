import OpenAI from 'openai'
import type {
  FunctionTool,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from 'openai/resources/responses/responses'
import { z } from 'zod/v4'
import { logger } from '@helpers/logger.ts'
import { env } from '../env'
import { badRequest, HttpError } from '../http'
import { DASHBOARD_TZ } from '../dates'
import { retrieverTools, type AgentTool } from './retriever'

// The AI Agent in AI/WMR_AI_Agent.png: answers a user question with an OpenAI
// model, which calls the retriever tools to read rates and reference notes.

/** API requests per question; each round of tool calls is one. */
const MAX_ITERATIONS = 8
const MAX_HISTORY = 20

const INSTRUCTIONS = `You are the assistant for Weekly Mortgage Rates, a site and app that publishes \
Freddie Mac's weekly US average mortgage rates.

Answer questions about mortgage rates using the tools. Every rate, date and figure you state must \
come from a tool result in this conversation; never estimate rates from memory. If the data does not \
cover what was asked, say so. Quote rates as percentages with two decimals and name the week they \
belong to. These are national averages, not an offer; say so when someone asks what rate they will get.

Keep answers short and plain: a sentence or two, or a short list for comparisons. You give general \
information, not financial advice. Politely decline questions unrelated to mortgages or this site.`

// Created on first use: the constructor throws without a key, and an unset
// key should only turn the assistant off.
let client: OpenAI | undefined
const openai = () =>
  (client ??= new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    // Stay inside the Vercel function limit (maxDuration: 60 in astro.config.mjs).
    timeout: 50_000,
    maxRetries: 1,
  }))

const REASONING_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high'] as const
const reasoningEffort = REASONING_EFFORTS.find(
  (e) => e === env.OPENAI_REASONING_EFFORT?.trim().toLowerCase(),
)

const toolsByName = new Map(retrieverTools.map((t) => [t.name, t]))

const toolDefinitions: FunctionTool[] = retrieverTools.map((t) => ({
  type: 'function',
  name: t.name,
  description: t.description,
  parameters: z.toJSONSchema(t.inputSchema),
  // Strict mode needs every property required; the tools have optional ones,
  // so arguments are validated in runTool instead.
  strict: false,
}))

/** Runs one tool call; any failure goes back to the model as the output. */
async function runTool(call: ResponseFunctionToolCall): Promise<string> {
  const tool: AgentTool | undefined = toolsByName.get(call.name)
  if (!tool) return `Error: unknown tool ${call.name}`
  let args: unknown
  try {
    args = JSON.parse(call.arguments || '{}')
  } catch {
    return 'Error: arguments were not valid JSON'
  }
  const parsed = tool.inputSchema.safeParse(args)
  if (!parsed.success) {
    return `Error: invalid arguments: ${z.prettifyError(parsed.error)}`
  }
  try {
    return await tool.run(parsed.data)
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`
  }
}

const askSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(8000),
      }),
    )
    .max(MAX_HISTORY)
    .default([]),
})

export type AskInput = z.input<typeof askSchema>

export type AskResult = {
  answer: string
  model: string
}

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: DASHBOARD_TZ }).format(new Date())

/** Runs the agent on one question, with earlier turns from `history`. */
export async function askAgent(input: unknown): Promise<AskResult> {
  if (!env.OPENAI_API_KEY) {
    throw new HttpError(503, 'The assistant is not configured')
  }
  const parsed = askSchema.safeParse(input)
  if (!parsed.success) throw badRequest('Invalid question')
  const { question, history } = parsed.data

  let pending: ResponseInputItem[] = [
    ...history,
    { role: 'user', content: question },
  ]
  let previousId: string | undefined

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await openai().responses.create({
        model: env.OPENAI_MODEL,
        instructions: `${INSTRUCTIONS}\n\nToday is ${today()}.`,
        // Reasoning models only; see OPENAI_REASONING_EFFORT in .env.example.
        ...(reasoningEffort && { reasoning: { effort: reasoningEffort } }),
        max_output_tokens: 16000,
        tools: toolDefinitions,
        input: pending,
        // Tool rounds continue the stored response, so only the tool outputs
        // are sent each time.
        previous_response_id: previousId,
      })

      const calls = response.output.filter(
        (item): item is ResponseFunctionToolCall => item.type === 'function_call',
      )
      if (calls.length === 0) {
        const answer = response.output_text.trim()
        if (!answer) {
          logger.warn(
            { status: response.status, reason: response.incomplete_details },
            'Agent returned no answer',
          )
          break
        }
        return { answer, model: response.model }
      }

      previousId = response.id
      pending = await Promise.all(
        calls.map(async (call) => ({
          type: 'function_call_output' as const,
          call_id: call.call_id,
          output: await runTool(call),
        })),
      )
    }
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) {
      throw new HttpError(429, 'The assistant is busy, please try again shortly')
    }
    if (err instanceof OpenAI.APIError) {
      logger.error({ err, status: err.status }, 'Agent request failed')
      throw new HttpError(502, 'The assistant is unavailable')
    }
    throw err
  }

  // Ran out of iterations while still calling tools, or an empty reply.
  return {
    answer: 'Sorry, I couldn’t work that out. Try a more specific question.',
    model: env.OPENAI_MODEL,
  }
}
