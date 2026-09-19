import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Reader, type CityResponse } from 'maxmind'
import { logger } from '@helpers/logger.ts'

// MaxMind GeoLite2 City database, bundled with the serverless function (see
// `includeFiles` in astro.config.mjs).
const DB_PATH =
  process.env.GEOIP_DB_PATH ??
  path.join(process.cwd(), 'data', 'GeoLite2-City.mmdb')

let reader: Reader<CityResponse> | null | undefined
const cache = new Map<string, string | null>()

function getReader(): Reader<CityResponse> | null {
  if (reader === undefined) {
    try {
      reader = new Reader<CityResponse>(readFileSync(DB_PATH))
    } catch (err) {
      logger.error({ err, path: DB_PATH }, 'Could not open GeoIP database')
      reader = null
    }
  }
  return reader
}

function isPrivateIp(ip: string): boolean {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(ip)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    )
  }
  return ip === '::1' || ip.startsWith('fe80:')
}

/**
 * "City, State, Country" for an IP (parts omitted when unknown), "Local
 * Network" for private addresses, or null when it can't be resolved.
 */
export function getLocationFromIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  if (isPrivateIp(ip)) return 'Local Network'
  if (cache.has(ip)) return cache.get(ip)!

  let location: string | null = null
  try {
    const record = getReader()?.get(ip)
    const subdivisions = record?.subdivisions
    const parts = [
      record?.city?.names.en,
      subdivisions?.[subdivisions.length - 1]?.names.en,
      record?.country?.names.en,
    ].filter(Boolean)
    location = parts.length ? parts.join(', ') : null
  } catch (err) {
    logger.warn({ err, ip }, 'GeoIP lookup failed')
  }
  cache.set(ip, location)
  return location
}

export type ParsedLocation = { city: string; state: string; country: string }

/** Splits a location string the way the dashboard reports expect. */
export function parseLocation(location: string | null): ParsedLocation {
  const unknown = { city: 'Unknown', state: 'Unknown', country: 'Unknown' }
  if (!location || location === 'Local Network') return unknown
  const parts = location.split(', ')
  if (parts.length === 3) {
    const [city, state, country] = parts
    return { city, state, country }
  }
  if (parts.length === 2) {
    const [city, country] = parts
    return { city, state: 'Unknown', country }
  }
  return { ...unknown, country: parts[0] }
}
