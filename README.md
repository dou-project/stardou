![](./public/og.png)

# 兜兜 Stardou

A Chinese Wordle family: 汉兜 (idioms) and 诗兜 (lines of classical poetry). 汉字 Wordle，多入口。

[stardou.org](https://stardou.org)

请勿剧透！PLEASE DO NOT SPOIL

> **Note**
> 兜兜基于 [antfu/handle](https://github.com/antfu/handle)（汉兜）修改而来，界面与规则保持一致，只是增加了诗句入口。感谢 [Anthony Fu](https://github.com/antfu) 与 [Inès](https://twitter.com/iiiiiiines_____) 的原作。

## 入口

| 入口 | 每日 | 无限 | 字数 | 题库 |
| --- | --- | --- | --- | --- |
| 汉兜 | [`/`](https://stardou.org) | [`/endless`](https://stardou.org/endless) | 4 | 1448 个成语：汉兜原题库 424 个 + [handle#105](https://github.com/antfu/handle/pull/105) 新增 1024 个 |
| 诗兜·五言 | [`/wuyan`](https://stardou.org/wuyan) | [`/wuyan/endless`](https://stardou.org/wuyan/endless) | 5 | 1253 句，出自《唐诗三百首》《千家诗》 |
| 诗兜·七言 | [`/qiyan`](https://stardou.org/qiyan) | [`/qiyan/endless`](https://stardou.org/qiyan/endless) | 7 | 1244 句，出自《唐诗三百首》《千家诗》 |

- 每日：每个入口每天一题，所有人同一天拿到同一题，零点更新。汉兜前 424 天沿用原题目顺序，之后按固定顺序遍历扩充后的题库，题库用完前不会重复。
- 无限：一题接一题，从未做过的题中随机抽取。链接带 `?i=题号`，分享出去对方打开的是同一题。无限模式的战绩与每日分开记录。
- 各入口的战绩分开记录，设置（拼音/注音/双拼、严格模式等）共享。
- 诗兜的提示会依次给出 字音 + 作者，再给出 汉字 + 诗题；猜完后展示全诗并高亮答案句。
- 严格模式下，诗兜只接受《全唐诗》中真实存在的诗句（诗库首次使用时按需加载）。

## Development Setup

- Install [Node.js](https://nodejs.org/en/) >=v18 and [pnpm](https://pnpm.io/) 8
- Run `pnpm install`
- Run `pnpm dev` and visit `http://localhost:4444`, `/wuyan`, `/qiyan`, `/endless`, `/wuyan/endless`, `/qiyan/endless`
- Run `pnpm test` to validate every answer in every pool (readings, lengths, schedule)
- 测试用：在地址后加 `?dev=hey` 可以切换前后日期、重置，并在控制台看到当天答案

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

兜兜通过 [tools/merge-pr105.ts](./tools/merge-pr105.ts) 合入，并做了以下处理（结果在 [src/answers/extra.json](./src/answers/extra.json)）：

- 剔除 27 个不在 [chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua) 成语词典中的词，多为错字或非成语，例如 赞谈不已（赞叹不已）、视入草芥（视如草芥）、静静乐道（津津乐道）、金光灿烂、断断续续
- 读音以 chinese-xinhua 为准，而不是 PR 自带的拼音（PR 中有 落 读 la4、为虎作伥 读 wei2 等错误）；两者都有误时按《现代汉语词典》人工校对，如 一模一样 mú、情不自禁 jīn、叶落归根 guī
- 只有拼音库读错的词才写入 `polyphones.json`，保持上面「二者互不包含」的约定

## 诗句勘误

诗句数据储存于 [./src/data/poems](./src/data/poems)

- `wuyan.json` / `qiyan.json` - 答案（顺序固定，即每日题目）与所属诗作
- `wuyan-corpus.txt` / `qiyan-corpus.txt` - 严格模式使用的诗库
- `pinyin-fixes.json` - 人工校对的读音，按句覆盖单字读音，例如 `"一行白鹭上青天": { "行": "hang2" }`

读音默认由 [pypinyin](https://github.com/mozillazg/python-pinyin) 生成，古诗中的多音字（行、长、重、朝、还、教……）常有误判。如遇读音错误，请在 `pinyin-fixes.json` 中添加对应句子，然后重新生成数据：

```bash
pip install opencc pypinyin
# 下载 chinese-poetry 的 蒙学/tangshisanbaishou.json、蒙学/qianjiashi.json 与 全唐诗/poet.tang.*.json
pnpm run poems <chinese-poetry 数据目录>
```

脚本会转为简体、拆分诗句、过滤字数，并以固定种子打乱答案顺序（相邻两天不出自同一首诗）。**修改答案池会改变之后每天的题目**，上线后请只追加读音勘误。

## 新增入口

1. 在 [./src/modes.ts](./src/modes.ts) 中添加一项（路径、字数、起始日期、存储前缀）
2. 在 [./src/logic/poems.ts](./src/logic/poems.ts) 中注册数据加载
3. 在 [./src/locales](./src/locales) 中添加 `name@<id>`、`intro-2@<id>`、`input-placeholder@<id>` 等文案
4. 在 [./tools/postbuild.mjs](./tools/postbuild.mjs) 中添加路径（包括 `<path>/endless`）

## 部署

纯静态站点，无后端。`pnpm build` 产出 `dist/`，每个入口都会生成对应的 `index.html`，任何静态托管都能直接使用。

- **GitHub Pages**：仓库设置中 Pages 选择 GitHub Actions，推送到 `main` 后由 [deploy.yml](./.github/workflows/deploy.yml) 自动部署；`public/CNAME` 已设为 `stardou.org`
- **Netlify**：直接导入仓库，配置见 [netlify.toml](./netlify.toml)
- **Cloudflare Pages / Vercel**：构建命令 `pnpm build`，输出目录 `dist`

## References

| 内容 | 来源 | 协议 |
| --- | --- | --- |
| 游戏原型 | [Wordle](https://www.nytimes.com/games/wordle/index.html) by Josh Wardle | - |
| 代码与界面 | [antfu/handle](https://github.com/antfu/handle) 汉兜 by Anthony Fu | MIT |
| 成语与成语读音 | [pwxcoo/chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua)（经汉兜处理） | MIT |
| 成语勘误 | [汉典 zdic.net](https://www.zdic.net/) | - |
| 新增成语 | [antfu/handle#105](https://github.com/antfu/handle/pull/105) by Nestor Qin：[香港中文书面语水平测试成语表](https://www.ln.edu.hk/cleac/f/page/72842/Cheng%20Yu%20Table.pdf)、《分类常用成语大全》、[《中国成语大全，值得收藏！》](https://mp.weixin.qq.com/s?__biz=MzA4OTQ1OTgwNQ==&mid=402870742&idx=7&sn=567e8062d5c1cfb4fe8bdde16c60c283) | PR 未单独声明 |
| 成语读音校对 | [pwxcoo/chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua) `idiom.json`、《现代汉语词典》 | MIT |
| 诗兜答案 | [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 蒙学/《唐诗三百首》（清·蘅塘退士 编）、蒙学/《千家诗》（宋·谢枋得、明·王相 编） | MIT |
| 诗兜严格模式诗库 | [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 《全唐诗》（清·彭定求 等编） | MIT |
| 繁简转换 | [OpenCC](https://github.com/BYVoid/OpenCC) | Apache-2.0 |
| 诗句读音 | [pypinyin](https://github.com/mozillazg/python-pinyin) + 人工校对 | MIT |

## Tech Stack

- [Vue 3](https://v3.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [VueUse](https://vueuse.org/)
- [UnoCSS](https://github.com/antfu/unocss)
- [Vitesse Lite](https://github.com/antfu/vitesse-lite)

## License

[MIT](./LICENSE) License © 2021-PRESENT [Anthony Fu](https://github.com/antfu), 2026-PRESENT Sky Lab
