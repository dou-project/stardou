<script setup lang="ts">
import { nextPuzzle, now } from '~/state'
import { t } from '~/i18n'
import { isEndless } from '~/modes'

// time left until the next local midnight
const ms = computed(() => {
  const next = new Date(now.value)
  next.setHours(24, 0, 0, 0)
  return +next - +now.value
})
const formatted = computed(() => {
  const h = Math.floor((ms.value % 86400000) / 3600000)
  const m = Math.floor((ms.value % 3600000) / 60000)
  const s = Math.floor((ms.value % 60000) / 1000)
  return t('time-format', h, m.toString().padStart(2, '0'), s.toString().padStart(2, '0'))
})

function next() {
  nextPuzzle()
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <div pt12 pb16>
    <div flex="~ col" items-center>
      <ShareButton m4 />
      <ToggleMask :hint="true" />
    </div>

    <div h-1px w-10 border="t base" mt4 mb6 mxa />

    <div v-if="isEndless" flex="~ col center">
      <button btn p="x6 y2" @click="next()">
        <span tracking-1 pl1>{{ t('next-puzzle') }}</span>
      </button>
    </div>
    <div v-else flex="~ col center" relative>
      <div op50 ws-nowrap>
        {{ t('next-note') }}
      </div>
      <div text-lg ws-nowrap style="font-variant-numeric: tabular-nums;">
        {{ formatted }}
      </div>
    </div>
  </div>
</template>
