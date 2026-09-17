<script setup lang="ts">
import type { MirrorType } from '~/types/mirror'

/**
 * Mirror category chip. The colours are keyed by the `mirror_type` enum value,
 * so a type added to the database later still renders (neutrally) instead of
 * breaking the row.
 */
const props = defineProps<{
  type: MirrorType
  /** Show the explanatory tooltip. */
  hint?: boolean
}>()

const { t, te } = useI18n()

interface TypeStyle {
  icon: string
  class: string
}

const TYPE_STYLES: Record<string, TypeStyle> = {
  reverse_proxy: {
    icon: 'lucide:shuffle',
    class:
      'bg-brand-50 text-brand-700 ring-1 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/25',
  },
  rsync: {
    icon: 'lucide:refresh-cw',
    class:
      'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/25',
  },
  http: {
    icon: 'lucide:globe',
    class:
      'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40',
  },
  https: {
    icon: 'lucide:lock',
    class:
      'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/25',
  },
  ftp: {
    icon: 'lucide:hard-drive',
    class:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25',
  },
  s3: {
    icon: 'lucide:cloud',
    class:
      'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/25',
  },
}

const FALLBACK: TypeStyle = {
  icon: 'lucide:circle-dot',
  class:
    'bg-slate-100 text-slate-600 ring-1 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600/40',
}

const style = computed(() => TYPE_STYLES[props.type] ?? FALLBACK)

/** Falls back to the raw enum value if a translation is missing. */
const text = computed(() => (te(`type.${props.type}`) ? t(`type.${props.type}`) : props.type))

const title = computed(() =>
  props.hint === false || !te(`type.${props.type}Hint`) ? undefined : t(`type.${props.type}Hint`),
)
</script>

<template>
  <span class="chip" :class="style.class" :title="title">
    <Icon :name="style.icon" class="size-3.5 shrink-0" aria-hidden="true" />
    <span>{{ text }}</span>
  </span>
</template>
