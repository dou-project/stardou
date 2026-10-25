import { getHint } from '../logic'
import { getPoem, getPoemAnswers, getPoems } from '../logic/poems'
import type { PoemAnswer, PoemInfo } from '../logic/poems'
import { endlessKey, isEndless, mode } from '../modes'
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

const endlessOrders = new Map<string, number[]>()

/** share of 小学 / 初中 / 高中 lines, same as the daily schedule in tools/build-poems.py */
const GRADE_WEIGHTS: Record<number, number> = { 1: 6, 2: 3, 3: 1 }

/** smooth weighted round-robin over the 学段 pools; no two puzzles in a row from one poem */
export function interleaveByGrade(indices: number[], list: PoemAnswer[], poems: PoemInfo[]) {
  const pools = new Map<number, number[]>()
  for (const i of indices) {
    const g = poems[list[i][2]]?.g || 1
    pools.set(g, [...(pools.get(g) || []), i])
  }
  const credit = new Map<number, number>()
  const order: number[] = []
  while (order.length < indices.length) {
    const live = [...pools.keys()].filter(g => pools.get(g)!.length).sort()
    const total = live.reduce((s, g) => s + (GRADE_WEIGHTS[g] || 1), 0)
    for (const g of live)
      credit.set(g, (credit.get(g) || 0) + (GRADE_WEIGHTS[g] || 1))
    const g = live.reduce((a, b) => credit.get(b)! > credit.get(a)! ? b : a)
    credit.set(g, credit.get(g)! - total)
    const pool = pools.get(g)!
    const last = order.length ? list[order[order.length - 1]][2] : -1
    const k = Math.max(0, pool.findIndex(i => list[i][2] !== last))
    order.push(pool.splice(k, 1)[0])
  }
  return order
}

/** the order of the whole pool for an endless key; everyone with the same key gets the same order */
export function getEndlessOrder(key = endlessKey) {
  if (!endlessOrders.has(key)) {
    const shuffled = seedShuffle(Array.from({ length: getPoolSize() }, (_, i) => i), `stardou:${mode.id}:${key}`)
    endlessOrders.set(key, mode.isPoem ? interleaveByGrade(shuffled, getPoemAnswers(), getPoems()) : shuffled)
  }
  return endlessOrders.get(key)!
}

/** puzzle #index (0-based) of the endless sequence for the current key */
export function getAnswerOfIndex(index: number): DailyAnswer {
  const order = getEndlessOrder()
  if (!order.length)
    return { word: '', hint: '' }
  const poolIndex = order[((index % order.length) + order.length) % order.length]
  if (mode.isPoem)
    return getPoemAnswerOfDay(poolIndex + 1)
  const [word = '', hint = ''] = getIdiomPool()[poolIndex] || []
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
