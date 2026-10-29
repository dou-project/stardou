/* eslint-disable no-console */
// Run against a production build: pnpm build && pnpm test:poem-hints
// Build without VITE_SUPABASE_* (e.g. move .env.local aside): with accounts on, ?dev=hey is ignored.
// Uses an installed Chrome/Chromium; override its path with CHROME.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const candidates = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean)
const executablePath = candidates.find(path => fs.existsSync(path))
assert(executablePath, 'Set CHROME to the path of an installed Chrome/Chromium browser')

const server = await preview({ preview: { port: 4456, strictPort: true } })
let browser
const errors = []

async function openGame(mode, day = 1, saved, settings = {}) {
  const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 390, height: 844 } })
  await context.addInitScript(({ mode, day, saved, settings }) => {
    if (localStorage.getItem(`${mode}-test-initialized`))
      return
    localStorage.setItem(`${mode}-test-initialized`, 'true')
    localStorage.setItem(`stardou-${mode}-initialized`, 'true')
    localStorage.setItem('handle-locale', 'hans')
    localStorage.setItem('handle-mode', 'py')
    if (saved)
      localStorage.setItem(`stardou-${mode}-tries-meta`, JSON.stringify({ [day]: saved }))
    for (const [key, value] of Object.entries(settings))
      localStorage.setItem(key, String(value))
  }, { mode, day, saved, settings })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://localhost:4456/${mode}?d=${day}&dev=hey`)
  await page.locator('input').waitFor()
  const meta = () => page.evaluate(({ mode, day }) =>
    JSON.parse(localStorage.getItem(`stardou-${mode}-tries-meta`) || '{}')[day] || {}, { mode, day })
  const submit = async (word, count) => {
    await page.locator('input').fill(word)
    await page.locator('input').press('Enter')
    await page.waitForFunction(({ mode, day, count }) =>
      JSON.parse(localStorage.getItem(`stardou-${mode}-tries-meta`) || '{}')[day]?.tries?.length === count,
    { mode, day, count })
  }
  return { context, page, meta, submit }
}

try {
  browser = await chromium.launch({ executablePath, headless: true })
  for (const [mode, answer, wrong] of [
    ['wuyan', '长河落日圆', '天地玄黄宇'],
    ['qiyan', '长风破浪会有时', '天地玄黄宇宙洪'],
  ]) {
    const data = JSON.parse(fs.readFileSync(`src/data/poems/${mode}.json`, 'utf8'))
    const day = data.answers.findIndex(a => a[0] === answer) + 1
    assert(day > 0)
    const poem = data.poems[data.answers[day - 1][2]]
    const game = await openGame(mode, day)
    const { page, submit, meta } = game
    assert((await page.locator('main').innerText()).includes(`朝代 ${poem.d}`))
    assert(!(await page.locator('main').innerText()).includes(poem.a))

    // wrong guesses never reveal anything by themselves
    for (let count = 1; count <= 6; count++)
      await submit(wrong, count)
    assert.equal(await page.getByRole('status').count(), 0)
    assert(!(await page.locator('main').innerText()).includes('声母：'))
    assert.equal((await meta()).hint, undefined)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))

    // 提示 reveals one character at a time, and the poet stays hidden
    await page.getByRole('button', { name: '提示', exact: true }).click()
    await page.getByText('已揭示答案中的 1 个字').waitFor()
    assert(!(await page.locator('main').innerText()).includes(poem.a))
    assert.equal((await meta()).hintLevel, 1)

    // a reload keeps the game; winning shows the poem and its poet
    await page.reload()
    await page.locator('input').waitFor()
    assert.equal((await meta()).tries.length, 6)
    await submit(answer, 7)
    await page.getByText('全诗', { exact: false }).waitFor()
    await page.getByText(`${poem.d} · ${poem.a}`, { exact: true }).waitFor()
    await page.getByText(/提示 1 字 ·\s+\d/).waitFor()
    await page.getByRole('button', { name: '重置', exact: true }).click()
    await page.locator('input').waitFor()
    await game.context.close()

    const win = await openGame(mode, day, { tries: Array(4).fill(wrong) })
    await win.submit(answer, 5)
    await win.page.getByText('全诗', { exact: false }).waitFor()
    await win.page.getByText(`${poem.d} · ${poem.a}`, { exact: true }).waitFor()
    // the result line, not the 记分板 label of the same name
    await win.page.getByText(/无提示 ·\s+\d/).waitFor()
    assert.equal((await win.meta()).hint, undefined)
    await win.context.close()

    const reveal = await openGame(mode, day, { tries: Array(15).fill(wrong), failed: true })
    assert(!(await reveal.page.locator('main').innerText()).includes(poem.a))
    await reveal.page.getByRole('button', { name: '查看答案', exact: true }).first().click()
    await reveal.page.getByRole('button', { name: '查看答案', exact: true }).last().click()
    await reveal.page.getByText(`${poem.d} · ${poem.a}`, { exact: true }).waitFor()
    assert.equal((await reveal.meta()).answer, true)
    await reveal.page.reload()
    await reveal.page.getByText(`${poem.d} · ${poem.a}`, { exact: true }).waitFor()
    await reveal.context.close()

    const strict = await openGame(mode, day, { tries: Array(4).fill(wrong) }, { 'handle-strict': true })
    await strict.page.waitForLoadState('networkidle')
    await strict.page.locator('input').fill(wrong)
    await strict.page.locator('input').press('Enter')
    assert.equal((await strict.meta()).tries.length, 4)
    await strict.context.close()

    console.log(`${mode}: dynasty, no automatic hints, one-character hints, persistence, win, reveal and strict mode passed`)
  }
  assert.deepEqual(errors, [])
  console.log('No browser errors')
}
finally {
  await browser?.close()
  await new Promise(resolve => server.httpServer.close(resolve))
}
