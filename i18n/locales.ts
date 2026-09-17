/**
 * Every language this site ships.
 *
 * This array is the single source of truth: nuxt.config.ts builds its locale
 * list, prerender routes and hreflang tags from it, and the language switcher
 * renders one entry per item. Adding a language therefore means:
 *
 *   1. copy `locales/zh-CN.json` to `locales/<code>.json` and translate it,
 *   2. append one entry here.
 *
 * No component needs to change, and no button needs to be redesigned.
 */
export interface LocaleDefinition {
  /** BCP-47 tag used in the URL prefix and as the i18n locale code. */
  code: string
  /** Tag handed to Intl for date and number formatting. */
  language: string
  /** Translation file inside `i18n/locales/`. */
  file: string
  /** Name shown in the language switcher, in the language itself. */
  name: string
  /** Short label for narrow screens. */
  short: string
  /** Writing direction, for future RTL languages. */
  dir: 'ltr' | 'rtl'
}

export const locales: LocaleDefinition[] = [
  {
    code: 'zh-CN',
    language: 'zh-CN',
    file: 'zh-CN.json',
    name: '简体中文',
    short: '中',
    dir: 'ltr',
  },
  {
    code: 'en',
    language: 'en-US',
    file: 'en.json',
    name: 'English',
    short: 'EN',
    dir: 'ltr',
  },
]

/** The language used when nothing else matches. */
export const defaultLocale: LocaleDefinition =
  locales.find((locale) => locale.code === 'zh-CN') ?? locales[0]!

/** Look up a locale by code, falling back to the default language. */
export function findLocale(code: string | undefined): LocaleDefinition {
  return locales.find((locale) => locale.code === code) ?? defaultLocale
}
