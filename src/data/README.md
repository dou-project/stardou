# Sources

## `idioms.txt` / `polyphones.json`

Processed from https://github.com/pwxcoo/chinese-xinhua/blob/master/data/idiom.json

## `t2s.json`

Processed from https://github.com/mollykannn/translate-big5-gbk.git

## `extra.json`

From users' input

## `poems/*.json` / `poems/*-corpus.txt`

Built by `tools/build-poems.py` from https://github.com/chinese-poetry/chinese-poetry (MIT, Copyright (c) 2016 JackeyGao):

- answers: 《唐诗三百首》 and 《千家诗》 (蒙学), 绝句 / 律诗 / short 古诗 only
- strict-mode corpus: every 5- or 7-character line of 《全唐诗》 plus the answers

`poems/pinyin-fixes.json` holds hand-checked readings that override pypinyin per line.

## `../answers/extra.json`

1024 idioms from https://github.com/antfu/handle/pull/105 (sources listed in the root README), filtered against chinese-xinhua and re-checked by `tools/merge-pr105.ts`.
