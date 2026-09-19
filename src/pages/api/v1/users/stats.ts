import { getDeviceStats } from '@lib/server/devices'
import { handler, preflight } from '@lib/server/http'

export const OPTIONS = preflight

export const GET = handler(() => getDeviceStats())
