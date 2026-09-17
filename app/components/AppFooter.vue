<script setup lang="ts">
/**
 * Site footer: who supports the mirror, who runs it, and where the source is.
 *
 * The four paragraphs are intentionally NOT translated. They name a specific
 * Chinese institution, a student association and its supervising college, and
 * the wording is the association's own — so it stays in Chinese on the English
 * page too, rather than being paraphrased per language. Nothing here is
 * localised, so this component does not use i18n at all.
 */

/** The association's source organisation, as published in the copy below. */
const sourceUrl = 'https://github.com/csaslu'
</script>

<template>
  <footer class="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
        <!-- Who supports and runs the mirror -->
        <div class="max-w-3xl space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          <p>
            上海立达学院开源软件镜像由上海立达学院图文信息中心提供支持，由上海立达学院通信与软件协会运行维护。
          </p>

          <p>mirrors.csaslu.com 为立达校内提供了高速的开源软件下载服务。</p>

          <p>
            上海立达学院通信与软件协会（CSASLU）是在数字科学学院指导下成立的学生学术技术组织，我们聚焦通信与软件工程领域，致力于搭建培养学生技术专长与兴趣、丰富课外实践、提升专业素养的专业化平台。
          </p>

          <p>
            本站相关源码可在
            <a
              :href="sourceUrl"
              class="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              这里
            </a>
            获取。
          </p>
        </div>

        <!--
          The association's logo: the cropped variant, so the mark itself fills
          the box. Sized near what the reference campus mirrors use (TUNA's
          footer logo is about 125px tall); smaller on phones, where it stacks
          under the text instead of sitting beside it.
        -->
        <div class="shrink-0 md:pl-10">
          <img
            src="/logo-mark.svg"
            alt="上海立达学院通信与软件协会"
            width="155"
            height="118"
            class="h-20 w-auto rounded-xl ring-1 ring-slate-200/80 md:h-28 dark:ring-slate-700/60"
            decoding="async"
          />
        </div>
      </div>
    </div>
  </footer>
</template>
