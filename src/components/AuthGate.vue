<script setup lang="ts">
import { account, authReady } from '~/cloud'
import { href, mode } from '~/modes'
import { locale, t } from '~/i18n'

// the game's own state (and its dark-mode toggle) isn't loaded yet
useDark()
useTitle(computed(() => `${locale.value === 'hant' ? mode.titleHant : mode.title} · ${t('site-name')}`))
</script>

<template>
  <main font-sans text="center gray-700 dark:gray-300" min-h-screen>
    <div max-w-sm mx-auto px-5 pt-10 pb-12 flex="~ col" items-center>
      <a :href="href()" self-start text-sm op60 hover:op100 flex items-center gap-1>
        <div i-carbon-chevron-left /> {{ t('back-home') }}
      </a>
      <img :src="href('/logo.webp')" alt="" w-20 h-20 mt-4 dark:rounded-full>
      <h1 font-title text-3xl font-semibold mt-4 class="tracking-[0.2em] pl-[0.2em]">
        {{ locale === 'hant' ? mode.titleHant : mode.title }}
      </h1>

      <div v-if="!authReady" mt-12 i-carbon-circle-dash animate-spin text-2xl op50 />
      <template v-else>
        <p text-sm op70 mt-3 mb-6>
          {{ t(account ? 'gate-avatar' : 'gate-intro') }}
        </p>
        <AccountPanel gate />
      </template>
    </div>
  </main>
</template>
