<script setup lang="ts">
import { MODES } from '~/modes'

// 1200×630 cover images (README / og:image), rendered by `pnpm covers`.
// Every row is a real guess scored against `answer` by the game logic.
const kind = new URLSearchParams(location.search).get('og') || 'home'

interface Row { word: string; answer: string }

const BOARDS: Record<string, Row[]> = {
  home: [
    { word: '画蛇添足', answer: '画龙点睛' },
    { word: '床前明月光', answer: '举头望明月' },
    { word: '两岸猿声啼不住', answer: '两岸猿声啼不住' },
  ],
  chengyu: ['对牛弹琴', '龙飞凤舞', '画蛇添足', '画龙点睛'].map(word => ({ word, answer: '画龙点睛' })),
  wuyan: ['床前明月光', '海上生明月', '低头思故乡', '举头望明月'].map(word => ({ word, answer: '举头望明月' })),
  qiyan: ['千里莺啼绿映红', '两个黄鹂鸣翠柳', '两岸青山相对出', '两岸猿声啼不住'].map(word => ({ word, answer: '两岸猿声啼不住' })),
}

const rows = BOARDS[kind] || BOARDS.home
const m = MODES.find(i => i.id === kind)
const zoom = Math.min(1.2, 520 / (Math.max(...rows.map(r => Array.from(r.word).length)) * 88))
</script>

<template>
  <main
    bg-base text-gray-700 font-sans select-none
    flex="~" items-center overflow-hidden
    style="width: 1200px; height: 630px"
  >
    <div flex="~ col" items-center justify-center style="width: 660px; padding-left: 60px">
      <div flex="~ col" items-center :style="{ zoom }">
        <WordBlocks
          v-for="r, i of rows" :key="i"
          :word="r.word" :answer="r.answer" :length="Array.from(r.word).length"
          :revealed="true" :animate="false"
        />
      </div>
    </div>
    <div flex="~ col" items-center style="width: 540px">
      <template v-if="m">
        <div font-title font-semibold text-2xl op45 class="tracking-[0.4em] pl-[0.4em]">
          开兜
        </div>
        <div font-title font-medium mt-3 class="tracking-[0.2em] pl-[0.2em]" style="font-size: 112px; line-height: 1.1">
          {{ m.title }}
        </div>
        <div text-2xl op50 mt-4 class="tracking-[0.25em] pl-[0.25em]">
          {{ m.isPoem ? `课本${m.blurb}` : m.blurb }} Wordle
        </div>
      </template>
      <template v-else>
        <div font-title font-medium class="tracking-[0.2em] pl-[0.2em]" style="font-size: 128px; line-height: 1.1">
          开兜
        </div>
        <div text-2xl op50 mt-4 class="tracking-[0.25em] pl-[0.25em]">
          StarDou · 汉字 Wordle
        </div>
      </template>
      <div h-1px w-14 bg-gray-400:30 my-8 />
      <div text-xl op55 class="tracking-[0.3em] pl-[0.3em]">
        {{ m ? `stardou.org${m.path}` : '成语 · 五言 · 七言' }}
      </div>
    </div>
  </main>
</template>
