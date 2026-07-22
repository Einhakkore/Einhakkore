/* ============================================================
   隱哈歌利 En-hakkore — 共用 Firebase 前端設定
   ============================================================
   ⚠️ 重要安全說明：
   此檔案的內容「會公開於前端」，任何人打開瀏覽器原始碼都看得到，
   這是 Firebase Web SDK 的正常設計，並非漏洞。

   真正的安全防線由以下兩者負責，「不可」在此檔存放任何真正的密鑰：
     1. Firestore Security Rules（firestore.rules）— 決定誰能讀寫資料
     2. Firebase App Check（reCAPTCHA v3）— 擋掉非本站發出的請求

   ── 使用方式 ──
   把下方 YOUR_* placeholder 換成 Firebase Console →
   專案設定 → 一般 → 你的應用程式 裡的實際值即可。
   （apiKey 只是專案識別碼，並非需要保密的私鑰。）
   ============================================================ */

export const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
