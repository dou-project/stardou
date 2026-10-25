<script setup lang="ts">
import { t } from '~/i18n'
import { mode } from '~/modes'
</script>

<template>
  <div>
    <p text-center p-4>
      {{ t('no-past-play') }}
    </p>
    <a btn :href="mode.path">{{ t('back-today') }}</a>
  </div>
</template>
