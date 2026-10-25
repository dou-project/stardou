<script setup lang="ts">
import { t } from '~/i18n'
import { mode, modeUrl } from '~/modes'
</script>

<template>
  <div>
    <p text-center p-4>
      {{ t('no-quiz-today') }}
    </p>
    <a btn :href="modeUrl(mode)">{{ t('back-today') }}</a>
  </div>
</template>
