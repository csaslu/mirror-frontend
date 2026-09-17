import type { MirrorStatusValue } from '~/types/mirror'

/** Visual tone of a status, mapped to colour classes by MirrorStatus.vue. */
export type StatusTone = 'success' | 'progress' | 'danger' | 'muted' | 'warning'

/** Iconify name (lucide collection) for each tone. */
const TONE_ICONS: Record<StatusTone, string> = {
  success: 'lucide:check-circle-2',
  progress: 'lucide:loader-circle',
  danger: 'lucide:alert-circle',
  warning: 'lucide:pause-circle',
  muted: 'lucide:help-circle',
}

const STATUS_TONES: Record<string, StatusTone> = {
  success: 'success',
  syncing: 'progress',
  'pre-syncing': 'progress',
  failed: 'danger',
  paused: 'warning',
  disabled: 'warning',
}

/**
 * Resolve how a raw upstream status should look.
 *
 * Unknown statuses (and a null status, meaning "not fetched yet") deliberately
 * degrade to a neutral muted chip rather than guessing at success.
 */
export function statusTone(status: MirrorStatusValue | null | undefined): StatusTone {
  if (!status) return 'muted'
  return STATUS_TONES[status] ?? 'muted'
}

export function statusIcon(status: MirrorStatusValue | null | undefined): string {
  return TONE_ICONS[statusTone(status)]
}

/** Whether the icon should spin (only while a sync is in flight). */
export function statusIsSpinning(status: MirrorStatusValue | null | undefined): boolean {
  return statusTone(status) === 'progress'
}

/**
 * Tailwind classes per tone. Kept as literal strings so Tailwind's scanner can
 * see every class it needs to emit.
 */
const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25',
  progress:
    'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/25',
  danger:
    'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/25',
  warning:
    'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25',
  muted:
    'bg-slate-100 text-slate-600 ring-1 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600/40',
}

/** Solid dot colour, used in the compact mobile/table views. */
const TONE_DOTS: Record<StatusTone, string> = {
  success: 'bg-emerald-500',
  progress: 'bg-sky-500',
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
  muted: 'bg-slate-400 dark:bg-slate-600',
}

export function statusChipClass(status: MirrorStatusValue | null | undefined): string {
  return TONE_CLASSES[statusTone(status)]
}

export function statusDotClass(status: MirrorStatusValue | null | undefined): string {
  return TONE_DOTS[statusTone(status)]
}

/** Order used when sorting by status: healthy first, unknown last. */
export function statusRank(status: MirrorStatusValue | null | undefined): number {
  switch (statusTone(status)) {
    case 'success':
      return 0
    case 'progress':
      return 1
    case 'warning':
      return 2
    case 'danger':
      return 3
    default:
      return 4
  }
}

/** Count mirrors per status, for the summary bar. */
export function statusSummary<T extends { status: MirrorStatusValue | null }>(
  mirrors: readonly T[],
): Record<StatusTone, number> {
  const summary: Record<StatusTone, number> = {
    success: 0,
    progress: 0,
    danger: 0,
    warning: 0,
    muted: 0,
  }

  for (const mirror of mirrors) {
    summary[statusTone(mirror.status)] += 1
  }

  return summary
}
