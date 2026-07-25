/* ============================================================
   隱哈歌利 En-hakkore — Newsletter 訂閱（Firebase module）
   ============================================================
   為什麼有這支檔案？
   舊版是在前端用 fetch(..., { mode:"no-cors" }) 直接打 Substack，
   拿到的是 opaque response（讀不到狀態），再「無條件」顯示成功畫面——
   於是畫面說成功、實際卻沒訂閱。這支 module 改成：

     1. 寫入 Firestore 的 subscribers 集合（由 Firestore Rules + App Check 把關）。
        這是「真正的成功依據」——寫入成功才跳 Success Modal。
     2. 額外對 Substack 發一次 best-effort 請求（碰運氣，不影響成功判定）。
        免費 Spark 方案無法用 Cloud Function 從伺服器端可靠地打 Substack；
        日後若升級 Blaze，把第 2 步換成呼叫 Cloud Function 即可。

   ── 載入方式 ──
   newsletter 區塊是共用 partial（由 site.js 注入），注入的 <script> 不會執行，
   因此本檔以獨立 module 於各頁載入，並等 site.js 派發的 'partials:loaded'
   事件後才綁定表單。
   ============================================================ */

import { initializeApp, getApps, getApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";
import { firebaseConfig } from "./firebase-config.js";

// 用「具名 app」而非 default app：newsletter 是共用 partial，會和 contact /
// donate / volunteer 各頁「自己的」Firebase module 同頁共存；那些 module 已用
// initializeApp() 建了 default app，這裡若再建一次 default 會丟 duplicate-app
// 而讓頁面壞掉。具名 app 完全獨立，互不干擾。
const APP_NAME = "newsletter";
const app = getApps().some(a => a.name === APP_NAME)
  ? getApp(APP_NAME)
  : initializeApp(firebaseConfig, APP_NAME);
const db = getFirestore(app);

// App Check（防機器人／垃圾寫入）— 與 contact/donate 共用同一把 reCAPTCHA v3 site key。
// 已初始化則略過（try/catch 防重複初始化報錯）。
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6LcXU18tAAAAAG50yNTaHpCQlwnF8hZXJl1VydWr"),
    isTokenAutoRefreshEnabled: true
  });
} catch (_) { /* already initialized */ }

// 簡單的 email 格式檢查（真正的把關在 Firestore Rules）
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Success Modal（動態建立，各頁共用一份） ----------
let modalEl = null;
function buildModal() {
  if (modalEl) return modalEl;
  const overlay = document.createElement("div");
  overlay.className = "nl-modal";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "nlModalTitle");
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="nl-modal-backdrop" data-close></div>
    <div class="nl-modal-card" role="document">
      <div class="nl-modal-check" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h3 id="nlModalTitle">訂閱成功！</h3>
      <p class="nl-modal-body"></p>
      <button type="button" class="nl-modal-btn" data-close>好的</button>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => closeModal();
  overlay.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") close();
  });

  modalEl = overlay;
  return overlay;
}
let lastFocus = null;
function openModal(message) {
  const overlay = buildModal();
  overlay.querySelector(".nl-modal-body").textContent = message;
  lastFocus = document.activeElement;
  overlay.hidden = false;
  document.body.classList.add("nl-modal-open");
  const btn = overlay.querySelector(".nl-modal-btn");
  if (btn) btn.focus();
}
function closeModal() {
  if (!modalEl) return;
  modalEl.hidden = true;
  document.body.classList.remove("nl-modal-open");
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

// ---------- best-effort：碰運氣同步到 Substack（不影響成功判定） ----------
function bestEffortSubstack(form, email) {
  const url = form.dataset.substack;
  if (!url) return;
  try {
    const body = new URLSearchParams();
    body.append("email", email);
    // Substack embed 需要 email；帶上 source 無妨。
    body.append("source", "embed");
    // no-cors：讀不到結果，純粹碰運氣，失敗一律吞掉。
    fetch(url, { method: "POST", mode: "no-cors", body }).catch(() => {});
  } catch (_) { /* ignore */ }
}

// ---------- 綁定單一表單 ----------
function bindForm(form) {
  if (form.dataset.nlBound) return;      // 防止重複綁定
  form.dataset.nlBound = "1";

  const statusEl = document.getElementById("newsletterStatus")
    || form.parentElement.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const setStatus = (msg, type) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status show " + type;
  };
  const clearStatus = () => { if (statusEl) statusEl.className = "form-status"; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    // honeypot：真人不會填 website 這欄，被填 → 判定為機器人並靜默丟棄
    if ((fd.get("website") || "").trim() !== "") return;

    const email = (fd.get("email") || "").trim();
    if (!EMAIL_RE.test(email)) {
      setStatus("請輸入正確的電子郵件格式。", "err");
      const input = form.querySelector('input[type="email"]');
      if (input) input.focus();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setStatus("送出中…", "ok");

    try {
      // 1) 真正的成功依據：寫入 Firestore（欄位需與 firestore.rules 的白名單一致）
      await addDoc(collection(db, "subscribers"), {
        email,
        createdAt: serverTimestamp(),
        source: "newsletter"
      });

      // 2) best-effort 同步 Substack（碰運氣，不影響上面的成功判定）
      bestEffortSubstack(form, email);

      form.reset();
      clearStatus();
      openModal("我們已收到您的訂閱！請至信箱點擊「確認訂閱」連結，即可開始收到代禱信。");
    } catch (err) {
      console.error("[newsletter] 訂閱失敗", err);
      setStatus("訂閱失敗，請稍後再試，或直接來信 einhakkore@gmail.com。", "err");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ---------- 綁定頁面上所有 newsletter 表單 ----------
function bindAll() {
  document.querySelectorAll("form.newsletter-form").forEach(bindForm);
}

// partial 由 site.js 非同步注入：等 'partials:loaded' 事件後再綁定；
// 若本檔載入時表單已在 DOM（例如頁面自帶），也立即綁一次（bindForm 有防重複）。
document.addEventListener("partials:loaded", bindAll);
bindAll();
