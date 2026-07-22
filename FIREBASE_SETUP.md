# Firebase 部署與設定指南

本文件說明如何把奉獻表單（`donate.html`）與後台（`admin.html`）串上 Firebase，
並在上線前完成三道安全設定：**Firestore 規則**、**Google 登入**、**App Check**。

> 所有步驟以「Firebase Console」（<https://console.firebase.google.com/>）操作為主。
> 需要一個 Firebase 專案；若尚未建立，先在 Console 點「新增專案」。

---

## 0. 填入專案設定

1. Firebase Console →「專案設定」（齒輪圖示）→「一般」。
2. 在「你的應用程式」區塊建立一個「網頁應用程式」（`</>` 圖示），取得 `firebaseConfig`。
3. 打開 `assets/js/firebase-config.js`，把 `YOUR_*` 的 placeholder 換成實際值。

> ⚠️ `firebase-config.js` 的內容會公開於前端，這是正常設計。
> `apiKey` 只是專案識別碼，不是需要保密的私鑰；真正的安全防線是下方的
> Firestore 規則與 App Check，**切勿在此檔存放任何真正的密鑰**。

---

## 1. 部署 Firestore 安全規則

規則檔為專案根目錄的 `firestore.rules`。它規範：

- `donations` 集合：任何人皆可 **create**（並驗證欄位型別與長度上限），
  但 **read** 僅限管理者白名單，**update / delete** 一律禁止。
- 管理者白名單寫在 `isAdmin()` 函式的 email 陣列中。
  **日後新增管理者，只需在該陣列加入 email 並重新部署規則即可。**

### 方法 A — 直接貼到 Console（最簡單）

1. Firebase Console → 左側「Firestore Database」→ 上方分頁「規則」。
2. 把 `firestore.rules` 的**全部內容**複製、覆蓋貼上編輯器。
3. 按「發布」。

### 方法 B — 使用 Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

> 每次修改 `firestore.rules`（例如新增管理者 email）後，都要重新執行發布，規則才會生效。

---

## 2. 啟用 Google 登入（後台身分驗證）

`admin.html` 以 Google 登入確認身分，登入後由 Firestore 規則判斷該 email
是否在白名單內；不在白名單者會收到權限錯誤，畫面顯示
「此帳號沒有檢視權限，請聯繫管理者。」

1. Firebase Console → 左側「Authentication」→ 若第一次使用先按「開始使用」。
2. 上方分頁「Sign-in method」→ 供應商清單中點「Google」。
3. 開啟「啟用」開關，選擇專案對外顯示名稱與支援用 email，按「儲存」。
4. 上方分頁「Settings」→「Authorized domains（授權網域）」，
   確認正式網域（例如 `enhakkore.org`）與測試用網域已列入；
   本機測試時 `localhost` 預設已允許。

> 白名單的 email 必須與 `firestore.rules` 的 `isAdmin()` 陣列一致。

---

## 3. 啟用 App Check（防機器人／垃圾寫入）

App Check 會為每個請求簽發 token，讓 Firestore 只接受「來自本站」的請求，
擋掉直接打 API 的機器人。目前程式碼中的 App Check 區塊**先以註解包住**，
取得 site key 後解除註解即可啟用。

### 3-1. 取得 reCAPTCHA v3 site key

1. 前往 reCAPTCHA 管理台：<https://www.google.com/recaptcha/admin/create>
2. 標籤自訂；類型選 **reCAPTCHA v3**。
3. 「網域」填入正式網域（例如 `enhakkore.org`）；本機測試可加 `localhost`。
4. 建立後會得到兩把金鑰：
   - **網站金鑰（site key）** → 前端使用（就是我們要填的）。
   - **密鑰（secret key）** → 交給 Firebase Console 註冊，**不要放進前端**。

### 3-2. 在 Firebase Console 註冊 App Check

1. Firebase Console → 左側「App Check」→ 選擇你的網頁應用程式。
2. 供應商選「reCAPTCHA v3」，貼上上一步的 **secret key**，儲存。
3. 待前端啟用並驗證無誤後，於「App Check」把 Firestore 設為
   **Enforce（強制）**，未帶合法 token 的請求就會被拒收。

### 3-3. 在前端解除註解

1. 打開 `assets/js/firebase-config.js` 旁的頁面程式：
   `donate.html` 與 `admin.html` 各有一段被註解的 App Check 初始化區塊。
2. 解除該區塊的註解，並把 `YOUR_RECAPTCHA_V3_SITE_KEY` 換成 **site key**。
3. 兩個檔案都要改（奉獻表單與後台都需要 App Check 保護）。

```js
import { initializeAppCheck, ReCaptchaV3Provider }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("你的 site key"),
  isTokenAutoRefreshEnabled: true
});
```

---

## 4. 上線前檢查清單

- [ ] `assets/js/firebase-config.js` 已填入真實專案設定（非 `YOUR_*`）。
- [ ] `firestore.rules` 已發布，且 `isAdmin()` 白名單為正確的管理者 email。
- [ ] Authentication 已啟用 Google 登入，授權網域含正式網域。
- [ ] 以**白名單帳號**登入 `admin.html` 能看到奉獻紀錄；
      以**非白名單帳號**登入會看到「此帳號沒有檢視權限」訊息。
- [ ] App Check 已註冊並在前端解除註解；確認奉獻表單仍能正常送出後，
      再於 Console 切換為 Enforce。
- [ ] 測試送出一筆奉獻，確認資料進到 Firestore 的 `donations` 集合。
