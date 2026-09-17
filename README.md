# mirror-frontend

[English](./README.md) · [简体中文](./README.zh-CN.md)

Frontend of Lida Mirror (the Shanghai Lida University open source mirror)

## Stack

[Nuxt 4](https://nuxt.com/) (SSG, `nitro.preset: static`) · Vue 3 · Tailwind CSS v4 ·
[@nuxtjs/i18n](https://i18n.nuxtjs.org/) · [@nuxt/icon](https://github.com/nuxt/icon)

## Quick start

```bash
pnpm install

# Development: HMR preview, API pointed at the local Go backend
NUXT_PUBLIC_API_BASE=http://127.0.0.1:18000/api/v1 pnpm dev --host 127.0.0.1
#   → http://127.0.0.1:3000

# Build the static site
pnpm generate

# Hand it to the backend (whose config.yaml web.dir points at this directory)
rm -rf ../mirror-backend/web && cp -R .output/public ../mirror-backend/web
```

In development the frontend runs on 3000 and the backend on 18000, which makes
the API call **cross-origin**: the backend has to allow that origin. It is
already configured in `config_debug.yaml` (`mirror.cors_allow_origins`). A
same-origin deployment (the backend serving both this frontend and `/api`) needs
no CORS configuration at all — it is off by default.

`pnpm dev` supports hot module replacement: edits under `.vue` files and
`app/` take effect immediately. Two exceptions:

- **Editing `i18n/locales/*.json` requires a page reload** (translation files are
  lazy-loaded and do not take part in HMR).
- **Editing `nuxt.config.ts` restarts the dev server.**

## Layout

```
app/
  app.vue                   Page shell: header / main / footer / toast / skip link
  assets/css/main.css       Tailwind v4 theme (brand colours, dark variant, component classes)
  components/
    AppHeader.vue           Header: brand, navigation, language and theme controls
    AppFooter.vue           Footer: support, operating organisation, source link, logo
    LocaleSwitcher.vue      Language switcher (data-driven, see below)
    ThemeToggle.vue         Light / dark / system
    MirrorTable.vue         Mirror table (wide screens) with inline detail rows
    MirrorCard.vue          Mirror cards (phones)
    MirrorDetail.vue        Detail panel inside an expanded row
    MirrorStatus.vue        Sync-status badge (with a fallback for unknown status)
    MirrorTypeChip.vue      Category badge (reverse_proxy / rsync / …)
    MirrorSearch.vue        Search field (focused with `/`)
    StatusSummary.vue       Status counters above the table
    StateMessage.vue        One presentation for loading / error / empty / no results
    DirectoryTable.vue      Directory table (sorting, icons, download/copy)
    MirrorTableSkeleton.vue Loading skeleton
    Toaster.vue             Toasts (link copied, …)
  composables/
    useMirrors.ts           List data + polling refresh
    useListing.ts           Directory listing data + breadcrumbs
    useToast.ts             Toast state
    useMediaQuery.ts        Breakpoint state (table/card accessibility handoff)
  pages/
    index.vue               Mirror list homepage
    mirror/[...path].vue    Directory browser: /mirror/{key}/{...path}
  types/mirror.ts           API types (mirrors the Go structs)
  types/directory.ts        Directory listing types
  utils/format.ts           Locale-aware byte, number and time formatting
  utils/status.ts           Status → tone / icon / sort key
i18n/
  locales.ts                Language list (the single source of truth)
  locales/zh-CN.json        Simplified Chinese
  locales/en.json           English
public/                     logo.svg, logo-mark.svg, robots.txt
nuxt.config.ts              Build, i18n, icons, runtime config
```

## Data flow

The page is static HTML and the data is fetched in the browser, so **adding a
mirror or a status change never requires rebuilding the frontend**:

```
pages/index.vue
   └─ useMirrors()  ──GET /api/v1/mirrors.json──▶  Go backend (Redis snapshot)
        └─ polls every NUXT_PUBLIC_REFRESH_INTERVAL ms (only while the tab is visible)
```

The directory browser reads `/api/v1/list/{key}/{path}/mirrors.json`: the backend
fetches the folder through the caching proxy and parses it into a neutral shape,
so the frontend **never sees upstream HTML** and needs no per-site adaptation.
Inside the browser, clicking a directory stays on `/mirror/...` (our UI) while
clicking a file goes to `/{key}/...` (downloaded through the proxy).

## Adding a language

1. Copy `i18n/locales/zh-CN.json` to `i18n/locales/<code>.json` and translate it;
2. Append one entry to the `locales` array in `i18n/locales.ts`
   (`code` / `language` / `file` / `name` / `short` / `dir`).

The language switcher, the prerender routes and the `hreflang` tags pick the new
language up automatically — no component changes, and no hard-coded two-language
toggle.

## How status and categories are presented

- Upstream status vocabularies differ (TUNA uses
  `success/failed/syncing/paused`), so the frontend renders them through the
  `status.*` translation keys. **An unknown value is shown as "unknown"** rather
  than leaking an English token into a Chinese page; the raw token is only shown
  in the tooltip, to help debugging.
- Categories are rendered from the database's `mirror_type` enum. A new enum
  value falls back to a neutral style and its raw label instead of breaking the
  render because a translation is missing.

## Environment variables

| Variable                       | Default                       | Meaning                                        |
| ------------------------------ | ----------------------------- | ---------------------------------------------- |
| `NUXT_PUBLIC_API_BASE`         | `/api/v1`                     | API prefix or a full URL                       |
| `NUXT_PUBLIC_SITE_NAME`        | `Lida Mirror`                 | Site name (fallback when i18n is missing)      |
| `NUXT_PUBLIC_SITE_URL`         | `https://mirror.example.edu`  | Site URL, used by i18n `baseUrl`               |
| `NUXT_PUBLIC_REFRESH_INTERVAL` | `60000`                       | Status poll interval, in milliseconds          |
| `NUXT_PUBLIC_OUTPUT_DIR`       | `.output/public`              | Overrides the build output directory           |

## Licence

See [LICENSE](./LICENSE).
