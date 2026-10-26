<script setup lang="ts">
/** the award mascot: a crying potato with a bow, or a grinning one with a crown */
defineProps<{ happy?: boolean }>()
</script>

<template>
  <svg viewBox="0 0 140 140" role="img" aria-hidden="true">
    <defs>
      <radialGradient id="potato-skin" cx="40%" cy="35%" r="70%">
        <stop offset="0" stop-color="#f1c27d" />
        <stop offset="1" stop-color="#c98f45" />
      </radialGradient>
    </defs>
    <path
      d="M70 22c26 0 44 18 46 44 2 30-14 56-46 58-31 2-50-22-48-52 2-28 20-50 48-50z"
      fill="url(#potato-skin)" stroke="#7a4a1c" stroke-width="3"
    />
    <g fill="#a8702f" opacity=".55">
      <ellipse cx="48" cy="52" rx="3" ry="2" />
      <ellipse cx="96" cy="60" rx="2.5" ry="2" />
      <ellipse cx="88" cy="104" rx="3" ry="2" />
      <ellipse cx="44" cy="96" rx="2" ry="1.5" />
    </g>
    <ellipse cx="47" cy="86" rx="8" ry="5" fill="#ff8fb1" opacity=".7" />
    <ellipse cx="93" cy="86" rx="8" ry="5" fill="#ff8fb1" opacity=".7" />

    <template v-if="happy">
      <path d="M48 70q8-9 16 0M76 70q8-9 16 0" fill="none" stroke="#3b2410" stroke-width="4" stroke-linecap="round" />
      <path d="M54 88q16 18 32 0z" fill="#7a2a1c" stroke="#3b2410" stroke-width="3" stroke-linejoin="round" />
      <path d="M60 94q10 6 20 0" fill="#ff7a8a" />
      <g transform="translate(70 22)">
        <path d="M-30 4l8-24 12 14 10-20 10 20 12-14 8 24z" fill="#ffd23f" stroke="#a86b00" stroke-width="3" stroke-linejoin="round" />
        <circle cx="0" cy="-2" r="4" fill="#ff3b6b" />
        <circle cx="-18" cy="0" r="3" fill="#3bb4ff" />
        <circle cx="18" cy="0" r="3" fill="#3bb4ff" />
      </g>
    </template>
    <template v-else>
      <path d="M44 64l14-6M96 64l-14-6" stroke="#3b2410" stroke-width="3.5" stroke-linecap="round" />
      <ellipse cx="56" cy="74" rx="8" ry="9" fill="#2a1a0c" />
      <ellipse cx="84" cy="74" rx="8" ry="9" fill="#2a1a0c" />
      <circle cx="59" cy="70" r="3" fill="#fff" />
      <circle cx="87" cy="70" r="3" fill="#fff" />
      <path d="M58 98q12-9 24 0" fill="none" stroke="#3b2410" stroke-width="3.5" stroke-linecap="round" />
      <path d="M50 82q-4 10 0 16q4-6 0-16z" fill="#7fd3ff" stroke="#2f8fd1" stroke-width="1.5" class="tear" />
      <path d="M90 82q-4 10 0 16q4-6 0-16z" fill="#7fd3ff" stroke="#2f8fd1" stroke-width="1.5" class="tear late" />
      <g transform="translate(100 30) rotate(18)">
        <path d="M0 0l-22-14v28zM0 0l22-14v28z" fill="#ff4fa3" stroke="#c2186b" stroke-width="2.5" stroke-linejoin="round" />
        <circle r="6" fill="#ff7cc0" stroke="#c2186b" stroke-width="2.5" />
        <g fill="#fff">
          <circle cx="-13" cy="-4" r="1.8" /><circle cx="-9" cy="6" r="1.5" /><circle cx="12" cy="-5" r="1.8" /><circle cx="15" cy="5" r="1.5" />
        </g>
      </g>
    </template>
  </svg>
</template>

<style scoped>
.tear {
  animation: drip 1.6s ease-in infinite;
}
.tear.late {
  animation-delay: 0.8s;
}
@keyframes drip {
  0% { transform: translateY(0); opacity: 1; }
  80% { transform: translateY(14px); opacity: 0.9; }
  100% { transform: translateY(16px); opacity: 0; }
}
</style>
