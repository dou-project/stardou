# 数据说明

## 成语

| 文件 | 内容 |
| --- | --- |
| `idioms.txt` | 已知成语列表（严格模式词库），来自 [chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua) |
| `polyphones.json` | 拼音库读错的成语及其正确读音，与 `idioms.txt` 互不包含 |
| `../answers/list.ts` | 汉兜原题目（前 424 天按此顺序出题） |
| `../answers/extra.json` | [handle#105](https://github.com/antfu/handle/pull/105) 新增的 1024 个成语 |

**勘误**：在 `new.txt` 中一行一词写入缺失或读错的成语，运行 `pnpm run update`，脚本会从 [汉典](https://www.zdic.net/) 抓取读音更新词库；汉典也没有的词会留在 `new.txt` 中待人工处理。

**handle#105 的处理**（[tools/merge-pr105.ts](../../tools/merge-pr105.ts)）：剔除 27 个不在 chinese-xinhua 中的词（多为错字，如「赞谈不已」「视入草芥」）；读音以 chinese-xinhua 为准，两者都错时按《现代汉语词典》校对（如 一模一样 mú、情不自禁 jīn）。PR 注明的来源为[香港中文书面语水平测试成语表](https://www.ln.edu.hk/cleac/f/page/72842/Cheng%20Yu%20Table.pdf)、《分类常用成语大全》与[《中国成语大全，值得收藏！》](https://mp.weixin.qq.com/s?__biz=MzA4OTQ1OTgwNQ==&mid=402870742&idx=7&sn=567e8062d5c1cfb4fe8bdde16c60c283)。

## 诗句

答案只取统编版（人教社）语文课本要求背诵的古诗词，按课本用字手工整理：

| 文件 | 学段 | 篇目 | 出题占比 |
| --- | --- | --- | --- |
| [poems/textbook/primary.txt](./poems/textbook/primary.txt) | 小学（课文、日积月累、古诗词诵读） | 110 首 | 60% |
| [poems/textbook/middle.txt](./poems/textbook/middle.txt) | 初中（课文、课外古诗词诵读） | 53 首 | 30% |
| [poems/textbook/high.txt](./poems/textbook/high.txt) | 高中（最常背的篇目，长篇只取名段） | 21 首 | 10% |

每首诗写作 `标题 | 朝代 | 作者`，下面是正文，诗与诗之间空一行；`- 句子` 列出不作答案的句子。所有五字句进入五言题库，七字句进入七言题库。

生成的文件：

- `poems/wuyan.json` / `poems/qiyan.json`：答案（顺序即每日题目）与全诗。按 6 : 3 : 1 交错排列学段，相邻两天不出自同一首诗。
- `poems/*-corpus.txt`：严格模式诗库，《全唐诗》《唐诗三百首》《千家诗》中所有五言 / 七言句，加上全部答案。
- `poems/pinyin-fixes.json`：按句覆盖 [pypinyin](https://github.com/mozillazg/python-pinyin) 的读音，处理古诗中的多音字（行、长、重、还、塞、弹……）；「一」「不」统一标本调。

修改篇目或读音后重新生成：

```bash
pip install opencc-python-reimplemented pypinyin
git clone --depth 1 https://github.com/chinese-poetry/chinese-poetry.git
pnpm run poems ./chinese-poetry
```

脚本会把每一句与 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 比对，并列出不一致的句子供人工确认（多为课本异文、异体字，或数据集未收录的元明清及近现代作品）。**修改题库会改变之后每天的题目。**

## 来源

| 内容 | 来源 | 协议 |
| --- | --- | --- |
| 游戏与界面 | [antfu/handle](https://github.com/antfu/handle) 汉兜 by Anthony Fu | MIT |
| 成语与读音 | [pwxcoo/chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua)、[汉典](https://www.zdic.net/) | MIT / - |
| 新增成语 | [antfu/handle#105](https://github.com/antfu/handle/pull/105) by Nestor Qin | - |
| 诗句篇目 | 统编版义务教育与普通高中《语文》教材 | - |
| 诗句校对、严格模式诗库 | [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) | MIT |
| 繁简转换 | [OpenCC](https://github.com/BYVoid/OpenCC)、[translate-big5-gbk](https://github.com/mollykannn/translate-big5-gbk)（`t2s.json`） | Apache-2.0 / - |
| 诗句读音 | [pypinyin](https://github.com/mozillazg/python-pinyin) + 人工校对 | MIT |
| 标题字体 | [Noto Serif SC](https://fonts.google.com/noto/specimen/Noto+Serif+SC) 思源宋体（只含标题用字的子集） | OFL-1.1 |
