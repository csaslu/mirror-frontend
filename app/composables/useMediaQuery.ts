/**
 * Reactive media query.
 *
 * Used to keep the table (wide screens) and the card list (phones) from both
 * being announced by screen readers. Both stay in the DOM so the layout never
 * shifts after hydration, but only the visible one is exposed to assistive
 * technology — see pages/index.vue.
 */
export function useMediaQuery(query: string) {
  const matches = ref(false)

  let mediaQuery: MediaQueryList | undefined

  function update(event?: MediaQueryListEvent) {
    matches.value = event ? event.matches : (mediaQuery?.matches ?? false)
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(query)
    update()
    mediaQuery.addEventListener('change', update)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', update)
  })

  return matches
}
