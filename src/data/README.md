# Sources

## `idioms.txt` / `polyphones.json`

Processed from https://github.com/pwxcoo/chinese-xinhua/blob/master/data/idiom.json

## `t2s.json`

Processed from https://github.com/mollykannn/translate-big5-gbk.git

## `extra.json`

From users' input

## `poems/textbook/*.txt`

The answer pool of 五言 / 七言: poems students recite in the 统编版 (人教社) textbooks, typed in textbook wording — `primary.txt` (小学), `middle.txt` (初中), `high.txt` (高中, famous passages only).

## `poems/*.json` / `poems/*-corpus.txt`

Built by `tools/build-poems.py` from `poems/textbook/*.txt`, cross-checked against https://github.com/chinese-poetry/chinese-poetry (MIT, Copyright (c) 2016 JackeyGao):

- answers: every 5- or 7-character line of the textbook poems, in a fixed order weighted 小学 6 : 初中 3 : 高中 1
- strict-mode corpus: every 5- or 7-character line of 《全唐诗》, 《唐诗三百首》 and 《千家诗》, plus the answers

`poems/pinyin-fixes.json` holds hand-checked readings that override pypinyin per line.

## `../answers/extra.json`

1024 idioms from https://github.com/antfu/handle/pull/105 (sources listed in the root README), filtered against chinese-xinhua and re-checked by `tools/merge-pr105.ts`.
