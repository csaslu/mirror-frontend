<script setup lang="ts">
/**
 * Counters above the table: how many mirrors are healthy, syncing, failed or
 * unknown. Mirrors what XJTU shows as a single "current status" chip, but
 * broken down so an operator can see a problem at a glance.
 *
 * While `loading` is set it renders placeholders of the same size instead of
 * disappearing. The row must always occupy its height: with a fast response the
 * list used to appear a frame later than the page, and the whole hero jumped
 * down by the height of this row.
 */
const props = withDefaults(
  defineProps<{
    summary: Record<'success' | 'progress' | 'danger' | 'warning' | 'muted', number>
    total: number
    loading?: boolean
  }>(),
  { loading: false },
)

const { t } = useI18n()

/** Tones shown while loading: enough chips to fill the row like real data does. */
const PLACEHOLDER_WIDTHS = ['4.5rem', '3.5rem', '4rem', '3.5rem', '3rem']

const items = computed(() =>
  (
    [
      { tone: 'success' as const, icon: 'lucide:check-circle-2', label: t('status.success') },
      { tone: 'progress' as const, icon: 'lucide:loader-circle', label: t('status.syncing') },
      { tone: 'danger' as const, icon: 'lucide:alert-circle', label: t('status.failed') },
      { tone: 'warning' as const, icon: 'lucide:pause-circle', label: t('status.paused') },
      { tone: 'muted' as const, icon: 'lucide:help-circle', label: t('status.unknown') },
    ] satisfies Array<{ tone: keyof typeof props.summary; icon: string; label: string }>
  ).filter((item) => props.summary[item.tone] > 0),
)

/** The syncing counter gets a spinning icon, matching the badges in the table. */
function spins(tone: keyof typeof props.summary): boolean {
  return tone === 'progress'
}

const TONE_TEXT: Record<string, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  progress: 'text-sky-600 dark:text-sky-400',
  danger: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  muted: 'text-slate-500 dark:text-slate-400',
}
</script>

<template>
  <!--
    The skeleton keeps the same box: text-sm with size-4 icons gives a 20px line,
    so the placeholders are 20px tall and the row height never changes.
  -->
  <ul
    v-if="loading"
    class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
    aria-hidden="true"
  >
    <li v-for="(width, index) in PLACEHOLDER_WIDTHS" :key="index" class="inline-flex h-5 items-center">
      <span class="h-4 w-4 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      <span
        class="ml-1.5 h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
        :style="{ width }"
      />
    </li>
  </ul>

  <ul v-else class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
    <li
      v-for="item in items"
      :key="item.tone"
      class="inline-flex items-center gap-1.5"
      :title="item.label"
    >
      <Icon
        :name="item.icon"
        class="size-4"
        :class="[TONE_TEXT[item.tone], spins(item.tone) ? 'animate-spin' : '']"
        aria-hidden="true"
      />
      <span class="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
        {{ summary[item.tone] }}
      </span>
      <span class="text-slate-500 dark:text-slate-400">{{ item.label }}</span>
    </li>
  </ul>
</template>
