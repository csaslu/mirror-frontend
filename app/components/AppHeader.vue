<script setup lang="ts">
/**
 * Sticky site header: brand, navigation, language and theme controls.
 *
 * Navigation entries are declared here; a link that is not part of this build
 * simply has no `to`, so no dead links are ever rendered.
 */
const { t, locale } = useI18n()
const localePath = useLocalePath()

const config = useRuntimeConfig()

/**
 * Site name comes from the translation files, with the runtime-configured name
 * as a fallback so a deployment can rename the site without a rebuild.
 */
const siteName = computed(() => {
  const name = t('site.name')
  return name === 'site.name' ? String(config.public.siteName) : name
})

const navItems = computed(() => [{ label: t('nav.mirrors'), to: localePath('/'), current: true }])
</script>

<template>
  <header class="surface-blur sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800">
    <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
      <NuxtLink :to="localePath('/')" class="flex min-w-0 items-center gap-2 sm:gap-3">
        <!--
          The association's logo, stored locally in public/logo-mark.svg (the
          cropped variant, so the mark fills its box rather than floating in the
          source artwork's padding).
          Alt is empty on purpose: the site name beside it is the accessible
          label, and a "logo" announcement on top of that helps nobody.
        -->
        <img
          src="/logo-mark.svg"
          alt=""
          width="26"
          height="20"
          class="h-7 w-auto shrink-0 sm:h-8"
          decoding="async"
        />

        <!--
          Hidden below the sm breakpoint: on a phone the language and theme
          controls need the width more than the name does, and the logo alone
          still identifies the site.
        -->
        <span
          class="hidden min-w-0 truncate text-base font-semibold text-slate-900 sm:block dark:text-slate-100"
        >
          {{ siteName }}
        </span>
      </NuxtLink>

      <nav class="ml-4 hidden items-center gap-1 md:flex" :aria-label="t('nav.mirrors')">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="
            item.current
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          "
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
