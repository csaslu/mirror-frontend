import type { ApiResponse, Mirror } from '~/types/mirror'

/** Cache key shared by every component that needs the mirror list. */
const MIRRORS_KEY = 'mirrors'

/**
 * The mirror list, fetched from the Go API.
 *
 * The page is served as static HTML, so this always runs on the client. The
 * useFetch cache means the list page and the detail page share one request,
 * and the periodic refresh keeps sync status honest without a page reload.
 */
export function useMirrors() {
  const config = useRuntimeConfig()

  const apiBase = computed(() => String(config.public.apiBase || '/api/v1').replace(/\/$/, ''))

  const { data, error, status, refresh } = useFetch<ApiResponse<Mirror[]>>(
    () => `${apiBase.value}/mirrors.json`,
    {
      // One shared request for the list page and the detail page.
      key: MIRRORS_KEY,
      // No payload caching: the endpoint must be re-read on every visit, and
      // the periodic refresh below keeps it current.
      server: false,
    },
  )

  const mirrors = computed<Mirror[]>(() => data.value?.data ?? [])

  /** Timestamp of the last successful fetch, for the "data fetched at" line. */
  const fetchedAt = ref<number | null>(null)
  watch(
    () => data.value,
    (value) => {
      if (value) fetchedAt.value = Date.now()
    },
    { immediate: true },
  )

  const refreshInFlight = ref(false)

  /** Refresh manually, deduplicating concurrent callers. */
  async function reload(): Promise<void> {
    if (refreshInFlight.value) return

    refreshInFlight.value = true
    try {
      await refresh()
      fetchedAt.value = Date.now()
    } finally {
      refreshInFlight.value = false
    }
  }

  /**
   * True before any list has been obtained, including the first client render
   * where the fetch status is still 'idle'.
   *
   * The page must branch on this *before* checking for an empty list: an empty
   * array and "we have not loaded anything yet" are different states, and
   * rendering the latter as "no mirrors configured" is what made the homepage
   * flash that message under a slow connection.
   *
   * A background refresh does not set it, because the previous list is still on
   * screen.
   */
  const loading = computed(() => data.value === undefined)

  return {
    mirrors,
    fetchedAt,
    refreshInFlight,
    error,
    /** No list has arrived yet: render a placeholder, not an empty state. */
    loading,
    /** The request failed and there is nothing to show. */
    unavailable: computed(() => Boolean(error.value) && data.value === undefined),
    /**
     * True while a request is in flight (a background refresh included). Drives
     * the "refreshing" affordance, not the page's main state.
     */
    pending: computed(() => status.value === 'pending'),
    reload,
  }
}

/**
 * Poll the mirror list while the tab is visible.
 *
 * Deliberately client-only: the static shell must not hold a timer during the
 * build, and a background tab has no reason to keep fetching.
 */
export function useMirrorPolling(reload: () => Promise<void> | void, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | undefined

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function start() {
    stop()
    if (intervalMs <= 0) return
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') void reload()
    }, intervalMs)
  }

  onMounted(() => {
    start()
    // Catch up immediately when the user comes back to the tab.
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') void reload()
  }

  return { start, stop }
}
