<script setup lang="ts">
import { answer } from '~/state'
import { t } from '~/i18n'

const poem = computed(() => answer.value.poem)

// split each paragraph so the answer line can be highlighted
const lines = computed(() => (poem.value?.p || []).map((p) => {
  const word = answer.value.word
  const i = p.indexOf(word)
  if (i < 0)
    return [p, '', '']
  return [p.slice(0, i), word, p.slice(i + word.length)]
}))
</script>

<template>
  <div v-if="poem" my6 px3 sm:px6 py5 bg-gray-500:5 font-serif flex="~ col center gap-1" max-w-full>
    <div op50 text-xs tracking-2 mb1>
      {{ t('full-poem') }}
    </div>
    <div text-lg font-bold tracking-1>
      {{ poem.t }}
    </div>
    <div op60 text-sm mb2>
      {{ poem.d }} · {{ poem.a }}
    </div>
    <div v-for="l, i of lines" :key="i" text-sm sm:text-base sm:tracking-1 leading-relaxed ws-nowrap>
      <span op80>{{ l[0] }}</span><b text-ok>{{ l[1] }}</b><span op80>{{ l[2] }}</span>
    </div>
  </div>
</template>
