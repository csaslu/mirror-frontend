<script setup lang="ts">
import type { DirectoryEntry } from '~/types/directory'

/**
 * One mirror directory as a table.
 *
 * Columns follow what the reference mirrors show (name, size, modified) and
 * rows link to our own paths: directories open the browser one level deeper,
 * files download through the caching proxy. Both go to "/{key}/…", never to the
 * upstream.
 */
const props = defineProps<{
  entries: DirectoryEntry[]
  /** Used for the empty-directory hint and the entry count. */
  path?: string
}>()

const { t, locale } = useI18n()

const toast = useToast()

type SortKey = 'name' | 'size' | 'mod_time'
type SortDirection = 'asc' | 'desc'

const sortKey = ref<SortKey>('name')
const sortDirection = ref<SortDirection>('asc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  // Sizes and dates are most useful largest/newest first.
  sortDirection.value = key === 'name' ? 'asc' : 'desc'
}

/**
 * Client-side sorting only: the API already returns directories first in
 * natural order, and re-sorting a few thousand rows is instant. A fetched
 * sort would also have to be cache-aware for no benefit.
 */
const sorted = computed(() => {
  const factor = sortDirection.value === 'asc' ? 1 : -1

  return [...props.entries].sort((a, b) => {
    // Directories always stay above files, whichever column is sorted.
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1
    }

    switch (sortKey.value) {
      case 'size': {
        const aSize = a.size ?? -1
        const bSize = b.size ?? -1
        if (aSize !== bSize) return (aSize - bSize) * factor
        return a.name.localeCompare(b.name, locale.value, { numeric: true })
      }
      case 'mod_time': {
        const aTime = a.mod_time ?? 0
        const bTime = b.mod_time ?? 0
        if (aTime !== bTime) return (aTime - bTime) * factor
        return a.name.localeCompare(b.name, locale.value, { numeric: true })
      }
      default:
        return a.name.localeCompare(b.name, locale.value, { numeric: true, sensitivity: 'base' }) * factor
    }
  })
})

const totalFiles = computed(() => props.entries.filter((entry) => entry.kind === 'file').length)
const totalDirectories = computed(() => props.entries.filter((entry) => entry.kind === 'directory').length)

function iconFor(entry: DirectoryEntry): string {
  return entry.kind === 'directory' ? 'lucide:folder' : 'lucide:file'
}

/** Size cell: the parsed size when we have it, otherwise the upstream's text. */
function sizeText(entry: DirectoryEntry): string {
  if (entry.kind === 'directory') return '—'
  if (entry.size !== null) return formatBytes(entry.size, locale.value)
  if (entry.size_text && entry.size_text !== '-') return entry.size_text
  return '—'
}

function timeText(entry: DirectoryEntry): string {
  if (entry.mod_time) return formatDateTime(entry.mod_time, locale.value)
  if (entry.mod_text && entry.mod_text !== '-') return entry.mod_text
  return '—'
}

const sortIcon = (key: SortKey) =>
  sortKey.value !== key ? 'lucide:chevrons-up-down' : sortDirection.value === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down'

function absoluteUrl(entry: DirectoryEntry): string {
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}${entry.url}`
}

async function copyLink(entry: DirectoryEntry) {
  const url = absoluteUrl(entry)

  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('browser.copied'), url)
  } catch {
    toast.error(t('mirror.copyFailed'), url)
  }
}
</script>

<template>
  <!--
    No horizontal scrolling on purpose. A table with a minimum width wider than
    a phone makes the browser widen the *layout* viewport to fit it, and the page
    then renders at a shrunken zoom level that the visitor can pinch out past the
    screen edge. `table-fixed` gives the columns fixed shares of whatever width
    is available, so there is nothing to overflow; long file names are truncated
    with the full value in the `title`.
  -->
  <div class="w-full min-w-0">
    <table class="w-full table-fixed border-collapse text-sm">
      <caption class="sr-only">{{ t('browser.title') }}</caption>

      <thead>
        <tr
          class="border-b border-slate-200 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400"
        >
          <th scope="col" class="w-auto px-4 py-3">
            <button
              type="button"
              class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
              :title="t('browser.sortHint')"
              @click="toggleSort('name')"
            >
              {{ t('fileTable.name') }}
              <Icon :name="sortIcon('name')" class="size-3.5" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="w-20 px-3 py-3 text-right whitespace-nowrap sm:w-24 sm:px-4">
            <button
              type="button"
              class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
              :title="t('browser.sortHint')"
              @click="toggleSort('size')"
            >
              {{ t('fileTable.size') }}
              <Icon :name="sortIcon('size')" class="size-3.5" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="w-28 px-3 py-3 whitespace-nowrap sm:w-40 sm:px-4">
            <button
              type="button"
              class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
              :title="t('browser.sortHint')"
              @click="toggleSort('mod_time')"
            >
              {{ t('fileTable.modified') }}
              <Icon :name="sortIcon('mod_time')" class="size-3.5" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="w-16 px-2 py-3 text-right sm:w-24 sm:px-4">
            <span class="sr-only">{{ t('table.actions') }}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="entry in sorted" :key="entry.url" class="group border-b border-slate-100 dark:border-slate-800/70">
          <td class="px-3 py-3 sm:px-4">
            <div class="flex min-w-0 items-center gap-2.5">
              <Icon
                :name="iconFor(entry)"
                class="size-4 shrink-0"
                :class="entry.kind === 'directory' ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'"
                aria-hidden="true"
              />

              <!-- Directories and files share the same visible style; only the
                   icon and the trailing slash differ, as on upstream listings. -->
              <!-- `truncate` needs a block-level box for the ellipsis to appear,
                   and the fixed layout gives the cell a width it can truncate to. -->
              <a
                v-if="entry.kind === 'file'"
                :href="entry.url"
                class="min-w-0 flex-1 truncate font-mono text-slate-800 hover:text-brand-600 hover:underline dark:text-slate-200 dark:hover:text-brand-400"
                :title="entry.name"
                download
              >
                {{ entry.name }}
              </a>
              <NuxtLink
                v-else
                :to="entry.url.replace(/^\//, '/mirror/')"
                class="min-w-0 flex-1 truncate font-mono font-medium text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
                :title="entry.name"
              >
                {{ entry.name }}/
              </NuxtLink>
            </div>
          </td>

          <td class="px-3 py-3 text-right font-mono text-xs whitespace-nowrap text-slate-600 tabular-nums sm:px-4 dark:text-slate-400">
            {{ sizeText(entry) }}
          </td>

          <td class="px-3 py-3 font-mono text-xs whitespace-nowrap text-slate-600 sm:px-4 dark:text-slate-400">
            {{ timeText(entry) }}
          </td>

          <td class="px-2 py-3 sm:px-4">
            <div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <a
                v-if="entry.kind === 'file'"
                :href="entry.url"
                class="icon-btn"
                :title="t('browser.openFile')"
                download
              >
                <Icon name="lucide:download" class="size-4" aria-hidden="true" />
                <span class="sr-only">{{ t('browser.openFile') }}</span>
              </a>

              <button
                type="button"
                class="icon-btn"
                :title="t('browser.copyLink')"
                @click="copyLink(entry)"
              >
                <Icon name="lucide:link" class="size-4" aria-hidden="true" />
                <span class="sr-only">{{ t('browser.copyLink') }}</span>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="entries.length" class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
      {{
        t('browser.entries', { count: entries.length })
      }}
      · {{ totalDirectories }} {{ t('browser.directoryCount') }} · {{ totalFiles }} {{ t('browser.fileCount') }}
    </p>
  </div>
</template>
