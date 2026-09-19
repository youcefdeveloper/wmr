import type { Filter, FilterRate } from '@admin-types/adminTypes.ts'

export const timeZone = 'America/New_York'

export const flipPercent = (value: string | number) => {
  const str = String(value)
  return str.endsWith('%') ? `%${str.slice(0, -1)}` : str
}

export function formatDate(
  dateString: string,
  lang: 'ar' | 'en' = 'en',
): string {
  const date = new Date(dateString + 'T00:00')
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateWithWeekday(
  dateString: string,
  lang: 'ar' | 'en' = 'en',
): string {
  const date = new Date(dateString + 'T00:00')
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-DZ', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).replace(',', '')
}

export function numberToWords(n: number): {
  arabic: string
  arabicWords: string
  english: string
  englishWords: string
} {
  if (n < 0 || n > 60) throw new Error('Number must be between 0 and 60')

  const arabicNumerals: { [key: string]: string } = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩',
  }

  const englishWordsRaw = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
    'twenty',
    'twenty-one',
    'twenty-two',
    'twenty-three',
    'twenty-four',
    'twenty-five',
    'twenty-six',
    'twenty-seven',
    'twenty-eight',
    'twenty-nine',
    'thirty',
    'thirty-one',
    'thirty-two',
    'thirty-three',
    'thirty-four',
    'thirty-five',
    'thirty-six',
    'thirty-seven',
    'thirty-eight',
    'thirty-nine',
    'forty',
    'forty-one',
    'forty-two',
    'forty-three',
    'forty-four',
    'forty-five',
    'forty-six',
    'forty-seven',
    'forty-eight',
    'forty-nine',
    'fifty',
    'fifty-one',
    'fifty-two',
    'fifty-three',
    'fifty-four',
    'fifty-five',
    'fifty-six',
    'fifty-seven',
    'fifty-eight',
    'fifty-nine',
    'sixty',
  ]

  // Capitalize only the first letter of the entire phrase
  // const capitalizeFirst = (text: string): string =>
  //   text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  // const englishWord = capitalizeFirst(englishWordsRaw[n])

  const capitalizeAllWords = (text: string): string =>
    text
      .split(/[- ]/) // split by hyphen or space
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(text.includes('-') ? '-' : ' ') // preserve hyphen if it exists
  const englishWord = capitalizeAllWords(englishWordsRaw[n])

  const arabicWords = [
    'صفر',
    'واحد',
    'اثنان',
    'ثلاثة',
    'أربعة',
    'خمسة',
    'ستة',
    'سبعة',
    'ثمانية',
    'تسعة',
    'عشرة',
    'أحد عشر',
    'اثنا عشر',
    'ثلاثة عشر',
    'أربعة عشر',
    'خمسة عشر',
    'ستة عشر',
    'سبعة عشر',
    'ثمانية عشر',
    'تسعة عشر',
    'عشرون',
    'واحد و عشرون',
    'اثنان و عشرون',
    'ثلاثة و عشرون',
    'أربعة و عشرون',
    'خمسة و عشرون',
    'ستة و عشرون',
    'سبعة و عشرون',
    'ثمانية و عشرون',
    'تسعة و عشرون',
    'ثلاثون',
    'واحد و ثلاثون',
    'اثنان و ثلاثون',
    'ثلاثة و ثلاثون',
    'أربعة و ثلاثون',
    'خمسة و ثلاثون',
    'ستة و ثلاثون',
    'سبعة و ثلاثون',
    'ثمانية و ثلاثون',
    'تسعة و ثلاثون',
    'أربعون',
    'واحد و أربعون',
    'اثنان و أربعون',
    'ثلاثة و أربعون',
    'أربعة و أربعون',
    'خمسة و أربعون',
    'ستة و أربعون',
    'سبعة و أربعون',
    'ثمانية و أربعون',
    'تسعة و أربعون',
    'خمسون',
    'واحد و خمسون',
    'اثنان و خمسون',
    'ثلاثة و خمسون',
    'أربعة و خمسون',
    'خمسة و خمسون',
    'ستة و خمسون',
    'سبعة و خمسون',
    'ثمانية و خمسون',
    'تسعة و خمسون',
    'ستون',
  ]

  // Convert Latin digits to Arabic numerals
  const arabicDigits = n
    .toString()
    .split('')
    .map((d) => arabicNumerals[d])
    .join('')

  return {
    arabic: arabicDigits,
    arabicWords: arabicWords[n],
    english: n.toString(),
    englishWords: englishWord,
  }
}


/**
 * Pagination
 *
 * @param c
 * @param m
 * @returns
 */
export const paging = (c: number, m: number) => {
  let current = c,
    last = m,
    delta = 1, // 2
    left = current - delta,
    right = current + delta + 1,
    range = [],
    rangeWithDots = [],
    l

  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= left && i < right)) {
      range.push(i)
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
}

export const __updateQueryParams = (updates: Record<string, string>) => {
  const url = new URL(window.location.href)
  Object.entries(updates).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  // window.history.replaceState({}, "", url);
  window.location.href = url.toString()
}

export function updateQueryParams(params: Record<string, string | null>, clearAll = false) {
  const url = new URL(window.location.href)
  const query = clearAll ? new URLSearchParams() : new URLSearchParams(url.search)

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      query.set(key, value)
    } else {
      query.delete(key)
    }
  })

  const newUrl = `${url.pathname}?${query.toString()}`
  window.history.pushState({}, '', newUrl)

  // trigger React components to react (optional event-based reload)
  window.dispatchEvent(new Event('popstate'))
}


export type PlatformData = {
  platform: string;
  total: number;
};

export type ComeBack = {
  today: number,
  yesterday: number,
  last_week: number,
  all_time: number
}

export type NewPlatformData = {
  platform: string
  total: number
  returning?: number
  oneTime?: number
  comeback?: {
    user: ComeBack
    session: ComeBack
  }
}

export type ReturningStats = {
  returning: number;
  'one time': number;
};

type ChartHeader = [string, string, { role: string }];
type ChartRow = [string, number, string];

export function buildDevicesChartData(input: PlatformData[]): [ChartHeader, ...ChartRow[]] {
  return [
    ['Platform', 'Number of Devices', { role: 'tooltip' }],
    ...input.map(({ platform, total }): ChartRow => {
      const name =
        platform.toLowerCase() === 'ios'
          ? 'iOS'
          : platform.charAt(0).toUpperCase() + platform.slice(1)
      return [`${name} (${total})`, total, `${total} ${name} Device(s)`]
    }),
  ]
}


export const buildReturningChartData = (stat: NewPlatformData | undefined): [ChartHeader, ...ChartRow[]] => {
  if (!stat) {
    // Return just the header if no data
    return [['Type', 'Number of Users', { role: 'tooltip' }]]
  }

  return [
    ['Type', 'Number of Users', { role: 'tooltip' }],
    [`Returning (${stat.returning ?? 0})`, stat.returning ?? 0, `${stat.returning ?? 0} Returning User(s)`],
    [`One Time (${stat.oneTime ?? 0})`, stat.oneTime ?? 0, `${stat.oneTime ?? 0} One Time User(s)`],
  ]
}

export type Device = {
  model: string;
  total: number;
};

export type DevicesByPlatform = {
  'ios': Device[],
  'android': Device[],
};

export function buildDeviceData(devices: Device[]): (string | number)[][] {
  return [
    ['Device Name', 'Device Count'],
    ...devices
      .slice()
      .sort((a, b) => b.total - a.total) // sort high → low
      .map(d => [d.model, d.total]),
  ]
}

// export function formatDateTime(input: any) {
//   // Accept Date object or string like "2025-09-20 18:03:49"
//   const date = input instanceof Date
//     ? input
//     : new Date(String(input).replace(' ', 'T')) // make it ISO-like
//
//   // Format month/day/year ONLY (with one comma after the day)
//   const datePart = date.toLocaleDateString('en-US', {
//     month: 'short',
//     day: 'numeric',
//     year: 'numeric',
//   }) // → "Sep 20, 2025"
//
//   // Format time only
//   const timePart = date.toLocaleTimeString('en-US', {
//     hour: 'numeric',
//     minute: '2-digit',
//     hour12: true,
//   })  // → "6:03 PM"
//     .toLowerCase()      // → "6:03 pm"
//     .replace(' ', '')  // remove the space before am/pm → "6:03pm"
//
//   return `${datePart} at ${timePart}`
// }

export function formatDateTime(input: any) {
  // Accept Date object or UTC string like "2025-09-24 22:12:38"
  const date = input instanceof Date
    ? input
    : new Date(String(input).replace(' ', 'T') + 'Z') // treat as UTC

  const timeZone = 'America/New_York' // EST / EDT automatically

  // Format month/day/year
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).replace(',', '') // → "Wed Sep 24, 2025"

  // Format time only
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  })  // → "6:12 PM"
    .toLowerCase()      // → "6:12 pm"
    .replace(' ', '')   // → "6:12pm"

  return `${datePart} @ ${timePart} EST`
}

export const today = new Date().toISOString().split('T')[0]
export const todayEST = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

export function parseQueryParams(search: string): Filter {
  const params = new URLSearchParams(search)

  // Device filters
  const platform = params.get('platform')
  const model = params.get('model')
  const order = params.get('order')
  const visit = params.get('visit')
  const visitBy = params.get('visitBy')
  const vOrder = params.get('vOrder')
  
  // User management filters
  const role = params.get('role')
  const provider = params.get('provider')
  const active = params.get('active')
  const eOrder = params.get('eOrder')
  const cOrder = params.get('cOrder')
  const rOrder = params.get('rOrder')
  
  // Common filters
  const size = params.get('size')
  const page = params.get('page')
  const uOrder = params.get('uOrder')
  const start = params.get('start')
  const end = params.get('end')
  const source = params.get('source')

  return {
    // Device filters
    platform: platform && platform !== '' ? platform as any : null,
    model: model && model !== '' ? model : null,
    order: order && order !== '' ? (order.toLowerCase() as 'asc' | 'desc') : null,
    visit: visit && visit !== '' ? visit as any : null,
    visitBy: visitBy && visitBy !== '' ? visitBy as any : null,
    vOrder: vOrder && vOrder !== '' ? (vOrder.toLowerCase() as 'asc' | 'desc') : null,
    
    // User management filters
    role: role && role !== '' ? role as any : null,
    provider: provider && provider !== '' ? provider as any : null,
    active: active && active !== '' ? parseInt(active) as 0 | 1 : null,
    eOrder: eOrder && eOrder !== '' ? (eOrder.toLowerCase() as 'asc' | 'desc') : null,
    cOrder: cOrder && cOrder !== '' ? (cOrder.toLowerCase() as 'asc' | 'desc') : null,
    rOrder: rOrder && rOrder !== '' ? (rOrder.toLowerCase() as 'asc' | 'desc') : null,

    // Common filters
    size: size ? parseInt(size) : 10,
    page: page ? parseInt(page) : 1,
    uOrder: uOrder && uOrder !== '' ? (uOrder.toLowerCase() as 'asc' | 'desc') : null,
    start: start && start !== '' ? start : null,
    end: end && end !== '' ? end : null,
    source: source && source !== '' ? source as any : null,
  }
}

export function parseQueryParamsRates(search: string): FilterRate {
  const params = new URLSearchParams(search)

  const size = params.get('size')
  const page = params.get('page')
  const order = params.get('order')
  const sort = params.get('sort')
  const start = params.get('start')
  const end = params.get('end')
  const source = params.get('source')

  return {
    size: size ? parseInt(size) : 10,
    page: page ? parseInt(page) : 1,
    order: order && order !== '' ? (order.toLowerCase() as 'asc' | 'desc') : null,
    sort: sort && sort !== '' ? (sort.toLowerCase() as 'newest' | 'oldest' | 'lowest' | 'highest') : null,
    start: start && start !== '' ? start : null,
    end: end && end !== '' ? end : null,
    source: source && source !== '' ? source as any : null,
  }
}

export const isAheadOfItsTime = (
  givenYear: number,
  weekString?: string | null
): boolean => {
  if (!weekString) {
    return false; 
  }

  const weekDate = new Date(weekString);
  if (isNaN(weekDate.getTime())) {
    return false;
  }

  const weekYear = weekDate.getUTCFullYear();
  return givenYear > weekYear;
}