<script setup lang="ts">
import { nextPuzzle, now } from '~/state'
import { t } from '~/i18n'
import { isEndless, mode, modeUrl } from '~/modes'

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

    <div v-if="isEndless" flex="~ col center gap-3">
      <button btn p="x6 y2" @click="next()">
        <span tracking-1 pl1>{{ t('next-puzzle') }}</span>
      </button>
      <a :href="`${modeUrl(mode, true)}?key=`" text-sm op50 hover:op80>
        {{ t('endless-change-key') }}
      </a>
    </div>
    <div v-else flex="~ col center" relative>
      <div op50 ws-nowrap>
        {{ t('next-note') }}
      </div>
      <div text-lg ws-nowrap style="font-variant-numeric: tabular-nums;">
        {{ formatted }}
      </div>
    </div>

    <a href="/" mt10 inline-flex gap-1 items-center text-sm op50 hover:op80>
      <div i-carbon-chevron-left /> {{ t('back-home') }}
    </a>
  </div>
</template>
