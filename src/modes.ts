/**
 * 兜兜 (Stardou) game modes. Every mode shares the exact same UI and rules;
 * only the answer length, answer pool and storage namespace differ.
 *
 * To add a mode: add an entry here, add its data loader in `logic/poems.ts`
 * (or reuse the idiom pool), and add `name@<id>` style strings in `locales/`.
 */
export type ModeId = 'idiom' | 'wuyan' | 'qiyan'

export interface GameMode {
  id: ModeId
  /** URL path, `/` for the default mode */
  path: string
  /** short label shown in the mode switcher */
  label: string
  labelHant: string
  /** number of characters per answer */
  length: number
  /** local date of day 0; day 1 is the following day */
  startDate: Date
  /** localStorage namespace; idiom keeps the original handle keys so old records survive */
  storagePrefix: string
  isPoem: boolean
}

export const MODES: GameMode[] = [
  {
    id: 'idiom',
    path: '/',
    label: '汉兜',
    labelHant: '漢兜',
    length: 4,
    startDate: new Date(2022, 0, 0),
    storagePrefix: 'handle',
    isPoem: false,
  },
  {
    id: 'wuyan',
    path: '/wuyan',
    label: '五言',
    labelHant: '五言',
    length: 5,
    startDate: new Date(2026, 9, 24),
    storagePrefix: 'stardou-wuyan',
    isPoem: true,
  },
  {
    id: 'qiyan',
    path: '/qiyan',
    label: '七言',
    labelHant: '七言',
    length: 7,
    startDate: new Date(2026, 9, 24),
    storagePrefix: 'stardou-qiyan',
    isPoem: true,
  },
]

const segments = typeof window === 'undefined'
  ? []
  : window.location.pathname.split('/').filter(Boolean).map(s => s.toLowerCase())

export const mode = MODES.find(m => m.path === `/${segments[0]}`) || MODES[0]

/** 无限模式: `/endless`, `/wuyan/endless`, `/qiyan/endless` — one puzzle after another */
export const isEndless = segments.includes('endless')

export function modeUrl(m: GameMode, endless = false) {
  if (!endless)
    return m.path
  return m.path === '/' ? '/endless' : `${m.path}/endless`
}

/** localStorage namespace for the current page */
export const storagePrefix = isEndless ? `${mode.storagePrefix}-endless` : mode.storagePrefix
