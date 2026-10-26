/* eslint-disable no-console */
// Run against a production build: pnpm build && pnpm test:poem-hints
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
    for (let count = 1; count <= 4; count++) {
      await submit(wrong, count)
      assert.equal(await page.getByRole('status').count(), 0)
    }
    await page.locator('input').fill('天')
    await page.locator('input').press('Enter')
    assert.equal((await meta()).tries.length, 4)
    assert.equal(await page.getByRole('status').count(), 0)
    await submit(wrong, 5)
    await page.getByRole('status').waitFor()
    const text = await page.getByRole('status').innerText()
    for (const part of ['声母：ch', '韵母：ang', '声调：二声（2）'])
      assert(text.includes(part), text)
    assert(!text.includes('长'))
    assert.equal((await meta()).hint, true)
    assert.equal((await meta()).poemPinyinHint, true)
    assert.equal((await meta()).hintLevel, undefined)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))

    await page.reload()
    await page.getByRole('status').waitFor()
    assert.equal(await page.getByRole('status').innerText(), text)
    await submit(wrong, 6)
    assert.equal(await page.getByRole('status').count(), 1)
    await page.getByRole('button', { name: '提示', exact: true }).click()
    await page.getByText('已揭示答案中的 1 个字').waitFor()
    assert(!(await page.locator('main').innerText()).includes(poem.a))
    // Reload closes the manual hint dialog and keeps the saved game.
    await page.reload()
    await page.getByRole('status').waitFor()
    await submit(answer, 7)
    await page.getByText('全诗', { exact: false }).waitFor()
    assert.equal(await page.getByRole('status').count(), 0)
    await page.getByText(`${poem.d} · ${poem.a}`, { exact: true }).waitFor()
    await page.getByRole('button', { name: '重置', exact: true }).click()
    await page.locator('input').waitFor()
    assert.equal(await page.getByRole('status').count(), 0)
    assert.equal((await meta()).poemPinyinHint, undefined)
    await game.context.close()

    const win = await openGame(mode, day, { tries: Array(4).fill(wrong) })
    await win.submit(answer, 5)
    await win.page.getByText('全诗', { exact: false }).waitFor()
    await win.page.getByText(`${poem.d} · ${poem.a}`, { exact: true }).waitFor()
    assert.equal(await win.page.getByRole('status').count(), 0)
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

    const disabled = await openGame(mode, day, { tries: Array(5).fill(wrong) }, { 'handle-hard-mode': true })
    assert.equal(await disabled.page.getByRole('status').count(), 0)
    assert.equal((await disabled.meta()).hint, undefined)
    await disabled.context.close()

    const strict = await openGame(mode, day, { tries: Array(4).fill(wrong) }, { 'handle-strict': true })
    await strict.page.waitForLoadState('networkidle')
    await strict.page.locator('input').fill(wrong)
    await strict.page.locator('input').press('Enter')
    assert.equal((await strict.meta()).tries.length, 4)
    assert.equal(await strict.page.getByRole('status').count(), 0)
    await strict.context.close()

    for (const inputMode of ['zy', 'sp']) {
      const alternate = await openGame(mode, day, { tries: Array(5).fill(wrong) }, { 'handle-mode': inputMode, 'handle-locale': 'hant' })
      await alternate.page.getByRole('status').waitFor()
      const hint = await alternate.page.getByRole('status').innerText()
      assert(hint.includes('聲母：ch') && hint.includes('韻母：ang') && hint.includes('聲調：二聲（2）'))
      await alternate.submit(answer, 6)
      await alternate.page.getByText('全詩', { exact: false }).waitFor()
      assert((await alternate.page.locator('main').innerText()).includes('首字讀音提示'))
      await alternate.context.close()
    }
    console.log(`${mode}: dynasty, five guesses, persistence, reset, win, strict mode, disabled hints, alternate input modes and results passed`)
  }

  for (const [mode, answer, initial, final] of [
    ['wuyan', '鱼戏莲叶间', 'y', 'ü'],
    ['qiyan', '峨眉山月半轮秋', '无（零声母）', 'e'],
  ]) {
    const data = JSON.parse(fs.readFileSync(`src/data/poems/${mode}.json`, 'utf8'))
    const day = data.answers.findIndex(a => a[0] === answer) + 1
    const game = await openGame(mode, day, { tries: Array(5).fill('天'.repeat(answer.length)) })
    await game.page.getByRole('status').waitFor()
    const text = await game.page.getByRole('status').innerText()
    assert(text.includes(`声母：${initial}`) && text.includes(`韵母：${final}`))
    await game.context.close()
  }
  const idiom = await openGame('chengyu', 1, { tries: Array(5).fill('天地玄黄') })
  assert.equal(await idiom.page.getByRole('status').count(), 0)
  assert.equal((await idiom.meta()).hint, undefined)
  await idiom.context.close()
  assert.deepEqual(errors, [])
  console.log('Zero initials, ü and idiom mode passed; no browser errors')
}
finally {
  await browser?.close()
  await new Promise(resolve => server.httpServer.close(resolve))
}
