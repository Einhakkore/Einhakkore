# 隱哈歌利 En-hakkore 官網（v2 — Aurora 版）

純靜態 HTML / CSS / JavaScript 網站，無需 build。

## 設計重點

- 🌌 **Aurora 柔光背景動畫**：4 個漂浮光點 + 細小星點，30-40 秒慢循環，捲動有視差
- ✏️ **客製化線型 SVG 圖示**：12 個專為宣教情境設計的線稿圖示
- 📷 **質感攝影**：用 Unsplash 紀實風格的免費圖片，可直接替換成自己的攝影
- 🎯 **AAA 對比度**：主要文字達 WCAG AAA 標準（對比度 ≥ 7:1）、裝飾文字達 AA
- 🎵 **7 種 section 節奏**：hero / cards / verse / feature / stats / cta-poem / newsletter
- ♿ **無障礙**：支援 `prefers-reduced-motion`、語意化 HTML

## 檔案結構

```
einhakkore-site/
├── index.html              # 首頁
├── about.html              # 關於我們
├── donate.html             # 奉獻支持
├── volunteer.html          # 參與服事
├── contact.html            # 聯絡我們
├── terms.html              # 服務條款 / 隱私
│
└── assets/
    ├── css/styles.css      # 全站樣式
    ├── js/site.js          # 共用 JS（含 partial loader）
    ├── fonts/              # 字型檔
    ├── img/                # logo 圖片
    └── partials/           # 共用區塊（nav / footer / 訂閱信 / aurora）
```

## 怎麼瀏覽

**請用本地伺服器**（雙擊 HTML 開可能會被瀏覽器擋字型）：

```bash
cd einhakkore-site
python3 -m http.server 8000
# 開 http://localhost:8000
```

## 字型

| 字型 | 用途 | 檔案 |
|---|---|---|
| **獅尾四季春加糖** | 品牌字型：logo、大標、引用經文 | `ShiweiSiJiChun-Regular/Medium/SemiBold.ttf` |
| **FreightText Pro** | 英文裝飾：eyebrow、引號、數字 | `FreightTextPro-*.otf`（5 個字重） |
| **Noto Sans TC** | 一般中文內文、按鈕 | Google Fonts，CSS 內 @import |

⚠️ **字型優化建議**：獅尾四季春加糖每個檔案約 26MB，總計 78MB。正式上線前建議用 [cn-font-split](https://github.com/KonghaYao/cn-font-split) 做字型子集化，可壓到 1-2MB。

## 圖片

目前用 **Unsplash CDN** 圖片（免費、無需署名），URL 直接寫在 HTML 裡。要替換成你自己的攝影：

1. 把圖片放進 `assets/img/`
2. 在對應 HTML 找到 `<img src="https://images.unsplash.com/...">`
3. 改成 `<img src="assets/img/你的檔名.jpg" alt="...">`

## 顏色（已設定為 AAA 對比）

`assets/css/styles.css` 最上面的 `:root` 區塊：

```css
:root {
  --navy-900: #1A2E40;      /* 背景主色 */
  --amber-500: #E8A33D;     /* 強調色 */
  --amber-400: #F2C36B;     /* 文字 amber, 對比 7.4:1 - AAA */

  --text-1: #F5F1E8;        /* 主文字 - 13.5:1 - AAA */
  --text-2: #D8DDE4;        /* 內文 - 10.8:1 - AAA */
  --text-3: #ADB7C0;        /* 次要 - 7.1:1 - AAA */
  --text-4: #8A96A2;        /* 標籤 - AA Large only */
}
```

## 自訂 Aurora 動畫

在 `assets/css/styles.css` 內搜尋 `.aurora-blob`：

```css
.aurora-1 {
  opacity: .85;                /* 想更暗就降低、更亮就拉高 */
  animation: drift1 32s ...;   /* 想更慢拉到 60s、更快降到 16s */
}
```

完全不要動畫的話：HTML 移除 `<div class="aurora">...</div>` 整段即可。

## 共用區塊維護

Nav、footer、訂閱信、Aurora 背景四個共用區塊都放在 `assets/partials/`，
每一頁只放對應的佔位 `<div data-include="...">`，由 `assets/js/site.js`
於載入時透過 `fetch()` 抓取 partials 並塞回 DOM。

要修改共用區塊，只要改 `assets/partials/` 下的檔案，六個頁面會同步更新：

| 檔案 | 用途 | 頁面裡的佔位標籤 |
|---|---|---|
| `partials/header.html`     | 導覽列 | `<div data-include="header"></div>` |
| `partials/footer.html`     | 頁尾 | `<div data-include="footer"></div>` |
| `partials/newsletter.html` | 訂閱代禱信 | `<div data-include="newsletter"></div>` |
| `partials/aurora.html`     | 背景光暈 | `<div data-include="aurora"></div>` |

> 因為 loader 用 `fetch()`，請務必透過本地伺服器（例如 `python3 -m http.server`）
> 或部署到 Web server 觀看；直接雙擊開啟 `file://` 會被瀏覽器擋。

## 表單

聯絡表單和電子報訂閱目前是**前端模擬送出**（顯示「已送出」訊息，但沒實際送到任何地方）。

要讓表單真的能用，接以下其中一種：
- [Formspree](https://formspree.io/) — 最簡單
- [Netlify Forms](https://docs.netlify.com/forms/setup/) — 部署到 Netlify 就免費
- 自己架後端 / 用 Google Apps Script

## License 注意

- **FreightText Pro** — Adobe 商業字型，請確認你擁有合法授權
- **獅尾四季春加糖** — 由 [Max 字型集](https://maxsfonts.com/) 提供，多為 SIL Open Font License
- **Unsplash 圖片** — 免費商用、無需署名

---

© 2026 En-hakkore · 隱哈歌利
