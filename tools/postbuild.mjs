// Make every mode path a real file so any static host works without rewrite rules
// (GitHub Pages, `npx serve dist`, S3...). Netlify/Cloudflare/Vercel work either way.
import { copyFileSync, mkdirSync } from 'node:fs'

const MODE_PATHS = ['wuyan', 'qiyan', 'endless', 'wuyan/endless', 'qiyan/endless']

for (const p of MODE_PATHS) {
  mkdirSync(`dist/${p}`, { recursive: true })
  copyFileSync('dist/index.html', `dist/${p}/index.html`)
}
copyFileSync('dist/index.html', 'dist/404.html')
console.log(`postbuild: created ${MODE_PATHS.map(p => `/${p}/`).join(', ')} and 404.html`)
