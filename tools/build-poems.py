"""
Build poem data for the 五言 / 七言 modes of 开兜 StarDou.

Answers come only from the poems students recite in the 统编版 (人教社) textbooks,
listed by hand in src/data/poems/textbook/{primary,middle,high}.txt. The daily
order is weighted towards 小学, then 初中, then 高中.

chinese-poetry (https://github.com/chinese-poetry/chinese-poetry) is used to
  1. cross-check every answer line (anything not found is printed for review;
     textbook wording sometimes differs from 全唐诗, e.g. 静夜思), and
  2. build the strict-mode corpus (every 5/7-char line of 全唐诗 + 唐诗三百首 + 千家诗).

Output: src/data/poems/{wuyan,qiyan}.json         answers (fixed order) + poems
        src/data/poems/{wuyan,qiyan}-corpus.txt   all valid lines for strict mode

Pinyin comes from pypinyin, then src/data/poems/pinyin-fixes.json overrides
single characters per line ("一行白鹭上青天": {"行": "hang2"}).

Usage: pip install opencc-python-reimplemented pypinyin
       python3 tools/build-poems.py <chinese-poetry-dir>
"""
import glob
import json
import os
import random
import re
import sys

import opencc
from pypinyin import Style, lazy_pinyin

SRC = sys.argv[1] if len(sys.argv) > 1 else None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/data/poems')
TEXTBOOK = os.path.join(OUT, 'textbook')

# 学段: file name, label, weight in the daily schedule
GRADES = [('primary', '小学', 6), ('middle', '初中', 3), ('high', '高中', 1)]

cc = opencc.OpenCC('t2s')
HAN = re.compile(r'^[\u3400-\u9fff]+$')
SPLIT = re.compile(r'[，。！？；、,.!?;：:]')


def to_lines(text):
    return [s.strip() for s in SPLIT.split(text) if s.strip()]


def parse_textbook(path, grade):
    """Blocks separated by blank lines: `标题 | 朝代 | 作者`, text lines, optional `- skip lines`."""
    poems = []
    raw = open(path, encoding='utf-8').read()
    for block in re.split(r'\n\s*\n', raw):
        lines = [l.strip() for l in block.strip().split('\n') if l.strip() and not l.strip().startswith('#')]
        if not lines:
            continue
        head = [s.strip() for s in lines[0].split('|')]
        if len(head) != 3:
            raise ValueError(f'{path}: bad header {lines[0]!r}')
        skip = set()
        text = []
        for l in lines[1:]:
            if l.startswith('- '):
                skip.update(l[2:].split())
            else:
                text.append(l)
        poems.append({'t': head[0], 'd': head[1], 'a': head[2], 'p': text, 'g': grade, 'skip': skip})
    return poems


def load_reference(src):
    """Every line of the chinese-poetry collections we cross-check against, in simplified form."""
    refs = set()
    files = glob.glob(os.path.join(src, '全唐诗', 'poet.*.json')) \
        + glob.glob(os.path.join(src, '宋词', 'ci.song.*.json')) \
        + glob.glob(os.path.join(src, '纳兰性德', '*.json'))
    for f in files:
        for poem in json.load(open(f, encoding='utf-8')):
            for p in poem.get('paragraphs') or []:
                refs.update(to_lines(cc.convert(p)))
    for f in ['tangshisanbaishou.json', 'qianjiashi.json']:
        data = json.load(open(os.path.join(src, '蒙学', f), encoding='utf-8'))
        for group in data['content']:
            for poem in group['content']:
                parts = poem['paragraphs']
                if parts and isinstance(parts[0], dict):
                    parts = [x for sub in parts for x in sub['paragraphs']]
                for p in parts:
                    refs.update(to_lines(cc.convert(p)))
    return refs


def load_corpus_lines(src, length):
    """Strict-mode corpus: 全唐诗 + the two 蒙学 anthologies (宋诗 would triple the download)."""
    out = set()
    for f in glob.glob(os.path.join(src, '全唐诗', 'poet.tang.*.json')):
        for poem in json.load(open(f, encoding='utf-8')):
            for p in poem.get('paragraphs') or []:
                for l in to_lines(cc.convert(p)):
                    if len(l) == length and HAN.match(l):
                        out.add(l)
    for f in ['tangshisanbaishou.json', 'qianjiashi.json']:
        data = json.load(open(os.path.join(src, '蒙学', f), encoding='utf-8'))
        for group in data['content']:
            for poem in group['content']:
                parts = poem['paragraphs']
                if parts and isinstance(parts[0], dict):
                    parts = [x for sub in parts for x in sub['paragraphs']]
                for p in parts:
                    for l in to_lines(cc.convert(p)):
                        if len(l) == length and HAN.match(l):
                            out.add(l)
    return out


fixes_path = os.path.join(OUT, 'pinyin-fixes.json')
PINYIN_FIXES = json.load(open(fixes_path, encoding='utf-8')) if os.path.exists(fixes_path) else {}

# readings pypinyin gets wrong in classical verse regardless of context;
# 一 / 不 keep their citation tone (no tone sandhi), like the idiom data
GLOBAL_FIX = {'似': 'si4', '泊': 'bo2', '没': 'mo4', '尽': 'jin4', '一': 'yi1', '不': 'bu4'}


def get_pinyin(line):
    pys = lazy_pinyin(line, style=Style.TONE3, neutral_tone_with_five=True)
    fix = {**GLOBAL_FIX, **PINYIN_FIXES.get(line, {})}
    return ' '.join(fix.get(c, p) for c, p in zip(line, pys))


def schedule(answers, seed):
    """Weighted interleave of the 学段 pools (小学 > 初中 > 高中); no two days in a row from one poem."""
    rng = random.Random(seed)
    pools = {g: [a for a in answers if a[3] == g] for g, _, _ in GRADES}
    for p in pools.values():
        rng.shuffle(p)
    weights = {g: w for g, _, w in GRADES}
    # smooth weighted round-robin: exactly 6:3:1 over any stretch, until a pool runs out
    credit = {g: 0 for g in pools}
    order = []
    while any(pools.values()):
        live = [g for g in pools if pools[g]]
        for x in live:
            credit[x] += weights[x]
        g = max(live, key=lambda x: credit[x])
        credit[g] -= sum(weights[x] for x in live)
        pool = pools[g]
        last = order[-1][2] if order else None
        i = next((k for k, a in enumerate(pool) if a[2] != last), 0)
        order.append(pool.pop(i))
    return order


def build(all_poems, length, name, refs, src):
    poems, answers, seen = [], [], set()
    for poem in all_poems:
        lines = [l for p in poem['p'] for l in to_lines(p)]
        idx = None
        for l in lines:
            if len(l) != length or not HAN.match(l) or l in seen or l in poem['skip']:
                continue
            seen.add(l)
            if idx is None:
                poems.append({k: poem[k] for k in ('t', 'a', 'd', 'p', 'g')})
                idx = len(poems) - 1
            answers.append([l, get_pinyin(l), idx, poem['g']])

    if refs is not None:
        missing = [(a[0], poems[a[2]]['t']) for a in answers if a[0] not in refs]
        if missing:
            print(f'{name}: {len(missing)} lines not found in chinese-poetry (check against the textbook):')
            for line, title in missing:
                print(f'  {line}  《{title}》')

    order = schedule(answers, f'stardou-{name}')
    grade_index = {g: i + 1 for i, (g, _, _) in enumerate(GRADES)}
    for p in poems:
        p['g'] = grade_index[p['g']]
    out_answers = [[l, py, idx] for l, py, idx, _ in order]

    json.dump({'poems': poems, 'answers': out_answers}, open(os.path.join(OUT, f'{name}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    if src:
        corpus = load_corpus_lines(src, length) | seen
        open(os.path.join(OUT, f'{name}-corpus.txt'), 'w', encoding='utf-8').write('\n'.join(sorted(corpus)) + '\n')
    counts = {label: sum(1 for a in order if a[3] == g) for g, label, _ in GRADES}
    first = {label: sum(1 for a in order[:100] if a[3] == g) for g, label, _ in GRADES}
    print(f'{name}: {len(order)} answers from {len(poems)} poems {counts}; first 100 days {first}')


all_poems = []
for grade, _, _ in GRADES:
    all_poems += parse_textbook(os.path.join(TEXTBOOK, f'{grade}.txt'), grade)

refs = load_reference(SRC) if SRC else None
build(all_poems, 5, 'wuyan', refs, SRC)
build(all_poems, 7, 'qiyan', refs, SRC)
