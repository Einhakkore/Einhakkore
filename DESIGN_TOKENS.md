# 設計 Token — 現況與使用規範

本檔記錄統一後的 token 系統。歷次盤點數據與合併理由一併保留，方便日後回溯。

範圍：`assets/css/styles.css`、`about.html` / `serve.html` 的頁內 `<style>`、
`give.html` 圓餅圖設定、`assets/js/site.js`。

---

## 0. 這次做了什麼

| 面向 | 之前 | 現在 |
|---|---|---|
| font-size 靜態級距 | 27 階（含 12.5 / 13.5 / 14.5 / 15.5 半格） | **10 階，全部靜態** |
| font-size 流體 `clamp()` | 15 組各自手寫 | **0 組**（改由單一 mobile 斷點降階） |
| line-height | 21 種 | **6 種** |
| letter-spacing | 18 種 | **8 種** |
| font-weight | 5 種、無 token | **5 個 token** |
| 手寫 `rgba()` / hex | 176 + 47 | **0**（全部走 token） |
| palette 金色 | 2 支（#FFBA49 / #E8A33D） | **1 支** |
| palette 綠色 | 3 支（#7FA64E / #8AA293 / #6B9040） | **1 支** |
| 假斜體 | 28 處瀏覽器合成 | **0 處** |
| 字型檔 | 9 支 / 33 MB | **6 支 / ~780 KB** |
| 無引用 token | 5 個 | **0 個** |

---

## 1. 字級 `--fs-*`

全部靜態。`clamp()` 已全數移除 —— 舊版四個「區塊主標」各有一條不同曲線，
同一頁往下捲標題會忽大忽小。窄螢幕的降階集中在 `@media (max-width: 700px)`
（`styles.css` 檔尾）與 `about.html` 自己的 720px 斷點，一眼看得完整層級。

| Token | 值 | 吸收的舊值 | 用途 |
|---|---|---|---|
| `--fs-3xs` | 11px | 10 · 11 | SVG 微標籤（node-en、core-en） |
| `--fs-2xs` | 12px | 12 · 12.5 | hint、badge、scroll-hint |
| `--fs-sm` | 14px | 13 · 13.5 · 14 · 14.5 | 次要內文、eyebrow、desc、表單 label |
| `--fs-md` | 16px | 15 · 15.5 · 16 · .95rem | 內文基準 |
| `--fs-xl` | 18px | 17 · 18 · 19 | 導引段落、hero 副標、卡片名 |
| `--fs-2xl` | 20px | 20 | 區塊 h3 |
| `--fs-3xl` | 22px | 22 | 卡片主標 |
| `--fs-4xl` | 28px | 24 · 26 · 28 · 30 | 次級大標、經文 |
| `--fs-5xl` | 36px | 32 · 34 · 38 · 40 · 42 · 48 · 64 | 區塊主標、裝飾數字 |
| `--fs-6xl` | 56px | 56 · 72 · 88 · 104 | hero h1、philosophy 浮水印 |

### 流體 → 靜態的對照

| 原本 | 現在（桌機） | 窄螢幕 |
|---|---|---|
| `.hero h1` clamp(36→56) | 56 | 36 |
| `.scr-hero__title` clamp(36→72) | 56 | 36 |
| `.page-hero h1` clamp(32→48) | 36 | 28 |
| `.section-head h2` clamp(28→38) | 36 | 28 |
| `.feature-text h2` clamp(28→36) | 36 | 28 |
| `.cta-poem` clamp(26→36) | 36 | 28 |
| `.about-cta h2` clamp(26→40) | 36 | 28 |
| `.philosophy__title` clamp(28→44) | 36 | 28 |
| `.verse-quote` clamp(22→30) | 28 | 22 |
| `.net-block h3` clamp(22→28) | 28 | 22 |
| `.ss-content h3` clamp(18→22) | 22 | 22 |
| `.philosophy__label` clamp(56→104) | 56 | 36 |
| `.section-num` 64 | 56 | 36 |

---

## 2. 行高 `--lh-*`

| Token | 值 | 吸收 |
|---|---|---|
| `--lh-flat` | 1 | 1 |
| `--lh-tight` | 1.2 | 1.05 · 1.15 · 1.2 |
| `--lh-heading` | 1.4 | 1.4 |
| `--lh-title` | 1.55 | 1.5 · 1.55 · 1.6 · 1.65 |
| `--lh-body` | 1.85 | 1.7 · 1.75 · 1.8 · 1.85 · 1.9 |
| `--lh-loose` | 2 | 1.95 · 2 · 2.05 |

`.6 / .8 / .9` 只出現在引號裝飾（`.quote-mark`、`.ss-num`），刻意留原地寫死。

## 3. 字距 `--ls-*`

| Token | 值 | 吸收 |
|---|---|---|
| `--ls-tight` | -.02em | -.02 |
| `--ls-none` | 0 | 0 |
| `--ls-cjk` | .02em | .02 · .03 |
| `--ls-wide` | .04em | .04 · .05 |
| `--ls-label` | .1em | .08 · .1 · .12 |
| `--ls-caps` | .18em | .15 · .18 · .2 |
| `--ls-eyebrow` | .25em | .25 · .28 |
| `--ls-track` | .3em | .3 · .32 · .35 · .4 |

## 4. 字重 `--fw-*`

`--fw-light` 300 ／ `--fw-regular` 400 ／ `--fw-medium` 500 ／
`--fw-semibold` 600 ／ `--fw-bold` 700

---

## 5. 顏色

### 5.1 合併結果

| 併掉的色 | 原本用量 | 現在 |
|---|---|---|
| `#E8A33D`（從未進 palette） | 27 處、20 種 alpha | `--amber-500` |
| `--amber-700 #C49C0C` | 28 處 | `--amber-500` |
| `--clay-500 #C77B52` | 7 處（皆為手寫 rgba） | `--amber-500` |
| `#8AA293`（從未進 palette） | 6 處 | `--sage-500` |
| `#6B9040`（從未進 palette） | 1 處 | `--sage-500` |
| `#E9EEEA`（從未進 palette） | 6 處 | `--paper` |

> ⚠️ **已知的對比取捨。** `--amber-500 #FFBA49` 對 `--paper #FAF6EF` 的對比是
> **1.6:1**（WCAG 內文需 4.5:1、大字需 3:1）。被併掉的 `--amber-700 #C49C0C`
> 原本是 4.6:1，註解明寫「文字級琥珀（對 paper 達 AA）」。
>
> 合併之後，淺色頁（contact / terms / serve / admin）上以琥珀色呈現的文字
> —— `.section-eyebrow`、`.newsletter-label`、`.practice-card .roman`、
> `.btn-text`、`.feature-text .link`、`.terms-content a`、`h2 em` 等 ——
> 對比都掉到 1.6:1。深色頁（home / about）不受影響，因為琥珀落在深底上。
>
> **give 頁是例外**：`.donate-block` / `.budget` 兩張卡是 `--surface-5` 淺底，
> 卡上這三處琥珀文字實測 1.6:1 —— `.donate-block h3`（合作副標）、
> `.budget h3 em`（「67.7 萬」）、`.form-consent a`（同意條款連結）。
> 待挑色後再改，目前維持 `--amber-500`。
>
> 若要救回可讀性又保持「只有一支金」，做法是：**裝飾**（按鈕底、邊框、光暈、
> icon、深底文字）維持 `--amber-500`，**淺底上的文字**改用 `--ink-800`／`--ink-900`。
> 這是純 CSS 的改動，需要時再說一聲。

### 5.2 Alpha 階梯

深色介面的 surface / border / 文字，過去有 66 處手寫 rgba、完全沒有 token：

```css
--surface-1:  rgba(255,255,255,.05);   /* 卡片底 */
--surface-2:  rgba(255,255,255,.09);   /* hover */
--surface-3:  rgba(255,255,255,.45);   /* 半透卡 */
--surface-4:  rgba(255,255,255,.90);   /* 實心卡 */
--hairline-1: rgba(255,255,255,.10);   /* 分隔線 */
--hairline-2: rgba(255,255,255,.20);   /* 邊框 */
--hairline-3: rgba(255,255,255,.35);   /* 強調框 */
--on-dark-2:  rgba(245,241,232,.85);   /* 深底內文 */
--on-dark-3:  rgba(245,241,232,.65);   /* 深底小字 */
```

深底標題直接用 `--text-on-dark`（`#F5F1E8`）。

### 5.2b `--surface-5` — 階梯末端的不透明底

`--surface-4` 只有 90% 不透明度，捲動場的深藍仍會透上來，把 `--text-1` 的內文
壓成低對比的灰藍。**需要逐字閱讀**的卡片（give 頁的預算圓環圖、奉獻資訊）
再往上補一階：

```css
--surface-5: var(--paper);   /* #FAF6EF — 不透明 */
```

前四階是白色 alpha，第五階不另立新色，直接吃既有的 `--paper`。

配邊框時注意：`--hairline-*` 是白色 alpha，畫在淺底上等於沒有 ——
`--surface-5` 的卡片一律配 `--line-*`（give 頁兩張卡用 `--line-mid`）。
半透明的裝飾性卡片維持 `--surface-4` 不變。

### 5.3 不可刪的 token

`--ink-700` / `--sky-500` / `--sky-700` 在 CSS 裡看不到 `var()` 引用，
但它們是 `give.html:118–121` 圓餅圖的 JS 資料在用。
`--stop-0` ~ `--stop-4` 共 15 個由 `site.js` 讀取。**都不可刪。**

---

## 6. 字型

### 6.1 子集化

`ShiweiSiJiChun` 原始檔每支 8.1–8.8 MB，四支合計 **33 MB** ——
（舊註解宣稱「已 subset 到 ~180 KB」，但那一步從未進到 repo。）

現由 `tools/subset-fonts.py` 掃過 repo 內所有 `.html` / `.js`，
取字元聯集（目前 1,065 字）後重新打包：

```
python3 tools/subset-fonts.py
```

原始檔放在 `assets/fonts/_src/`，該目錄已 `.gitignore` ——
每支 8 MB 以上，進版本控制會讓 repo 再肥 25 MB。
要重跑時先依 `.gitignore` 內的指令從 git 歷史還原原始檔。

**新增中文文案之後要重跑一次，否則新字會掉回系統字型。**

### 6.2 已移除的字型檔

站內從未請求這三個字重，連同 `@font-face` 宣告一併刪除：

| 檔案 | 原因 |
|---|---|
| `ShiweiSiJiChun-Regular.woff2` | 400 normal 從未請求（brand 的 400 一律搭 italic） |
| `FreightTextPro-Semibold.woff2` | 600 從未請求 |
| `FreightTextPro-Bold.woff2` | 700 從未請求 |

保留：ShiweiSiJiChun 500 / 600 / Italic、FreightText 300 / 400 / 500。

### 6.3 假斜體

FreightText 只有五支正體、沒有 italic 檔，站上卻有 **28 處**
用 `font-style: italic` —— 那些 eyebrow、section-num、引號全是瀏覽器
把正體硬拉斜的合成字。已全數移除 `font-style: italic`，改為正體。

`--font-brand`（ShiweiSiJiChun）有真正的 Italic 檔，
所以 7 處 `em` 強調字維持斜體不變。

`body` 另設 `font-synthesis: none`：日後若有人請求缺檔的字重／字形，
會直接顯現而不是被合成矇混過去。

---

## 7. 修掉的 bug

### 7.1 alpha 階梯 token 自我循環（give 頁整頁失效）

§5.2 那九個 token 進 `styles.css` 時被寫成了自我參照：

```css
--surface-4:  var(--surface-4);   /* ← 循環，不是宣告 */
--hairline-3: var(--hairline-3);
--on-dark-2:  var(--on-dark-2);
/* ...共 9 個 */
```

依 CSS 自訂屬性規範，循環參照的 token 在 computed-value 階段即為
guaranteed-invalid，所有引用它的宣告一併失效：

- `.donate-block` / `.budget` 的 `background: var(--surface-4)` → 退回
  `transparent`，兩張白卡直接消失，深藍背景場透出來
- `border: 1px solid var(--hairline-3)` 是簡寫，整條失效 → `border-style: none`
- 卡上的文字仍是 `--text-1`（`#1A2E40`）等深色值，落在深藍底上 ≈ 1.1:1，
  give 頁的預算圓環圖與奉獻資訊因此**完全讀不到**

已改回 §5.2 列的實際 rgba 值。同時受影響的還有 home / about 的 `--card-bg`、
`--on-dark-2/3` 與 newsletter 邊框。

### 7.2 圓餅圖引線的 `--line`

`styles.css` 的 `.lead{ stroke: var(--line) }` —— 全站從未定義 `--line`
（只有 `--line-dim` / `--line-mid` / `--line-strong`）。宣告在計算值階段即失效，
`stroke` 退回繼承值，give 頁圓餅圖引線的顏色是不受控的。已改綁 `--line-mid`。
