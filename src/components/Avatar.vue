<script setup lang="ts">
import { avatarUrl } from '~/cloud'

const props = defineProps<{
  userId: string
  v: number | null
  name: string
  /** a local preview (object URL) shown instead of the uploaded one */
  src?: string
}>()

const url = computed(() => props.src || avatarUrl(props.userId, props.v))
const failed = ref(false)
watch(url, () => failed.value = false)
</script>

<template>
  <img
    v-if="url && !failed" :src="url" alt=""
    rounded-full object-cover bg-gray-400:10 flex-none
    @error="failed = true"
  >
  <div v-else rounded-full bg-gray-400:15 flex-none flex items-center justify-center font-serif op80>
    {{ Array.from(name || '?')[0] }}
  </div>
</template>
