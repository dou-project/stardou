/**
 * Stress tests for the 兜兜 additions: every answer in every pool must
 * parse, have a well-formed reading, and the schedule must be stable.
 */
import fs from 'fs'
import { describe, expect, it } from 'vitest'
import { toZhuyin } from '@hankit/tools'
import extra from '../src/answers/extra.json'
import { answers } from '../src/answers/list'
import { getAnswerOfDay, getIdiomPool } from '../src/answers'
import { getPinyin } from '../src/logic/idioms'
import { parseWord, testAnswer } from '../src/logic/utils'
import wuyan from '../src/data/poems/wuyan.json'
import qiyan from '../src/data/poems/qiyan.json'

const HAN = /^\p{Script=Han}+$/u
const SYLLABLE = /^([a-z]+?)([0-5])?$/

function checkReading(word: string, reading: string[]) {
  expect(reading, word).toHaveLength(word.length)
  for (const p of reading) {
    const m = p.match(SYLLABLE)
    expect(m, `${word}: ${p}`).toBeTruthy()
    // must be a real syllable (zhuyin conversion fails otherwise)
    expect(toZhuyin(m![1].replace(/^([jqxy])v/, '$1u')), `${word}: ${p}`).toBeTruthy()
  }
}

describe('idiom pool', () => {
  const pool = getIdiomPool()

  it('has no duplicates and only 4-char hanzi', () => {
    const words = pool.map(i => i[0])
    expect(new Set(words).size).toBe(words.length)
    for (const w of words)
      expect(w, w).toMatch(/^\p{Script=Han}{4}$/u)
    expect(words.length).toBeGreaterThan(1400)
  })

  it('every hint char is part of its answer', () => {
    for (const [w, h] of [...answers, ...(extra as string[][])]) {
      if (h)
        expect(w, w).toContain(h)
    }
  })

  it('every answer has a valid reading and solves itself', () => {
    for (const [w] of pool) {
      checkReading(w, getPinyin(w))
      const parsed = parseWord(w, w)
      expect(testAnswer(parsed, parsed).every(r => r.char === 'exact'), w).toBe(true)
    }
  })

  it('keeps the original handle schedule', () => {
    for (let d = 1; d < answers.length; d++)
      expect(getAnswerOfDay(d).word).toBe(answers[d][0])
  })

  it('10 years of daily answers: valid, deterministic, no repeat within the pool size', () => {
    const seen = new Map<string, number>()
    for (let d = answers.length; d < answers.length + 3650; d++) {
      const a = getAnswerOfDay(d)
      expect(a.word, `day ${d}`).toMatch(/^\p{Script=Han}{4}$/u)
      expect(a.word).toContain(a.hint)
      expect(getAnswerOfDay(d).word).toBe(a.word)
      const last = seen.get(a.word)
      if (last != null)
        expect(d - last).toBeGreaterThanOrEqual(pool.length)
      seen.set(a.word, d)
    }
  })
})

describe.each([['wuyan', wuyan, 5], ['qiyan', qiyan, 7]] as const)('poem pool %s', (_, data, len) => {
  const answers = data.answers as [string, string, number][]

  it('lines are unique, right length, and belong to their poem', () => {
    expect(new Set(answers.map(a => a[0])).size).toBe(answers.length)
    for (const [line, , idx] of answers) {
      expect(line).toMatch(HAN)
      expect(line).toHaveLength(len)
      const poem = data.poems[idx]
      expect(poem, line).toBeTruthy()
      expect(poem.p.join(''), line).toContain(line)
      expect(poem.t && poem.a && poem.d, line).toBeTruthy()
    }
  })

  it('every reading is well-formed', () => {
    for (const [line, py] of answers)
      checkReading(line, py.split(' '))
  })

  it('no two consecutive days come from the same poem', () => {
    for (let i = 1; i < answers.length; i++)
      expect(answers[i][2] === answers[i - 1][2], answers[i][0]).toBe(false)
  })

  it('strict corpus contains every answer', () => {
    const corpus = new Set(fs.readFileSync(`src/data/poems/${_}-corpus.txt`, 'utf8').split('\n'))
    for (const [line] of answers)
      expect(corpus.has(line), line).toBe(true)
  })
})
