import { clientIp, handler, preflight, readJson } from '@lib/server/http'
import { registerPushToken, type RegisterPushTokenInput } from '@lib/server/push'

export const OPTIONS = preflight

export const POST = handler(async (ctx) =>
  registerPushToken(
    await readJson<RegisterPushTokenInput>(ctx.request),
    clientIp(ctx),
  ),
)
