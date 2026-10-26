/**
 * Accounts, avatars and the leaderboards (今日榜, 总榜), backed by Supabase.
 * Schema lives in supabase/migrations. The SDK is only fetched once someone
 * has signed in before or opens the board, so playing costs nothing extra.
 */
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { computed, ref, watch } from 'vue'
import type { GameMode, ModeId } from './modes'
import { BASE } from './modes'
import { SITE } from './site'

export const cloudEnabled = !!(SITE.supabase.url && SITE.supabase.anonKey)

export interface Account {
  id: string
  email: string
  nickname: string
  /** see `avatarUrl`; null until a photo is uploaded */
  avatarV: number | null
}

export const account = ref<Account | null>(null)
/** false while a stored sign-in is being restored or a new one is loading its profile */
export const authReady = ref(!cloudEnabled)

/** signed in with a profile photo: what the game pages require */
export const hasFullAccount = computed(() => !!account.value && account.value.avatarV != null)

let clientPromise: Promise<SupabaseClient> | undefined

function client() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      const c = createClient(SITE.supabase.url, SITE.supabase.anonKey)
      c.auth.onAuthStateChange((_event, session) => {
        // calling the client inside this callback can deadlock, so defer
        setTimeout(async () => {
          await setUser(session?.user ?? null)
          authReady.value = true
        })
      })
      return c
    })
  }
  return clientPromise
}

async function setUser(user: User | null) {
  if (account.value?.id === user?.id)
    return
  if (!user) {
    account.value = null
    return
  }
  authReady.value = false
  const c = await client()
  const { data } = await c.from('profiles').select('nickname, avatar_v').eq('id', user.id).maybeSingle()
  account.value = {
    id: user.id,
    email: user.email || '',
    nickname: data?.nickname || user.user_metadata?.nickname || '',
    avatarV: data?.avatar_v ?? null,
  }
  await uploadPendingAvatar()
  syncResults()
}

function hasStoredSession() {
  try {
    return Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
  }
  catch {
    return false
  }
}

/** coming back from a confirmation email: the session is in the URL */
function hasSessionInUrl() {
  return /[#&]access_token=|[?&]code=/.test(location.hash + location.search)
}

/** restore a previous sign-in; call once per page */
export function initCloud() {
  if (!cloudEnabled)
    return
  if (hasStoredSession() || hasSessionInUrl())
    client()
  else
    authReady.value = true
}

/** resolves once we know whether someone is signed in */
export function whenAuthReady() {
  return new Promise<void>((resolve) => {
    if (authReady.value)
      return resolve()
    const stop = watch(authReady, (ready) => {
      if (ready) {
        stop()
        resolve()
      }
    })
  })
}

export type AuthError = 'invalid' | 'exists' | 'weak' | 'unconfirmed' | 'email' | 'rate' | 'unknown'

function authError(e: { code?: string; message?: string; status?: number }): AuthError {
  switch (e.code) {
    case 'invalid_credentials': return 'invalid'
    case 'user_already_exists':
    case 'email_exists': return 'exists'
    case 'weak_password': return 'weak'
    case 'email_not_confirmed': return 'unconfirmed'
    case 'email_address_invalid':
    case 'validation_failed': return 'email'
  }
  if (e.status === 429)
    return 'rate'
  return 'unknown'
}

/**
 * `confirm` means the project requires clicking the emailed link before signing in;
 * the avatar then waits in this browser until that first sign-in.
 */
export async function signUp(email: string, password: string, nickname: string, avatar: Blob): Promise<{ error?: AuthError; confirm?: boolean }> {
  const c = await client()
  // stored first: the sign-in event that uploads it can fire before signUp returns
  await savePendingAvatar(email, avatar)
  const { data, error } = await c.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
      emailRedirectTo: location.origin + BASE,
    },
  })
  // with confirmations on, an already-registered email comes back as a user without identities
  const failed = error ? authError(error) : data.user && !data.user.identities?.length ? 'exists' : undefined
  if (failed) {
    clearPendingAvatar()
    return { error: failed }
  }
  return { confirm: !data!.session }
}

export async function signIn(email: string, password: string): Promise<{ error?: AuthError }> {
  const c = await client()
  const { error } = await c.auth.signInWithPassword({ email, password })
  return error ? { error: authError(error) } : {}
}

export async function signOut() {
  const c = await client()
  await c.auth.signOut()
}

export interface StoredMeta {
  passed?: boolean
  answer?: boolean
  failed?: boolean
  tries?: string[]
  hint?: boolean
  hintLevel?: number
  duration?: number
  [field: string]: unknown
}

export interface ResultRow {
  mode: ModeId
  puzzle: string
  tries: number
  hint_level: number
  passed: boolean
  duration_ms: number | null
}

// `<prefix>-tries-meta` for daily puzzles, `<prefix>-endless:<key>-tries-meta` for endless ones
const META_KEY = /^stardou-(chengyu|wuyan|qiyan)(?:-endless:(.*))?-tries-meta$/

/** every finished puzzle in this browser, across all modes and endless keys */
export function collectResults(storage: Storage = localStorage): ResultRow[] {
  return collectGames(storage).map(g => g.result)
}

export interface Game {
  mode: ModeId
  puzzle: string
  meta: StoredMeta
  result: ResultRow
}

const finished = (m?: StoredMeta) => !!m && !!(m.passed || m.answer || m.failed) && !!m.tries?.length

/** every finished game in this browser with its full record, across all modes and endless keys */
export function collectGames(storage: Storage = localStorage): Game[] {
  const games: Game[] = []
  for (let i = 0; i < storage.length; i++) {
    const match = storage.key(i)?.match(META_KEY)
    if (!match)
      continue
    const [key, mode, endlessKey] = match
    let history: Record<string, StoredMeta>
    try {
      history = JSON.parse(storage.getItem(key) || '{}') || {}
    }
    catch {
      continue
    }
    for (const [n, m] of Object.entries(history)) {
      if (!finished(m))
        continue
      const puzzle = endlessKey == null ? `d${n}` : `e:${endlessKey}:${n}`
      games.push({
        mode: mode as ModeId,
        puzzle,
        meta: m,
        result: {
          mode: mode as ModeId,
          puzzle,
          tries: Math.min(m.tries!.length, 200),
          hint_level: Math.min(m.hintLevel || (m.hint ? 1 : 0), 6),
          passed: !!m.passed,
          duration_ms: m.duration ? Math.min(Math.round(m.duration), 7 * 86400000) : null,
        },
      })
    }
  }
  return games
}

/** the localStorage key and history index a puzzle id lives at (inverse of collectGames) */
export function storageSlot(mode: ModeId, puzzle: string) {
  if (/^d\d+$/.test(puzzle))
    return { key: `stardou-${mode}-tries-meta`, n: puzzle.slice(1) }
  // endless keys may contain ':', the index is after the last one
  const m = puzzle.match(/^e:(.*):(\d+)$/)
  return m ? { key: `stardou-${mode}-endless:${m[1]}-tries-meta`, n: m[2] } : null
}

/**
 * Bring this player's finished games from other devices into this browser, so a puzzle
 * finished elsewhere shows as played. Games already finished here are kept. Run before the
 * game's own state reads localStorage.
 */
export async function restoreProgress(storage: Storage = localStorage) {
  const user = account.value
  if (!user)
    return 0
  const c = await client()
  const { data, error } = await c.from('progress').select('mode, puzzle, meta').eq('user_id', user.id).limit(5000)
  if (error || !data)
    return 0
  return mergeProgress(data as { mode: ModeId; puzzle: string; meta: StoredMeta }[], storage)
}

export function mergeProgress(rows: { mode: ModeId; puzzle: string; meta: StoredMeta }[], storage: Storage) {
  const histories = new Map<string, Record<string, StoredMeta>>()
  let restored = 0
  for (const { mode, puzzle, meta } of rows) {
    const slot = storageSlot(mode, puzzle)
    if (!slot || !finished(meta))
      continue
    if (!histories.has(slot.key)) {
      let h: Record<string, StoredMeta> = {}
      try {
        h = JSON.parse(storage.getItem(slot.key) || '{}') || {}
      }
      catch {}
      histories.set(slot.key, h)
    }
    const history = histories.get(slot.key)!
    if (finished(history[slot.n]))
      continue
    history[slot.n] = meta
    restored++
  }
  for (const [key, history] of histories) {
    try {
      storage.setItem(key, JSON.stringify(history))
    }
    catch {}
  }
  return restored
}

let syncing: Promise<void> = Promise.resolve()

/** upload finished puzzles; rows already on the board are left as they were */
export function syncResults() {
  syncing = syncing.then(async () => {
    if (!account.value || !clientPromise)
      return
    const games = collectGames()
    if (!games.length)
      return
    const c = await client()
    const user_id = account.value.id
    const [results, progress] = await Promise.all([
      c.from('results').upsert(
        games.map(g => ({ ...g.result, user_id })),
        { onConflict: 'user_id,mode,puzzle', ignoreDuplicates: true },
      ),
      c.from('progress').upsert(
        games.map(g => ({ user_id, mode: g.mode, puzzle: g.puzzle, meta: g.meta, updated_at: new Date().toISOString() })),
        { onConflict: 'user_id,mode,puzzle' },
      ),
    ])
    for (const { error } of [results, progress]) {
      if (error)
        console.warn('[stardou] sync failed', error.message)
    }
  }).catch(() => {})
  return syncing
}

export interface TodayRow {
  user_id: string
  nickname: string
  avatar_v: number | null
  tries: number
  hint_level: number
  passed: boolean
  duration_ms: number | null
}

/** solved first by fewest tries, then fewest hints, then fastest; gave up or over the limit last */
export function rankToday(rows: TodayRow[], triesLimit: number) {
  const lost = (r: TodayRow) => +!(r.passed && r.tries <= triesLimit)
  return [...rows].sort((a, b) =>
    lost(a) - lost(b)
    || a.tries - b.tries
    || a.hint_level - b.hint_level
    || (a.duration_ms ?? Infinity) - (b.duration_ms ?? Infinity)
    || a.nickname.localeCompare(b.nickname),
  )
}

function dayIndex(d: Date) {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

/** today's daily puzzle id for a mode, by the player's local date (same as the game) */
export function todayPuzzle(m: GameMode, now = new Date()) {
  return `d${dayIndex(now) - dayIndex(m.startDate)}`
}

const BOARD_LIMIT = 100

export async function fetchToday(m: GameMode) {
  const c = await client()
  await syncing
  const { data, error } = await c.from('results')
    .select('user_id, tries, hint_level, passed, duration_ms, profiles(nickname, avatar_v)')
    .eq('mode', m.id)
    .eq('puzzle', todayPuzzle(m))
    .order('passed', { ascending: false })
    .order('tries')
    .order('hint_level')
    .order('duration_ms', { nullsFirst: false })
    .limit(BOARD_LIMIT)
  if (error)
    throw error
  const rows = (data as any[]).map(({ profiles, ...r }) => ({ ...r, ...profiles }) as TodayRow)
  return rankToday(rows, m.tries)
}

export interface OverallRow {
  mode: ModeId | 'all'
  user_id: string
  nickname: string
  avatar_v: number | null
  games: number
  solved: number
  /** over solved puzzles; null before the first one */
  avg_tries: number | null
  hints: number
}

export async function fetchOverall(mode: ModeId | 'all') {
  const c = await client()
  await syncing
  const [board, mine] = await Promise.all([
    c.from('overall_board').select('*')
      .eq('mode', mode)
      .gt('solved', 0)
      .order('solved', { ascending: false })
      .order('avg_tries')
      .limit(BOARD_LIMIT),
    account.value
      ? c.from('overall_board').select('*').eq('mode', mode).eq('user_id', account.value.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (board.error)
    throw board.error
  return { rows: (board.data || []) as OverallRow[], mine: mine.data as OverallRow | null }
}

/** load the SDK so the sign-in form is instant */
export function prepareCloud() {
  if (cloudEnabled)
    client()
}

const AVATAR_SIZE = 256
const PENDING_AVATAR = 'stardou-pending-avatar'

export function avatarUrl(userId: string, v: number | null) {
  return v == null ? '' : `${SITE.supabase.url}/storage/v1/object/public/avatars/${userId}/avatar?v=${v}`
}

/** center-crop to a square and shrink, so every avatar is a few dozen KB */
export async function cropAvatar(file: File): Promise<Blob> {
  const src = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = src
    await img.decode()
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = AVATAR_SIZE
    canvas.getContext('2d')!.drawImage(
      img,
      (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
      0, 0, AVATAR_SIZE, AVATAR_SIZE,
    )
    const toBlob = (type: string) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.85))
    // Safari can't encode webp and silently hands back a png
    const webp = await toBlob('image/webp')
    const blob = webp?.type === 'image/webp' ? webp : await toBlob('image/jpeg')
    if (!blob)
      throw new Error('could not encode avatar')
    return blob
  }
  finally {
    URL.revokeObjectURL(src)
  }
}

export async function uploadAvatar(blob: Blob) {
  const user = account.value
  if (!user)
    throw new Error('not signed in')
  const c = await client()
  const { error } = await c.storage.from('avatars').upload(`${user.id}/avatar`, blob, {
    upsert: true,
    contentType: blob.type,
    cacheControl: '86400',
  })
  if (error)
    throw error
  const v = Date.now()
  const { error: e2 } = await c.from('profiles').update({ avatar_v: v }).eq('id', user.id)
  if (e2)
    throw e2
  if (account.value?.id === user.id)
    account.value = { ...account.value, avatarV: v }
}

async function savePendingAvatar(email: string, blob: Blob) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  try {
    localStorage.setItem(PENDING_AVATAR, JSON.stringify({ email: email.toLowerCase(), dataUrl }))
  }
  catch {}
}

function clearPendingAvatar() {
  try {
    localStorage.removeItem(PENDING_AVATAR)
  }
  catch {}
}

/** the photo picked at sign-up, once that same account is signed in */
async function uploadPendingAvatar() {
  let pending: { email: string; dataUrl: string } | null = null
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_AVATAR) || 'null')
  }
  catch {}
  if (!pending || pending.email !== account.value?.email.toLowerCase())
    return
  try {
    await uploadAvatar(await (await fetch(pending.dataUrl)).blob())
    clearPendingAvatar()
  }
  catch (e) {
    console.warn('[stardou] avatar upload failed', e)
  }
}

export type PlaceTier = 'lost' | 'only' | 'top' | 'last' | 'mid' | 'low'

/** where a player landed on a ranked 今日榜, for the result screen */
export function placeOf(ranked: TodayRow[], userId: string, triesLimit: number) {
  const index = ranked.findIndex(r => r.user_id === userId)
  if (index < 0)
    return null
  const me = ranked[index]
  const n = ranked.length
  const beaten = n > 1 ? Math.round((n - 1 - index) / (n - 1) * 100) : 0
  const tier: PlaceTier = !(me.passed && me.tries <= triesLimit)
    ? 'lost'
    : n === 1
      ? 'only'
      : index === 0
        ? 'top'
        : index === n - 1
          ? 'last'
          : beaten >= 50 ? 'mid' : 'low'
  return { index, beaten, tier, me }
}
