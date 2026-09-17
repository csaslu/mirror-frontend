import tailwindcss from '@tailwindcss/vite'
import { locales } from './i18n/locales'

// Nuxt configuration for the Lida Mirror frontend.
//
// Deployment model (see ../docs/plan-mirror-serving.md):
//   * `pnpm generate` writes a fully static site to `web/`, which the Go
//     backend serves read-only at "/" (mirror directories and /api stay on the
//     backend).
//   * The mirror list is fetched from the Go API at runtime, so production
//     needs no Node process: any static host works.
//
// Adding a language: add its metadata to `i18n/locales.ts` and create the
// matching JSON file. Nothing else — the switcher, the <link rel=alternate>
// tags and the prerender list all read from that one array.

const defaultLocale = 'zh-CN'

/**
 * Every icon this site can render, including the ones chosen at runtime by a
 * computed name (status chips, category chips, theme toggle). Bundling them
 * keeps `@nuxt/icon` from reaching for the public Iconify API in the browser.
 */
const bundledIcons = [
  // Layout and controls.
  'lucide:arrow-left',
  'lucide:chevron-down',
  'lucide:chevron-down',
  'lucide:chevron-right',
  'lucide:chevron-up',
  'lucide:chevrons-up-down',
  'lucide:corner-left-up',
  'lucide:copy',
  'lucide:download',
  'lucide:external-link',
  'lucide:file',
  'lucide:file-question',
  'lucide:folder',
  'lucide:folder-open',
  'lucide:info',
  'lucide:languages',
  'lucide:link',
  'lucide:monitor',
  'lucide:moon',
  'lucide:refresh-cw',
  'lucide:search',
  'lucide:search-x',
  'lucide:server',
  'lucide:sun',
  'lucide:x',
  // Status chips.
  'lucide:alert-circle',
  'lucide:check',
  'lucide:check-circle-2',
  'lucide:help-circle',
  'lucide:loader-circle',
  'lucide:minus',
  'lucide:pause',
  'lucide:pause-circle',
  // Category chips.
  'lucide:circle-dot',
  'lucide:cloud',
  'lucide:globe',
  'lucide:hard-drive',
  'lucide:lock',
  'lucide:shuffle',
  // Empty and error states.
  'lucide:graduation-cap',
  'lucide:package-open',
  'lucide:wifi-off',
  'lucide:zap',
]

// The API the site talks to. Nitro's dev proxy forwards /api to the Go backend,
// so development and production use the exact same relative URL.
//
// Override at build time:
//   NUXT_PUBLIC_API_BASE=https://mirror.example.edu/api/v1 pnpm generate
const apiBase = process.env.NUXT_PUBLIC_API_BASE || '/api/v1'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  ssr: true,

  modules: ['@nuxtjs/i18n', '@nuxtjs/color-mode', '@nuxt/icon'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#1B69CD' },
      ],
      link: [
        // The association logo, stored locally (public/logo.svg): the site must
        // not depend on a remote asset, and a campus network may have no route
        // to it at all.
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'apple-touch-icon', href: '/logo.svg' },
      ],
    },
  },

  i18n: {
    restructureDir: 'i18n',    defaultLocale,
    // Default language has no prefix (/), every other one does (/en/...).
    strategy: 'prefix_except_default',
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || undefined,
    locales,
    bundle: { optimizeTranslationDirective: false },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'lida_mirror_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: defaultLocale,
    },
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'lida_mirror_color_mode',
  },

  icon: {
    // Icons must never be fetched at runtime: a campus mirror has to work on a
    // network without access to api.iconify.design.
    //
    // `fallbackToApi: false` makes a missing icon a build-time failure instead
    // of a silent network request, `sizeLimitKb: 0` stops the size guard from
    // dropping icons, and the explicit list below covers every icon that is
    // referenced through a computed name (the scanner cannot see those).
    provider: 'server',
    fallbackToApi: false,
    serverBundle: 'local',
    clientBundle: {
      icons: bundledIcons,
      scan: true,
      sizeLimitKb: 0,
    },
  },

  runtimeConfig: {
    public: {
      apiBase,
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'Lida Mirror',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://mirror.example.edu',
      // How often the client re-fetches mirror status, in milliseconds.
      refreshInterval: Number(process.env.NUXT_PUBLIC_REFRESH_INTERVAL || 60_000),
    },
  },

  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      // A build without a reachable backend still succeeds: the list renders
      // from the API at runtime and the empty state takes over.
      failOnError: false,
      // The default language has no prefix (prefix_except_default), so only the
      // non-default ones need an explicit route; the crawler finds "/".
      routes: ['/', ...locales.filter((locale) => locale.code !== defaultLocale).map((locale) => `/${locale.code}`)],
    },
  },

  // The static output goes to the standard `.output/public`. Deployment copies
  // that directory into the Go backend's `web.dir` — see docs/README.md.
  generate: { dir: process.env.NUXT_PUBLIC_OUTPUT_DIR || undefined },

  typescript: { strict: true },

  devtools: { enabled: true },
})
