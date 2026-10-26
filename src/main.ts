// register vue composition api globally
import { createApp } from 'vue'
import { isHome } from './modes'
import { loadModeData } from './logic/poems'
import { account, cloudEnabled, initCloud, restoreProgress, whenAuthReady } from './cloud'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

const params = new URLSearchParams(location.search)

// signing in is optional: anyone can play, only signed-in players are on the leaderboards
initCloud()

/** games finished on other devices, before anything reads localStorage; never holds the page up for long */
async function restoreFromAccount() {
  if (!cloudEnabled)
    return
  await whenAuthReady()
  if (!account.value)
    return
  await Promise.race([
    restoreProgress().catch(() => 0),
    new Promise(resolve => setTimeout(resolve, 4000)),
  ])
}

if (import.meta.env.DEV && params.has('og')) {
  // cover images, rendered by `pnpm covers`
  loadModeData().then(async () => {
    const { default: Cover } = await import('./components/Cover.vue')
    createApp(Cover).mount('#app')
  })
}
else if (isHome) {
  // the cards say which daily puzzles are done
  restoreFromAccount()
    .then(() => import('./components/Home.vue'))
    .then(({ default: Home }) => createApp(Home).mount('#app'))
}
else {
  // poem modes load their answer pool before any game state is evaluated
  loadModeData().then(async () => {
    await restoreFromAccount()
    const { default: App } = await import('./App.vue')
    createApp(App).mount('#app')
  })
}
