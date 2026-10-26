<script setup lang="ts">
import type { TodayRow } from '~/cloud'
import { account, fetchToday } from '~/cloud'
import type { ModeId } from '~/modes'
import { MODES } from '~/modes'
import { formatDuration } from '~/storage'
import { t } from '~/i18n'

const props = defineProps<{ initialMode?: ModeId; active?: boolean }>()

const modeId = ref<ModeId | 'all'>(props.initialMode || 'chengyu')
const mode = computed(() => MODES.find(m => m.id === modeId.value) || MODES[0])

const rows = ref<TodayRow[]>([])
const loading = ref(true)
const failed = ref(false)

async function load() {
  if (!props.active)
    return
  loading.value = true
  failed.value = false
  try {
    rows.value = await fetchToday(mode.value)
  }
  catch {
    failed.value = true
  }
  loading.value = false
}

watch([modeId, () => account.value?.id, () => props.active], load, { immediate: true })

const solved = (r: TodayRow) => r.passed && r.tries <= mode.value.tries
function status(r: TodayRow) {
  if (!solved(r))
    return r.passed ? t('board-over', r.tries) : t('board-gave-up', r.tries)
  const parts = [t('board-tries', r.tries)]
  if (r.hint_level)
    parts.push(t('board-hints', r.hint_level))
  if (r.duration_ms && r.duration_ms >= 1000)
    parts.push(formatDuration(r.duration_ms))
  return parts.join(' · ')
}
const played = computed(() => !!account.value && rows.value.some(r => r.user_id === account.value!.id))
</script>

<template>
  <div w-full flex="~ col" items-center>
    <ModeTabs v-model="modeId" />
    <p text-xs op45 mt3>
      {{ t('board-today-rule') }}
    </p>

    <div w-full mt4 min-h-30 flex="~ col gap-2" :class="loading ? 'op50' : ''" transition-opacity>
      <div v-if="failed" py8 text-sm op60 flex="~ col center gap-2">
        {{ t('board-load-failed') }}
        <button ghost-btn text-xs @click="load()">
          {{ t('board-retry') }}
        </button>
      </div>
      <div v-else-if="!loading && !rows.length" py10 text-sm op50>
        {{ t('board-today-empty') }}
      </div>
      <div
        v-for="r, i of rows" :key="r.user_id"
        card px4 py2.5 flex items-center gap-3 text-left
        :class="r.user_id === account?.id ? 'border-primary!' : ''"
      >
        <div w-6 flex-none text-center font-serif :class="i < 3 && solved(r) ? 'text-primary font-bold text-lg' : 'op40'">
          {{ solved(r) ? i + 1 : '-' }}
        </div>
        <Avatar :user-id="r.user_id" :v="r.avatar_v" :name="r.nickname" w-9 h-9 />
        <div flex-1 min-w-0>
          <div font-semibold truncate>
            {{ r.nickname }}
            <span v-if="r.user_id === account?.id" text-xs text-primary font-normal>（{{ t('board-you') }}）</span>
          </div>
          <div text-xs mt0.5 :class="solved(r) ? 'op55' : 'text-mis'">
            {{ status(r) }}
          </div>
        </div>
      </div>
    </div>

    <p v-if="account && !loading && !failed && !played" text-sm op60 mt4>
      {{ t('board-today-not-played') }}
    </p>
  </div>
</template>
