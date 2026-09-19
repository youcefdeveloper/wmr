import { requireRole } from '@lib/server/auth'
import { handler, json, preflight, readJson } from '@lib/server/http'
import {
  createManualRate,
  listManualRates,
  type ManualRateInput,
} from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(() => listManualRates(), { apiKey: 'manual' })

export const POST = handler(
  async ({ request }) => {
    await requireRole(
      request,
      ['superadmin', 'admin'],
      'Forbidden: Only superadmin or admin can create rates.',
    )
    const rate = await createManualRate(await readJson<ManualRateInput>(request))
    return json(request, rate, 201)
  },
  { apiKey: 'manual' },
)
