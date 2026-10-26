import { initialized, markEnd, markStart, meta, pauseTimer, useStrictMode } from './storage'
import { answer, dayNo, daySince, isDev, isFinished, isPassed, leaderboardTab, showCelebration, showCheatSheet, showHelp, showLeaderboard } from './state'
import { locale, t } from './i18n'
import { START_DATE } from './logic/constants'
import { tryFixAnswer } from './logic/answer-fix'
import { ensurePoemCorpus } from './logic/poems'
import { endlessKey, isEndless, mode } from './modes'
import { SITE } from './site'
import { account, cloudEnabled, syncResults } from './cloud'

useTitle(computed(() => `${locale.value === 'hant' ? mode.titleHant : mode.title} · ${t('site-name')} ${SITE.nameEn}`))

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

// signing out inside the game goes back to the sign-in page
if (cloudEnabled) {
  watch(account, (a) => {
    if (!a)
      location.reload()
  })
}

// out of tries counts as finished for the board, even if the player keeps guessing
watch(() => isFinished.value || !!meta.value.failed, (v) => {
  if (v)
    syncResults()
}, { flush: 'post' })

// finishing a puzzle (not reopening a finished one, nor stepping onto one in endless mode)
// shows where you landed, after the result and confetti: the award ceremony for the daily
// puzzle, 总榜 for endless ones
if (cloudEnabled) {
  watch([isFinished, dayNo], ([v, day], [old, oldDay]) => {
    if (v && !old && day === oldDay) {
      setTimeout(() => {
        // a second tab of the same game learns of the finish through localStorage; stay quiet there
        if (document.visibilityState !== 'visible')
          return
        if (isEndless) {
          leaderboardTab.value = 'overall'
          showLeaderboard.value = true
        }
        else {
          showCelebration.value = true
        }
      }, 2000)
    }
  })
}

const visible = useDocumentVisibility()

let leaveTime = 0
const REFRESH_TIME = 1000 * 60 * 60 * 3 // 3 hours
// Only react to the tab being shown or hidden. Reacting to `meta` as well makes two open tabs
// rewrite each other's timer through localStorage forever, and a guess made meanwhile gets lost.
watch(visible, (v) => {
  if (v === 'visible') {
    // left for a long while, refresh the page for updates
    if (leaveTime && Date.now() - leaveTime > REFRESH_TIME)
      location.reload()

    // restart timer
    if (meta.value.duration)
      markStart()
  }
  else if (v === 'hidden') {
    leaveTime = Date.now()
    pauseTimer()
  }
}, { flush: 'post', immediate: true })

nextTick(() => {
  // if (acceptCollecting.value)
  //   sendAnalytics()

  tryFixAnswer(dayNo.value)
})

if (isDev || import.meta.hot) {
  const theDate = new Date(+START_DATE + dayNo.value * 86400000)
  // eslint-disable-next-line no-console
  console.log(isEndless ? `#${dayNo.value + 1}` : `D${dayNo.value}`, isEndless ? endlessKey : theDate.toLocaleDateString(), answer.value.word, answer.value.hint)
}
