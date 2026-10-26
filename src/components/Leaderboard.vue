<script setup lang="ts">
import type { ModeId } from '~/modes'
import { account, authReady, prepareCloud } from '~/cloud'
import { t } from '~/i18n'

type Tab = 'today' | 'overall'
const props = defineProps<{ initialMode?: ModeId; initialTab?: Tab; active?: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const tab = ref<Tab>(props.initialTab || 'today')
// every opening starts on the board it was opened for
watch(() => props.active, (a) => {
  if (a)
    tab.value = props.initialTab || 'today'
  // guests get the sign-in form here, so have the SDK ready
  if (a && !account.value)
    prepareCloud()
}, { immediate: true })
</script>

<template>
  <div p5 pb8 flex="~ col" items-center relative max-w-lg mx-auto>
    <button absolute top-4 right-4 icon-btn @click="$emit('close')">
      <div i-carbon-close />
    </button>

    <div i-carbon-trophy text-3xl text-primary op80 />

    <div v-if="!authReady" mt-10 mb-6 i-carbon-circle-dash animate-spin text-2xl op50 />

    <!-- only signed-in players have boards; everyone else can still play -->
    <template v-else-if="!account">
      <div mt3 font-title text-xl font-semibold class="tracking-[0.15em]">
        {{ t('board-title') }}
      </div>
      <p text-sm op60 mt2 mb4 text-center max-w-72>
        {{ t('board-guest') }}
      </p>
      <AccountPanel />
    </template>

    <template v-else>
      <div flex gap-6 mt3 font-title text-xl font-semibold class="tracking-[0.15em]">
        <button
          v-for="[id, label] of [['today', t('board-today')], ['overall', t('board-overall')]] as [Tab, string][]" :key="id"
          pb1 border-b-2 transition-colors
          :class="tab === id ? 'border-primary' : 'border-transparent op40 hover:op70'"
          @click="tab = id"
        >
          {{ label }}
        </button>
      </div>

      <div w-full mt5>
        <TodayBoard v-if="tab === 'today'" :initial-mode="props.initialMode" :active="props.active" />
        <OverallBoard v-else :active="props.active" />
      </div>

      <div w-full border="t base" mt6 pt5>
        <AccountPanel />
      </div>
    </template>
  </div>
</template>
