// Languages the mobile app can report with `register-push-token`.
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  zh: 'Chinese',
  ar: 'Arabic',
  de: 'German',
  ja: 'Japanese',
  pt: 'Portuguese',
  ur: 'Urdu',
  fa: 'Persian',
  uz: 'Uzbek',
  it: 'Italian',
  bn: 'Bengali',
  hi: 'Hindi',
  ko: 'Korean',
  so: 'Somali',
  ru: 'Russian',
  uk: 'Ukrainian',
  tr: 'Turkish',
  nl: 'Dutch',
  sq: 'Albanian',
  tz: 'Tamazight',
  he: 'Hebrew',
  bs: 'Bosnian',
  ms: 'Malay',
  sw: 'Swahili',
}

export function getLanguageName(code: string | null | undefined): string | null {
  if (!code) return null
  return LANGUAGE_NAMES[code.trim().toLowerCase()] ?? null
}

export function isSupportedLanguage(code: string): boolean {
  return Object.hasOwn(LANGUAGE_NAMES, code)
}
