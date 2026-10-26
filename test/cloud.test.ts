import { describe, expect, it } from 'vitest'
import type { TodayRow } from '../src/cloud'
import { collectGames, collectResults, mergeProgress, placeOf, rankToday, storageSlot, todayPuzzle } from '../src/cloud'
import { MODES } from '../src/modes'

function storage(items: Record<string, unknown>): Storage {
  const entries = Object.entries(items).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)] as const)
  return {
    length: entries.length,
    key: (i: number) => entries[i]?.[0] ?? null,
    getItem: (k: string) => entries.find(e => e[0] === k)?.[1] ?? null,
  } as Storage
}

describe('collectResults', () => {
  it('reads finished daily and endless puzzles across modes', () => {
    const rows = collectResults(storage({
      'stardou-chengyu-tries-meta': {
        3: { passed: true, tries: ['a', 'b', 'c'], hint: true, hintLevel: 2, duration: 61234.5 },
        4: { tries: ['a'] }, // still playing
        5: { answer: true, failed: true, tries: Array(10).fill('x') },
      },
      'stardou-qiyan-endless:春风 37-tries-meta': {
        0: { failed: true, tries: Array(15).fill('x') }, // out of tries, not yet given up
      },
      'stardou-wuyan-tries-meta': '{broken',
      'stardou-wuyan-initialized': true,
      'handle-mode': 'py',
    }))
    expect(rows).toEqual([
      { mode: 'chengyu', puzzle: 'd3', tries: 3, hint_level: 2, passed: true, duration_ms: 61235 },
      { mode: 'chengyu', puzzle: 'd5', tries: 10, hint_level: 0, passed: false, duration_ms: null },
      { mode: 'qiyan', puzzle: 'e:春风 37:0', tries: 15, hint_level: 0, passed: false, duration_ms: null },
    ])
  })

  it('keeps values inside the database limits', () => {
    const [row] = collectResults(storage({
      'stardou-chengyu-tries-meta': { 1: { passed: true, tries: Array(300).fill('x'), hintLevel: 9 } },
    }))
    expect(row.tries).toBe(200)
    expect(row.hint_level).toBe(6)
  })
})

describe('rankToday', () => {
  const row = (nickname: string, r: Partial<TodayRow>): TodayRow =>
    ({ user_id: nickname, nickname, avatar_v: null, tries: 1, hint_level: 0, passed: true, duration_ms: null, ...r })

  it('orders solved by tries, hints, time; gave up and over the limit last', () => {
    const ranked = rankToday([
      row('认输', { tries: 9, passed: false }),
      row('超次', { tries: 12 }),
      row('四次慢', { tries: 4, duration_ms: 90000 }),
      row('四次快', { tries: 4, duration_ms: 30000 }),
      row('四次没计时', { tries: 4 }),
      row('四次提示', { tries: 4, hint_level: 1, duration_ms: 1000 }),
      row('三次', { tries: 3, hint_level: 2 }),
    ], 10)
    expect(ranked.map(r => r.nickname)).toEqual(['三次', '四次快', '四次慢', '四次没计时', '四次提示', '认输', '超次'])
  })
})

describe('todayPuzzle', () => {
  it('counts local days from the mode start date', () => {
    const m = MODES[0]
    expect(todayPuzzle(m, new Date(m.startDate))).toBe('d0')
    expect(todayPuzzle(m, new Date(m.startDate.getFullYear(), m.startDate.getMonth(), m.startDate.getDate() + 3, 23, 59))).toBe('d3')
  })
})

describe('placeOf', () => {
  const row = (id: string, r: Partial<TodayRow> = {}): TodayRow =>
    ({ user_id: id, nickname: id, avatar_v: null, tries: 3, hint_level: 0, passed: true, duration_ms: null, ...r })
  const board = ['a', 'b', 'c', 'd', 'e'].map((id, i) => row(id, { tries: i + 2 }))

  it('ranks by position and percent beaten', () => {
    expect(placeOf(board, 'a', 10)).toMatchObject({ index: 0, beaten: 100, tier: 'top' })
    expect(placeOf(board, 'b', 10)).toMatchObject({ index: 1, beaten: 75, tier: 'mid' })
    expect(placeOf(board, 'c', 10)).toMatchObject({ index: 2, beaten: 50, tier: 'mid' })
    expect(placeOf(board, 'd', 10)).toMatchObject({ index: 3, beaten: 25, tier: 'low' })
    expect(placeOf(board, 'e', 10)).toMatchObject({ index: 4, beaten: 0, tier: 'last' })
  })

  it('handles giving up, a lone player, and someone not on the board', () => {
    expect(placeOf([row('a'), row('x', { passed: false, tries: 10 })], 'x', 10)?.tier).toBe('lost')
    expect(placeOf([row('a'), row('x', { tries: 12 })], 'x', 10)?.tier).toBe('lost')
    expect(placeOf([row('a')], 'a', 10)).toMatchObject({ tier: 'only', beaten: 0 })
    expect(placeOf([row('a')], 'z', 10)).toBeNull()
  })
})

function memoryStorage(items: Record<string, unknown> = {}): Storage {
  const map = new Map(Object.entries(items).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]))
  return {
    get length() { return map.size },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
    clear: () => map.clear(),
  }
}

describe('progress across devices', () => {
  it('maps puzzle ids back to localStorage slots', () => {
    expect(storageSlot('chengyu', 'd12')).toEqual({ key: 'stardou-chengyu-tries-meta', n: '12' })
    expect(storageSlot('qiyan', 'e:春风 37:4')).toEqual({ key: 'stardou-qiyan-endless:春风 37-tries-meta', n: '4' })
    expect(storageSlot('wuyan', 'e:a:b:7')).toEqual({ key: 'stardou-wuyan-endless:a:b-tries-meta', n: '7' })
    expect(storageSlot('wuyan', 'x1')).toBeNull()
  })

  it('round-trips: games collected on one device restore on another', () => {
    const desk = memoryStorage({
      'stardou-chengyu-tries-meta': { 1: { passed: true, tries: ['画龙点睛'], hintLevel: 1, duration: 5000, end: 9 } },
      'stardou-qiyan-endless:春风 37-tries-meta': { 3: { answer: true, failed: true, tries: Array(15).fill('x') } },
    })
    const rows = collectGames(desk).map(({ mode, puzzle, meta }) => ({ mode, puzzle, meta }))
    const phone = memoryStorage({
      // started today's puzzle on the phone but didn't finish; another puzzle finished here only
      'stardou-chengyu-tries-meta': { 1: { tries: ['一心一意'] }, 2: { passed: true, tries: ['守株待兔'] } },
    })
    expect(mergeProgress(rows, phone)).toBe(2)
    expect(JSON.parse(phone.getItem('stardou-chengyu-tries-meta')!)).toEqual({
      1: { passed: true, tries: ['画龙点睛'], hintLevel: 1, duration: 5000, end: 9 },
      2: { passed: true, tries: ['守株待兔'] },
    })
    expect(JSON.parse(phone.getItem('stardou-qiyan-endless:春风 37-tries-meta')!)[3].answer).toBe(true)
  })

  it('keeps a game already finished on this device, and ignores unfinished ones from the server', () => {
    const phone = memoryStorage({ 'stardou-chengyu-tries-meta': { 1: { passed: true, tries: ['a', 'b'] } } })
    expect(mergeProgress([
      { mode: 'chengyu', puzzle: 'd1', meta: { passed: true, tries: ['c'] } },
      { mode: 'chengyu', puzzle: 'd2', meta: { tries: ['d'] } },
    ], phone)).toBe(0)
    expect(JSON.parse(phone.getItem('stardou-chengyu-tries-meta')!)).toEqual({ 1: { passed: true, tries: ['a', 'b'] } })
  })
})
