<script setup lang="ts">
import { isDark, parseWord, showHelp, useMask } from '~/state'
import { initialized, inputMode } from '~/storage'
import { t } from '~/i18n'
import { isEndless, mode } from '~/modes'
import { numberToHanzi } from '~/logic'

function start() {
  showHelp.value = false
  useMask.value = false
  initialized.value = true
}

const r = mode.rules
const nth = (i: number) => numberToHanzi(i + 1)
const charAt = (w: string, i: number) => Array.from(w)[i]

// the misplaced final of the third example, in the player's input mode
const final = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  inputMode.value
  const c = parseWord(r.parts.word, r.parts.answer)[r.parts.final]
  return inputMode.value === 'zy' ? `${c._2 || ''}${c._3 || ''}` : c._2 || ''
})
</script>

<template>
  <div p="x5 y10" flex="~ col gap-2 y-center" relative>
    <div absolute top-4 right-4 flex="~ gap-3">
      <button v-if="!initialized" icon-btn @click="isDark = !isDark">
        <div i-carbon-sun dark:i-carbon-moon />
      </button>
      <button v-else icon-btn @click="start()">
        <div i-carbon-close />
      </button>
    </div>

    <AppName text-3xl />
    <div mt1 op50 text-sm>
      {{ t('description') }}
    </div>

    <div h-1px w-10 border="b base" m4 />

    <p text-xl font-serif mb4>
      <b>{{ t('rule') }}</b>
    </p>

    <p>{{ t('intro-1', numberToHanzi(mode.tries)) }} <b text-ok>{{ t('intro-2') }}</b>。</p>
    <p>{{ t('intro-3') }}</p>
    <p v-if="mode.isPoem" op70 max-w-130>
      {{ t('intro-poem') }}
    </p>
    <div h-1px w-10 border="b base" m4 />

    <WordBlocks my2 :word="r.exact.word" :length="mode.length" :revealed="true" :answer="r.exact.answer" />
    <p max-w-130>
      {{ t('intro-4', nth(r.exact.at)) }} <b text-ok>{{ charAt(r.exact.word, r.exact.at) }}</b> {{ t('intro-6') }}
    </p>

    <WordBlocks my2 :word="r.misplaced.word" :length="mode.length" :revealed="true" :answer="r.misplaced.answer" />
    <p max-w-130>
      {{ t('intro-7', nth(r.misplaced.at)) }} <b text-mis>{{ charAt(r.misplaced.word, r.misplaced.at) }}</b> {{ t('intro-9', nth(r.misplaced.at)) }}
    </p>

    <WordBlocks my2 :word="r.parts.word" :length="mode.length" :revealed="true" :answer="r.parts.answer" />
    <p max-w-130>
      {{ t('intro-10') }} <b>{{ t('intro-11') }}</b> {{ t('intro-12') }}
      {{ t('intro-13', nth(r.parts.at)) }} <b op50>{{ charAt(r.parts.word, r.parts.at) }}</b> {{ t('intro-15') }} <b op50>{{ charAt(r.parts.word, r.parts.at) }}</b> {{ t('intro-16') }}
      {{ t('intro-17', nth(r.parts.final)) }} <b text-mis>{{ final }}</b> {{ t('intro-19', numberToHanzi(mode.length), nth(r.parts.final)) }}
    </p>

    <WordBlocks my2 :word="r.win" :length="mode.length" :revealed="true" :answer="r.win" />
    <p>{{ t('intro-20') }}</p>

    <div h-1px w-10 border="b base" m4 />

    <p font-serif>
      <b>{{ t('rules-extra-title') }}</b>
    </p>
    <p op70>
      {{ t('rules-extra-intro') }}
    </p>
    <div flex="~ col gap-1" max-w-130 text-left op70>
      <p><b>{{ t('strict-mode') }}</b>：{{ t('rules-strict') }}</p>
      <p><b>{{ t('hard-clues') }}</b>：{{ t('rules-hard') }}</p>
      <p><b>{{ t('hard-mode') }}</b>：{{ t('rules-no-hint') }}</p>
    </div>
    <p op50 text-sm>
      {{ t('rules-extra-note') }}
    </p>

    <div h-1px w-10 border="b base" m4 />

    <button btn p="x6 y2" @click="start()">
      <span tracking-1 pl1>{{ t('start') }}</span>
    </button>
    <div op50 text-sm>
      {{ isEndless ? t('endless-tip') : t('update-tip') }}
    </div>

    <div h-1px w-10 border="b base" m4 />

    <Settings :lite="true" />

    <div h-1px w-10 border="b base" m4 />

    <div op40 text-xs>
      inspired by <a href="https://www.nytimes.com/games/wordle/index.html" target="_blank" hover:op80>Wordle</a>
      · {{ t('based-on') }} <a href="https://github.com/antfu/handle" target="_blank" hover:op80>汉兜</a> by Anthony & Inès
    </div>
  </div>
</template>
