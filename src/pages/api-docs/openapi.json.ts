import type { APIRoute } from 'astro'
import { openApiSpec } from '@lib/openapi'
import { canViewApiDocs } from '@lib/server/docs-access'

export const GET: APIRoute = async ({ request }) => {
  if (!(await canViewApiDocs(request))) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify(openApiSpec), {
    headers: { 'Content-Type': 'application/json' },
  })
}
