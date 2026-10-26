<script setup lang="ts">
import type { OverallRow } from '~/cloud'
import { account, fetchOverall } from '~/cloud'
import type { ModeId } from '~/modes'
import { t } from '~/i18n'

const props = defineProps<{ active?: boolean }>()

const tab = ref<ModeId | 'all'>('all')
const rows = ref<OverallRow[]>([])
const mine = ref<OverallRow | null>(null)
const loading = ref(true)
const failed = ref(false)

async function load() {
  if (!props.active)
    return
  loading.value = true
  failed.value = false
  try {
    const r = await fetchOverall(tab.value)
    rows.value = r.rows
    mine.value = r.mine
  }
  catch {
    failed.value = true
  }
  loading.value = false
}

watch([tab, () => account.value?.id, () => props.active], load, { immediate: true })

const listed = computed(() => !!mine.value && rows.value.some(r => r.user_id === mine.value!.user_id))
</script>

<template>
  <div w-full flex="~ col" items-center>
    <ModeTabs v-model="tab" all />
    <p text-xs op45 mt3>
      {{ t('board-overall-rule') }}
    </p>

    <div w-full mt4 min-h-30 flex="~ col gap-2" :class="loading ? 'op50' : ''" transition-opacity>
      <div v-if="failed" py8 text-sm op60 flex="~ col center gap-2">
        {{ t('board-load-failed') }}
        <button ghost-btn text-xs @click="load()">
          {{ t('board-retry') }}
        </button>
      </div>
      <div v-else-if="!loading && !rows.length" py10 text-sm op50>
        {{ t('board-overall-empty') }}
      </div>
      <div
        v-for="r, i of rows" :key="r.user_id"
        card px4 py2.5 flex items-center gap-3 text-left
        :class="r.user_id === account?.id ? 'border-primary!' : ''"
      >
        <div w-6 flex-none text-center font-serif :class="i < 3 ? 'text-primary font-bold text-lg' : 'op40'">
          {{ i + 1 }}
        </div>
        <Avatar :user-id="r.user_id" :v="r.avatar_v" :name="r.nickname" w-9 h-9 />
        <div flex-1 min-w-0>
          <div font-semibold truncate>
            {{ r.nickname }}
            <span v-if="r.user_id === account?.id" text-xs text-primary font-normal>（{{ t('board-you') }}）</span>
          </div>
          <div text-xs op55 mt0.5>
            {{ t('board-overall-stats', r.games, r.avg_tries ?? '-') }}
          </div>
        </div>
        <div flex-none text-right>
          <div text-2xl font-serif leading-none>
            {{ r.solved }}
          </div>
          <div text-xs op40 mt1>
            {{ t('board-solved') }}
          </div>
        </div>
      </div>
    </div>

    <p v-if="account && !loading && !failed && !listed" text-sm op60 mt4>
      {{ mine ? t('board-overall-mine', mine.solved, mine.games) : t('board-overall-none') }}
    </p>
  </div>
</template>
