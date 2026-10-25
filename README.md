![](./public/og.png)

# 开兜 StarDou

A Chinese Hanzi Wordle with three entrances: idioms, five-character and seven-character lines of classical poetry. 汉字 Wordle：猜成语，猜诗句。

[stardou.org](https://stardou.org)

请勿剧透！PLEASE DO NOT SPOIL

> **Note**
> 开兜基于 [antfu/handle](https://github.com/antfu/handle)（汉兜）修改而来，棋盘与配色规则保持一致，增加了五言、七言两个诗句入口和带密钥的无限模式。感谢 [Anthony Fu](https://github.com/antfu) 与 [Inès](https://twitter.com/iiiiiiines_____) 的原作。

| 成语 | 五言 | 七言 |
| --- | --- | --- |
| ![](./public/og-chengyu.png) | ![](./public/og-wuyan.png) | ![](./public/og-qiyan.png) |

## 玩法

首页选择入口，进入之后只有「返回首页」，不会再看到其他入口。第一次进入某个入口时会先展示该入口的游戏规则（示例按四字 / 五言 / 七言分别给出）。

| 入口 | 每日 | 无限 | 字数 | 机会 | 题库 |
| --- | --- | --- | --- | --- | --- |
| 成语 | [`/chengyu`](https://stardou.org/chengyu) | [`/chengyu/endless`](https://stardou.org/chengyu/endless) | 4 | 10 次 | 1448 个成语：汉兜原题库 424 个 + [handle#105](https://github.com/antfu/handle/pull/105) 新增 1024 个 |
| 五言 | [`/wuyan`](https://stardou.org/wuyan) | [`/wuyan/endless`](https://stardou.org/wuyan/endless) | 5 | 15 次 | 414 句，出自 68 首课本诗词 |
| 七言 | [`/qiyan`](https://stardou.org/qiyan) | [`/qiyan/endless`](https://stardou.org/qiyan/endless) | 7 | 15 次 | 665 句，出自 127 首课本诗词 |

- **每日**：每个入口每天一题，所有人同一天拿到同一题，零点更新。成语前 424 天沿用汉兜原题目顺序，之后按固定顺序遍历扩充后的题库。
- **无限**：先输入一个密钥（或随机生成），之后一题接一题。**同一个密钥的题目顺序永远相同**，把密钥告诉朋友就能一起玩、对答案；链接形如 `/wuyan/endless?key=春风37&i=3`。每个密钥的进度和战绩分开保存，首页和密钥页会列出最近用过的密钥。
- **诗句**：题目上方直接给出诗人；每点一次「提示」就在原位置揭示答案中的一个字（顺序固定，最多揭示到只差一个字），已揭示的字会显示在诗人下方；猜完后展示全诗、高亮答案句，并标注出自小学 / 初中 / 高中课本。
- 各入口的战绩分开记录，设置（拼音 / 注音 / 双拼、简繁、深色模式、严格模式等）共享。严格模式下诗句须在诗库中（诗库首次使用时按需加载）。

## 诗句题库

答案只取统编版（人教社）语文课本中要求背诵的古诗词，手工整理在 [src/data/poems/textbook](./src/data/poems/textbook)：

| 文件 | 学段 | 篇目 | 每日出题占比 |
| --- | --- | --- | --- |
| [primary.txt](./src/data/poems/textbook/primary.txt) | 小学（1-6 年级课文、日积月累、古诗词诵读） | 110 首 | 60% |
| [middle.txt](./src/data/poems/textbook/middle.txt) | 初中（7-9 年级课文、课外古诗词诵读） | 53 首 | 30% |
| [high.txt](./src/data/poems/textbook/high.txt) | 高中（必修、选择性必修中最常背的篇目，长篇只取名段） | 21 首 | 10% |

- 每日顺序按 小学 : 初中 : 高中 = 6 : 3 : 1 交错排列（任意连续 10 天中都是 6 : 3 : 1，直到某个学段用完），相邻两天不出自同一首诗；无限模式按同样比例、以密钥为种子排列。
- 正文按课本用字，例如《静夜思》「床前明月光 / 举头望明月」、《游园不值》「小扣柴扉久不开」、《泊船瓜洲》「春风又绿江南岸」。构建脚本会把每一句与 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 比对，列出不一致的句子供人工确认（多为课本异文、异体字，或数据集未收录的元明清及近现代作品）。
- 读音由 [pypinyin](https://github.com/mozillazg/python-pinyin) 生成，再由 [pinyin-fixes.json](./src/data/poems/pinyin-fixes.json) 按句覆盖古诗中的多音字（行、长、重、还、塞、骑、看……）；「一」「不」统一标本调，与成语数据一致。

修改题库：编辑 `textbook/*.txt`（格式见文件开头），然后重新生成：

```bash
pip install opencc-python-reimplemented pypinyin
git clone --depth 1 https://github.com/chinese-poetry/chinese-poetry.git
pnpm run poems ./chinese-poetry
```

**修改题库会改变之后每天的题目**，上线后请只追加读音勘误。

## 成语勘误

成语数据库储存于

- [./src/data/idioms.txt](./src/data/idioms.txt) - 已知的成语列表
- [./src/data/polyphones.json](./src/data/polyphones.json) - 特殊发音的成语列表

二者互不包含。

如遇到成语缺失或发音错误，请编辑 [./src/data/new.txt](./src/data/new.txt) 文件，一行一词，完成后执行 `pnpm run update` 命令，脚本会自动抓取 [汉典](https://www.zdic.net/) 的数据更新成语数据库。如遇汉典中也缺失的成语，其会留存在 new.txt 中，需要手动判断与添加。

### 新增成语（handle#105）

[antfu/handle#105](https://github.com/antfu/handle/pull/105)（作者 Nestor Qin，未合并入上游）新增了 1051 个成语，PR 中注明的来源为：

- 岭南大学 香港中文书面语水平测试成语表：[Cheng Yu Table.pdf](https://www.ln.edu.hk/cleac/f/page/72842/Cheng%20Yu%20Table.pdf)
- 《分类常用成语大全》（PR 未给出版本与链接）
- 微信公众号文章《中国成语大全，值得收藏！》：[链接](https://mp.weixin.qq.com/s?__biz=MzA4OTQ1OTgwNQ==&mid=402870742&idx=7&sn=567e8062d5c1cfb4fe8bdde16c60c283)

开兜通过 [tools/merge-pr105.ts](./tools/merge-pr105.ts) 合入，并做了以下处理（结果在 [src/answers/extra.json](./src/answers/extra.json)）：

- 剔除 27 个不在 [chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua) 成语词典中的词，多为错字或非成语，例如 赞谈不已（赞叹不已）、视入草芥（视如草芥）、静静乐道（津津乐道）、金光灿烂、断断续续
- 读音以 chinese-xinhua 为准，而不是 PR 自带的拼音（PR 中有 落 读 la4、为虎作伥 读 wei2 等错误）；两者都有误时按《现代汉语词典》人工校对，如 一模一样 mú、情不自禁 jīn、叶落归根 guī
- 只有拼音库读错的词才写入 `polyphones.json`，保持上面「二者互不包含」的约定

## Development Setup

- Install [Node.js](https://nodejs.org/en/) >=v18 and [pnpm](https://pnpm.io/) 8
- Run `pnpm install`
- Run `pnpm dev` and visit `http://localhost:4444` (home), `/chengyu`, `/wuyan`, `/qiyan`, and `/<mode>/endless`
- Run `pnpm test` to validate every answer in every pool (readings, lengths, schedule, endless keys, rules examples)
- Run `pnpm covers` to re-render the cover images in `public/` (`og*.png`) with the installed Google Chrome
- 测试用：在地址后加 `?dev=hey` 可以切换前后日期、重置，并在控制台看到当天答案

## 新增入口

1. 在 [./src/modes.ts](./src/modes.ts) 中添加一项（路径、字数、机会次数、起始日期、存储前缀、首页预览、规则示例）
2. 在 [./src/logic/poems.ts](./src/logic/poems.ts) 中注册数据加载
3. 在 [./src/locales](./src/locales) 中添加 `name@<id>`、`description@<id>`、`intro-2@<id>`、`input-placeholder@<id>` 等文案（简繁两份）
4. 在 [./tools/postbuild.mjs](./tools/postbuild.mjs) 和 [./src/components/Cover.vue](./src/components/Cover.vue) 中添加路径与封面

## 部署

纯静态站点，无后端。`pnpm build` 产出 `dist/`，每个入口（含 `/<mode>/endless`）都会生成带各自标题与封面的 `index.html`，任何静态托管都能直接使用。

- **GitHub Pages**：免费方案下 Pages 只能从**公开**仓库发布（私有仓库发布需要 GitHub Pro / Team）。[deploy.yml](./.github/workflows/deploy.yml) 在私有仓库中会自动跳过，在公开仓库中推送到 `main` 即部署（仓库设置中 Pages 选择 GitHub Actions）。`public/CNAME` 已设为 `stardou.org`
- **Netlify / Cloudflare Pages / Vercel**：可以直接连接私有仓库。构建命令 `pnpm build`，输出目录 `dist`；Netlify 配置见 [netlify.toml](./netlify.toml)
- 私有仓库中的 [ci.yml](./.github/workflows/ci.yml) 会在每次推送时运行测试与构建

## References

| 内容 | 来源 | 协议 |
| --- | --- | --- |
| 游戏原型 | [Wordle](https://www.nytimes.com/games/wordle/index.html) by Josh Wardle | - |
| 代码与界面 | [antfu/handle](https://github.com/antfu/handle) 汉兜 by Anthony Fu | MIT |
| 成语与成语读音 | [pwxcoo/chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua)（经汉兜处理） | MIT |
| 成语勘误 | [汉典 zdic.net](https://www.zdic.net/) | - |
| 新增成语 | [antfu/handle#105](https://github.com/antfu/handle/pull/105) by Nestor Qin：[香港中文书面语水平测试成语表](https://www.ln.edu.hk/cleac/f/page/72842/Cheng%20Yu%20Table.pdf)、《分类常用成语大全》、[《中国成语大全，值得收藏！》](https://mp.weixin.qq.com/s?__biz=MzA4OTQ1OTgwNQ==&mid=402870742&idx=7&sn=567e8062d5c1cfb4fe8bdde16c60c283) | PR 未单独声明 |
| 成语读音校对 | [pwxcoo/chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua) `idiom.json`、《现代汉语词典》 | MIT |
| 诗句篇目 | 统编版（人教社）义务教育与普通高中《语文》教材中的背诵篇目 | - |
| 诗句校对 | [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)：全唐诗、全宋诗、宋词、唐诗三百首、千家诗、纳兰性德诗集 | MIT |
| 严格模式诗库 | [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 《全唐诗》《唐诗三百首》《千家诗》 + 全部答案句 | MIT |
| 繁简转换 | [OpenCC](https://github.com/BYVoid/OpenCC)（opencc-python-reimplemented） | Apache-2.0 |
| 诗句读音 | [pypinyin](https://github.com/mozillazg/python-pinyin) + 人工校对 | MIT |
| 标题字体 | [Noto Serif SC](https://fonts.google.com/noto/specimen/Noto+Serif+SC) 思源宋体（只含标题用字的子集） | OFL-1.1 |

## Tech Stack

- [Vue 3](https://v3.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [VueUse](https://vueuse.org/)
- [UnoCSS](https://github.com/antfu/unocss)
- [Vitesse Lite](https://github.com/antfu/vitesse-lite)

## License

[MIT](./LICENSE) License © 2021-PRESENT [Anthony Fu](https://github.com/antfu), 2026-PRESENT Sky Lab
