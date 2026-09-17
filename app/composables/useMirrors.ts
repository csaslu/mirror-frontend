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

  return {
    mirrors,
    fetchedAt,
    refreshInFlight,
    error,
    /**
     * True until a list is available to render.
     *
     * Not simply `status === 'pending'`: on the very first client render the
     * status is still 'idle', and treating that as "loaded" renders the counts
     * before the data exists — which is what made the hero jump when a fast
     * response landed. A background refresh does not set this, because the
     * previous list is still on screen.
     */
    pending: computed(() => status.value === 'pending' || data.value === undefined),
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
