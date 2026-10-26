// register vue composition api globally
import { createApp, watch } from 'vue'
import { isHome } from './modes'
import { loadModeData } from './logic/poems'
import { account, cloudEnabled, hasFullAccount, initCloud, restoreProgress, whenAuthReady } from './cloud'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

const params = new URLSearchParams(location.search)

initCloud()

/** game pages need a signed-in player with an avatar; until then the sign-in page holds #app */
async function requireAccount() {
  if (!cloudEnabled)
    return
  await whenAuthReady()
  if (hasFullAccount.value)
    return
  const { default: AuthGate } = await import('./components/AuthGate.vue')
  const gate = createApp(AuthGate)
  gate.mount('#app')
  await new Promise<void>((resolve) => {
    const stop = watch(hasFullAccount, (ok) => {
      if (ok) {
        stop()
        resolve()
      }
    })
  })
  gate.unmount()
}

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
    await requireAccount()
    await restoreFromAccount()
    const { default: App } = await import('./App.vue')
    createApp(App).mount('#app')
  })
}
