<script setup lang="ts">
import { HINT_CHARS_MAX, answer, dayNoHanzi, hint, hintRevealed, parseWord, parsedAnswer } from '~/state'
import { meta } from '~/storage'
import { t } from '~/i18n'
import { mode } from '~/modes'

const parsed = computed(() => parseWord(hint.value, answer.value.word)[0])
const masked = computed(() => ({
  ...parsed.value,
  char: '?',
}))
const poem = computed(() => answer.value.poem)
const count = computed(() => hintRevealed.value.size)
</script>

<template>
  <div p8 flex="~ col gap-4" items-center>
    <p><b>{{ dayNoHanzi }}</b></p>
    <template v-if="mode.isPoem">
      <div>{{ t('hint-note-chars', count) }}</div>
      <div flex :style="{ zoom: Math.min(1, 300 / (mode.length * 64)) }">
        <template v-for="c, i of parsedAnswer" :key="i">
          <CharBlock v-if="hintRevealed.has(i)" :char="c" m1 />
          <div v-else w-20 h-20 m1 border="2 gray-400/25" flex items-center justify-center text-2xl text-gray-400 font-serif>
            ?
          </div>
        </template>
      </div>
      <div v-if="poem" font-serif>
        {{ t('poet-of-day') }} <b>{{ poem.d }} · {{ poem.a }}</b>
      </div>
      <button
        v-if="count < HINT_CHARS_MAX"
        class="btn bg-mis"
        @click="meta.hintLevel = count + 1"
      >
        {{ t('more-hint') }}
      </button>
    </template>
    <template v-else>
      <div>{{ t('hint-note') }} <b>{{ meta.hintLevel === 2 ? t('hanzi') : t('ziyin') }}</b></div>
      <CharBlock :char="meta.hintLevel === 2 ? parsed : masked" />
      <button
        v-if="meta.hintLevel !== 2"
        class="btn bg-mis"
        @click="meta.hintLevel = 2"
      >
        {{ t('more-hint') }}
      </button>
    </template>
  </div>
</template>
