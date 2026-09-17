<script setup lang="ts">
/**
 * Placeholder rows shown while the mirror list loads. Rendering a real table
 * shape (rather than a spinner) keeps the page from jumping when data lands.
 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 6 })
</script>

<template>
  <div class="overflow-hidden" aria-hidden="true">
    <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <div class="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
    </div>

    <div
      v-for="row in rows"
      :key="row"
      class="flex items-center gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-800/70"
    >
      <div class="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div class="hidden h-4 flex-1 animate-pulse rounded bg-slate-100 lg:block dark:bg-slate-800/70" />
      <div class="h-5 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800/70" />
      <div class="h-4 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" />
      <div class="hidden h-4 w-20 animate-pulse rounded bg-slate-100 sm:block dark:bg-slate-800/70" />
      <div class="h-5 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800/70" />
    </div>
  </div>
</template>
