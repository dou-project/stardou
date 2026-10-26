<script setup lang="ts">
import { MODES, href, modeUrl } from '~/modes'
import type { GameMode } from '~/modes'
import { locale, t } from '~/i18n'
import { SITE } from '~/site'

const isDark = useDark()
useTitle(computed(() => `${t('site-name')} ${SITE.nameEn} - ${t('description')}`))

const HANZI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
function hanziCount(n: number) {
  if (n <= 10)
    return HANZI[n]
  return `十${HANZI[n - 10]}`
}

function dayIndex(d: Date) {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

function readJSON<T>(key: string): T | undefined {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? undefined
  }
  catch {
    return undefined
  }
}

function status(m: GameMode) {
  const day = dayIndex(new Date()) - dayIndex(m.startDate)
  const meta = readJSON<Record<number, { passed?: boolean; failed?: boolean; answer?: boolean; tries?: string[] }>>(`${m.storagePrefix}-tries-meta`)?.[day]
  if (meta?.passed || meta?.answer)
    return 'done'
  if (meta?.tries?.length)
    return 'playing'
  return ''
}

const cards = MODES.map(m => ({
  mode: m,
  title: computed(() => locale.value === 'hant' ? m.titleHant : m.title),
  blurb: computed(() => locale.value === 'hant' ? m.blurbHant : m.blurb),
  tries: t('tries-count', hanziCount(m.tries)),
  status: status(m),
}))
</script>

<template>
  <main font-sans text="gray-700 dark:gray-300" min-h-screen select-none>
    <div absolute top-4 right-4 flex="~ gap-4" items-center text-sm>
      <button op60 hover:op100 @click="locale = locale === 'hans' ? 'hant' : 'hans'">
        {{ locale === 'hans' ? '繁' : '简' }}
      </button>
      <button icon-btn @click="isDark = !isDark">
        <div i-carbon-sun dark:i-carbon-moon />
      </button>
    </div>

    <div max-w-md mx-auto px-5 pt-14 pb-12 flex="~ col" items-center text-center>
      <img :src="href('/logo.webp')" alt="" w-32 h-32 dark:rounded-full>
      <h1 font-title text-5xl font-semibold mt-6 class="tracking-[0.25em] pl-[0.25em]">
        {{ t('site-name') }}
      </h1>
      <div text-xs op45 mt-2 uppercase class="tracking-[0.45em] pl-[0.45em]">
        {{ SITE.nameEn }}
      </div>
      <div op60 mt-4 text-sm tracking-wide>
        {{ t('home-tagline') }}
      </div>

      <div w-full mt-10 flex="~ col gap-4">
        <section v-for="c of cards" :key="c.mode.id" card p5 text-left>
          <a :href="modeUrl(c.mode)" block group>
            <div flex items-center justify-between gap-3>
              <div font-title text-2xl font-semibold class="tracking-[0.2em]" group-hover:text-primary transition-colors>
                {{ c.title.value }}
              </div>
              <div flex="~ gap-1" flex-none>
                <div
                  v-for="[ch, color], i of c.mode.preview" :key="i"
                  w-5.5 h-5.5 flex items-center justify-center font-serif rounded-sm style="font-size: 11px"
                  :class="color === 'ok' ? 'bg-ok text-white' : color === 'mis' ? 'bg-gray-400/10 text-mis' : 'bg-gray-400/10 op70'"
                >
                  {{ ch }}
                </div>
              </div>
            </div>
            <div text-sm op55 mt-1.5>
              {{ c.blurb.value }} · {{ c.tries }}
            </div>
          </a>
          <div flex gap-2 mt4>
            <a :href="modeUrl(c.mode)" btn flex-1 flex items-center justify-center gap-2 py2>
              {{ t('daily-play') }}
              <span v-if="c.status" text-xs op80>· {{ t(c.status === 'done' ? 'status-done' : 'status-playing') }}</span>
            </a>
            <a :href="modeUrl(c.mode, true)" ghost-btn py2 flex items-center justify-center gap-1>
              <div i-carbon-infinity-symbol />
              {{ t('endless') }}
            </a>
          </div>
        </section>
      </div>

      <div mt12 text-xs op45 leading-6>
        <div>
          inspired by <a href="https://www.nytimes.com/games/wordle/index.html" target="_blank" hover:text-primary>Wordle</a>
          · {{ t('based-on') }} <a href="https://github.com/antfu/handle" target="_blank" hover:text-primary>汉兜</a>
          by Anthony & Inès
        </div>
        <div>{{ t('poem-source') }}</div>
        <a v-if="SITE.repo" :href="SITE.repo" target="_blank" inline-flex items-center gap-1 mt2 hover:text-primary>
          <div i-carbon-logo-github /> GitHub
        </a>
      </div>
    </div>
  </main>
</template>
