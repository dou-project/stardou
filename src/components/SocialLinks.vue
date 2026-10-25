<script setup lang="ts">
import { SITE } from '~/site'
</script>

<template>
  <div v-if="SITE.repo" flex p4 mt2>
    <a
      square-btn mx2 flex-gap-1 op50 hover:op80
      :href="SITE.repo"
      target="_blank"
    >
      <div i-carbon-logo-github />
      GitHub
    </a>
  </div>
</template>
