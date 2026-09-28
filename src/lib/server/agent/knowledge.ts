// Reference notes the agent can look up (the "Vector Store" in
// AI/WMR_AI_Agent.png). The rates themselves come from Postgres; this holds
// the text knowledge around them. `searchKnowledge` is the only entry point,
// so a pgvector-backed store can replace the keyword ranking below without
// touching the agent.

export type KnowledgeDoc = { id: string; title: string; text: string }

const DOCS: KnowledgeDoc[] = [
  {
    id: 'pmms',
    title: 'Freddie Mac Primary Mortgage Market Survey (PMMS)',
    text:
      'The rates on Weekly Mortgage Rates come from Freddie Mac’s Primary Mortgage Market Survey. ' +
      'Freddie Mac publishes the survey weekly, normally on Thursday at noon US Eastern time. ' +
      'The rates are national averages for conventional, conforming, fully amortizing loans for borrowers ' +
      'with strong credit putting 20% down. They are averages, not an offer: the rate a borrower is quoted ' +
      'depends on credit score, down payment, loan size, points and location.',
  },
  {
    id: 'products',
    title: 'Loan products in the data',
    text:
      '30-year fixed-rate mortgage (30 Yr. FRM): the rate stays the same for 30 years; weekly data since April 1971. ' +
      '15-year fixed-rate mortgage (15 Yr. FRM): the rate stays the same for 15 years, usually lower than the 30-year ' +
      'rate with higher monthly payments; data since 1991. ' +
      '5/1 adjustable-rate mortgage (5/1 ARM): fixed for 5 years, then adjusts yearly; Freddie Mac stopped reporting it in November 2022.',
  },
  {
    id: 'points',
    title: 'Fees and points',
    text:
      'Points are upfront fees paid at closing to lower the rate; one point is 1% of the loan amount. ' +
      'The survey reports the average fees and points alongside each rate. Since November 2022 Freddie Mac no longer ' +
      'publishes fees and points, so recent weeks have no points value.',
  },
  {
    id: 'rate-vs-apr',
    title: 'Interest rate vs APR',
    text:
      'The interest rate is the cost of borrowing the principal. The APR (annual percentage rate) also includes fees, ' +
      'points and some closing costs spread over the loan term, so it is usually higher than the rate. ' +
      'The weekly survey figures are interest rates, not APRs.',
  },
  {
    id: 'drivers',
    title: 'What moves mortgage rates',
    text:
      'Fixed mortgage rates track the 10-year US Treasury yield more closely than the Federal Reserve’s policy rate. ' +
      'Inflation, the economic outlook, investor demand for mortgage-backed securities and Fed policy expectations ' +
      'all move them. The Fed does not set mortgage rates directly.',
  },
  {
    id: 'payment',
    title: 'Estimating a monthly payment',
    text:
      'Monthly principal and interest payment: M = P * r / (1 - (1 + r)^-n), where P is the loan amount, ' +
      'r the annual rate divided by 12 (as a decimal) and n the number of monthly payments (360 for 30 years, 180 for 15). ' +
      'Taxes, insurance and PMI come on top. The site’s mortgage calculator does this computation.',
  },
  {
    id: 'app',
    title: 'Weekly Mortgage Rates app and site',
    text:
      'Weekly Mortgage Rates shows the latest weekly rates, weekly and yearly charts and a mortgage calculator, ' +
      'on the website and the iOS and Android apps. The app can send a push notification when a new week is published. ' +
      'Yearly figures are averages of that year’s weekly rates.',
  },
]

const STOP_WORDS = new Set(
  'a an and are as at be by can do does for from how i in is it my of on or the this to was what when where which who why will with you your'.split(
    ' ',
  ),
)

// Crude stemming so "published" matches "publishes" and "points" matches "point".
const stem = (t: string) =>
  t.length > 4 ? t.replace(/(ing|ed|es|s)$/, '') : t

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9/ ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
    .map(stem)

const docTokens = DOCS.map((d) => new Set(tokenize(`${d.title} ${d.text}`)))
const titleTokens = DOCS.map((d) => new Set(tokenize(d.title)))

// Rarer words count for more (inverse document frequency).
const idf = (term: string) => {
  const df = docTokens.filter((t) => t.has(term)).length
  return df ? Math.log(1 + DOCS.length / df) : 0
}

/** The `limit` notes most relevant to `query`, best first. */
export function searchKnowledge(query: string, limit = 3): KnowledgeDoc[] {
  const terms = [...new Set(tokenize(query))]
  return DOCS.map((doc, i) => ({
    doc,
    score: terms.reduce(
      (s, t) =>
        s +
        (docTokens[i].has(t) ? idf(t) : 0) +
        // A word in the title is a strong signal of what the note is about.
        (titleTokens[i].has(t) ? idf(t) : 0),
      0,
    ),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.doc)
}
