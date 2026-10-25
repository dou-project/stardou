import { shallowRef } from 'vue'
import { mode } from '../modes'

export interface PoemInfo {
  /** title */
  t: string
  /** author */
  a: string
  /** dynasty */
  d: string
  /** paragraphs, e.g. ['白日依山尽，黄河入海流。', ...] */
  p: string[]
  /** 学段 of the textbook: 1 小学, 2 初中, 3 高中 */
  g: number
}

/** [line, pinyin (TONE2, space separated), poem index] */
export type PoemAnswer = [string, string, number]

interface PoemData {
  poems: PoemInfo[]
  answers: PoemAnswer[]
}

let data: PoemData = { poems: [], answers: [] }

/** pinyin of every answer line in the current mode, used instead of the generic per-char lookup */
export const PoemPinyin: Record<string, string> = {}

type DataModule = Promise<{ default: PoemData }>

const loaders: Record<string, () => DataModule> = {
  wuyan: () => import('../data/poems/wuyan.json') as unknown as DataModule,
  qiyan: () => import('../data/poems/qiyan.json') as unknown as DataModule,
}

const corpusLoaders: Record<string, () => Promise<{ default: string }>> = {
  wuyan: () => import('../data/poems/wuyan-corpus.txt?raw'),
  qiyan: () => import('../data/poems/qiyan-corpus.txt?raw'),
}

/** Load the answer pool for the current mode. Must resolve before the app mounts. */
export async function loadModeData() {
  if (!mode.isPoem)
    return
  data = (await loaders[mode.id]()).default
  for (const [line, pinyin] of data.answers)
    PoemPinyin[line] = pinyin
}

export function getPoemAnswers() {
  return data.answers
}

export function getPoem(index: number): PoemInfo | undefined {
  return data.poems[index]
}

export function getPoems() {
  return data.poems
}

/** Full-text corpus for strict mode. Large, so it is only fetched when strict mode is used. */
export const poemCorpus = shallowRef<Set<string>>()
let corpusPromise: Promise<void> | undefined

export function ensurePoemCorpus() {
  if (!mode.isPoem)
    return Promise.resolve()
  if (!corpusPromise) {
    corpusPromise = corpusLoaders[mode.id]().then(({ default: raw }) => {
      poemCorpus.value = new Set(raw.split(/\r?\n/).filter(Boolean))
    })
  }
  return corpusPromise
}

export function checkValidPoemLine(word: string) {
  if (PoemPinyin[word])
    return true
  // corpus not loaded yet: don't block the player
  if (!poemCorpus.value)
    return true
  return poemCorpus.value.has(word)
}
