#!/usr/bin/env python3
"""
把 ShiweiSiJiChun 子集化到站內實際用到的字元。

原始檔每支 8.1–8.8 MB（四支合計 33 MB），是整站最大的載入成本。
這支腳本掃過 repo 內所有 .html / .js 的文字，取字元聯集後重新打包 woff2。

⚠️ 新增中文文案之後要重跑一次，否則新字會掉回系統字型：
       python3 tools/subset-fonts.py

原始字型放在 assets/fonts/_src/，該目錄已 .gitignore（每支 8 MB 以上，
進版本控制會讓 repo 再肥 25 MB）。要重跑時先從 git 歷史還原：

    mkdir -p assets/fonts/_src
    for f in Medium SemiBold Italic; do
      git show 611a858:assets/fonts/ShiweiSiJiChun-$f.woff2 \
        > assets/fonts/_src/ShiweiSiJiChun-$f.woff2
    done
"""

import pathlib
import re
import sys

from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "fonts" / "_src"
OUT = ROOT / "assets" / "fonts"

# font-brand 用到的三支：Regular(400 normal) 站內從未請求，故不列入
FACES = [
    "ShiweiSiJiChun-Medium.woff2",
    "ShiweiSiJiChun-SemiBold.woff2",
    "ShiweiSiJiChun-Italic.woff2",
]

# 一律保底納入：ASCII、全形標點、常用符號
ALWAYS = set(
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "　、。，．・；：？！‥…「」『』（）〔〕【】〈〉《》"
    + "─—–‧“”‘’〃※°＃＆＊＠＄％＋－×÷＝＜＞"
    + "０１２３４５６７８９"
    + "①②③④⑤⑥⑦⑧⑨⑩"
)


def harvest() -> set:
    """掃 repo 內所有 html / js，取出全部字元。"""
    chars = set(ALWAYS)
    files = [
        p
        for pat in ("*.html", "assets/**/*.html", "assets/**/*.js")
        for p in ROOT.glob(pat)
        if "_src" not in p.parts
    ]
    for p in files:
        txt = p.read_text(encoding="utf-8", errors="ignore")
        # 拿掉 <script>/<style> 內容以外的標籤，但保留其文字
        txt = re.sub(r"<!--.*?-->", " ", txt, flags=re.S)
        chars |= set(txt)
    # 只留下需要外掛字型的字：CJK、注音、全形標點
    keep = {
        c
        for c in chars
        if c in ALWAYS
        or "　" <= c <= "〿"
        or "㄀" <= c <= "ㄯ"
        or "一" <= c <= "鿿"
        or "豈" <= c <= "﫿"
        or "︰" <= c <= "﹏"
        or "＀" <= c <= "￯"
    }
    return keep


def main() -> int:
    if not SRC.is_dir():
        print(f"找不到原始字型目錄：{SRC}", file=sys.stderr)
        print("請先把原始 woff2 移到該目錄再重跑。", file=sys.stderr)
        return 1

    chars = harvest()
    print(f"站內字元聯集：{len(chars)} 字")

    total_before = total_after = 0
    for name in FACES:
        src = SRC / name
        if not src.exists():
            print(f"  ! 略過（找不到）{name}", file=sys.stderr)
            continue

        font = TTFont(src)
        opts = Options()
        opts.flavor = "woff2"
        opts.desubroutinize = True
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        opts.drop_tables += ["DSIG"]

        sub = Subsetter(options=opts)
        sub.populate(text="".join(sorted(chars)))
        sub.subset(font)

        dst = OUT / name
        font.flavorData = None
        font.save(dst)
        font.close()

        before = src.stat().st_size
        after = dst.stat().st_size
        total_before += before
        total_after += after
        print(
            f"  {name:34} {before/1048576:6.2f} MB → {after/1024:7.1f} KB"
            f"  ({after/before*100:.1f}%)"
        )

    if total_before:
        print(
            f"\n合計 {total_before/1048576:.1f} MB → {total_after/1024:.0f} KB"
            f"（省下 {(1-total_after/total_before)*100:.1f}%）"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
