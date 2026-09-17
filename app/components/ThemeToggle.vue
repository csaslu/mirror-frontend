<script setup lang="ts">
/**
 * Light / dark / system switch.
 *
 * @nuxtjs/color-mode already keeps the preference in localStorage and applies
 * the `dark` class to <html> before paint, so this component only has to expose
 * the three states.
 */
const { t } = useI18n()
const colorMode = useColorMode()

const options = computed(() => [
  { value: 'light' as const, icon: 'lucide:sun', label: t('settings.themeLight') },
  { value: 'dark' as const, icon: 'lucide:moon', label: t('settings.themeDark') },
  { value: 'system' as const, icon: 'lucide:monitor', label: t('settings.themeSystem') },
])

const currentIcon = computed(() => {
  if (colorMode.preference === 'light') return 'lucide:sun'
  if (colorMode.preference === 'dark') return 'lucide:moon'
  return 'lucide:monitor'
})
</script>

<template>
  <ClientOnly>
    <div
      class="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/80 p-0.5 dark:border-slate-700 dark:bg-slate-900/80"
      role="group"
      :aria-label="t('settings.theme')"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        :class="
          colorMode.preference === option.value
            ? 'bg-brand-600 text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        "
        :title="option.label"
        :aria-pressed="colorMode.preference === option.value"
        @click="colorMode.preference = option.value"
      >
        <Icon :name="option.icon" class="size-4" aria-hidden="true" />
        <span class="sr-only">{{ option.label }}</span>
      </button>
    </div>

    <template #fallback>
      <!-- Keep the layout stable before hydration. -->
      <div
        class="h-8 w-[70px] animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
      />
    </template>
  </ClientOnly>
</template>
