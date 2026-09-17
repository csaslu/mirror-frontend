<script setup lang="ts">
import { locales } from '~~/i18n/locales'

/**
 * Language switcher.
 *
 * One entry per language comes straight from `i18n/locales.ts`, so adding a
 * language needs no change here. A native <select> is used on purpose: it is
 * keyboard and screen-reader friendly for free, works on touch devices without
 * a popover implementation, and never renders a dead single-button toggle.
 */
const { locale, setLocale, t } = useI18n()

const switchLocalePath = useSwitchLocalePath()

/** Nothing to switch between: hide the control entirely. */
const hasChoice = computed(() => locales.length > 1)

const current = computed(() => locales.find((item) => item.code === locale.value) ?? locales[0]!)

async function onChange(event: Event) {
  const code = (event.target as HTMLSelectElement).value
  if (code === locale.value) return

  // setLocale persists the cookie; the locale-prefixed route is produced by the
  // module, so the user stays on the same page in the new language.
  await setLocale(code)
  await navigateTo(switchLocalePath(code))
}
</script>

<template>
  <label v-if="hasChoice" class="relative inline-flex items-center">
    <span class="sr-only">{{ t('settings.languageSwitch') }}</span>

    <Icon
      name="lucide:languages"
      class="pointer-events-none absolute left-2.5 size-4 text-slate-500 dark:text-slate-400"
      aria-hidden="true"
    />

    <select
      class="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white/80 py-0 pr-7 pl-8 text-sm font-medium text-slate-700 transition-colors hover:bg-white focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
      :value="locale"
      :aria-label="t('settings.languageSwitch')"
      @change="onChange"
    >
      <option v-for="item in locales" :key="item.code" :value="item.code">{{ item.name }}</option>
    </select>

    <Icon
      name="lucide:chevron-down"
      class="pointer-events-none absolute right-2 size-4 text-slate-400"
      aria-hidden="true"
    />
  </label>

  <!-- Single-language build: show which language is active, without a control. -->
  <span v-else class="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
    {{ current.short }}
  </span>
</template>
