/**
 * 开兜 StarDou game modes. Every mode shares the same board and rules;
 * only the answer length, tries, answer pool and storage namespace differ.
 *
 * To add a mode: add an entry here, add its data loader in `logic/poems.ts`
 * (or reuse the idiom pool), add `name@<id>` style strings in `locales/`,
 * and add its paths to `tools/postbuild.mjs`.
 */
export type ModeId = 'chengyu' | 'wuyan' | 'qiyan'

/** A guess shown on the rules page, colored against `answer` (spaces never match) */
export interface RuleExample {
  word: string
  answer: string
  /** 0-based position the sentence talks about */
  at: number
}

export interface GameMode {
  id: ModeId
  /** URL path */
  path: string
  /** title shown in the navbar, e.g. 成语 */
  title: string
  titleHant: string
  /** one-line description on the home page */
  blurb: string
  blurbHant: string
  /** number of characters per answer */
  length: number
  tries: number
  /** local date of day 0; day 1 is the following day */
  startDate: Date
  storagePrefix: string
  isPoem: boolean
  /** decorative tiles on the home page card: [char, 'ok' | 'mis' | ''] */
  preview: [string, string][]
  rules: {
    exact: RuleExample
    misplaced: RuleExample
    /** `at` = the char whose initial and final match; `final` = the char whose final is misplaced */
    parts: RuleExample & { final: number }
    win: string
  }
}

/** day 1 of every mode */
const LAUNCH = new Date(2026, 9, 24)

export const MODES: GameMode[] = [
  {
    id: 'chengyu',
    path: '/chengyu',
    title: '成语',
    titleHant: '成語',
    blurb: '四字成语',
    blurbHant: '四字成語',
    length: 4,
    tries: 10,
    startDate: LAUNCH,
    storagePrefix: 'stardou-chengyu',
    isPoem: false,
    preview: [['画', 'ok'], ['龙', ''], ['点', 'mis'], ['睛', 'ok']],
    rules: {
      exact: { word: '班门弄斧', answer: ' 门  ', at: 1 },
      misplaced: { word: '水落石出', answer: '一一一水', at: 0 },
      parts: { word: '巧夺天工', answer: '桥它拖 ', at: 0, final: 1 },
      win: '武运昌隆',
    },
  },
  {
    id: 'wuyan',
    path: '/wuyan',
    title: '五言',
    titleHant: '五言',
    blurb: '五言诗句',
    blurbHant: '五言詩句',
    length: 5,
    tries: 15,
    startDate: LAUNCH,
    storagePrefix: 'stardou-wuyan',
    isPoem: true,
    preview: [['举', ''], ['头', 'ok'], ['望', ''], ['明', 'mis'], ['月', 'ok']],
    rules: {
      exact: { word: '床前明月光', answer: '   月 ', at: 3 },
      misplaced: { word: '白日依山尽', answer: ' 山   ', at: 3 },
      parts: { word: '春眠不觉晓', answer: '纯 天  ', at: 0, final: 1 },
      win: '举头望明月',
    },
  },
  {
    id: 'qiyan',
    path: '/qiyan',
    title: '七言',
    titleHant: '七言',
    blurb: '七言诗句',
    blurbHant: '七言詩句',
    length: 7,
    tries: 15,
    startDate: LAUNCH,
    storagePrefix: 'stardou-qiyan',
    isPoem: true,
    preview: [['两', 'ok'], ['个', ''], ['黄', ''], ['鹂', 'mis'], ['鸣', ''], ['翠', 'ok'], ['柳', '']],
    rules: {
      exact: { word: '两个黄鹂鸣翠柳', answer: '    鸣  ', at: 4 },
      misplaced: { word: '春风又绿江南岸', answer: '江      ', at: 4 },
      parts: { word: '千里江陵一日还', answer: '钱 七    ', at: 0, final: 1 },
      win: '两岸猿声啼不住',
    },
  },
]

/** where the site is served from: `/` locally, `/<repo>/` on GitHub Pages; always ends with `/` */
export const BASE: string = import.meta.env?.BASE_URL || '/'

/** href for a site path such as `/wuyan` or `/logo.webp`, under BASE */
export function href(path = '/') {
  return BASE + path.replace(/^\//, '')
}

const pathname = typeof window === 'undefined' ? '/' : window.location.pathname
const segments = (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname)
  .split('/').filter(Boolean).map(s => s.toLowerCase())

/** `/` is the home page where players pick a mode */
export const isHome = !MODES.some(m => m.path === `/${segments[0]}`)

export const mode = MODES.find(m => m.path === `/${segments[0]}`) || MODES[0]

/** 无限模式: `/<mode>/endless?key=...` — the key fixes the order, so friends with the same key get the same puzzles */
export const isEndless = !isHome && segments[1] === 'endless'

export function modeUrl(m: GameMode, endless = false) {
  return href(endless ? `${m.path}/endless` : m.path)
}

const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)

export const ENDLESS_KEY_MAX = 24

export function normalizeKey(key: string) {
  return key.trim().replace(/\s+/g, ' ').slice(0, ENDLESS_KEY_MAX)
}

function readLastKey() {
  try {
    return localStorage.getItem(`${mode.storagePrefix}-endless-last`) || ''
  }
  catch {
    return ''
  }
}

/** `?key=` (empty) explicitly asks for the key page; no param resumes the last key */
export const endlessKey = isEndless
  ? normalizeKey(params.has('key') ? params.get('key') || '' : readLastKey())
  : ''

/** `?word=` plays a custom answer; kept apart so it never counts as that day's result */
const customWord = params.get('word')

/** localStorage namespace for the current page; every endless key keeps its own record */
export const storagePrefix = customWord
  ? `${mode.storagePrefix}-word:${customWord}`
  : isEndless
    ? `${mode.storagePrefix}-endless:${endlessKey}`
    : mode.storagePrefix
