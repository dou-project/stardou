<script setup lang="ts">
import { locale } from '~/i18n'
import { mode } from '~/modes'
</script>

<template>
  <div font-title font-semibold leading-none whitespace-nowrap flex="~ center" text-2xl class="tracking-[0.3em] pl-[0.3em]">
    {{ locale === 'hant' ? mode.titleHant : mode.title }}
  </div>
</template>
