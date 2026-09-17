<script setup lang="ts">
/**
 * Search box for the mirror list.
 *
 * Pressing "/" focuses it, which is the shortcut mirror users already know from
 * TUNA and XJTU. The value is owned by the parent so filtering stays there.
 */
const props = defineProps<{
  modelValue: string
  placeholder?: string
  /** Number of results, announced to screen readers as the user types. */
  resultCount?: number
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()

const input = ref<HTMLInputElement | null>(null)

const value = computed({
  get: () => props.modelValue,
  set: (next: string) => emit('update:modelValue', next),
})

function onKeydown(event: KeyboardEvent) {
  // "/" focuses the field unless the user is already typing somewhere.
  const target = event.target as HTMLElement | null
  const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

  if (event.key === '/' && !typing) {
    event.preventDefault()
    input.value?.focus()
    return
  }

  if (event.key === 'Escape' && document.activeElement === input.value) {
    value.value = ''
    input.value?.blur()
  }
}
</script>

<template>
  <div class="relative">
    <Icon
      name="lucide:search"
      class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    />

    <input
      ref="input"
      v-model="value"
      type="search"
      class="field h-12 rounded-2xl pr-24 pl-12 text-base shadow-sm"
      :placeholder="placeholder ?? t('home.searchPlaceholder')"
      :aria-label="t('home.searchPlaceholder')"
      autocomplete="off"
      spellcheck="false"
      @keydown="onKeydown"
    />

    <div class="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
      <span
        v-if="value && resultCount !== undefined"
        class="text-xs text-slate-500 dark:text-slate-400"
        aria-live="polite"
      >
        {{ resultCount }}
      </span>

      <button
        v-if="value"
        type="button"
        class="icon-btn size-8"
        :title="t('home.clearSearch')"
        @click="value = ''"
      >
        <Icon name="lucide:x" class="size-4" aria-hidden="true" />
        <span class="sr-only">{{ t('home.clearSearch') }}</span>
      </button>

      <kbd
        v-else
        class="hidden rounded border border-slate-200 px-1.5 py-0.5 font-mono text-xs text-slate-400 sm:inline-block dark:border-slate-700 dark:text-slate-500"
      >
        {{ t('home.searchHint') }}
      </kbd>
    </div>
  </div>
</template>
