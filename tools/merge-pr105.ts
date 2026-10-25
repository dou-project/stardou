/* eslint-disable no-console */
/**
 * One-off: merge idioms from antfu/handle#105 into the answer pool.
 * Pinyin reference = chinese-xinhua idiom.json (same source as idioms.txt),
 * falling back to the PR's polyphones entry. Keeps the handle invariant:
 * a word lives in idioms.txt if the pinyin lib reads it right, else in polyphones.json.
 *
 * MERGE_ARGS=<analysis.json>,<xinhua idiom.json>,<pr polyphones.json> TEST=true vite-node tools/merge-pr105.ts
 */
import fs from 'fs'
import { getPinyinRaw as pinyin } from '../packages/tools/src/pinyin/get'
import { normalizePinyin } from './utils'

const [analysisPath, xinhuaPath, prPolyPath] = (process.env.MERGE_ARGS || '').split(',')
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'))
const xinhua = new Map<string, string>((JSON.parse(fs.readFileSync(xinhuaPath, 'utf8')) as any[]).map(i => [i.word, i.pinyin]))
const prPoly = JSON.parse(fs.readFileSync(prPolyPath, 'utf8')) as Record<string, string>

const polyPath = 'src/data/polyphones.json'
const polyphones = JSON.parse(fs.readFileSync(polyPath, 'utf8')) as Record<string, string>
const idioms = new Set(fs.readFileSync('src/data/idioms.txt', 'utf8').split('\n').map(i => i.trim()).filter(Boolean))

const computed = (w: string) => pinyin(w, { style: pinyin.STYLE_TONE2 }).map((i: string[]) => i[0]).join(' ')
const norm = (p: string) => normalizePinyin(p.replace(/ü/g, 'ü')).replace(/v0/g, 'v').replace(/ü/g, 'v').replace(/(\D)0\b/g, '$1')

// hand-checked against 《现代汉语词典》 where the PR and chinese-xinhua disagree and xinhua is wrong
const MANUAL: Record<string, string> = {
  一模一样: 'yi1 mu2 yi1 yang4',
  间不容发: 'jian1 bu4 rong2 fa4',
  稳操左券: 'wen3 cao1 zuo3 quan4',
  约定俗成: 'yue1 ding4 su2 cheng2',
  进退两难: 'jin4 tui4 liang3 nan2',
  情不自禁: 'qing2 bu4 zi4 jin1',
  一哄而散: 'yi1 hong4 er2 san4',
  一哄而上: 'yi1 hong4 er2 shang4',
  一哄而起: 'yi1 hong4 er2 qi3',
  欢呼雀跃: 'huan1 hu1 que4 yue4',
  单枪匹马: 'dan1 qiang1 pi3 ma3',
  约法三章: 'yue1 fa3 san1 zhang1',
  毛遂自荐: 'mao2 sui4 zi4 jian4',
  叶落归根: 'ye4 luo4 gui1 gen1',
  一丘之貉: 'yi1 qiu1 zhi1 he2',
  一邱之貉: 'yi1 qiu1 zhi1 he2',
  屡教不改: 'lv3 jiao4 bu4 gai3',
  愁眉不展: 'chou2 mei2 bu4 zhan3',
  龙吟虎啸: 'long2 yin2 hu3 xiao4',
  惊心动魄: 'jing1 xin1 dong4 po4',
}

const accepted: [string, string][] = []
const skipped: string[] = []
let disagree = 0
let fixedReadings = 0
for (const [word, hint] of analysis.new as [string, string][]) {
  if (!idioms.has(word) && !polyphones[word] && !xinhua.has(word)) {
    skipped.push(word)
    continue
  }
  const ref = MANUAL[word] || (xinhua.has(word) ? norm(xinhua.get(word)!) : prPoly[word])
  if (prPoly[word] && xinhua.has(word) && prPoly[word] !== ref)
    disagree++
  if (!ref || ref.split(' ').length !== 4 || !/^[a-z]+[0-4]?( [a-z]+[0-4]?){3}$/.test(ref)) {
    console.log('bad pinyin, skip', word, ref)
    skipped.push(word)
    continue
  }
  if (polyphones[word]) {
    // handle already hand-curated this reading
    if (polyphones[word] !== ref)
      console.log('keep handle reading', word, polyphones[word], '| ref', ref)
  }
  else if (computed(word) === ref) {
    idioms.add(word)
  }
  else {
    // the pinyin lib reads it wrong: pin the reference reading
    polyphones[word] = ref
    idioms.delete(word)
    fixedReadings++
  }
  accepted.push([word, hint])
}

fs.writeFileSync('src/answers/extra.json', `${JSON.stringify(accepted)}\n`)
fs.writeFileSync(polyPath, `${JSON.stringify(polyphones, null, 2)}\n`)
fs.writeFileSync('src/data/idioms.txt', `${Array.from(idioms).sort().join('\n')}\n`)
console.log({ accepted: accepted.length, skipped: skipped.length, disagree, fixedReadings })
console.log('skipped:', skipped.join(' '))
