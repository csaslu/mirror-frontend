<script setup lang="ts">
import type { Mirror } from '~/types/mirror'

/**
 * Card rendering of one mirror, used on narrow screens where a wide table
 * would force horizontal scrolling.
 */
const props = defineProps<{ mirror: Mirror }>()

const emit = defineEmits<{ (event: 'copy', mirror: Mirror): void }>()

const { t, locale } = useI18n()
</script>

<template>
  <article class="card p-4">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <NuxtLink
          :to="`/mirror/${mirror.key}`"
          class="font-mono text-base font-semibold text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
        >
          {{ mirror.key }}
        </NuxtLink>
        <p v-if="mirror.comment" class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {{ mirror.comment }}
        </p>
      </div>

      <MirrorStatus :status="mirror.status" size="sm" />
    </header>

    <dl class="mt-3 grid grid-cols-2 gap-3 text-xs">
      <div>
        <dt class="text-slate-500 dark:text-slate-400">{{ t('table.category') }}</dt>
        <dd class="mt-1">
          <MirrorTypeChip :type="mirror.type" />
        </dd>
      </div>

      <div>
        <dt class="text-slate-500 dark:text-slate-400">{{ t('table.size') }}</dt>
        <dd class="mt-1 font-mono text-slate-800 dark:text-slate-200">
          {{ mirror.size === null ? t('mirror.sizeUnknown') : formatBytes(mirror.size, locale) }}
        </dd>
      </div>

      <div class="col-span-2">
        <dt class="text-slate-500 dark:text-slate-400">{{ t('table.lastSync') }}</dt>
        <dd class="mt-1 text-slate-800 dark:text-slate-200">
          <ClientOnly>
            <span :title="mirror.last_update ? formatDateTime(mirror.last_update, locale) : undefined">
              {{
                mirror.last_update
                  ? formatRelativeTime(mirror.last_update, locale)
                  : t('mirror.syncUnknown')
              }}
            </span>            <template #fallback>
              <span>{{
                mirror.last_update ? formatDateTime(mirror.last_update, locale) : t('mirror.syncUnknown')
              }}</span>
            </template>
          </ClientOnly>
        </dd>
      </div>
    </dl>

    <footer class="mt-4 flex items-center gap-2">
      <NuxtLink :to="`/mirror/${mirror.key}`" class="btn-ghost flex-1 border border-slate-200 dark:border-slate-700">
        <Icon name="lucide:folder-open" class="size-4" aria-hidden="true" />
        {{ t('mirror.browse') }}
      </NuxtLink>

      <button
        type="button"
        class="icon-btn border border-slate-200 dark:border-slate-700"
        :title="t('mirror.copyUrl')"
        @click="emit('copy', mirror)"
      >
        <Icon name="lucide:link" class="size-4" aria-hidden="true" />
        <span class="sr-only">{{ t('mirror.copyUrl') }}</span>
      </button>
    </footer>
  </article>
</template>
