<script setup lang="ts">
import type { ModeId } from '~/modes'
import { MODES } from '~/modes'
import { locale, t } from '~/i18n'

defineProps<{ modelValue: ModeId | 'all'; all?: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: ModeId | 'all'): void }>()

const tabs = computed(() => MODES.map(m => ({ id: m.id as ModeId | 'all', title: locale.value === 'hant' ? m.titleHant : m.title })))
</script>

<template>
  <div flex border="~ base rounded" text-sm overflow-hidden>
    <button
      v-for="m of all ? [{ id: 'all' as const, title: t('board-all') }, ...tabs] : tabs" :key="m.id"
      px4 py1.5 transition-colors
      :class="modelValue === m.id ? 'bg-primary text-white' : 'op60 hover:op100'"
      @click="$emit('update:modelValue', m.id)"
    >
      {{ m.title }}
    </button>
  </div>
</template>
