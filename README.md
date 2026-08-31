# 隱哈歌利 En-hakkore 官網

純靜態 HTML / CSS / JavaScript 網站，無需 build。

## 設計重點

- 🌊 **Flow 色場**：背景以 section 為單位換色（`data-flow-palette`），
  搭配「裂／湧／流」三組 SVG 線稿轉場（`data-flow-divider`）
- 🎯 **AAA 對比度**：主要文字達 WCAG AAA（≥ 7:1），可用 `tools/contrast-audit.js` 稽核
- ♿ **無障礙**：支援 `prefers-reduced-motion`、語意化 HTML
- 🔥 **表單接 Firebase**：聯絡、參與服事、奉獻表單寫入 Firestore，後台在 `admin.html`

## 檔案結構

```
├── index.html              # 首頁
├── about.html              # 起源與異象
├── serve.html              # 參與我們
├── give.html               # 奉獻支持
├── contact.html            # 聯絡我們
├── terms.html              # 服務條款 / 隱私權政策
├── admin.html              # 表單後台（robots noindex）
├── firestore.rules         # Firestore 安全規則
│
├── assets/
│   ├── css/styles.css      # 全站樣式
│   ├── css/flow.css        # Flow 色場 / 線稿 / 遮罩
│   ├── js/site.js          # partial loader + 進場動畫 + 點擊複製 + 表單
│   ├── js/flow.js          # Flow 的行為層（線稿描繪、換色、視差）
│   ├── js/firebase-config.js
│   ├── fonts/              # 子集化後的 woff2
│   ├── img/                # logo 與照片（webp）
│   └── partials/           # 共用區塊
│
└── tools/
    ├── contrast-audit.js   # 全站文字對比稽核（Playwright）
    └── subset-fonts.py     # 字型子集化
```

## 怎麼瀏覽

**請用本地伺服器**（partial loader 走 `fetch()`，`file://` 會被瀏覽器擋）：

```bash
python3 -m http.server 8000
# 開 http://localhost:8000
```

## 字型

| 字型 | 用途 | 檔案 |
|---|---|---|
| **獅尾四季春加糖** | 品牌字型：logo、大標、引用經文 | `ShiweiSiJiChun-Medium/SemiBold/Italic.woff2` |
| **FreightText Pro** | 英文裝飾：eyebrow、引號、數字 | `FreightTextPro-Light/Book/Medium.woff2` |
| **Noto Sans TC** | 一般中文內文、按鈕 | Google Fonts，各頁 `<head>` 以 `<link>` 載入 |

字型已用 `tools/subset-fonts.py` 子集化（6 支、約 780 KB）。原始檔不進版本控制，
需要重跑時見 `.gitignore` 內的還原指令。

`font-synthesis: none` 是刻意的——每個字重／字形都有實體檔案，
漏掉哪一個會直接露出來，而不是被瀏覽器用假粗體矇混過去。

## 顏色

`assets/css/styles.css` 最上面的 `:root` 是 V3 色票（Navy / Cobalt / Mineral /
Aqua / Amber / Sign），每一階都註明了實測對比與「能不能承載文字」。
完整的 token 系統與合併理由見 `DESIGN_TOKENS.md`。

改色前請先跑一次對比稽核：

```bash
python3 -m http.server 8000 &
node tools/contrast-audit.js
```

## 共用區塊維護

共用區塊放在 `assets/partials/`，每一頁只放對應的佔位 `<div data-include="...">`，
由 `assets/js/site.js` 於載入時透過 `fetch()` 抓取並塞回 DOM。
改一次，所有頁面同步更新：

| 檔案 | 用途 | 佔位標籤 |
|---|---|---|
| `partials/header.html`     | 導覽列 | `<div data-include="header"></div>` |
| `partials/footer.html`     | 頁尾 | `<div data-include="footer"></div>` |
| `partials/icons.html`      | SVG symbol 圖示庫 | `<div data-include="icons"></div>` |
| `partials/flow.html`       | Flow 的 clipPath 與色場層 | `<div data-include="flow"></div>` |
| `partials/newsletter.html` | 訂閱代禱信 | `<div data-include="newsletter"></div>` |
| `partials/aurora.html`     | 背景光暈（非 flow 頁面用） | `<div data-include="aurora"></div>` |

`flow.js` 依賴 `flow.html` 已進 DOM，所以 `<script>` 的順序必須是
`site.js` →（GSAP / ScrollTrigger）→ `flow.js`。

## 表單

聯絡表單（`contact.html`）、參與服事（`serve.html`）與奉獻（`give.html`）
都寫入 Firestore，由各頁底部的 Firebase module 直接處理送出、App Check 驗證、
honeypot 檢查與狀態訊息；帶 `data-backend` 的表單 `site.js` 不會攔截。

設定步驟（Firestore 規則、Google 登入、App Check）見 **`FIREBASE_SETUP.md`**。

訂閱代禱信因平台限制不在站內收單，直接外連 <https://enhakkore.substack.com/>。

## License 注意

- **FreightText Pro** — Adobe 商業字型，請確認你擁有合法授權
- **獅尾四季春加糖** — 由 [Max 字型集](https://maxsfonts.com/) 提供，多為 SIL Open Font License

---

© 2026 En-hakkore · 隱哈歌利
