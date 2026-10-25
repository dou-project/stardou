import { initialized, markEnd, markStart, meta, pauseTimer, useStrictMode } from './storage'
import { answer, dayNo, daySince, isDev, isFinished, isPassed, showCheatSheet, showHelp } from './state'
import { t } from './i18n'
import { answers } from './answers/list'
import { START_DATE } from './logic/constants'
import { tryFixAnswer } from './logic/answer-fix'
import { ensurePoemCorpus } from './logic/poems'
import { isEndless, mode } from './modes'
import { SITE } from './site'

useTitle(computed(() => `${t('name')} - ${t('description')} · ${SITE.name}`))

if (!initialized.value)
  showHelp.value = true

// strict mode in poem modes needs the full-text corpus
watchEffect(() => {
  if (mode.isPoem && useStrictMode.value)
    ensurePoemCorpus()
})

watchEffect(() => {
  if (isPassed.value)
    meta.value.passed = true
})

watch(daySince, (n, o) => {
  // on day changed
  if (!isEndless && o === dayNo.value && isFinished.value)
    dayNo.value = n
})

watch([isFinished, meta], () => {
  if (isFinished.value)
    markEnd()
    // sendAnalytics()
}, { flush: 'post' })

watch(isFinished, (v) => {
  if (v)
    showCheatSheet.value = false
}, { flush: 'post' })

const visible = useDocumentVisibility()

let leaveTime = 0
const REFRESH_TIME = 1000 * 60 * 60 * 3 // 3 hours
watchEffect(() => {
  if (visible.value === 'visible') {
    // left for a long while, refresh the page for updates
    if (leaveTime && Date.now() - leaveTime > REFRESH_TIME)
      location.reload()

    // restart timer
    if (meta.value.duration)
      markStart()
  }
  else if (visible.value === 'hidden') {
    leaveTime = Date.now()
    pauseTimer()
  }
}, { flush: 'post' })

nextTick(() => {
  // if (acceptCollecting.value)
  //   sendAnalytics()

  tryFixAnswer(dayNo.value)
})

if (isDev || import.meta.hot) {
  const theDate = new Date(+START_DATE + dayNo.value * 86400000)
  // eslint-disable-next-line no-console
  console.log(`D${dayNo.value}`, theDate.toLocaleDateString(), answer.value.word, answer.value.hint)
}

if (import.meta.hot && !mode.isPoem) {
  // eslint-disable-next-line no-console
  console.log(`${answers.length} days prepared, later days are drawn randomly from the list`)
}
