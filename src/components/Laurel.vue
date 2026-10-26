<script setup lang="ts">
/** one golden laurel branch curving up; mirror it with `flip` */
defineProps<{ flip?: boolean }>()
const leaves = Array.from({ length: 7 }, (_, i) => i)
</script>

<template>
  <svg viewBox="0 0 60 120" :style="flip ? { transform: 'scaleX(-1)' } : undefined" aria-hidden="true">
    <defs>
      <linearGradient id="laurel-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff1a8" />
        <stop offset=".5" stop-color="#e6b422" />
        <stop offset="1" stop-color="#9a6a00" />
      </linearGradient>
    </defs>
    <path d="M44 116Q8 80 30 6" fill="none" stroke="url(#laurel-gold)" stroke-width="3" stroke-linecap="round" />
    <g v-for="i of leaves" :key="i" :transform="`translate(${36 - i * 3.2 + (i > 3 ? (i - 3) * 2.4 : 0)} ${108 - i * 15}) rotate(${-40 + i * 4})`">
      <ellipse cx="-9" cy="0" rx="10" ry="4.5" fill="url(#laurel-gold)" stroke="#8a5d00" stroke-width="1" />
      <ellipse cx="9" cy="-2" rx="10" ry="4.5" fill="url(#laurel-gold)" stroke="#8a5d00" stroke-width="1" transform="rotate(50 9 -2)" />
    </g>
  </svg>
</template>
