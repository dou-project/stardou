// register vue composition api globally
import { createApp } from 'vue'
import { isHome } from './modes'
import { loadModeData } from './logic/poems'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

const params = new URLSearchParams(location.search)

if (import.meta.env.DEV && params.has('og')) {
  // cover images, rendered by `pnpm covers`
  loadModeData().then(async () => {
    const { default: Cover } = await import('./components/Cover.vue')
    createApp(Cover).mount('#app')
  })
}
else if (isHome) {
  import('./components/Home.vue').then(({ default: Home }) => createApp(Home).mount('#app'))
}
else {
  // poem modes load their answer pool before any game state is evaluated
  loadModeData().then(async () => {
    const { default: App } = await import('./App.vue')
    createApp(App).mount('#app')
  })
}
