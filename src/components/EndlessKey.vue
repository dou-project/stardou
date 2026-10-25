<script setup lang="ts">
import { ENDLESS_KEY_MAX, mode, modeUrl, normalizeKey } from '~/modes'
import { readEndlessProgress } from '~/state'
import { t } from '~/i18n'

const key = ref('')
const recent = Object.entries(readEndlessProgress()).reverse()

const WORDS = '春风 秋月 明月 青山 白云 流水 星河 清风 落花 细雨 晚霞 长亭 孤帆 远山 寒梅 新柳 江南 塞北 小桥 斜阳 芳草 归雁 渔火 松涛 竹影 桃花 杏雨 荷风 菊香 雪夜'.split(' ')

function randomKey() {
  key.value = WORDS[Math.floor(Math.random() * WORDS.length)] + Math.floor(Math.random() * 90 + 10)
}

function start(k: string) {
  const normalized = normalizeKey(k)
  if (!normalized)
    return
  location.href = `${modeUrl(mode, true)}?key=${encodeURIComponent(normalized)}`
}
</script>

<template>
  <div max-w-sm mx-auto pt-8 pb-16 flex="~ col gap-4" items-center>
    <div i-carbon-infinity-symbol text-3xl text-primary op80 />
    <div font-title text-2xl font-semibold class="tracking-[0.2em] pl-[0.2em]">
      {{ t('endless-title') }}
    </div>
    <p op65 text-sm leading-6 text-center max-w-80>
      {{ t('endless-key-intro') }}
    </p>

    <div border="2 base" w-full mt-2>
      <input
        v-model="key"
        bg-transparent w-full p3 outline-none text-center text-lg
        type="text" autocomplete="off" :maxlength="ENDLESS_KEY_MAX"
        :placeholder="t('endless-key-placeholder')"
        @keydown.enter="start(key)"
      >
    </div>
    <div flex="~ gap-3">
      <button btn p="x6 y2" :disabled="!key.trim()" @click="start(key)">
        {{ t('start') }}
      </button>
      <button ghost-btn p="x4 y2" flex="~ center gap-1" @click="randomKey()">
        <div i-carbon-shuffle /> {{ t('endless-key-random') }}
      </button>
    </div>

    <div v-if="recent.length" w-full mt-8>
      <div text-xs op45 mb-2 tracking-wide>
        {{ t('endless-key-recent') }}
      </div>
      <div flex="~ col gap-2">
        <button
          v-for="[k, n] of recent" :key="k"
          card px4 py2.5 flex="~" items-center justify-between hover:border-primary transition-colors
          @click="start(k)"
        >
          <span font-serif>{{ k }}</span>
          <span text-sm op50>{{ t('endless-resume', n + 1) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
