<script setup lang="ts">
/**
 * The over-the-top award ceremony after a daily puzzle: where you placed on 今日榜,
 * told with as much glitter as possible, good or bad.
 */
import type { PlaceTier, TodayRow } from '~/cloud'
import { account, fetchToday, placeOf } from '~/cloud'
import { mode } from '~/modes'
import { t } from '~/i18n'

const emit = defineEmits<{ (e: 'close'): void; (e: 'board'): void }>()

const rows = ref<TodayRow[]>([])
const failed = ref(false)
const place = computed(() => account.value ? placeOf(rows.value, account.value.id, mode.tries) : null)

onMounted(async () => {
  // the upload of this very result can still be in flight; give it one more try
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      rows.value = await fetchToday(mode)
    }
    catch {
      failed.value = true
      return
    }
    if (place.value)
      return
    await new Promise(resolve => setTimeout(resolve, 1200))
  }
  failed.value = !place.value
})

const tier = computed<PlaceTier>(() => place.value?.tier || 'lost')
const good = computed(() => tier.value === 'top' || tier.value === 'mid')
const mood = computed(() => good.value ? 'good' : 'bad')

const title = computed(() => {
  if (tier.value === 'mid' || tier.value === 'low')
    return t('cele-title-rank', place.value!.index + 1)
  return t(`cele-title-${tier.value}` as any)
})

const top3 = computed(() => rows.value.slice(0, 3))
const meInTop3 = computed(() => !!place.value && place.value.index < 3)
const score = (r: TodayRow) => r.passed && r.tries <= mode.tries ? r.tries : t('cele-gave-up')
const CROWNS = ['gold', 'silver', 'bronze']
const SPARKLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  delay: `${(i % 5) * 0.4}s`,
  size: `${0.8 + (i % 3) * 0.4}rem`,
}))
</script>

<template>
  <div class="stage" @click.self="emit('close')">
    <div class="curtain left" />
    <div class="curtain right" />
    <span v-for="s, i of SPARKLES" :key="i" class="sparkle" :style="{ left: s.left, top: s.top, animationDelay: s.delay, fontSize: s.size }">✦</span>

    <div v-if="!place" class="loading">
      <template v-if="failed">
        <p>{{ t('board-load-failed') }}</p>
        <button class="btn-close" @click="emit('close')">
          {{ t('cele-close-bad') }}
        </button>
      </template>
      <p v-else>
        {{ t('cele-loading') }}
      </p>
    </div>

    <div v-else class="show">
      <div class="cloud">
        {{ t(good ? 'cele-cloud-good' : 'cele-cloud') }}
        <span class="kitty">🐱</span>
      </div>

      <h1 class="headline">
        <span class="crown">👑</span>
        <span class="rainbow">{{ title }}</span>
        <span class="crown">👑</span>
      </h1>
      <div class="ribbon">
        {{ t('cele-beat-1') }}<b>{{ place.beaten }}%</b>{{ t('cele-beat-2') }}
      </div>

      <div class="panels">
        <section class="certificate">
          <div class="cert-inner">
            <div class="cert-star">
              ★
            </div>
            <div class="award-row">
              <Laurel class="laurel" />
              <h2 class="award">
                {{ t(`cele-award-${tier}` as any) }}
              </h2>
              <Laurel class="laurel" flip />
            </div>
            <div class="mascot-row">
              <p class="note left">
                {{ t(`cele-note-left-${mood}` as any) }} ♡
              </p>
              <Potato class="potato" :happy="good" />
              <p class="note right">
                {{ t(`cele-note-right-${mood}` as any) }} ♡
              </p>
            </div>
            <p class="winner">
              {{ t('cele-winner') }}<b>{{ account!.nickname }}</b>
            </p>
            <p class="line">
              {{ t(`cele-line-${tier}` as any) }}
            </p>
            <div class="stamp">
              <span>{{ t(good ? 'cele-stamp-good' : 'cele-stamp-bad') }}</span>
              <b>★</b>
              <span>{{ t('cele-stamp-sub') }}</span>
            </div>
          </div>
        </section>

        <section class="board">
          <h2 class="board-title">
            <span>👼</span>🏆 {{ t('cele-board') }} 🏆<span class="mirror">👼</span>
          </h2>
          <div class="ranking">
            <div class="thead">
              <span>{{ t('cele-col-rank') }}</span><span>{{ t('cele-col-player') }}</span><span>{{ t('cele-col-score') }}</span>
            </div>
            <div v-for="r, i of top3" :key="r.user_id" class="trow" :class="{ me: r.user_id === account?.id }">
              <span class="rank"><i class="crown-icon" :class="CROWNS[i]">👑</i>{{ i + 1 }}</span>
              <span class="who">
                <Avatar :user-id="r.user_id" :v="r.avatar_v" :name="r.nickname" class="avatar" />
                {{ r.user_id === account?.id ? t('cele-you') : r.nickname }}
              </span>
              <span class="score">{{ score(r) }}</span>
            </div>
            <template v-if="!meInTop3">
              <div class="arrows">
                <span v-for="i of 4" :key="i">⬇</span>
              </div>
              <div class="trow me big">
                <span class="rank">{{ place.index + 1 }}</span>
                <span class="who">
                  <Avatar :user-id="place.me.user_id" :v="place.me.avatar_v" :name="place.me.nickname" class="avatar" />
                  {{ t('cele-you') }}
                </span>
                <span class="score">{{ score(place.me) }}</span>
              </div>
            </template>
            <div class="burst">
              {{ t(`cele-burst-${tier}` as any) }}
            </div>
          </div>
          <div class="banner">
            🏆 <span>{{ t(`cele-banner-${tier}` as any) }}</span>
          </div>
          <button class="see-all" @click="emit('board')">
            {{ t('cele-full-board') }} →
          </button>
        </section>
      </div>

      <div class="crowd">
        <div v-for="i of 3" :key="i" class="fan">
          <p class="bubble">
            {{ t(`cele-crowd-${mood}-${i}` as any) }}
          </p>
          <span class="face">{{ good ? ['🤩', '😲', '🙇'][i - 1] : ['😭', '🥲', '😢'][i - 1] }}👏</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn-claim" @click="emit('close')">
          <span>{{ good ? '🥳' : '🥹' }}</span>{{ t(`cele-claim-${mood}` as any) }}<span>{{ good ? '🥳' : '🥹' }}</span>
        </button>
        <button class="btn-close" @click="emit('close')">
          {{ t(`cele-close-${mood}` as any) }}
        </button>
      </div>
      <p class="verdict">
        {{ t(`cele-eval-${tier}` as any) }} 🖱️
      </p>
    </div>
  </div>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow-y: auto;
  padding: 1.25rem 0.9rem 2.5rem;
  color: #3a1020;
  font-family: system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background:
    radial-gradient(circle at 50% 30%, rgb(255 255 255 / 0.55), transparent 60%),
    repeating-conic-gradient(#ff8cc6 0 25%, #ffb6dc 0 50%) 0 0 / 34px 34px;
  animation: fade-in 0.35s ease-out;
}
@keyframes fade-in {
  from { opacity: 0; transform: scale(1.04); }
}

.curtain {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 9vw;
  max-width: 90px;
  background: repeating-linear-gradient(90deg, #8e0016 0 10px, #d4102f 10px 22px, #a3001b 22px 30px);
  box-shadow: inset -8px 0 18px rgb(0 0 0 / 0.35);
  pointer-events: none;
}
.curtain.left { left: 0; border-bottom-right-radius: 70% 30%; }
.curtain.right { right: 0; transform: scaleX(-1); border-bottom-right-radius: 70% 30%; }

.sparkle {
  position: fixed;
  color: #fff;
  text-shadow: 0 0 6px #fff, 0 0 12px #ff5fb0;
  pointer-events: none;
  animation: twinkle 1.8s ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0); }
  50% { opacity: 1; transform: scale(1.2) rotate(45deg); }
}

.loading {
  position: relative;
  margin: 30vh auto 0;
  width: fit-content;
  padding: 1rem 1.6rem;
  border-radius: 1rem;
  background: #fff;
  font-weight: 800;
  text-align: center;
}

.show {
  position: relative;
  max-width: 980px;
  margin: 0 auto;
}

.cloud {
  position: absolute;
  right: 0.2rem;
  top: -0.4rem;
  z-index: 2;
  white-space: pre-line;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.25;
  padding: 0.45rem 0.6rem;
  background: #fff;
  border-radius: 999px;
  box-shadow: 0 2px 0 #e86aa8;
  transform: rotate(6deg);
}
@media (max-width: 600px) {
  .cloud { display: none; }
  .headline .crown:last-child { display: none; }
}
.kitty {
  position: absolute;
  right: -0.3rem;
  bottom: -1.5rem;
  font-size: 1.5rem;
}

.headline {
  margin: 1.4rem 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: clamp(1.7rem, 7.5vw, 3.6rem);
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
}
.crown {
  font-size: 0.7em;
  filter: drop-shadow(0 2px 0 #8a5a00);
  animation: bob 1.4s ease-in-out infinite;
}
@keyframes bob {
  50% { transform: translateY(-4px) rotate(-6deg); }
}
.rainbow {
  background: linear-gradient(90deg, #ff2e4d, #ff9a00, #ffe600, #35d46a, #1fa7ff, #8a4dff, #ff3fd0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-stroke: 2px #fff;
  paint-order: stroke fill;
  filter: drop-shadow(0 3px 0 #5b1470) drop-shadow(0 0 10px rgb(255 255 255 / 0.8));
}

.ribbon {
  position: relative;
  margin: 0.8rem auto 0;
  width: fit-content;
  max-width: 100%;
  padding: 0.45rem 2.2rem;
  font-size: clamp(1rem, 4.6vw, 1.9rem);
  font-weight: 900;
  color: #fff;
  background: linear-gradient(#e8162f, #a30018);
  clip-path: polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%);
  text-shadow: 0 2px 0 #6a000f;
  white-space: nowrap;
}
.ribbon b {
  margin: 0 0.2em;
  font-size: 1.6em;
  font-style: italic;
  background: linear-gradient(#fff8b0, #ffcc00 55%, #ff9500);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 0 #7a1d00);
  vertical-align: -0.08em;
}

.panels {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}
@media (min-width: 760px) {
  .panels { grid-template-columns: 1.05fr 1fr; align-items: start; }
}

.certificate {
  padding: 9px;
  border-radius: 6px;
  background: linear-gradient(135deg, #fff3a0, #d9a520 30%, #fff0a0 50%, #b8860b 75%, #ffe680);
  box-shadow: 0 6px 0 #8a5a00, 0 10px 24px rgb(120 0 40 / 0.35);
}
.cert-inner {
  position: relative;
  padding: 1.6rem 0.8rem 1rem;
  text-align: center;
  background:
    radial-gradient(ellipse at 50% 45%, #fffef5, #fbecc4 70%, #f1d79a);
  border: 3px double #b8860b;
}
.cert-inner::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 1.3rem;
  background: repeating-radial-gradient(circle at 50% -40%, #c4102c 0 14px, #8e0016 14px 18px);
  border-bottom-left-radius: 50% 100%;
  border-bottom-right-radius: 50% 100%;
}
.cert-star {
  position: absolute;
  top: -0.9rem;
  left: 50%;
  transform: translateX(-50%);
  width: 2.2rem;
  height: 2.2rem;
  line-height: 2.2rem;
  border-radius: 50%;
  color: #fff6c0;
  background: radial-gradient(circle at 35% 30%, #ffe680, #b8860b);
  box-shadow: 0 2px 0 #7a5200;
}
.award-row {
  display: flex;
  align-items: center;
  justify-content: center;
}
.laurel {
  width: 2.2rem;
  height: 4.4rem;
  flex: none;
}
.award {
  margin: 0 0.3rem;
  font-family: "Noto Serif SC", "Songti SC", "STSong", serif;
  font-size: clamp(1.9rem, 8vw, 2.7rem);
  font-weight: 900;
  color: #b3122a;
  -webkit-text-stroke: 1px #fff3c4;
  text-shadow: 0 3px 0 #6b0a18, 0 0 12px rgb(255 220 120 / 0.9);
  letter-spacing: 0.05em;
}
.mascot-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}
.potato {
  width: clamp(7rem, 34vw, 9.5rem);
  filter: drop-shadow(0 6px 6px rgb(120 70 0 / 0.35));
}
.note {
  white-space: pre-line;
  font-family: "Kaiti SC", "STKaiti", "KaiTi", cursive;
  font-size: clamp(0.72rem, 3.2vw, 0.95rem);
  font-weight: 700;
  line-height: 1.35;
  color: #e3248a;
}
.note.left { transform: rotate(-10deg); }
.note.right { transform: rotate(8deg); }
.winner {
  margin-top: 0.4rem;
  font-size: clamp(1rem, 4.4vw, 1.35rem);
  font-weight: 800;
}
.winner b {
  color: #d6102c;
  font-size: 1.2em;
}
.line {
  margin-top: 0.3rem;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: 0.92rem;
}
.stamp {
  position: absolute;
  right: 0.5rem;
  bottom: 2.6rem;
  width: 4.6rem;
  height: 4.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px double #c8102e;
  border-radius: 50%;
  color: #c8102e;
  font-size: 0.6rem;
  font-weight: 800;
  line-height: 1.2;
  opacity: 0.8;
  transform: rotate(-18deg);
  mix-blend-mode: multiply;
}
.stamp b { font-size: 1rem; }

.board {
  position: relative;
  padding: 0.8rem;
  border-radius: 10px;
  background: linear-gradient(#fff7fb, #ffe3f1);
  border: 6px solid #e8b931;
  box-shadow: inset 0 0 0 3px #fff6c8, 0 6px 0 #a0731a, 0 10px 24px rgb(120 0 40 / 0.3);
}
.board-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: clamp(1.4rem, 6vw, 2rem);
  font-weight: 900;
  color: #b3122a;
  text-shadow: 0 2px 0 #ffe08a;
}
.mirror { display: inline-block; transform: scaleX(-1); }
.ranking {
  position: relative;
  margin-top: 0.6rem;
  border-radius: 6px;
  overflow: visible;
}
.thead, .trow {
  display: grid;
  grid-template-columns: 4.2rem 1fr 4.2rem;
  align-items: center;
  text-align: center;
}
.thead {
  padding: 0.4rem 0;
  font-weight: 800;
  color: #7a1b3a;
  background: #ffc7df;
  border-radius: 6px 6px 0 0;
}
.trow {
  padding: 0.45rem 0;
  font-weight: 800;
  font-size: 1.05rem;
  background: #fff9e6;
  border-top: 2px solid #f6cfe0;
}
.trow:nth-of-type(odd) { background: #f3f0ff; }
.rank {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-style: italic;
  font-size: 1.3rem;
  color: #c8102e;
}
.crown-icon { font-style: normal; font-size: 1rem; }
.crown-icon.silver { filter: grayscale(1) brightness(1.3); }
.crown-icon.bronze { filter: sepia(1) hue-rotate(-20deg) saturate(2) brightness(0.85); }
.who {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  justify-content: flex-start;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.avatar {
  width: 1.8rem;
  height: 1.8rem;
  font-size: 0.8rem;
}
.score { color: #c8102e; font-size: 1.2rem; }
.arrows {
  display: flex;
  justify-content: space-around;
  padding: 0.2rem 2.5rem 0;
  color: #ff2f92;
  font-size: 1.4rem;
  text-shadow: 0 2px 0 #9b0050;
  animation: bob 0.9s ease-in-out infinite;
}
.trow.me {
  background: linear-gradient(#c8ff3d, #8fe000) !important;
  border: 3px solid #ff2f92;
  border-radius: 6px;
  box-shadow: 0 0 0 3px #fff, 0 0 18px #ff5fb0;
}
.trow.me.big { padding: 0.6rem 0; font-size: 1.4rem; }
.trow.me.big .rank { font-size: 1.8rem; }
.burst {
  position: absolute;
  right: -0.6rem;
  bottom: -3.4rem;
  padding: 1.1rem 0.9rem;
  font-size: 0.95rem;
  font-weight: 900;
  color: #d4001c;
  background: #ffe600;
  clip-path: polygon(50% 0, 61% 18%, 82% 8%, 78% 30%, 100% 34%, 84% 50%, 100% 66%, 78% 70%, 82% 92%, 61% 82%, 50% 100%, 39% 82%, 18% 92%, 22% 70%, 0 66%, 16% 50%, 0 34%, 22% 30%, 18% 8%, 39% 18%);
  transform: rotate(-12deg);
  animation: pulse 0.8s ease-in-out infinite;
  white-space: nowrap;
}
@keyframes pulse {
  50% { transform: rotate(-12deg) scale(1.08); }
}
.banner {
  margin: 3.6rem auto 0;
  width: fit-content;
  max-width: 100%;
  padding: 0.5rem 1.6rem;
  font-size: clamp(1rem, 4.6vw, 1.4rem);
  font-weight: 900;
  color: #ffe27a;
  background: linear-gradient(#c8102e, #7e0012);
  border: 3px solid #e8b931;
  border-radius: 999px;
  text-shadow: 0 2px 0 #4a0008;
}
.see-all {
  display: block;
  margin: 0.6rem auto 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #b3122a;
  text-decoration: underline;
}

.crowd {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1.4rem;
}
.fan {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.bubble {
  position: relative;
  white-space: pre-line;
  padding: 0.35rem 0.55rem;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  background: #fff;
  border: 2px solid #3a1020;
  border-radius: 0.8rem;
}
.bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #3a1020;
  border-top: 0;
  border-left: 0;
  transform: translateX(-50%) rotate(45deg);
}
.face {
  font-size: 2.1rem;
  animation: clap 0.5s ease-in-out infinite;
}
.fan:nth-child(2) .face { animation-delay: 0.15s; }
.fan:nth-child(3) .face { animation-delay: 0.3s; }
@keyframes clap {
  50% { transform: translateY(-3px) rotate(4deg); }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1.2rem;
}
.btn-claim {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1.4rem;
  font-size: clamp(1.15rem, 5vw, 1.6rem);
  font-weight: 900;
  color: #fff;
  background: linear-gradient(#ff7ac8, #e0198a);
  border: 4px solid #ffd84a;
  border-radius: 999px;
  box-shadow: 0 5px 0 #9b0a5a, 0 0 0 3px #e0198a, 0 0 22px #ff5fb0;
  text-shadow: 0 2px 0 #8a0050;
  animation: pulse-btn 1.2s ease-in-out infinite;
}
@keyframes pulse-btn {
  50% { transform: scale(1.04); }
}
.btn-close {
  padding: 0.6rem 1.2rem;
  font-weight: 800;
  color: #333;
  background: linear-gradient(#ffffff, #c9c9c9);
  border: 2px solid #8a8a8a;
  border-radius: 0.6rem;
  box-shadow: 0 3px 0 #6d6d6d;
}
.verdict {
  margin: 1rem auto 0;
  width: fit-content;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 700;
  background: #fff6a8;
  box-shadow: 2px 3px 0 rgb(0 0 0 / 0.15);
  transform: rotate(-3deg);
}

@media (prefers-reduced-motion: reduce) {
  .sparkle, .crown, .arrows, .burst, .face, .btn-claim, :deep(.tear) { animation: none; }
}
</style>
