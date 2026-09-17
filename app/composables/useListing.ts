import type { ApiResponse } from '~/types/mirror'
import type { DirectoryEntry, DirectoryListing } from '~/types/directory'

/**
 * Directory listing for one folder of a mirror.
 *
 * The listing is read from the Go API, which fetches the folder through the
 * caching proxy and parses the upstream's HTML into a neutral shape — so this
 * component tree never sees upstream markup.
 *
 * The request is issued here rather than through `useFetch` because the page
 * needs a precise loading state. With `useFetch`, `entries` is an empty array
 * until the response lands, and every render in between looks like an empty
 * directory — which showed up as a flash of "this directory is empty" when
 * opening a folder.
 */
export function useListing(key: Ref<string> | ComputedRef<string>, subPath: Ref<string> | ComputedRef<string>) {
  const config = useRuntimeConfig()

  const apiBase = computed(() => String(config.public.apiBase || '/api/v1').replace(/\/$/, ''))

  /**
   * Listing URL. Built by concatenation rather than interpolation-with-slash so
   * an empty key or path can never produce "//" — that would be read as an empty
   * mirror key and answer 404.
   */
  const url = computed(() => {
    const base = `${apiBase.value}/list/${encodeURIComponent(key.value)}`
    const clean = subPath.value.replace(/^\/+|\/+$/g, '')

    return `${base}${clean ? `/${clean}` : ''}/mirrors.json`
  })

  const listing = ref<DirectoryListing | null>(null)
  const entries = computed<DirectoryEntry[]>(() => listing.value?.entries ?? [])

  /** A request for the current path is in flight. */
  const loading = ref(true)

  /**
   * True when the upstream did not return a listing we can render (a file was
   * requested, listing is disabled, or the format is unknown).
   */
  const unavailable = ref(false)

  /**
   * A response has been received for the current path. Until this is true the
   * page must not claim the directory is empty: an empty list and "we do not
   * know yet" are different states.
   */
  const settled = ref(false)

  /**
   * Guards against a slow response for a previous folder overwriting the
   * current one: only the newest request may write state.
   */
  let requestToken = 0

  async function load() {
    const token = ++requestToken

    // Clear immediately so the breadcrumb, the table and the footer can never
    // show a stale folder next to the new path.
    listing.value = null
    unavailable.value = false
    settled.value = false
    loading.value = true

    const target = url.value

    try {
      const response = await $fetch<ApiResponse<DirectoryListing>>(target)

      if (token !== requestToken) return

      listing.value = response.data
      unavailable.value = false
    } catch {
      if (token !== requestToken) return

      // A 404 means "the upstream gave us no listing here", which the page
      // reports as such rather than as an empty directory. Transport failures
      // land here too, and the same message covers them.
      listing.value = null
      unavailable.value = true
    } finally {
      if (token === requestToken) {
        settled.value = true
        loading.value = false
      }
    }
  }

  /** Reload the current folder (used by the retry button). */
  async function refresh(): Promise<void> {
    await load()
  }

  // Client-only data: the static shell is built without a backend.
  if (import.meta.client) {
    watch(url, () => void load(), { immediate: true })
  }

  return { listing, entries, loading, settled, unavailable, refresh, url }
}

/**
 * Breadcrumb segments for a path inside a mirror.
 *
 * The first crumb is the mirror root, which is also the mirror's overview page.
 */
export interface Crumb {
  label: string
  to: string
}

export function breadcrumbs(key: string, subPath: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: key, to: `/mirror/${key}` }]

  const segments = subPath.split('/').filter(Boolean)

  let accumulated = ''
  for (const segment of segments) {
    accumulated += `/${segment}`
    crumbs.push({ label: segment, to: `/mirror/${key}${accumulated}` })
  }

  return crumbs
}
