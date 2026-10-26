<script setup lang="ts">
import {
  breakpoints,
  leaderboardTab,
  showCelebration,
  showCheatSheet,
  showDashboard,
  showFailed,
  showHelp,
  showHint,
  showLeaderboard,
  showSettings,
  showShareDialog,
} from '~/state'
import { account, cloudEnabled } from '~/cloud'
import { mode } from '~/modes'

const lg = breakpoints.lg
</script>

<template>
  <Modal v-model="showCheatSheet" :direction="lg ? 'right' : 'top'" :mask="!lg">
    <CheatSheet />
  </Modal>
  <Modal v-model="showSettings" direction="top">
    <Settings my6 />
  </Modal>
  <Modal v-model="showHint" direction="top">
    <Hint />
  </Modal>
  <Modal v-model="showFailed" direction="top">
    <FailedPage />
  </Modal>
  <Modal v-model="showDashboard" direction="top">
    <Dashboard />
  </Modal>
  <Modal v-model="showShareDialog" direction="top">
    <ShareDialog />
  </Modal>
  <Modal v-if="cloudEnabled" v-model="showLeaderboard" direction="top">
    <Leaderboard :initial-mode="mode.id" :initial-tab="leaderboardTab" :active="showLeaderboard" @close="showLeaderboard = false" />
  </Modal>
  <Celebration
    v-if="cloudEnabled && showCelebration && account"
    @close="showCelebration = false"
    @board="showCelebration = false; leaderboardTab = 'today'; showLeaderboard = true"
  />
  <Modal v-model="showHelp" direction="top">
    <WelcomePage />
  </Modal>
</template>
