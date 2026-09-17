<script setup lang="ts">
import { statusTone } from '~/utils/status'
import type { MirrorStatusValue } from '~/types/mirror'

/**
 * One mirror's sync status, rendered as a coloured chip with an icon.
 *
 * Wording comes from the `status.*` translation keys, so an upstream status
 * this frontend has never seen still renders: unknown values fall back to the
 * neutral "unknown" label instead of leaking a raw English token into a
 * Chinese page.
 */
const props = withDefaults(
  defineProps<{
    status: MirrorStatusValue | null
    /** Show the text next to the icon. */
    label?: boolean
    size?: 'sm' | 'md'
  }>(),
  { label: true, size: 'md' },
)

const { t } = useI18n()

const TONE_CLASSES = {
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
} as const

const TONE_ICONS = {
  success: 'lucide:check',
  progress: 'lucide:loader-circle',
  danger: 'lucide:x',
  warning: 'lucide:pause',
  muted: 'lucide:minus',
} as const

/** Status values that have a dedicated translation key. */
const KNOWN_STATUSES = new Set([
  'success',
  'syncing',
  'failed',
  'paused',
  'pre-syncing',
  'disabled',
])

const tone = computed(() => statusTone(props.status))
const chipClass = computed(() => TONE_CLASSES[tone.value])
const icon = computed(() => TONE_ICONS[tone.value])
const spinning = computed(() => tone.value === 'progress')

/** Human label: a translated known status, or a neutral "unknown". */
const text = computed(() => {
  if (!props.status || !KNOWN_STATUSES.has(props.status)) {
    return t('status.unknown')
  }
  return t(`status.${props.status}`)
})

/** Tooltip explaining what the status means. */
const hint = computed(() => {
  if (!props.status || !KNOWN_STATUSES.has(props.status)) {
    return t('status.unknownHint')
  }
  return t(`status.${props.status}Hint`)
})

/** Raw upstream token, shown in the tooltip to help debugging. */
const rawToken = computed(() =>
  props.status && !KNOWN_STATUSES.has(props.status) ? props.status : '',
)
</script>

<template>
  <span
    class="chip"
    :class="[chipClass, size === 'sm' ? 'px-2 py-0.5 text-[11px]' : '']"
    :title="rawToken ? `${hint} (${rawToken})` : hint"
  >
    <Icon
      :name="icon"
      :class="['size-3.5 shrink-0', spinning ? 'animate-spin' : '']"
      aria-hidden="true"
    />
    <span v-if="label">{{ text }}</span>
    <span v-else class="sr-only">{{ text }}</span>
  </span>
</template>
