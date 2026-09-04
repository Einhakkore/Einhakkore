# 設計規範 — En-hakkore 隱哈歌利

這份文件是**寫新樣式時要遵守的規則**。規範原本散在 `styles.css` 的 `:root` 註解、
`flow.css` 的區塊說明，以及各頁 `<style>` 裡的零星條文，這裡把它們收在一起。

- 想知道「token 為什麼長這樣、從哪些舊值合併而來」→ 見 `DESIGN_TOKENS.md`
- 想知道「檔案怎麼組織、怎麼跑起來」→ 見 `README.md`

> **關於 V3 §編號。** 程式碼註解引用了 §12–§28（例如 `styles.css:265` 的
> 「V3 §23：UI 4px」）。那份原始規範**不在 repo 裡**，本文件的條文是從實作
> 反推整理的。拿到原始文件後，請回頭核對編號與條文是否一致。

---

## 0. 一句話的設計意圖

> 「一座深色的展覽空間，讓光、色彩與人的連結慢慢浮現。」

Contemporary Art Museum × Spiritual Editorial。判斷一個新元件對不對，
先問它像不像展覽空間裡的一面牆，而不是像不像一張 SaaS 卡片。

---

## 1. 顏色

### 1.1 色票有敘事角色，不是「主色／次色」

| 色系 | 角色 |
|---|---|
| **Navy** | 空間 / 深度 |
| **Cobalt** | 思想 / 異象 / 宣言 |
| **Mineral** | 環境 / 旅程 / 流動 |
| **Aqua** | 人與人之間的連結 |
| **Amber** | 光 / 焦點 / 呼召 |
| **Sign** | 警示 / 錯誤 / 急需 |

選色時先問「這一段在講什麼」，不是「這裡需要一個強調色」。
定義在 `assets/css/styles.css` 的 `:root`。

### 1.2 哪些顏色能承載文字 ⚠️

這是全站最容易踩到的規則。每一階都有實測對比值（`tools/contrast-audit.js`）：

| | 色階 |
|---|---|
| **可以當「有字的面」** | Cobalt 700 / 500、Mineral 700、Aqua 700、全部 Navy |
| **只能當「無字的物件」** | Aqua 500 / 300、Mineral 500 / 300、Cobalt 300、**全部 Amber** |

> **黃色當文字是深底的特權。** Amber 最深的 600 壓在白底也只有 2.31:1，
> 連大字的 3:1 都過不了。淺底上的 Amber 只做**填色、底線、圓點**。
> 淺底需要點綴色時用 `--mineral-700`（5.50:1，淺底上唯一安全的冷色文字）。

Sign 同理：`--sign #D14B3A` 本身當文字到處都不過 AA，所以拆三階 ——
`--sign` 只做標記／邊框／圖示，淺底文字用 `--sign-ink`，深底文字用 `--sign-light`。

### 1.3 文字色階

| Token | 對 off-white | 用途 |
|---|---|---|
| `--text-1` | 16.3:1 AAA | 主要標題 |
| `--text-2` | 7.7:1 AAA | 內文 |
| `--text-3` | 5.1:1 AA | 次要內文 |
| `--text-4` | 3.6:1 | ⚠️ **僅限 ≥24px 大字或非文字元素**，不要拿來排內文 |

深底上的文字用 `--text-on-dark`（純白）、`--on-dark-2`（.85）、`--on-dark-3`（.65）。

### 1.4 禁止色票

**sand / clay / sage / coral / 暖紙白** 在 V3 全部移除，整套改冷調。

`styles.css` 裡的 `--sage-700`、`--clay-700`、`--sky-500`、`--paper` 等舊名
**只是指向新值的相容層**，為了避免一次改動兩千多行選擇器而保留。
**新寫的樣式一律直接用 V3 名稱**（`--aqua-700`、`--mineral-700`…）。

### 1.5 不可刪的 token

`--ink-900` / `--ink-700` / `--sky-700` / `--sky-500` 在 CSS 裡看不到 `var()` 引用，
但 `give.html` 的預算圓環圖是用 JS 資料指定顏色的（`give.html:124–129`），
刪掉圓環圖會失色。

### 1.6 改色流程

改任何顏色前後都要跑對比稽核：

```bash
python3 -m http.server 8000 &
node tools/contrast-audit.js
```

---

## 2. 明暗翻面：`data-surface`

V3 的用色比例是 White 40% / Navy 28%，**明暗會一段一段翻**。
所以文字色**絕對不要寫死成 `rgba(255,255,255,…)`** —— 每翻一段就要逐條改回來。

正確做法：section 上宣告 `data-surface="dark|light"`，元件吃 `--surface-*`：

```html
<section class="section" data-surface="dark"> … </section>
```

| Token | dark | light |
|---|---|---|
| `--surface-fg` | 白 | `--navy-900` |
| `--surface-fg-2` | 白 .88 | `--text-2` |
| `--surface-fg-3` | 白 .74 | `--text-3` |
| `--surface-accent` | `--amber-500`（8.20:1） | `--mineral-700` |
| `--surface-line` | 白 .18 | 深 .14 |
| `--surface-line-strong` | 白 .40 | 深 .30 |

翻轉就只是改一個屬性。`--surface-accent` 這一階自動處理了 §1.2 的「金色在淺底
當不了文字」——這是不要繞過它的主要理由。

---

## 3. 字型與文字

### 3.1 三套字型的分工

| 字型 | Token | 用途 |
|---|---|---|
| 獅尾四季春加糖 | `--font-brand` | 品牌字：logo、大標、引用經文 |
| FreightText Pro | `--font-en` | 英文裝飾：eyebrow、引號、數字 |
| Noto Sans TC | `--font-zh` | 一般中文內文、按鈕 |

### 3.2 字級 — 10 階，全部靜態

| Token | 值 | 用途 |
|---|---|---|
| `--fs-3xs` | 11px | SVG 微標籤 |
| `--fs-2xs` | 12px | hint、badge、scroll-hint |
| `--fs-sm` | 14px | 次要內文、eyebrow、desc、表單 label |
| `--fs-md` | 16px | 內文基準 |
| `--fs-xl` | 18px | 導引段落、hero 副標、卡片名 |
| `--fs-2xl` | 20px | 區塊 h3 |
| `--fs-3xl` | 22px | 卡片主標 |
| `--fs-4xl` | 28px | 次級大標、經文 |
| `--fs-5xl` | 36px | 區塊主標、裝飾數字 |
| `--fs-6xl` | 56px | hero h1、philosophy 浮水印 |

> **不要新增 `clamp()` 流體字級。** 舊版 15 組各自手寫的 clamp 已全數移除 ——
> 四個「區塊主標」各有一條不同曲線，同一頁往下捲標題會忽大忽小。
> 窄螢幕的降階**集中在 `styles.css` 檔尾的 `@media (max-width: 700px)`**，
> 一眼看得完整層級。新的大標若需要降階，加在那一區。

### 3.3 行高 / 字距 / 字重

```
--lh-flat 1 · --lh-tight 1.2 · --lh-heading 1.4
--lh-title 1.55（中文標題主力）· --lh-body 1.85 · --lh-loose 2（長文）

--ls-tight -.02em · --ls-none 0 · --ls-cjk .02em（中文標題主力）
--ls-wide .04em · --ls-label .1em · --ls-caps .18em
--ls-eyebrow .25em · --ls-track .3em

--fw-light 300 · --fw-regular 400 · --fw-medium 500
--fw-semibold 600 · --fw-bold 700
```

### 3.4 字型檔的兩條硬規則

**① `font-synthesis: none` 是刻意的。**
站內只宣告真正請求到的字重：ShiweiSiJiChun 500 / 600 / Italic、
FreightText 300 / 400 / 500。缺檔的字重會**直接露餡**，而不是被瀏覽器
用假粗體矇混過去。

FreightText **沒有 italic 檔**，所以 `font-style: italic` 只能用在
`--font-brand` 上（它有真正的 Italic 檔）。舊版 28 處假斜體已全數移除。

**② 新增中文文案後必須重跑子集化。**

```bash
python3 tools/subset-fonts.py
```

字型是依 repo 內實際用到的字元（目前 1,065 字）打包的，
**沒重跑的話新字會掉回系統字型。**

---

## 4. 圓角

```
--radius-card  : 4px    所有卡片 / 面板容器
--radius-input : 4px    輸入框、select、狀態訊息列
--radius-icon  : 4px    icon 徽章底
--radius-btn   : 2px    按鈕
--radius-pill  : 999px  只給特殊互動（例如 serve 的三個圈）
--radius-round : 50%    正圓（頭像、圓點、圓形 icon）
```

原則：**UI 4px / Image 0–4px / Button 0–2px。**

> 整站 16–24px 的圓角會把畫面推向 SaaS，刻意收掉。
> `--radius-pill` 保留但不是常規選項 —— 用之前先確認它真的是個特殊互動元件。

---

## 5. 版面

- **最大寬度 1280px**，側邊留白桌機 64 / 平板 40 / 手機 20
  （`.wrap` 已用 `clamp(20px, 5vw, 64px)` 統一處理，不要在子元件再加一層水平留白）
- **Section 垂直留白**：`clamp(88px, 12vh, 140px)`
- **窄螢幕（≤700px）水平統一 24px**

### 對齊：不要每個標題都置中

`.section-head` 預設**靠左**、`max-width: 46ch`。
置中留給刻意的 statement（經文、頁尾 CTA），需要時加 `.section-head--center`
（量測放寬到 62ch —— 46ch 會把置中的長標題折在很奇怪的位置）。

**右側的空白就是版面的呼吸，不用填滿。** 內頁 hero 一律靠左。

### 少用卡片

需要一組並列資訊時，**優先考慮「一道上緣線 + 大留白」的編輯式排版**，
資訊層級靠字級與間距，而不是「毛玻璃卡 + 圓角 + 陰影」。
範例見 `about.html` 的 `.person-card`（`border-top` + `background: none` + `border-radius: 0`）。

### 深色面上的白色層

需要一張真的卡片時，用這道 alpha 階梯，不要手寫 `rgba()`：

```
--surface-1  白 .05   卡片底
--surface-2  白 .09   hover
--surface-3  白 .45   半透卡
--surface-4  白 .90   實心感卡片
--surface-5  不透明   需要逐字閱讀的內容卡

--hairline-1 白 .10   分隔線
--hairline-2 白 .20   邊框
--hairline-3 白 .35   強調框
```

⚠️ **`--surface-5` 一定要配 `--line-*` 而不是 `--hairline-*`。**
hairline 是白色 alpha，畫在不透明淺底上等於沒有。
`--surface-4` 只有 90%，捲動場的深藍會透上來把深色內文壓成低對比的灰藍 ——
**需要逐字閱讀的卡片（give 頁預算圖、奉獻資訊）用 `--surface-5`**，
半透明的裝飾性卡片維持 `--surface-4`。

---

## 6. 背景行為（Flow 色場）

`assets/css/flow.css` + `assets/js/flow.js` + `assets/partials/flow.html`。
`index` / `about` / `serve` / `give` 四頁用（`body[data-flow="sections"]`）；
`contact` / `terms` 改用 `partials/aurora.html` 的靜態光暈。

### 6.1 架構：一層 fixed 的背景

背景是 `position: fixed` 的 `.flow-field`，**捲動時它不動，所以不存在接縫。**

> 不要回頭去做「每個區塊自己畫一段底色、上緣接前一段顏色」的寫法 ——
> 那等於把漸層烤進版面的幾何裡，看起來就是「一段一段被切開，中間補了個漸層」。

### 6.2 換色：宣告在 section 上

```html
<section data-surface="dark"
         data-flow-palette="#101D29 | #0B1116 | rgba(60,145,173,.16) | 78% 42%">
```

格式是 `bg1 | bg2 | glow 顏色 | glow 位置`。flow.js 把它寫成 inline 的
`--flow-bg1 / --flow-bg2 / --flow-glow / --flow-glow-at`。

**換色靠兩層 ping-pong 交替淡入 opacity**（1.2s，`cubic-bezier(.16,1,.3,1)`），
不重寫整片漸層 —— 重寫會讓整個視窗每一幀重新光柵化，交替淡入則是合成器的事。

### 6.3 深轉亮是 scroll-driven，不是補間

亮色層 `.flow-field__light` 的 opacity 直接綁在捲動進度上
（`animation-timeline: view()`，range `cover 40%` → `cover 62%`），
**捲多少就亮多少**。timeline 掛在一個零高度的哨兵 `.flow-turn` 上，
而不是 section 本身 —— 掛在 section 上的話，高的 section 會讓轉場拖過整段內容。

不支援的瀏覽器走 flow.js 的 IntersectionObserver 交叉淡入，一樣會亮，
只是少了跟捲動同步。

### 6.4 ⚠️ 翻面前後必須留超過一個視窗高的空白

**整個視窗會一起變色，所以變色的那一刻畫面上不能有文字**，
否則會看到「近乎純黑的字寫在還沒轉完的海藍底上」。

`flow.css` 已經用 `clamp(320px, 56vh, 560px)` 對翻面前後兩段各加了留白，
**合計 112vh > 100vh**。舊版兩邊各 34vh、合計 68vh，任何捲動位置都一定有
一邊的字在畫面上 —— 這是它被改掉的原因。

新增 `data-surface="light"` 的段落時，確認 `flow.css` 的
`[data-surface]:has(+ …)` 選擇器組有涵蓋到你的 DOM 結構。

### 6.5 Header 在會變色的場上

深色頁的 `--header-bg` 是 `color-mix(… 92%, transparent)`，**不要調回 78%**：
78% 在「深轉亮」的中間調會讓底下的淺色透上來把整條 bar 提亮，
金色的 active 連結掉到 4.0:1。

---

## 7. 照片遮罩與形狀

`assets/partials/flow.html` 的 `<defs>` 定義 clipPath，`.flow-figure` 取用。

| Class | 形狀 | 預設比例 |
|---|---|---|
| `.flow-figure--spring` | 泉眼：上緣拱起像井口，下緣一道水面的波 | 3 / 4 |
| `.flow-figure--oval` | 直立橢圓：直邊 + 上下收圓 | 3 / 4 |
| `.flow-figure--wave` | 波浪切角：上緣側邊直角，下緣一道波 | 4 / 3 |

**形狀與比例成套，換 class 就換形狀。**

### 7.1 允許與禁止的形狀

允許：**Circle / Arc / Flow Line / Abstract Organic** 四類。
**水滴是禁止形狀**（原本的 `flow-clip-drop` 已移除）。

### 7.2 三條判準

1. **有機輪廓只用在 ≥200px**，小尺寸一律 Circle / Ring
2. **不做線稿版本** —— 線稿一定會讀成 icon
3. **一個畫面最多一種有機輪廓**，不要並排變成「形狀展示」

### 7.3 視差與降級

圖比框高一截（`top: -9%; height: 118%`），捲動時在框內上下走，視差從這裡來。
`clip-path` 解析失敗（partial 沒載到）時圖片只會變回矩形，**不會消失**。
新增遮罩時保持這個特性。

### 7.4 Divider

section 之間的線條轉場，三種：`contour`（等高線／漣漪）、`rift`（裂）、`well`（泉眼）。

```html
<div class="flow-divider" data-flow-divider="contour"></div>
```

線條由 flow.js 產生並量 `getTotalLength()` 做描繪動畫。
`rift` / `well` 的線頭用 mask 在左右兩側淡掉 —— **不要在畫面邊緣留硬切口**。

---

## 8. 動效

| | 值 |
|---|---|
| 主 easing | `cubic-bezier(.16, 1, .3, 1)` |
| 微互動（hover、按鈕） | 200–350ms |
| 進場 reveal | 900ms，位移 40px + `blur(8px)` → 0，stagger 90ms |
| 色場換色 | 1.2s |
| 線稿描繪 | 1.8s |
| Ambient（漂移、呼吸） | **8–40s** |

進場動畫加 `class="reveal"` 即可，`site.js` 會自動依同一個 parent 下的
順序算 `--reveal-delay`（每個 +90ms）。

### `prefers-reduced-motion`

不是全部關掉，**分兩種處理**：

- **關掉**：位移、模糊、視差、blob 動畫、線稿描繪
- **保留**：色場換色（那是資訊，不是動態，只是不再有淡入過程）、
  `.flow-field__light` 的 scroll-driven animation

> `.flow-field__light` 刻意不關 —— 它是跟著捲動走的，不是自己在播。
> 關掉的話整頁會停在深底，而那一段的文字是深色的，會直接看不到。

---

## 9. 無障礙底線

- 主要文字達 **WCAG AAA（≥ 7:1）**，次要文字至少 AA
- 大字（≥24px）的門檻是 3:1 —— `.section-num` 的 opacity 從 .55 提到 .78 就是為此
- 支援 `prefers-reduced-motion`
- 語意化 HTML；純裝飾層一律 `aria-hidden="true"`
- JS 掛掉時內容不能消失：色場停第一層、線條直接顯示、圖片變回矩形

---

## 10. 送出前檢查清單

- [ ] 新顏色是走 token 而不是手寫 `rgba()` / hex？
- [ ] 淺底上有沒有出現金色文字？（見 §1.2）
- [ ] 用的是 V3 名稱而不是 `--sage-*` / `--clay-*` 相容層？
- [ ] 文字色是吃 `--surface-*` 而不是寫死白色？
- [ ] 有沒有新增 `clamp()` 字級？（降階應該加在 700px 斷點）
- [ ] 圓角是不是超過 4px？
- [ ] 新增中文文案 → 跑過 `tools/subset-fonts.py`？
- [ ] 改過顏色 → 跑過 `tools/contrast-audit.js`？
- [ ] 新的 `data-surface="light"` 段落前後留白夠不夠一個視窗高？

---

© 2026 En-hakkore · 隱哈歌利
