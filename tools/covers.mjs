/* eslint-disable no-console */
// Render the cover images (README + og:image) from src/components/Cover.vue.
// Usage: pnpm covers   (uses the installed Google Chrome; set CHROME=/path/to/chrome to override)
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 4455
const COVERS = [
  ['home', '/', 'public/og.png'],
  ['chengyu', '/chengyu', 'public/og-chengyu.png'],
  ['wuyan', '/wuyan', 'public/og-wuyan.png'],
  ['qiyan', '/qiyan', 'public/og-qiyan.png'],
]

const server = await createServer({ server: { port: PORT, strictPort: true, hmr: false } })
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2, locale: 'zh-CN' })
  for (const [kind, path, out] of COVERS) {
    await page.goto(`http://localhost:${PORT}${path}?og=${kind}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: out })
    console.log(`covers: ${out}`)
  }
}
finally {
  await browser.close()
  await server.close()
}
