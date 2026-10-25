import seedrandom from 'seedrandom'
import { getHint } from '../logic'
import { getPoem, getPoemAnswers } from '../logic/poems'
import type { PoemInfo } from '../logic/poems'
import { isEndless, mode } from '../modes'
import { answers } from './list'
import { seedShuffle } from './utils'
// idioms from https://github.com/antfu/handle/pull/105, filtered and re-checked by tools/merge-pr105.ts
import extra from './extra.json'

export interface DailyAnswer {
  word: string
  hint: string
  poem?: PoemInfo
}

/** handle's original, hand-picked daily list (index = day) */
const ORIGINAL_DAYS = answers.length

let _idiomPool: string[][] | undefined
/** original answers + PR #105 idioms, in a fixed shuffled order */
export function getIdiomPool() {
  if (!_idiomPool) {
    const seen = new Set<string>()
    const all = [...answers, ...(extra as string[][])].filter(([w]) => w && !seen.has(w) && seen.add(w))
    _idiomPool = seedShuffle(all, 'stardou-idioms')
  }
  return _idiomPool
}

/** number of distinct puzzles available in the current mode */
export function getPoolSize() {
  return mode.isPoem ? getPoemAnswers().length : getIdiomPool().length
}

export function getAnswerOfDay(day: number): DailyAnswer {
  if (isEndless)
    return getAnswerOfIndex(day)
  if (mode.isPoem)
    return getPoemAnswerOfDay(day)

  let answer: string[]
  if (day < ORIGINAL_DAYS) {
    // keep the original handle schedule
    answer = answers[day]
  }
  else {
    // after the original list: walk the extended pool, no repeats until it is exhausted
    const pool = getIdiomPool()
    answer = pool[(day - ORIGINAL_DAYS) % pool.length]
  }
  const [word = '', hint = ''] = answer
  return {
    word,
    hint: hint || getHint(word),
  }
}

/** puzzle #index of the endless pool */
export function getAnswerOfIndex(index: number): DailyAnswer {
  if (mode.isPoem)
    return getPoemAnswerOfDay(index + 1)
  const pool = getIdiomPool()
  const [word = '', hint = ''] = pool[((index % pool.length) + pool.length) % pool.length] || []
  return { word, hint: hint || getHint(word) }
}

function getPoemAnswerOfDay(day: number): DailyAnswer {
  const list = getPoemAnswers()
  if (day < 1 || !list.length)
    return { word: '', hint: '' }
  // the list is pre-shuffled at build time; loop over it once exhausted
  const [word, , poemIndex] = list[(day - 1) % list.length]
  return {
    word,
    hint: getHint(word),
    poem: getPoem(poemIndex),
  }
}

/** pick a random puzzle the player has not finished yet */
export function pickNextIndex(finished: Set<number>, current?: number) {
  const size = getPoolSize()
  const rng = seedrandom()
  for (let i = 0; i < 50; i++) {
    const n = Math.floor(rng() * size)
    if (!finished.has(n) && n !== current)
      return n
  }
  const left = Array.from({ length: size }, (_, i) => i).filter(i => !finished.has(i) && i !== current)
  return left.length ? left[Math.floor(rng() * left.length)] : Math.floor(rng() * size)
}
