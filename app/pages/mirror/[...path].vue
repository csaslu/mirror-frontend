<script setup lang="ts">
import { breadcrumbs } from '~/composables/useListing'

/**
 * Mirror directory browser: /mirror/{key}/{...path}
 *
 * The page is ours (Nuxt template and styling); the contents come from
 * /api/v1/list/{key}/{path}/mirrors.json, which reads the folder through the
 * caching proxy and parses the upstream's listing. Opening a directory stays in
 * this browser, while files link to "/{key}/…" so they download through the
 * proxy with cache rules applied.
 */
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

/**
 * The route is a single catch-all (mirror/[...path].vue), so both the mirror key
 * and the directory inside it come from that one parameter.
 *
 * Deriving them from the resolved path as well as from the parameter keeps the
 * first client render correct: reading only `route.params.path` was empty during
 * setup, which produced a "/list//..." request that the API (correctly) answered
 * with 404.
 */
const segments = computed(() => {
  const raw = route.params.path
  const fromParam = (Array.isArray(raw) ? raw : [raw])
    .flatMap((segment) => String(segment ?? '').split('/'))
    .filter(Boolean)

  if (fromParam.length > 0) {
    return fromParam
  }

  // Fall back to the URL itself, dropping the locale prefix and "/mirror".
  const path = route.path.replace(/^\/[a-z]{2}(-[A-Za-z]{2})?\//, '/')

  return path.split('/').filter(Boolean).slice(1)
})

const key = computed(() => segments.value[0] ?? '')
const subPath = computed(() => segments.value.slice(1).join('/'))

const { listing, entries, loading, settled, unavailable, refresh } = useListing(key, subPath)

/** Mirror metadata (status, size, description) for the header strip. */
const { mirrors } = useMirrors()
const mirror = computed(() => mirrors.value.find((item) => item.key === key.value))

const crumbs = computed(() => breadcrumbs(key.value, subPath.value))

const displayPath = computed(() => listing.value?.display_path ?? `/${key.value}${subPath.value ? `/${subPath.value}` : ''}`)

const fetchedAt = computed(() =>
  listing.value?.fetched_at ? formatDateTime(listing.value.fetched_at, locale.value) : '',
)

const toast = useToast()

async function copyCurrentLink() {
  const url = window.location.href

  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('browser.copied'), url)
  } catch {
    toast.error(t('mirror.copyFailed'), url)
  }
}

useSeoMeta({
  title: () => `${displayPath.value} · ${t('browser.title')}`,
  description: () => t('site.description'),
  // Directory listings are redundant with the mirror list for search engines,
  // and can be huge; keep them out of the index.
  robots: 'noindex, follow',
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <NuxtLink
      :to="localePath('/')"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
    >
      <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
      {{ t('browser.backToList') }}
    </NuxtLink>

    <!-- Title row: mirror name, status, and the current path -->
    <header class="mt-5 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {{ key }}
          </h1>
          <MirrorStatus v-if="mirror" :status="mirror.status" size="sm" />
          <MirrorTypeChip v-if="mirror" :type="mirror.type" />
        </div>

        <p v-if="mirror?.comment" class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {{ mirror.comment }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button type="button" class="btn-ghost border border-slate-200 dark:border-slate-700" @click="copyCurrentLink">
          <Icon name="lucide:link" class="size-4" aria-hidden="true" />
          {{ t('browser.copyLink') }}
        </button>

        <a
          v-if="listing?.source"
          :href="listing.source"
          class="btn-ghost border border-slate-200 dark:border-slate-700"
          target="_blank"
          rel="noopener"
        >
          <Icon name="lucide:external-link" class="size-4" aria-hidden="true" />
          {{ t('browser.upstream') }}
        </a>
      </div>
    </header>

    <!-- Breadcrumbs -->
    <nav class="mt-5 flex flex-wrap items-center gap-1 text-sm" :aria-label="t('browser.title')">
      <template v-for="(crumb, index) in crumbs" :key="crumb.to">
        <Icon
          v-if="index > 0"
          name="lucide:chevron-right"
          class="size-3.5 text-slate-400"
          aria-hidden="true"
        />
        <NuxtLink
          :to="localePath(crumb.to)"
          class="rounded-md px-2 py-1 font-mono transition-colors"
          :class="
            index === crumbs.length - 1
              ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          "
        >
          {{ crumb.label }}
        </NuxtLink>
      </template>
    </nav>

    <!-- Listing -->
    <div class="card mt-5 overflow-hidden">
      <!--
        The listing is fetched in the browser only (the static shell is built
        without a backend), so every state below depends on data that does not
        exist during rendering. The whole block is therefore client-only, with
        the skeleton as its fallback: rendering a data-dependent branch on the
        server would make the server and client disagree during hydration —
        which showed up as "rendered on server: empty directory, expected on
        client: skeleton" before the block was wrapped.
      -->
      <ClientOnly>
        <!--
          Loading comes first on purpose. `entries` is empty until the response
          lands, so testing "no entries" before "still loading" made every
          folder navigation flash "this directory is empty" for a frame.
        -->
        <MirrorTableSkeleton v-if="loading" :rows="8" />

        <!-- Upstream gave us something we cannot render as a directory -->
        <StateMessage
          v-else-if="unavailable"
          icon="lucide:file-question"
          :title="t('browser.unavailableTitle')"
          :description="t('browser.unavailableHint')"
          retryable
          :action-label="t('state.retry')"
          @retry="refresh"
        >
          <div class="mt-2 flex flex-wrap items-center justify-center gap-2">
            <a
              :href="`/${key}${subPath ? `/${subPath}` : '/'}`"
              class="btn-primary"
              target="_blank"
              rel="noopener"
            >
              <Icon name="lucide:external-link" class="size-4" aria-hidden="true" />
              {{ t('browser.upstream') }}
            </a>
            <NuxtLink :to="localePath(`/mirror/${key}`)" class="btn-ghost border border-slate-200 dark:border-slate-700">
              {{ t('browser.root') }}
            </NuxtLink>
          </div>
        </StateMessage>

        <!--
          Empty directory: only claimable once a response has actually arrived
          (`settled`), never while a request is in flight.
        -->
        <StateMessage
          v-else-if="settled && !entries.length"
          icon="lucide:folder-open"
          :title="t('browser.empty')"
          :description="displayPath"
        />

        <!-- Contents -->
        <template v-else-if="entries.length">
          <!-- Parent row sits above the table, like an upstream listing. -->
          <NuxtLink
            v-if="listing?.parent_path"
            :to="localePath(listing.parent_path.replace(/^\//, '/mirror/'))"
            class="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800/40"
          >
            <Icon name="lucide:corner-left-up" class="size-4 text-slate-400" aria-hidden="true" />
            {{ t('browser.parent') }}
          </NuxtLink>

          <DirectoryTable :entries="entries" :path="displayPath" />
        </template>

        <!-- Nothing to show yet: exactly as reassuring as the skeleton above. -->
        <MirrorTableSkeleton v-else :rows="8" />

        <template #fallback>
          <MirrorTableSkeleton :rows="8" />
        </template>
      </ClientOnly>
    </div>

    <ClientOnly>
      <!-- Footer strip: how this page was produced -->
      <p
        v-if="listing"
        class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
      >
        <span class="inline-flex items-center gap-1">
          <Icon name="lucide:server" class="size-3.5" aria-hidden="true" />
          <span class="font-mono">{{ listing.parser }}</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>{{ t('browser.fetchedAt', { time: fetchedAt }) }}</span>
        <template v-if="mirror?.status === 'syncing'">
          <span aria-hidden="true">·</span>
          <span class="text-sky-600 dark:text-sky-400">{{ t('browser.syncingHint') }}</span>
        </template>
      </p>
    </ClientOnly>
  </div>
</template>
