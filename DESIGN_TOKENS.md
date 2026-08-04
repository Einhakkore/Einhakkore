# 設計 Token 盤點與統一提案

盤點範圍：`assets/css/styles.css`（2418 行）、`about.html` `<style>`（56–837）、
`serve.html` `<style>`（79–311）、`give.html` 的圓餅圖設定、`assets/js/site.js`。

---

## 0. 一句話總結

| 面向 | 現況 | 提案 |
|---|---|---|
| font-size 靜態級距 | **27 階**（含 12.5 / 13.5 / 14.5 / 15.5 這種半格） | **12 階** |
| font-size 流體級距 | **15 組** 各自手寫的 `clamp()` | **6 組** |
| line-height | **21 種** | **6 種** |
| letter-spacing | **18 種** | **8 種** |
| font-weight | 5 種（乾淨，僅缺 token） | 5 個 token |
| 顏色 token | 已定義 **81 個** | 保留 + 補 4 個孤兒色 |
| 顏色字面值 | **176 處** `rgba()` + 47 個 hex 硬寫 | 收斂成 alpha 階梯 token |
| 死 token | 5 個定義了沒人用 | 刪除 |
| Bug | `var(--line)` 從未定義 | 修掉 |

---

## 1. 文字級距（font-size）

### 1.1 靜態級距 — 現況 27 階

| px | 用了幾次 | 代表用途 |
|---|---|---|
| 88 | 1 | `.verse-card .quote-mark` |
| 64 | 1 | `.section-num` |
| 42 | 1 | `.stat-cell__num` |
| 40 | 2 | `.quote-mark`(about)、`.section-num` 手機 |
| 38 | 1 | `.field-card__count b` |
| 34 | 1 | `.center-big`（圓餅圖中央數字） |
| 32 | 2 | `.admin-header h1`、`.philosophy__label` 手機 |
| 30 | 1 | `.core-brand` 手機 |
| 28 | 4 | `.newsletter h3`、`.admin-gate-card h1`、`.budget h3 em` |
| 26 | 4 | `.person-card__name`、`.host-card__num`、`.core-brand` |
| 24 | 2 | `.budget h3`、`.practice-card h3` |
| 22 | **8** | `.donate-block h2`、`.contact-form h3`、`.terms-content h3`、`.verse-card blockquote`… |
| 20 | 2 | `.donate-block h3`、`.node-zh` 手機 |
| 19 | 1 | `.node-zh` |
| 18 | 3 | `.hero-sub`、`.host-card__name` |
| 17 | 5 | `.page-hero p`、`.contact-card h4`、`.give-step-title` |
| 16 | **14** | `body`、`.terms-content`、`.feature-text p`、`.section-head .lead` |
| **15.5** | 3 | `.philosophy__note`、`.person-card__quote p`、`.net-block__note` |
| 15 | **19** | `.btn`、`.nav a`、`.practice-card p`、`.donate-block p`、表單輸入框 |
| **14.5** | 2 | `.copy-item p`、`.host-card__desc` |
| 14 | **23** | eyebrow 系列、`.desc`、`.footer-col a`、`.form-status` |
| **13.5** | 2 | `.org-list .sub`、`.org-note` |
| 13 | **14** | `.field label`、`.footer-bottom`、`.verse-card cite`、`.admin-table` |
| **12.5** | 1 | `.lbl-note` |
| 12 | 9 | `.scroll-hint`、`.kind-badge`、`.copy-hint` |
| 11 | 5 | `.core-en`、`.node-en` 手機、`.logo-wall__ph span` |
| 10 | 2 | `.node-en`、`.sort-arrow` |

另有 1 處單位不一致：`.budget > p` 用 `.95rem`（全站唯一的 rem）。

**問題**：15 / 15.5、14 / 14.5、13 / 13.5、12 / 12.5 這四組半格差在畫面上完全看不出來，
但讓「這段該用哪一級」變成每次重猜。真正撐起版面的其實只有 8 個級距（14、15、16、22 佔了 64 次）。

### 1.2 流體級距 — 現況 15 組各自為政

| clamp | 用在 |
|---|---|
| `clamp(56px, 7vw, 104px)` | `.philosophy__label` |
| `clamp(36px, 5.6vw, 72px)` | `.scr-hero__title` |
| `clamp(36px, 4.6vw, 56px)` | `.hero h1` |
| `clamp(32px, 4vw, 48px)` | `.page-hero h1` |
| `clamp(36px, 4vw, 48px)` | `.ss-content .ss-num` |
| `clamp(28px, 3vw, 44px)` | `.philosophy__title` |
| `clamp(26px, 3.2vw, 40px)` | `.about-cta h2` |
| `clamp(28px, 3.4vw, 38px)` | `.section-head h2` |
| `clamp(28px, 3vw, 36px)` | `.feature-text h2` |
| `clamp(26px, 3vw, 36px)` | `.cta-poem` |
| `clamp(22px, 2.6vw, 30px)` | `.verse-quote` |
| `clamp(22px, 2.4vw, 28px)` | `.net-block h3` |
| `clamp(18px, 1.9vw, 22px)` | `.ss-content h3` |
| `clamp(15px, 2vw, 17px)` | `.cta-sub` |
| `clamp(13px, 1.3vw, 15px)` | `.ss-content p` |

`.section-head h2`(28→38)、`.feature-text h2`(28→36)、`.cta-poem`(26→36)、`.about-cta h2`(26→40)
是同一個「區塊主標」角色，卻有四組不同曲線 —— 同一頁往下捲，標題會忽大忽小。

### 1.3 提案

```css
/* 靜態級距 —— 12 階 */
--fs-3xs:  11px;   /* SVG 微標籤 */
--fs-2xs:  12px;   /* hint、badge、scroll-hint */
--fs-xs:   13px;   /* 表單 label、cite、表格 */
--fs-sm:   14px;   /* 次要內文、eyebrow、desc */
--fs-md:   15px;   /* 內文基準（站內最常用） */
--fs-base: 16px;   /* body、長文 */
--fs-lg:   17px;   /* 導引段落 */
--fs-xl:   18px;   /* hero 副標、卡片名 */
--fs-2xl:  20px;   /* h3 */
--fs-3xl:  22px;   /* 區塊／卡片主標（最常用的標題級） */
--fs-4xl:  26px;   /* 大卡片標題 */
--fs-5xl:  32px;   /* 頁內最大靜態標題 */

/* 流體級距 —— 6 組 */
--fs-fluid-hero:    clamp(36px, 5.6vw, 72px);  /* 首頁／about hero h1 */
--fs-fluid-display: clamp(32px, 4.4vw, 52px);  /* page-hero h1 */
--fs-fluid-h2:      clamp(28px, 3.4vw, 38px);  /* 所有區塊主標 */
--fs-fluid-h3:      clamp(22px, 2.6vw, 30px);  /* 次級標、經文 */
--fs-fluid-lead:    clamp(15px, 2vw, 17px);    /* 導引段落 */
--fs-fluid-numeral: clamp(36px, 4vw, 48px);    /* section-num、統計數字 */
--fs-watermark:     clamp(56px, 7vw, 104px);   /* philosophy 浮水印，唯一特例 */
```

**合併對照（★ = 畫面看得出變化，需你確認）**

| 現值 → 新 token | 影響 |
|---|---|
| 10 → `--fs-3xs`(11) | `.node-en`、`.sort-arrow` 微幅放大 |
| 12.5 → `--fs-2xs`(12) | 無感 |
| 13.5 → `--fs-xs`(13) | 無感 |
| 14.5 → `--fs-sm`(14) | 無感 |
| 15.5 → `--fs-md`(15) | 無感 |
| 19 → `--fs-xl`(18) | 無感 |
| 24 → `--fs-4xl`(26) ★ | `.budget h3`、`.practice-card h3` 變大 2px |
| 28、30 → `--fs-5xl`(32) ★ | `.newsletter h3` 等變大 4px |
| 34、38、40、42 → `--fs-fluid-numeral` ★ | 數字統一為流體，桌機收在 48 |
| 64 → `--fs-fluid-numeral` ★ | `.section-num` 由 64 縮到 48 |
| 88 → 建議獨立保留 | `.verse-card .quote-mark` 是裝飾引號 |
| `.95rem` → `--fs-md` | 無感 |

如果不想動視覺，可以只採用「無感」那幾組（12.5/13.5/14.5/15.5/19/.95rem），
就已經把 27 階降到 21 階；★ 那幾組再另外決定。

---

## 2. 行高（line-height）— 21 種 → 6 種

現況：`.6 .8 .9 1 1.05 1.15 1.2 1.4 1.5 1.55 1.6 1.65 1.7 1.75 1.8 1.85 1.9 1.95 2 2.05 inherit`

其中 `1.85 / 1.9 / 1.95 / 2 / 2.05` 是五種幾乎一樣的內文行高（共 23 處），
`1.5 / 1.55 / 1.6 / 1.65` 是四種幾乎一樣的標題行高（共 17 處）。

```css
--lh-flat:    1;      /* 數字、icon 標籤 */
--lh-tight:   1.2;    /* 吸收 1.05 / 1.15 / 1.2 */
--lh-heading: 1.4;    /* 小標 */
--lh-title:   1.55;   /* 吸收 1.5 / 1.55 / 1.6 / 1.65 —— 中文標題主力 */
--lh-body:    1.85;   /* 吸收 1.7 / 1.75 / 1.8 / 1.85 / 1.9 */
--lh-loose:   2;      /* 吸收 1.95 / 2 / 2.05 —— 長文 */
```

`.6 / .8 / .9` 只出現在引號裝飾（`.quote-mark`、`.ss-num`），維持原地寫死即可。

---

## 3. 字距（letter-spacing）— 18 種 → 8 種

現況：`-.02 0 .02 .03 .04 .05 .08 .1 .12 .15 .18 .2 .25 .28 .3 .32 .35 .4 em`

```css
--ls-tight:    -.02em;  /* 英文大字浮水印 */
--ls-none:     0;       /* 英文斜體 em、數字 */
--ls-cjk:      .02em;   /* 中文標題主力（29 處） */
--ls-wide:     .04em;   /* 吸收 .03 / .04 / .05（16 處） */
--ls-label:    .1em;    /* 吸收 .08 / .1 / .12 */
--ls-caps:     .18em;   /* 吸收 .15 / .18 / .2 */
--ls-eyebrow:  .25em;   /* 吸收 .25 / .28 */
--ls-track:    .3em;    /* 吸收 .3 / .32 / .35 / .4 */
```

---

## 4. 字重與字體家族（已乾淨，只缺 token）

```css
--fw-light:    300;
--fw-regular:  400;
--fw-medium:   500;
--fw-semibold: 600;
--fw-bold:     700;
```

字體家族三支已有 token 且使用一致，不需調整：
`--font-zh`（Noto Sans TC）／`--font-brand`（ShiweiSiJiChun）／`--font-en`（FreightText）。

---

## 5. 顏色

### 5.1 孤兒色 —— 不在 palette 裡，卻大量使用

| 色值 | 用了幾次 | 問題 |
|---|---|---|
| **`#E8A33D`** | **27**（20 種不同 alpha） | 全站所有「琥珀色的光暈／邊框／底色」都用它，但 palette 裡的琥珀是 `--amber-500 #FFBA49`。**同一頁上有兩支不同的金色**：實心按鈕是 `#FFBA49`，它的 hover 光暈卻是 `#E8A33D`。 |
| **`#8AA293`** | 6 | `.practice-card.sage` 的 icon／邊框／光暈與 `--sage-tint` 用的灰綠，跟 palette 的 `--sage-500 #7FA64E`（黃綠）根本不同色相。 |
| **`#6B9040`** | 1 | `.form-status.ok` 的邊框 —— 站內第三支綠。 |
| **`#E9EEEA`** | 6 | `about.html` 頁尾 CTA 的亮底，寫死在兩處漸層裡。 |
| `#fff` | 2 | `.give-step-num`、`.social-circles a:hover` 的文字色，其他地方都用 `--text-on-dark`。 |

### 5.2 Alpha 階梯 —— 有底色 token，但 alpha 全部手寫

| 基底 | 出現次數 | 用過的 alpha | 現有 token |
|---|---|---|---|
| `#FFFFFF` | **40** | .04 .05 .06 .08 .09 .10 .12 .14 .20 .30 .35 .42 .45 .55 .82 .90 .92 1 | **完全沒有** |
| `#F5F1E8`(`--text-on-dark`) | 26 | .08 .18 .55 .60 .65 .70 .72 .82 .84 .85 .86 .88 .92 .94 | 只有 `--home-text-2`(.82)、`--home-text-3`(.60)，且有 8 處明明是 .82 卻重寫字面值 |
| `#E8A33D` | 27 | 20 種 | 無 |
| `#1A2E40`(`--ink-900`) | 12 | .04 .08 .10 .14 .22 .28 .35 .55 | 只有 `--line-dim`(.08)、`--line-mid`(.14)、`--line-strong`(.22) |
| `#EDE3D3`(`--sand`) | 9 | .16 .32 .55 .70 .92 .94 .98 | `--sand` 只被 `var()` 用過 **1 次** |
| `#C77B52`(`--clay-500`) | 7 | .10 .35 | `--clay-500` 被 `var()` 用過 **0 次** |
| `#FAF6EF`(`--paper`) | 6 | .78 .85 .98 | — |

提案：白／深色兩套介面用的 surface 與 border，各給一組 alpha 階梯 token：

```css
/* 深色面上的白色層（卡片底、邊框、分隔線） */
--surface-1:  rgba(255,255,255,.05);
--surface-2:  rgba(255,255,255,.09);
--surface-3:  rgba(255,255,255,.45);
--surface-4:  rgba(255,255,255,.90);
--hairline-1: rgba(255,255,255,.10);
--hairline-2: rgba(255,255,255,.20);
--hairline-3: rgba(255,255,255,.35);

/* 深色面上的文字（已有 --home-text-* 三階，改成通用命名） */
--on-dark-1: var(--text-on-dark);        /* #F5F1E8 */
--on-dark-2: rgba(245,241,232,.85);      /* 吸收 .82 .84 .85 .86 .88 */
--on-dark-3: rgba(245,241,232,.65);      /* 吸收 .55 .60 .65 .70 .72 */
```

### 5.3 死 token（定義了，全站 0 次 `var()` 引用）

- `--clay-500`（值本身被手寫 rgba 用了 7 次）
- `--clay-tint`
- `--sage-tint`
- `--stats-bg`、`--stats-border`（在兩個 `:root` 區塊 + `body[data-page]` 區塊都定義了三份）

*註：`--ink-700` / `--sky-500` / `--sky-700` 看起來沒被 CSS 用，但它們是 `give.html:118–121`
圓餅圖的 JS 資料在用，**不能刪**。*

### 5.4 Bug：`--line` 從未定義

`assets/css/styles.css:590`

```css
.lead{ stroke:var(--line); stroke-width:1; fill:none; }
```

全站沒有任何地方定義 `--line`（只有 `--line-dim` / `--line-mid` / `--line-strong`）。
這條宣告在計算值階段就無效，`stroke` 會退回繼承值 —— give 頁圓餅圖的引線顏色目前是不受控的。
應改成 `var(--line-mid)`。

順帶一提，`.lead` 這個 class 同時被兩種東西使用：圓餅圖的引線 `<path>`，以及
`.section-head .lead` 這個 `<p>` 段落。目前不衝突（`stroke`/`fill` 對 HTML 文字無效），
但語意上建議把圓餅圖那支改名為 `.donut-lead`。

---

## 6. 建議的導入順序

1. **先加 token 定義**（本次已做）—— 純新增，不改任何 call site，畫面 0 變化。
2. **修 `--line` bug**（本次已做）。
3. **無感遷移**：把 12.5/13.5/14.5/15.5/19/.95rem 換成新 token，把 176 處 `rgba()` 中
   「值剛好等於現有 token」的部分換成 token。畫面 0 變化，可安心整批做。
4. **孤兒色收斂**（需你決定）：`#E8A33D` 要併進 `--amber-500`，還是正式收編為
   `--amber-550`？`#8AA293` 要併進 `--sage-500`，還是收編為 `--sage-mist`？
   這兩題會改變畫面，是設計決定。
5. **★ 級距合併**（需你決定）：第 1.3 節標 ★ 的那幾組。
6. 刪掉 5.3 的死 token。
