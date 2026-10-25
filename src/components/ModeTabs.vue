<script setup lang="ts">
import { MODES, isEndless, mode, modeUrl } from '~/modes'
import { locale, t } from '~/i18n'

// keep dev params (dev=hey) when switching modes
const search = location.search.includes('dev=') ? '?dev=hey' : ''
</script>

<template>
  <div border="b base" flex="~ center wrap" font-serif text-sm tracking-1>
    <div flex="~ center">
      <template v-for="m, i of MODES" :key="m.id">
        <div v-if="i" w-1px h-3 border="r base" />
        <a
          :href="modeUrl(m, isEndless) + search"
          px3 py1.5
          :class="m.id === mode.id ? 'text-primary font-bold' : 'op50 hover:op80'"
        >
          {{ locale === 'hant' ? m.labelHant : m.label }}
        </a>
      </template>
    </div>
    <div mx2 op30>
      ·
    </div>
    <div flex="~ center" text-xs>
      <a
        :href="modeUrl(mode, false) + search"
        px2 py1.5
        :class="!isEndless ? 'text-primary font-bold' : 'op50 hover:op80'"
      >{{ t('daily') }}</a>
      <div w-1px h-3 border="r base" />
      <a
        :href="modeUrl(mode, true) + search"
        px2 py1.5
        :class="isEndless ? 'text-primary font-bold' : 'op50 hover:op80'"
      >{{ t('endless') }}</a>
    </div>
  </div>
</template>
