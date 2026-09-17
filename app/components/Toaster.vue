<script setup lang="ts">
/**
 * Renders the toast stack from `useToast`. Mounted once in the default layout
 * of the page shell, positioned so it never covers the header controls.
 */
const { toasts, dismiss } = useToast()

const TONE_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  info: 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
} as const

const TONE_ICONS = {
  success: 'lucide:check-circle-2',
  error: 'lucide:alert-circle',
  info: 'lucide:info',
} as const
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-from-class="translate-y-2 opacity-0"
      enter-active-class="transition duration-200"
      leave-to-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-lg"
        :class="TONE_STYLES[toast.tone]"
      >
        <Icon :name="TONE_ICONS[toast.tone]" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />

        <div class="min-w-0">
          <p class="text-sm font-medium">{{ toast.message }}</p>
          <p v-if="toast.detail" class="mt-0.5 truncate font-mono text-xs opacity-75">
            {{ toast.detail }}
          </p>
        </div>

        <button
          type="button"
          class="ml-1 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
          @click="dismiss(toast.id)"
        >
          <Icon name="lucide:x" class="size-3.5" aria-hidden="true" />
          <span class="sr-only">×</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
