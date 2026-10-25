<script setup lang="ts">
import { dayNoHanzi, showDashboard, showHelp, showSettings, useMask } from '~/state'
import { gamesCount } from '~/storage'
import { endlessKey, href, isEndless } from '~/modes'
import { t } from '~/i18n'

const toggleSettings = useToggle(showSettings)
const toggleDashboard = useToggle(showDashboard)

function openHelp() {
  showHelp.value = true
  useMask.value = false
}
</script>

<template>
  <nav border="b base" relative>
    <div flex items-center justify-between md:max-w-xl ma py3 px3>
      <div flex items-center w-24>
        <a :href="href()" icon-btn mx1 flex="~ gap-1" items-center text-sm :title="t('back-home')">
          <div i-carbon-chevron-left text-lg />
          <span font-title tracking-wider>{{ t('site-name') }}</span>
        </a>
      </div>
      <div flex="~ col" items-center min-w-0>
        <AppName />
        <div text-xs op45 mt-0.5 ws-nowrap truncate max-w-48 tracking-wide>
          <template v-if="isEndless && endlessKey">
            {{ t('endless') }} · {{ endlessKey }} · {{ dayNoHanzi }}
          </template>
          <template v-else-if="isEndless">
            {{ t('endless') }}
          </template>
          <template v-else>
            {{ dayNoHanzi }}
          </template>
        </div>
      </div>
      <div flex items-center justify-end w-24 gap-1>
        <button icon-btn mx1.5 :title="t('rule')" @click="openHelp()">
          <div i-carbon-help />
        </button>
        <button v-if="gamesCount" icon-btn mx1.5 :title="t('dashboard')" @click="toggleDashboard()">
          <div i-carbon-chart-column />
        </button>
        <button icon-btn mx1.5 :title="t('settings')" @click="toggleSettings()">
          <div i-carbon-settings />
        </button>
      </div>
    </div>
  </nav>
</template>
