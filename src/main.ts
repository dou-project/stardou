// register vue composition api globally
import { createApp } from 'vue'
import { loadModeData } from './logic/poems'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

// poem modes load their answer pool before any game state is evaluated
loadModeData().then(async () => {
  const { default: App } = await import('./App.vue')
  createApp(App).mount('#app')
})
