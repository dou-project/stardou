"""
Build poem data for 诗兜 (wuyan / qiyan modes).

Input:  chinese-poetry JSON (https://github.com/chinese-poetry/chinese-poetry)
          <src>/tangshisanbaishou.json   (蒙学/唐诗三百首)
          <src>/qianjiashi.json          (蒙学/千家诗)
          <src>/tang/poet.tang.*.json    (全唐诗, strict-mode corpus)
Output: src/data/poems/{wuyan,qiyan}.json         answers (fixed order) + poems
        src/data/poems/{wuyan,qiyan}-corpus.txt   all valid lines for strict mode

Pinyin comes from pypinyin, then src/data/poems/pinyin-fixes.json overrides
single characters per line ("一行白鹭上青天": {"行": "hang2"}).

Usage: python3 tools/build-poems.py <chinese-poetry-src-dir>
"""
import glob
import json
import os
import random
import re
import sys

import opencc
from pypinyin import Style, lazy_pinyin

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/data/poems')
os.makedirs(OUT, exist_ok=True)

cc = opencc.OpenCC('t2s')
HAN = re.compile(r'^[一-鿿]+$')
SPLIT = re.compile(r'[，。！？；、,.!?;：:]')
MAX_POEM_LINES = 8  # 绝句 + 律诗 + short 古诗; skip long 歌行 whose lines are mostly obscure

# Simplified-conversion slips we know about (opencc keeps the variant)
CHAR_FIX = {'沈': '沉'}


def to_lines(paragraphs):
    out = []
    for p in paragraphs:
        for seg in SPLIT.split(cc.convert(p)):
            seg = seg.strip()
            if seg:
                out.append(seg)
    return out


def fix_chars(s):
    return ''.join(CHAR_FIX.get(c, c) for c in s)


def clean_author(a):
    m = re.match(r'^（(.+?)）(.+)$', a or '')
    if m:
        return cc.convert(m.group(1)), cc.convert(m.group(2))
    return '唐', cc.convert(a or '佚名')


def load_anthology(path):
    data = json.load(open(path, encoding='utf-8'))
    for group in data['content']:
        for poem in group['content']:
            dynasty, author = clean_author(poem.get('author'))
            title = cc.convert(poem.get('chapter') or '')
            # multi-part poems (其一, 其二...) come as a list of sub-poems
            parts = poem['paragraphs']
            if parts and isinstance(parts[0], dict):
                subs = [(p.get('subchapter'), p['paragraphs']) for p in parts]
            else:
                subs = [(poem.get('subchapter'), parts)]
            for sub, paragraphs in subs:
                sub = cc.convert(sub or '')
                m = re.search(r'其[一二三四五六七八九十]+$', sub)
                yield {
                    'title': title + ('·' + m.group(0) if m else ''),
                    'author': author,
                    'dynasty': dynasty,
                    'paragraphs': [fix_chars(cc.convert(p)) for p in paragraphs],
                }


fixes_path = os.path.join(OUT, 'pinyin-fixes.json')
PINYIN_FIXES = json.load(open(fixes_path, encoding='utf-8')) if os.path.exists(fixes_path) else {}

# readings pypinyin gets wrong in classical verse regardless of context
GLOBAL_FIX = {'似': 'si4', '泊': 'bo2', '没': 'mo4'}


def get_pinyin(line):
    pys = lazy_pinyin(line, style=Style.TONE3, neutral_tone_with_five=True)
    fix = {**GLOBAL_FIX, **PINYIN_FIXES.get(line, {})}
    return ' '.join(fix.get(c, p) for c, p in zip(line, pys))


def build(length, name):
    poems, answers, seen = [], [], set()
    for f in ['tangshisanbaishou.json', 'qianjiashi.json']:
        for poem in load_anthology(os.path.join(SRC, f)):
            lines = [fix_chars(l) for l in to_lines(poem['paragraphs'])]
            if not lines or len(lines) > MAX_POEM_LINES:
                continue
            if not all(len(l) == length and HAN.match(l) for l in lines):
                continue
            idx = None
            for l in lines:
                if l in seen:
                    continue
                seen.add(l)
                if idx is None:
                    poems.append({'t': poem['title'], 'a': poem['author'], 'd': poem['dynasty'], 'p': poem['paragraphs']})
                    idx = len(poems) - 1
                answers.append([l, get_pinyin(l), idx])

    # fixed, reproducible order; adjacent days should not come from the same poem
    rng = random.Random(f'doudou-{name}')
    rng.shuffle(answers)
    for i in range(1, len(answers)):
        if answers[i][2] == answers[i - 1][2]:
            for j in range(i + 1, len(answers)):
                if answers[j][2] != answers[i - 1][2]:
                    answers[i], answers[j] = answers[j], answers[i]
                    break

    corpus = set(seen)
    for f in glob.glob(os.path.join(SRC, 'tang', 'poet.tang.*.json')):
        for poem in json.load(open(f, encoding='utf-8')):
            for l in to_lines(poem.get('paragraphs') or []):
                l = fix_chars(l)
                if len(l) == length and HAN.match(l):
                    corpus.add(l)

    json.dump({'poems': poems, 'answers': answers}, open(os.path.join(OUT, f'{name}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    open(os.path.join(OUT, f'{name}-corpus.txt'), 'w', encoding='utf-8').write('\n'.join(sorted(corpus)) + '\n')
    print(f'{name}: {len(answers)} answers from {len(poems)} poems, corpus {len(corpus)} lines')


build(5, 'wuyan')
build(7, 'qiyan')
