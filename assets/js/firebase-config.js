/* ============================================================
   隱哈歌利 En-hakkore — 共用 Firebase 前端設定
   ============================================================
   ⚠️ 重要安全說明：
   此檔案的內容「會公開於前端」，任何人打開瀏覽器原始碼都看得到，
   這是 Firebase Web SDK 的正常設計，並非漏洞。

   真正的安全防線由以下兩者負責，「不可」在此存放任何真正的密鑰：
     1. Firestore Security Rules（firestore.rules）— 決定誰能讀寫資料
     2. Firebase App Check（reCAPTCHA v3）— 擋掉非本站發出的請求

   ── 使用方式 ──
   本檔僅「匯出」設定物件；實際的 initializeApp() 由各頁面
   （admin.html / give.html）自行呼叫，並統一使用 gstatic CDN 的
   Firebase ES 模組。切勿在此加入 `import ... from "firebase/app"`
   之類的 bare specifier，瀏覽器無法解析，會導致整個模組載入失敗、
   讓引用它的頁面整頁空白。
   ============================================================ */

// Firebase Web 設定（apiKey 只是專案識別碼，並非需要保密的私鑰）。
export const firebaseConfig = {
  apiKey:            "AIzaSyBvqv6Y9ed6tFDDc5LLHC1ePFtcwQwBeV4",
  authDomain:        "einhakkore-3efe2.firebaseapp.com",
  projectId:         "einhakkore-3efe2",
  storageBucket:     "einhakkore-3efe2.firebasestorage.app",
  messagingSenderId: "158806315576",
  appId:             "1:158806315576:web:cb9a50f92d57ff562fcccd",
  measurementId:     "G-Q91DCHM5YC"
};
