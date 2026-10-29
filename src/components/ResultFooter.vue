<script setup lang="ts">
import { formatDuration, meta } from '~/storage'
import { t } from '~/i18n'
import { dayNoHanzi } from '~/state'
import { mode } from '~/modes'

defineProps<{
  day?: boolean
}>()

const hintText = computed(() => {
  if (!meta.value.hintLevel)
    return t(meta.value.hint ? 'hint-level-1' : 'hint-level-none')
  else if (mode.isPoem)
    return t('hint-level-chars', meta.value.hintLevel)
  else if (meta.value.hintLevel === 1)
    return t('hint-level-1')
  else
    return t('hint-level-2')
})
</script>

<template>
  <div op50 my1 text-sm ws-nowrap text-center>
    <template v-if="day">
      {{ dayNoHanzi }} ·
    </template>
    {{ hintText }} ·
    <template v-if="meta.strict">
      {{ t('strict-mode') }} ·
    </template>
    <template v-if="meta.hardClues">
      {{ t('hard-clues') }} ·
    </template>
    {{ formatDuration(meta.duration || 0) }}
  </div>
</template>
