<script setup lang="ts">
import { statusSummary } from '~/utils/status'
import type { Mirror } from '~/types/mirror'

/**
 * The mirror list homepage.
 *
 * Served as static HTML and hydrated on the client: the list itself comes from
 * the Go API at runtime, so the page never needs a rebuild to show new mirrors
 * or fresh sync status.
 */
const { t, locale } = useI18n()
const config = useRuntimeConfig()

const { mirrors, fetchedAt, refreshInFlight, error, pending, reload } = useMirrors()

// Poll while the tab is visible so sync status stays current (see composable).
useMirrorPolling(reload, Number(config.public.refreshInterval))

const query = ref('')
const activeType = ref<string>('all')
const expanded = ref<string[]>([])

/** Tailwind's `md` breakpoint, for the table/card accessibility handoff. */
const isWide = useMediaQuery('(min-width: 768px)')

/** Filter by fuzzy name/description match plus the category chips. */
const filtered = computed<Mirror[]>(() => {
  const needle = query.value.trim().toLowerCase()

  return mirrors.value.filter((mirror) => {
    if (activeType.value !== 'all' && mirror.type !== activeType.value) return false
    if (!needle) return true

    return (
      mirror.key.toLowerCase().includes(needle) ||
      mirror.comment.toLowerCase().includes(needle) ||
      mirror.type.toLowerCase().includes(needle)
    )
  })
})

const summary = computed(() => statusSummary(mirrors.value))

/** Categories actually present, so the chips never offer an empty filter. */
const categories = computed(() => {
  const seen = new Map<string, number>()
  for (const mirror of mirrors.value) {
    seen.set(mirror.type, (seen.get(mirror.type) ?? 0) + 1)
  }
  // Most common category first: that is the one users filter by.
  return [...seen.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
})

const hasMirrors = computed(() => mirrors.value.length > 0)
const hasResults = computed(() => filtered.value.length > 0)

function toggleExpanded(key: string) {
  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter((item) => item !== key)
    : [...expanded.value, key]
}

/** Copy a mirror's public URL, with a toast for feedback. */
const toast = useToast()

async function copyMirror(mirror: Mirror) {
  const url = `${window.location.origin}/${mirror.key}/`

  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('mirror.copied'), url)
  } catch {
    // Clipboard API needs a secure context; tell the user instead of failing
    // silently.
    toast.error(t('mirror.copyFailed'), url)
  }
}

const lastUpdated = computed(() =>
  fetchedAt.value ? formatDateTime(fetchedAt.value / 1000, locale.value) : '',
)

const refreshSeconds = computed(() => Math.round(Number(config.public.refreshInterval) / 1000))

useSeoMeta({
  title: () => t('site.name'),
  description: () => t('site.description'),
  ogTitle: () => t('site.name'),
  ogDescription: () => t('site.description'),
  ogType: 'website',
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div
        class="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-brand-950 dark:via-slate-950 dark:to-slate-900"
        aria-hidden="true"
      />
      <div
        class="absolute -top-24 -right-24 size-72 rounded-full bg-accent-400/20 blur-3xl dark:bg-accent-500/10"
        aria-hidden="true"
      />

      <div class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div class="flex flex-wrap items-center gap-2">
          <span class="chip bg-white/70 text-slate-600 ring-1 ring-slate-500/15 dark:bg-slate-800/70 dark:text-slate-300 dark:ring-slate-600/40">
            <Icon name="lucide:zap" class="size-3.5" aria-hidden="true" />
            {{ t('site.tagline') }}
          </span>
        </div>

        <h1 class="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          {{ t('home.title') }}
        </h1>

        <div class="mt-6 max-w-2xl">
          <MirrorSearch v-model="query" :result-count="filtered.length" />
        </div>

        <!--
          Always rendered, even before the list arrives: this row is part of the
          hero's height, and letting it appear a frame later made the whole page
          jump as soon as the (fast) response landed. `loading` swaps the
          counters for same-sized placeholders instead of removing the row.
        -->
        <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <StatusSummary :summary="summary" :total="mirrors.length" :loading="pending" />

          <span class="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-700" aria-hidden="true" />

          <ClientOnly>
            <div v-if="!pending" class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Icon
                name="lucide:refresh-cw"
                class="size-3.5"
                :class="refreshInFlight ? 'animate-spin' : ''"
                aria-hidden="true"
              />
              <span v-if="lastUpdated">{{ t('home.updatedAt', { time: lastUpdated }) }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ t('home.autoRefresh', { seconds: refreshSeconds }) }}</span>

              <button
                type="button"
                class="ml-1 rounded-md px-1.5 py-0.5 font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                @click="reload"
              >
                {{ t('home.refreshNow') }}
              </button>
            </div>

            <!--
              Same line height as the block above (text-xs + size-3.5 icon), so
              the row does not grow when the fetch completes.
            -->
            <div
              v-else
              class="flex h-5 items-center gap-2"
              aria-hidden="true"
            >
              <span class="size-3.5 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <span class="h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            <template #fallback>
              <span class="inline-flex h-5 items-center text-xs text-transparent" aria-hidden="true">
                {{ t('state.loading') }}
              </span>
            </template>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- Category filter -->
    <section class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center gap-2">
        <span class="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {{ t('home.filterByType') }}
        </span>

        <button
          type="button"
          class="chip transition-colors"
          :class="
            activeType === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          "
          @click="activeType = 'all'"
        >
          {{ t('home.filterAll') }}
          <span class="tabular-nums opacity-70">{{ mirrors.length }}</span>
        </button>

        <button
          v-for="[type, count] in categories"
          :key="type"
          type="button"
          class="chip transition-colors"
          :class="
            activeType === type
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          "
          @click="activeType = type"
        >
          {{ t(`type.${type}`) }}
          <span class="tabular-nums opacity-70">{{ count }}</span>
        </button>
      </div>
    </section>

    <!-- Mirror list -->
    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="card overflow-hidden">
        <!--
          Every state below depends on data that only exists in the browser, so
          the whole block is client-only with the table skeleton as its server
          fallback. Rendering a data-dependent branch during SSR is what causes
          hydration mismatches: the server and the client would disagree about
          whether the list is still loading.
        -->
        <ClientOnly>
          <StateMessage
            v-if="error && !hasMirrors"
            icon="lucide:wifi-off"
            tone="danger"
            :title="t('state.error')"
            :description="t('state.errorHint')"
            retryable
            :action-label="t('state.retry')"
            @retry="reload"
          />

          <StateMessage
            v-else-if="!hasMirrors"
            icon="lucide:package-open"
            :title="t('state.empty')"
            :description="t('state.emptyHint')"
          />

          <StateMessage
            v-else-if="!hasResults"
            icon="lucide:search-x"
            :title="t('home.searchEmpty', { query })"
          >
            <button type="button" class="btn-ghost mt-1" @click="query = ''">
              <Icon name="lucide:x" class="size-4" aria-hidden="true" />
              {{ t('home.clearSearch') }}
            </button>
          </StateMessage>

          <template v-else>
            <!--
              Table on wide screens, cards on phones. Both are rendered so the
              layout never shifts after hydration, but the hidden one is removed
              from the accessibility tree: otherwise a screen reader would read
              every mirror twice.
            -->
            <div class="hidden md:block" :aria-hidden="!isWide || undefined">
              <MirrorTable
                :mirrors="filtered"
                :expanded="expanded"
                @toggle="toggleExpanded"
                @copy="copyMirror"
              />
            </div>

            <div class="grid gap-3 p-4 md:hidden" :aria-hidden="isWide || undefined">
              <MirrorCard
                v-for="mirror in filtered"
                :key="mirror.id"
                :mirror="mirror"
                @copy="copyMirror"
              />
            </div>
          </template>

          <template #fallback>
            <MirrorTableSkeleton :rows="8" />
          </template>
        </ClientOnly>
      </div>

      <p
        v-if="hasMirrors"
        class="mt-3 text-center text-xs text-slate-500 dark:text-slate-400"
      >
        {{ t('home.showingCount', { shown: filtered.length, total: mirrors.length }) }}
      </p>
    </section>
  </div>
</template>
