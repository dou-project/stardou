/* eslint-disable no-console */
// Make every mode path a real file so any static host works without rewrite rules
// (GitHub Pages, `npx serve dist`, S3...), each with its own title and cover image.
// SITE_URL (e.g. https://dou-project.github.io/stardou/) makes og:image absolute for link previews.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const PAGES = [
  { path: 'chengyu', title: '成语', desc: '四字成语', og: 'og-chengyu.png' },
  { path: 'wuyan', title: '五言', desc: '课本里的五言诗句', og: 'og-wuyan.png' },
  { path: 'qiyan', title: '七言', desc: '课本里的七言诗句', og: 'og-qiyan.png' },
]

const base = process.env.SITE_URL || process.env.BASE_PATH || '/'
const prefix = base.endsWith('/') ? base : `${base}/`

const html = readFileSync('dist/index.html', 'utf8')
  .replace(/(property="og:image" content=")[^"]*/, `$1${prefix}og.png`)
  .replace(/(name="twitter:image" content=")[^"]*/, `$1${prefix}og.png`)

function page({ title, desc, og }, endless) {
  const name = `${title}${endless ? '·无限' : ''} · 开兜 StarDou`
  const description = `开兜 StarDou${endless ? ' 无限模式' : ''}：猜${desc}的汉字 Wordle`
  return html
    .replace(/<title>.*<\/title>/, `<title>${name}</title>`)
    .replace(/(name="description" content=")[^"]*/, `$1${description}`)
    .replace(/(property="og:title" content=")[^"]*/, `$1${name}`)
    .replace(/(property="og:description" content=")[^"]*/, `$1${description}`)
    .replaceAll(`${prefix}og.png`, `${prefix}${og}`)
}

writeFileSync('dist/index.html', html)
const written = []
for (const p of PAGES) {
  for (const endless of [false, true]) {
    const dir = `dist/${p.path}${endless ? '/endless' : ''}`
    mkdirSync(dir, { recursive: true })
    writeFileSync(`${dir}/index.html`, page(p, endless))
    written.push(`/${dir.slice(5)}/`)
  }
}
copyFileSync('dist/index.html', 'dist/404.html')
console.log(`postbuild: created ${written.join(', ')} and 404.html`)
