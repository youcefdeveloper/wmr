import { handler, json, preflight } from '@lib/server/http'
import { importAndNotify } from '@lib/server/importer'

export const OPTIONS = preflight

async function resolveSource(request: Request, url: URL) {
  const importUrl = url.searchParams.get('url')
  if (importUrl) return { url: importUrl }
  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const file = (await request.formData()).get('file')
    if (file instanceof File) return { file: await file.arrayBuffer() }
  }
  throw new Error('No source provided for Excel import.')
}

/**
 * Imports new weeks from a Freddie Mac workbook, given as `?url=` or as a
 * multipart `file` upload. `?push=yes` notifies app users of the latest week.
 */
export const POST = handler(async ({ request, url }) => {
  const push = ['1', 'true', 'on', 'yes'].includes(
    (url.searchParams.get('push') ?? 'no').toLowerCase(),
  )
  try {
    return await importAndNotify(await resolveSource(request, url), push)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return json(request, { success: false, error: `Import failed: ${message}` }, 500)
  }
})
