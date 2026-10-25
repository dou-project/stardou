import { breakpointsTailwind } from '@vueuse/core'
import type { MatchType, ParsedChar } from './logic'
import { START_DATE, TRIES_LIMIT, WORD_LENGTH, parseWord as _parseWord, testAnswer as _testAnswer, checkPass, getHint, numberToHanzi } from './logic'
import { useNumberTone as _useNumberTone, inputMode, meta, spMode, tries } from './storage'
import { getAnswerOfDay } from './answers'
import { endlessKey, isEndless, mode } from './modes'
import { t } from './i18n'

export const isIOS = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isMobile = isIOS || /iPad|iPhone|iPod|Android|Phone|webOS/i.test(navigator.userAgent)
export const breakpoints = useBreakpoints(breakpointsTailwind)

export const now = useNow({ interval: 1000 })
const { width: windowWidth } = useWindowSize()
/** scale factor for a row of `length` tiles (each 5rem + margins = 88px) so it fits the screen */
export function getTileZoom(length: number) {
  if (length <= 4)
    return 1
  return Math.min(1, (windowWidth.value - 24) / (length * 88))
}
export const isDark = useDark()
export const showHint = ref(false)
export const showSettings = ref(false)
export const showHelp = ref(false)
export const showShare = ref(false)
export const showFailed = ref(false)
export const showDashboard = ref(false)
export const showCheatSheet = ref(false)
export const showShareDialog = ref(false)
export const useMask = ref(false)

export const useNumberTone = computed(() => {
  if (inputMode.value === 'sp')
    return true
  if (inputMode.value === 'zy')
    return false
  return _useNumberTone.value
})

const params = new URLSearchParams(window.location.search)
export const isDev = import.meta.hot || params.get('dev') === 'hey'
function localDayIndex(d: Date) {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}
// count local calendar days, so DST shifts never move the boundary
export const daySince = useDebounce(computed(() => localDayIndex(now.value) - localDayIndex(START_DATE)))
const PROGRESS_KEY = `${mode.storagePrefix}-endless-progress`

/** endless mode: how far each key has got, `{ [key]: puzzle index }` */
export function readEndlessProgress(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') || {}
  }
  catch {
    return {}
  }
}

function initialDayNo() {
  if (!isEndless)
    return +(params.get('d') || daySince.value)
  const fromUrl = params.get('i')
  if (fromUrl != null && /^\d+$/.test(fromUrl) && +fromUrl > 0)
    return +fromUrl - 1
  return readEndlessProgress()[endlessKey] || 0
}
/** day number, or the puzzle index (0-based) along the key's sequence in endless mode */
export const dayNo = ref(initialDayNo())
export const dayNoHanzi = computed(() => isEndless ? t('endless-resume', dayNo.value + 1) : `第${numberToHanzi(dayNo.value)}日`)
export const answer = computed(() =>
  params.get('word')
    ? {
        word: params.get('word')!,
        hint: getHint(params.get('word')!),
      }
    : getAnswerOfDay(dayNo.value),
)

export const hint = computed(() => answer.value.hint)
export const parsedAnswer = computed(() => parseWord(answer.value.word))

export const isPassed = computed(() => meta.value.passed || (tries.value.length && checkPass(testAnswer(parseWord(tries.value[tries.value.length - 1])))))
export const isFailed = computed(() => !isPassed.value && tries.value.length >= TRIES_LIMIT)
export const isFinished = computed(() => isPassed.value || meta.value.answer)

export function parseWord(word: string, _ans = answer.value.word, mode = inputMode.value, spM = spMode.value) {
  return _parseWord(word, _ans, mode, spM)
}

export function testAnswer(word: ParsedChar[], ans = parsedAnswer.value) {
  return _testAnswer(word, ans)
}

export const parsedTries = computed(() => tries.value.map((i) => {
  const word = parseWord(i)
  const result = testAnswer(word)
  return {
    word,
    result,
  }
}))

export function getSymbolState(symbol?: string | number, key?: '_1' | '_2' | 'tone') {
  const results: MatchType[] = []
  for (const t of parsedTries.value) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const w = t.word[i]
      const r = t.result[i]
      if (key) {
        if (w[key] === symbol)
          results.push(r[key])
      }
      else {
        if (w._1 === symbol)
          results.push(r._1)
        if (w._2 === symbol)
          results.push(r._2)
        if (w._3 === symbol)
          results.push(r._3)
      }
    }
  }
  if (results.includes('exact'))
    return 'exact'
  if (results.includes('misplaced'))
    return 'misplaced'
  if (results.includes('none'))
    return 'none'
  return null
}

/** endless mode: the next puzzle of the same key, without reloading */
export function nextPuzzle() {
  dayNo.value += 1
}

if (isEndless && endlessKey) {
  watch(dayNo, (n) => {
    try {
      const progress = readEndlessProgress()
      // keep the most recent keys only
      delete progress[endlessKey]
      const entries = [...Object.entries(progress), [endlessKey, n] as const].slice(-8)
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(Object.fromEntries(entries)))
      localStorage.setItem(`${mode.storagePrefix}-endless-last`, endlessKey)
    }
    catch {}
    const url = new URL(location.href)
    url.searchParams.set('key', endlessKey)
    url.searchParams.set('i', String(n + 1))
    replaceUrl(url)
  }, { immediate: true })
}

function replaceUrl(url: URL) {
  window.history.replaceState(null, '', url)
}
