/**
 * Stress tests for the 开兜 additions: every answer in every pool must
 * parse, have a well-formed reading, and the schedule must be stable.
 */
import fs from 'fs'
import { describe, expect, it } from 'vitest'
import { toZhuyin } from '@hankit/tools'
import extra from '../src/answers/extra.json'
import { answers } from '../src/answers/list'
import { getAnswerOfDay, getEndlessOrder, getIdiomPool, interleaveByGrade } from '../src/answers'
import { seedShuffle } from '../src/answers/utils'
import { MODES } from '../src/modes'
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
    const corpus = new Set(fs.readFileSync(`src/data/poems/${_}-corpus.txt`, 'utf8').split(/\r?\n/))
    for (const [line] of answers)
      expect(corpus.has(line), line).toBe(true)
  })

  it('only uses poems from the textbook lists', () => {
    const titles = new Set(['primary', 'middle', 'high'].flatMap(f =>
      fs.readFileSync(`src/data/poems/textbook/${f}.txt`, 'utf8').split('\n')
        .filter(l => / \| .+ \| /.test(l) && !l.startsWith('#'))
        .map(l => l.split(' | ')[0].trim()),
    ))
    for (const p of data.poems) {
      expect(titles.has(p.t), p.t).toBe(true)
      expect([1, 2, 3]).toContain(p.g)
    }
  })

  it('daily order is 小学 6 : 初中 3 : 高中 1', () => {
    const grades = answers.slice(0, 100).map(a => data.poems[a[2]].g)
    expect(grades.filter(g => g === 1)).toHaveLength(60)
    expect(grades.filter(g => g === 2)).toHaveLength(30)
    expect(grades.filter(g => g === 3)).toHaveLength(10)
  })

  it('endless order is a weighted permutation that depends only on the key', () => {
    const order = (key: string) => interleaveByGrade(seedShuffle(answers.map((_, i) => i), `stardou:${_}:${key}`), answers, data.poems as any)
    const a = order('春风37')
    expect(order('春风37')).toEqual(a)
    expect(order('明月')).not.toEqual(a)
    expect([...a].sort((x, y) => x - y)).toEqual(answers.map((_, i) => i))
    const grades = a.slice(0, 50).map(i => data.poems[answers[i][2]].g)
    expect(grades.filter(g => g === 1)).toHaveLength(30)
    for (let i = 1; i < a.length; i++)
      expect(answers[a[i]][2] === answers[a[i - 1]][2], answers[a[i]][0]).toBe(false)
  })
})

describe('endless keys', () => {
  it('same key, same idiom order', () => {
    expect(getEndlessOrder('春风37')).toEqual(getEndlessOrder('春风37'))
    expect(getEndlessOrder('春风37')).not.toEqual(getEndlessOrder('春风38'))
    expect(new Set(getEndlessOrder('x')).size).toBe(getIdiomPool().length)
  })
})

describe.each(MODES.map(m => [m.id, m] as const))('rules examples %s', (_, m) => {
  const scored = (e: { word: string; answer: string }) => testAnswer(parseWord(e.word, e.answer), parseWord(e.answer, e.answer))
  const { exact, misplaced, parts, win } = m.rules

  it('have the mode length', () => {
    for (const w of [exact.word, misplaced.word, parts.word, win])
      expect(Array.from(w), w).toHaveLength(m.length)
  })

  it('color what the sentences say', () => {
    expect(scored(exact)[exact.at].char).toBe('exact')
    expect(scored(misplaced)[misplaced.at].char).toBe('misplaced')
    const p = scored(parts)
    expect(p[parts.at].char).toBe('none')
    expect(p[parts.at]._1).toBe('exact')
    expect(p[parts.at]._2).toBe('exact')
    expect(p[parts.final]._2).toBe('misplaced')
    expect(scored({ word: win, answer: win }).every(r => r.char === 'exact')).toBe(true)
  })
})
