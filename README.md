![](./public/og.png)

<h1 align="center">开兜 StarDou</h1>

<p align="center">汉字 Wordle：猜成语，猜课本里的诗句</p>

<p align="center"><a href="https://dou-project.github.io/stardou/"><b>开始玩 →</b></a></p>

<p align="center">请勿剧透！PLEASE DO NOT SPOIL</p>

| [成语](https://dou-project.github.io/stardou/chengyu) | [五言](https://dou-project.github.io/stardou/wuyan) | [七言](https://dou-project.github.io/stardou/qiyan) |
| :---: | :---: | :---: |
| ![](./public/og-chengyu.png) | ![](./public/og-wuyan.png) | ![](./public/og-qiyan.png) |
| 四字成语 · 10 次机会 | 五言诗句 · 15 次机会 | 七言诗句 · 15 次机会 |

## 玩法

- 每个格子的汉字、声母、韵母、声调分别着色：**青色**表示位置正确，**橙色**表示答案里有但位置不对。
- **每日**：每个入口每天一题，所有人相同，零点更新。
- **无限**：输入一个密钥后一题接一题。同一个密钥的题目顺序永远相同，发给朋友就能一起玩。
- **诗句**：题目上方给出诗人，每次提示揭示答案中的一个字，猜完展示全诗。

## 题库

| 入口 | 题量 | 来源 |
| --- | --- | --- |
| 成语 | 1448 个 | 汉兜原题库 424 个 + [handle#105](https://github.com/antfu/handle/pull/105) 1024 个 |
| 五言 | 414 句，68 首 | 统编版语文课本背诵篇目 |
| 七言 | 665 句，127 首 | 统编版语文课本背诵篇目 |

诗句按 小学 : 初中 : 高中 = 6 : 3 : 1 出题。篇目、读音勘误和重新生成方法见 [src/data/README.md](./src/data/README.md)。

## 开发

```bash
pnpm install
pnpm dev      # http://localhost:4444，加 ?dev=hey 可切换日期并在控制台看答案
pnpm test     # 校验题库、读音、出题顺序与规则示例
pnpm build    # 输出 dist/
pnpm covers   # 重新生成 public/og*.png（需要 Google Chrome）
```

推送到 `main` 后由 [deploy.yml](./.github/workflows/deploy.yml) 自动部署到 GitHub Pages。

## 致谢

基于 [antfu/handle](https://github.com/antfu/handle)（汉兜）by [Anthony Fu](https://github.com/antfu) & [Inès](https://twitter.com/iiiiiiines_____)，灵感来自 [Wordle](https://www.nytimes.com/games/wordle/index.html)。数据与字体来源见 [src/data/README.md](./src/data/README.md)。

## License

[MIT](./LICENSE) © 2021-PRESENT [Anthony Fu](https://github.com/antfu), 2026-PRESENT Sky Lab
