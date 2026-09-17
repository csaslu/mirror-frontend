<script setup lang="ts">
/**
 * Full-card message for the loading, error, empty and no-search-results states.
 * One component keeps all four looking identical.
 */
const props = withDefaults(
  defineProps<{
    icon: string
    title: string
    description?: string
    tone?: 'neutral' | 'danger'
    /** Renders a retry button that emits `retry`. */
    retryable?: boolean
    actionLabel?: string
  }>(),
  { tone: 'neutral', retryable: false },
)

const emit = defineEmits<{ (event: 'retry'): void }>()

const iconClass = computed(() =>
  props.tone === 'danger'
    ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
)
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
    <div class="flex size-12 items-center justify-center rounded-full" :class="iconClass">
      <Icon :name="icon" class="size-6" aria-hidden="true" />
    </div>

    <div>
      <p class="font-semibold text-slate-800 dark:text-slate-100">{{ title }}</p>
      <p v-if="description" class="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {{ description }}
      </p>
    </div>

    <button v-if="retryable" type="button" class="btn-ghost mt-1" @click="emit('retry')">
      <Icon name="lucide:refresh-cw" class="size-4" aria-hidden="true" />
      {{ actionLabel }}
    </button>

    <slot />
  </div>
</template>
