/**
 * Asks the rates assistant a question from the terminal (`npm run agent:ask`).
 *
 *   npm run agent:ask -- "What is the 30-year rate this week?"
 *   npm run agent:ask            # interactive: keeps the conversation going
 *
 * Needs OPENAI_API_KEY and DATABASE_URL in .env.local.
 */
import { createInterface } from 'node:readline/promises'
import { askAgent, type AskInput } from '../src/lib/server/agent'
import { HttpError } from '../src/lib/server/http'

const history: NonNullable<AskInput['history']> = []

async function ask(question: string) {
  const { answer } = await askAgent({ question, history })
  history.push(
    { role: 'user', content: question },
    { role: 'assistant', content: answer },
  )
  console.log(`\n${answer}\n`)
}

const question = process.argv.slice(2).join(' ').trim()

try {
  if (question) {
    await ask(question)
  } else {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    for (;;) {
      const line = (await rl.question('> ')).trim()
      if (!line || line === 'exit') break
      await ask(line)
    }
    rl.close()
  }
} catch (err) {
  if (!(err instanceof HttpError)) throw err
  console.error(`${err.status}: ${err.message}`)
  process.exit(1)
}
process.exit(0)
