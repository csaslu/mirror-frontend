<script setup lang="ts">
import { findLocale } from '~~/i18n/locales'

/**
 * Shell for every page: language attributes, header, footer and the skip link.
 * Layout lives here rather than in a separate `layouts/` file because the site
 * has a single chrome.
 */
const { t, locale } = useI18n()

const currentLocale = computed(() => findLocale(locale.value))

useHead({
  htmlAttrs: {
    // Drives hyphenation, font selection and screen-reader pronunciation.
    lang: computed(() => currentLocale.value.language),
    dir: computed(() => currentLocale.value.dir),
  },
  titleTemplate: (title) => (title ? `${title} · ${t('site.shortName')}` : t('site.name')),
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
    >
      {{ t('a11y.skipToContent') }}
    </a>

    <AppHeader />

    <main id="main" class="flex-1">
      <NuxtPage />
    </main>

    <AppFooter />

    <Toaster />
  </div>
</template>
