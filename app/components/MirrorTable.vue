<script setup lang="ts">
import type { Mirror } from '~/types/mirror'

/**
 * The mirror table.
 *
 * Columns follow what the reference campus mirrors show, plus the category the
 * backend asked for: name, description, category, size, last successful sync,
 * status. Size and last-sync hint on hover, and every row expands into a detail
 * panel instead of linking to a heavy per-mirror page.
 */
const props = defineProps<{
  mirrors: Mirror[]
  /** Keys currently expanded. */
  expanded?: string[]
}>()

const emit = defineEmits<{
  (event: 'toggle', key: string): void
  (event: 'copy', mirror: Mirror): void
}>()

const { t, locale } = useI18n()

/** Localised clock, so a stale list still ages correctly between refreshes. */
const now = ref(Date.now())

let ticker: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  ticker = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})

onUnmounted(() => {
  if (ticker) clearInterval(ticker)
})

const expandedSet = computed(() => new Set(props.expanded ?? []))

function absoluteTime(seconds: number | null): string {
  return formatDateTime(seconds, locale.value)
}

function relativeTime(seconds: number | null): string {
  if (!seconds) return t('mirror.syncUnknown')
  return formatRelativeTime(seconds, locale.value, now.value)
}

/**
 * Public URL of a mirror directory. The locale prefix is deliberately absent:
 * mirror content is language-neutral, and users paste these into apt sources.
 */
function mirrorUrl(key: string): string {
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}/${key}/`
}
</script>

<template>
  <!--
    `min-w-0 w-full` is load-bearing: this is a flex/grid item, and the
    default `min-width: auto` lets it grow to the table's min-width, so the
    overflow never engages — the page itself gets wider and a phone renders
    the whole layout at a shrunken zoom level.
  -->
  <div class="w-full min-w-0 overflow-x-auto scrollbar-thin">
    <table class="w-full min-w-[46rem] border-collapse text-sm">
      <caption class="sr-only">{{ t('home.title') }}</caption>

      <thead>
        <tr
          class="border-b border-slate-200 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400"
        >
          <th scope="col" class="px-4 py-3">{{ t('table.name') }}</th>
          <th scope="col" class="hidden px-4 py-3 lg:table-cell">{{ t('table.description') }}</th>
          <th scope="col" class="px-4 py-3">{{ t('table.category') }}</th>
          <th scope="col" class="px-4 py-3 text-right whitespace-nowrap">
            {{ t('table.size') }}
          </th>
          <th scope="col" class="px-4 py-3 whitespace-nowrap">{{ t('table.lastSync') }}</th>
          <th scope="col" class="px-4 py-3">{{ t('table.status') }}</th>
          <th scope="col" class="px-4 py-3 text-right">
            <span class="sr-only">{{ t('table.actions') }}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-for="mirror in mirrors" :key="mirror.id">
          <tr
            class="group border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
            :class="expandedSet.has(mirror.key) ? 'bg-slate-50/70 dark:bg-slate-800/40' : ''"
          >
            <!-- Name -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  :aria-expanded="expandedSet.has(mirror.key)"
                  :title="expandedSet.has(mirror.key) ? t('table.collapse') : t('table.expand')"
                  @click="emit('toggle', mirror.key)"
                >
                  <Icon
                    name="lucide:chevron-right"
                    class="size-4 transition-transform"
                    :class="expandedSet.has(mirror.key) ? 'rotate-90' : ''"
                    aria-hidden="true"
                  />
                  <span class="sr-only">{{ t('table.expand') }}</span>
                </button>

                <NuxtLink
                  :to="`/mirror/${mirror.key}`"
                  class="font-mono text-sm font-semibold text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
                >
                  {{ mirror.key }}
                </NuxtLink>
              </div>
              <!-- Description is moved under the name on narrow screens. -->
              <p v-if="mirror.comment" class="mt-0.5 pl-8 text-xs text-slate-500 lg:hidden">
                {{ mirror.comment }}
              </p>
            </td>

            <!-- Description (wide screens) -->
            <td class="hidden px-4 py-3 text-slate-600 lg:table-cell dark:text-slate-400">
              {{ mirror.comment || '—' }}
            </td>

            <!-- Category -->
            <td class="px-4 py-3">
              <MirrorTypeChip :type="mirror.type" />
            </td>

            <!-- Size -->
            <td
              class="px-4 py-3 text-right font-mono text-slate-700 tabular-nums dark:text-slate-300"
            >
              {{ mirror.size === null ? t('mirror.sizeUnknown') : formatBytes(mirror.size, locale) }}
            </td>

            <!-- Last sync -->
            <td class="px-4 py-3 whitespace-nowrap">
              <ClientOnly>
                <time
                  :datetime="mirror.last_update ? new Date(mirror.last_update * 1000).toISOString() : undefined"
                  class="text-slate-600 dark:text-slate-400"
                  :title="mirror.last_update ? absoluteTime(mirror.last_update) : t('status.unknownHint')"
                >
                  {{ relativeTime(mirror.last_update) }}
                </time>

                <template #fallback>
                  <!-- Absolute time renders identically on both sides. -->
                  <span class="text-slate-600 dark:text-slate-400">
                    {{ mirror.last_update ? absoluteTime(mirror.last_update) : t('mirror.syncUnknown') }}
                  </span>
                </template>
              </ClientOnly>
            </td>

            <!-- Status -->
            <td class="px-4 py-3">
              <MirrorStatus :status="mirror.status" />
            </td>

            <!-- Actions -->
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <NuxtLink
                  :to="`/mirror/${mirror.key}`"
                  class="icon-btn"
                  :title="t('mirror.browse')"
                >
                  <Icon name="lucide:folder-open" class="size-4" aria-hidden="true" />
                  <span class="sr-only">{{ t('mirror.browse') }}</span>
                </NuxtLink>

                <button
                  type="button"
                  class="icon-btn"
                  :title="t('mirror.copyUrl')"
                  @click="emit('copy', mirror)"
                >
                  <Icon name="lucide:link" class="size-4" aria-hidden="true" />
                  <span class="sr-only">{{ t('mirror.copyUrl') }}</span>
                </button>
              </div>
            </td>
          </tr>

          <!-- Expandable detail row -->
          <tr v-if="expandedSet.has(mirror.key)" class="border-b border-slate-100 dark:border-slate-800/70">
            <td colspan="7" class="bg-slate-50/60 px-4 py-4 dark:bg-slate-900/40">
              <MirrorDetail :mirror="mirror" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
