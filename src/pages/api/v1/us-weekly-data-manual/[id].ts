import { requireRole } from '@lib/server/auth'
import { handler, idParam, preflight, readJson } from '@lib/server/http'
import {
  deleteManualRate,
  getManualRate,
  updateManualRate,
  type ManualRateInput,
} from '@lib/server/rates'

export const OPTIONS = preflight

export const GET = handler(({ params }) => getManualRate(idParam(params.id)), {
  apiKey: 'manual',
})

export const PUT = handler(
  async ({ request, params }) => {
    await requireRole(
      request,
      ['superadmin', 'admin'],
      'Forbidden: Only superadmin or admin can update rates.',
    )
    return updateManualRate(
      idParam(params.id),
      await readJson<ManualRateInput>(request),
    )
  },
  { apiKey: 'manual' },
)

export const PATCH = PUT

export const DELETE = handler(
  async ({ request, params }) => {
    await requireRole(
      request,
      ['superadmin', 'admin'],
      'Forbidden: Only superadmin or admin can delete rates.',
    )
    return deleteManualRate(idParam(params.id))
  },
  { apiKey: 'manual' },
)
