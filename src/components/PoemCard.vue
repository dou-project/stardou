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

const grade = computed(() => poem.value?.g ? t(`grade-${poem.value.g}` as any) : '')
</script>

<template>
  <div v-if="poem" my6 px4 sm:px8 py6 card font-serif flex="~ col center gap-1" max-w-full>
    <div op45 text-xs class="tracking-[0.3em]" mb2>
      {{ t('full-poem') }}<template v-if="grade">
        · {{ grade }}
      </template>
    </div>
    <div text-xl font-bold tracking-1>
      {{ poem.t }}
    </div>
    <div op60 text-sm mb3>
      {{ poem.d }} · {{ poem.a }}
    </div>
    <div v-for="l, i of lines" :key="i" text-sm sm:text-base sm:tracking-1 leading-loose>
      <span op80>{{ l[0] }}</span><b text-ok>{{ l[1] }}</b><span op80>{{ l[2] }}</span>
    </div>
  </div>
</template>
