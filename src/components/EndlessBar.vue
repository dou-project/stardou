<script setup lang="ts">
import { dayNo, goToPuzzle } from '~/state'
import { getPoolSize } from '~/answers'
import { mode, modeUrl } from '~/modes'
import { t } from '~/i18n'

const total = getPoolSize()
const editing = ref(false)
const draft = ref('')
const el = ref<HTMLInputElement>()

async function edit() {
  draft.value = String(dayNo.value + 1)
  editing.value = true
  await nextTick()
  el.value?.select()
}

function jump() {
  if (!editing.value)
    return
  editing.value = false
  const n = Number.parseInt(draft.value)
  if (n >= 1)
    goToPuzzle(Math.min(n, total) - 1)
}
</script>

<template>
  <div border="b base" text-sm>
    <div flex items-center justify-center gap-3 py2 px3>
      <button icon-btn disabled:op25 :disabled="dayNo <= 0" :title="t('endless-prev')" @click="goToPuzzle(dayNo - 1)">
        <div i-carbon-chevron-left />
      </button>
      <input
        v-if="editing"
        ref="el" v-model="draft"
        w-20 py0.5 text-center bg-transparent outline-none border="b primary"
        type="text" inputmode="numeric" :aria-label="t('endless-jump')"
        @keydown.enter="jump" @keydown.esc="editing = false" @blur="jump"
      >
      <button v-else w-20 py0.5 border="b dashed gray-400/40" hover:text-primary :title="t('endless-jump')" @click="edit()">
        {{ t('endless-resume', dayNo + 1) }}
      </button>
      <span op40 style="font-variant-numeric: tabular-nums;">/ {{ total }}</span>
      <button icon-btn :title="t('endless-next')" @click="goToPuzzle(dayNo + 1)">
        <div i-carbon-chevron-right />
      </button>
      <div w-1px h-4 border="r base" />
      <a :href="`${modeUrl(mode, true)}?key=`" op60 hover:op100 hover:text-primary>
        {{ t('endless-change-key-short') }}
      </a>
    </div>
  </div>
</template>
