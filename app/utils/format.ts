/**
 * Locale-aware formatters.
 *
 * Formatting is done in the browser with Intl instead of on the server, so the
 * static build stays language-agnostic and every visitor sees sizes and times
 * in their own locale.
 */

/** Narrow a BCP-47 tag to something Intl always accepts ("zh-CN" -> "zh-CN"). */
function normalizeLocale(locale: string): string {
  return locale || 'en'
}

const numberFormatters = new Map<string, Intl.NumberFormat>()

function numberFormatter(locale: string): Intl.NumberFormat {
  const key = normalizeLocale(locale)
  let formatter = numberFormatters.get(key)

  if (!formatter) {
    formatter = new Intl.NumberFormat(key)
    numberFormatters.set(key, formatter)
  }

  return formatter
}

/**
 * Format a byte count the way mirror sites do: binary units with a space and
 * two decimals ("4.96 TB"), and "-" for an unknown size.
 */
export function formatBytes(bytes: number | null | undefined, locale = 'en'): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return '-'
  }

  if (bytes === 0) {
    return `0 ${locale.startsWith('zh') ? 'B' : 'bytes'}`
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent

  // Bytes are whole numbers; larger units get two decimals for consistency
  // with the upstream listings.
  const formatted =
    exponent === 0
      ? numberFormatter(locale).format(bytes)
      : numberFormatter(locale).format(Number(value.toFixed(2)))

  return `${formatted} ${units[exponent]}`
}

/** Format a plain count with locale-aware grouping. */
export function formatNumber(value: number | null | undefined, locale = 'en'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return numberFormatter(locale).format(value)
}

/**
 * Convert a Unix timestamp in seconds to a Date, or null when the value cannot
 * be a real instant.
 *
 * Upstream data is not a trusted input: a missing field arrives as 0 or null,
 * and a malformed one can be negative. `Intl` throws a RangeError on an
 * invalid Date, which inside a render function would blank the page — so every
 * formatter goes through here first.
 */
function toDate(unixSeconds: number | null | undefined): Date | null {
  if (unixSeconds === null || unixSeconds === undefined) return null
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return null

  const date = new Date(unixSeconds * 1000)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Absolute timestamp, e.g. "2026-09-16 23:44". Used for tooltips and the
 * detail view, where a precise instant matters.
 */
export function formatDateTime(unixSeconds: number | null | undefined, locale = 'en'): string {
  const date = toDate(unixSeconds)
  if (!date) return '-'

  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Relative time such as "3 小时前" / "3 hours ago", which is what every
 * reference mirror site uses for its last-sync column. Anything older than a
 * month falls back to an absolute date: "412 days ago" helps nobody.
 */
export function formatRelativeTime(
  unixSeconds: number | null | undefined,
  locale = 'en',
  now = Date.now(),
): string {
  const date = toDate(unixSeconds)
  if (!date) return '-'

  const diffSeconds = Math.round((date.getTime() - now) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 45) {
    return translate(locale, 'justNow')
  }

  const rtf = new Intl.RelativeTimeFormat(normalizeLocale(locale), { numeric: 'auto' })

  if (absSeconds > 30 * 86_400) {
    return formatDateTime(unixSeconds, locale)
  }

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ]

  let duration = diffSeconds

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }

  return rtf.format(Math.round(duration), 'year')
}

function translate(locale: string, key: 'justNow'): string {
  return locale.startsWith('zh') ? '刚刚' : 'just now'
}
