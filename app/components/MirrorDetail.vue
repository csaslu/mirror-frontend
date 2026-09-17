<script setup lang="ts">
import type { Mirror } from '~/types/mirror'

/**
 * Detail panel shown when a table row is expanded. This is where the facts
 * that do not fit the table live: the upstream URL, the exact sync instant and
 * the meaning of the mirror's category.
 */
const props = defineProps<{ mirror: Mirror }>()

const { t, te, locale } = useI18n()

const emit = defineEmits<{ (event: 'copy', mirror: Mirror): void }>()

/** Public URL of the mirror directory (no locale prefix: it is pasteable). */
const url = computed(() => {
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}/${props.mirror.key}/`
})

const facts = computed(() => [
  { label: t('mirror.key'), value: props.mirror.key, mono: true },
  {
    label: t('mirror.source'),
    value: props.mirror.source || '—',
    mono: true,
    href: props.mirror.source?.startsWith('http') ? props.mirror.source : undefined,
  },
  {
    label: t('mirror.size'),
    value:
      props.mirror.size === null ? t('mirror.sizeUnknown') : formatBytes(props.mirror.size, locale.value),
    mono: true,
  },
  {
    label: t('mirror.lastSync'),
    value: props.mirror.last_update
      ? formatDateTime(props.mirror.last_update, locale.value)
      : t('mirror.syncUnknown'),
    mono: true,
  },
])

const typeHint = computed(() =>
  te(`type.${props.mirror.type}Hint`) ? t(`type.${props.mirror.type}Hint`) : '',
)
</script>

<template>
  <div class="animate-in grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="fact in facts"
      :key="fact.label"
      class="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
    >
      <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ fact.label }}</dt>
      <dd
        class="mt-1 truncate text-sm text-slate-800 dark:text-slate-200"
        :class="fact.mono ? 'font-mono' : ''"
        :title="fact.value"
      >
        <a
          v-if="fact.href"
          :href="fact.href"
          target="_blank"
          rel="noopener"
          class="text-brand-600 hover:underline dark:text-brand-400"
        >
          {{ fact.value }}
        </a>
        <template v-else>{{ fact.value }}</template>
      </dd>
    </div>

    <div class="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
      <button
        type="button"
        class="btn-ghost border border-slate-200 font-mono text-xs dark:border-slate-700"
        :title="t('mirror.copyUrl')"
        @click="emit('copy', mirror)"
      >
        <Icon name="lucide:copy" class="size-4" aria-hidden="true" />
        {{ url }}
      </button>

      <NuxtLink
        class="btn-ghost border border-slate-200 text-xs dark:border-slate-700"
        :to="`/mirror/${mirror.key}`"
      >
        <Icon name="lucide:folder-open" class="size-4" aria-hidden="true" />
        {{ t('mirror.browse') }}
      </NuxtLink>

      <a
        v-if="mirror.source?.startsWith('http')"
        class="btn-ghost border border-slate-200 text-xs dark:border-slate-700"
        :href="mirror.source"
        target="_blank"
        rel="noopener"
      >
        <Icon name="lucide:external-link" class="size-4" aria-hidden="true" />
        {{ t('mirror.openSource') }}
      </a>

      <p v-if="typeHint" class="text-xs text-slate-500 dark:text-slate-400">
        <Icon name="lucide:info" class="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
        {{ typeHint }}
      </p>
    </div>
  </div>
</template>
