/* ============================================================
   EINHAKKORE — Site JavaScript
   partials loader + stagger reveal + 點擊複製 + 表單
   ============================================================ */

(function () {

  // ---------- Shared partials loader ----------
  // 每頁把 <div data-include="header|footer|newsletter|aurora|icons|flow"></div>
  // 換成 assets/partials/*.html 的內容，nav / footer / 訂閱只要改一次。
  async function loadPartials() {
    const nodes = document.querySelectorAll("[data-include]");
    await Promise.all([...nodes].map(async node => {
      const name = node.dataset.include;
      try {
        const res = await fetch(`assets/partials/${name}.html`, { cache: "no-cache" });
        if (!res.ok) throw new Error(res.status);
        const tpl = document.createElement("template");
        tpl.innerHTML = (await res.text()).trim();
        node.replaceWith(tpl.content);
      } catch (err) {
        console.warn(`[partials] failed to load "${name}"`, err);
      }
    }));
  }

  // ---------- Stagger reveal ----------
  function initReveal() {
    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;

    // 幫同 parent 下的 .reveal 依序算 stagger delay
    const groups = new Map();
    reveals.forEach(el => {
      const parent = el.parentElement || document.body;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach(list => {
      list.forEach((el, idx) => {
        el.style.setProperty('--reveal-delay', (idx * 90) + 'ms');
      });
    });

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }

  function initContactGuides() {
    const cards = document.querySelectorAll('.guide-card');
    const select = document.getElementById('contact-category');
    const message = document.getElementById('contact-message');
    if (!cards.length || !select) return;

    const defaultPlaceholder = message ? message.placeholder : '';

    function syncTo(value) {
      let matched = null;
      cards.forEach(c => {
        const on = c.dataset.category === value;
        if (on) matched = c;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (message) {
        message.placeholder = matched && matched.dataset.placeholder
          ? matched.dataset.placeholder
          : defaultPlaceholder;
      }
    }

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const value = card.dataset.category;
        select.value = value;
        syncTo(value);
      });
    });

    select.addEventListener('change', () => syncTo(select.value));
  }

  function initInteractivity() {

    // ---------- Mobile menu ----------
    const menuBtn = document.getElementById("menuToggle");
    const nav = document.getElementById("nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
    }

    // ---------- Highlight current page ----------
    const currentPage = document.body.getAttribute("data-page");
    if (currentPage) {
      document.querySelectorAll(".nav a[data-page]").forEach(a => {
        if (a.getAttribute("data-page") === currentPage) {
          a.classList.add("active");
        }
      });
    }

    // ---------- Contact guide cards ↔ Category select ----------
    initContactGuides();

    // ---------- Contact / Volunteer forms ----------
    // 送出後不整段隱藏表單，改在表單下方顯示提示訊息（與 donate 頁一致）。
    // 未勾選「我已同意…」時，擋下送出並提醒使用者勾選。
    // 有自帶後端（data-backend，例如 Firebase）的表單由該頁自己的 module
    // 處理送出，這裡略過，避免兩個 submit handler 互相打架。
    document.querySelectorAll("form.contact-form:not([data-backend])").forEach(form => {
      // 找到（或補上）表單下方的狀態訊息容器
      let statusEl = form.querySelector(".form-status");
      if (!statusEl) {
        statusEl = document.createElement("div");
        statusEl.className = "form-status";
        statusEl.setAttribute("role", "status");
        statusEl.setAttribute("aria-live", "polite");
        form.appendChild(statusEl);
      }
      const setStatus = (msg, type) => {
        statusEl.textContent = msg;
        statusEl.className = "form-status show " + type;
      };

      form.addEventListener("submit", e => {
        e.preventDefault();

        // honeypot：真人不會填 website 這欄，被填 → 判定為機器人，靜默丟棄
        const hp = form.querySelector(".hp-field");
        if (hp && hp.value.trim() !== "") return;

        // 同意條款：未勾選 → 擋下並提醒
        const consent = form.querySelector('input[name="consent"]');
        if (consent && !consent.checked) {
          setStatus("請先勾選並同意隱私權政策及服務條款，才能送出表單。", "err");
          consent.focus();
          return;
        }

        // 必填欄位（novalidate，改由此處觸發原生提示泡泡）
        if (!form.checkValidity()) {
          setStatus("請確認必填欄位是否已完整填寫。", "err");
          form.reportValidity();
          return;
        }

        // 成功：保留表單，訊息顯示在下方
        setStatus("我們已收到您的訊息，感謝您！團隊會儘快回覆您。", "ok");
        form.reset();
      });
    });

    initReveal();
    initCopyToClipboard();
  }

  // ---------- 點擊複製 + snackbar ----------
  function showSnackbar(msg) {
    let bar = document.getElementById('snackbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'snackbar';
      bar.setAttribute('role', 'status');
      bar.setAttribute('aria-live', 'polite');
      document.body.appendChild(bar);
    }
    bar.textContent = msg;
    bar.classList.add('show');
    clearTimeout(showSnackbar._t);
    showSnackbar._t = setTimeout(() => bar.classList.remove('show'), 2000);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext !== false) {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* fall through */ }
    }
    // Fallback for older browsers / non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function initCopyToClipboard() {
    document.addEventListener('click', async (e) => {
      const trigger = e.target.closest('[data-copy]');
      if (!trigger) return;
      e.preventDefault();
      const text  = trigger.dataset.copy || trigger.textContent.trim();
      const label = trigger.dataset.label || '';
      const ok = await copyText(text);
      if (ok) {
        showSnackbar(label ? `已複製${label}：${text}` : `已複製：${text}`);
        trigger.classList.add('copied');
        clearTimeout(trigger._copyResetT);
        trigger._copyResetT = setTimeout(() => trigger.classList.remove('copied'), 1600);
      } else {
        showSnackbar('複製失敗，請手動選取');
      }
    });
  }

  // 進站流程：先把 partials 塞好，再綁事件（保證 header/footer 都能找到 DOM）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => loadPartials().then(initInteractivity));
  } else {
    loadPartials().then(initInteractivity);
  }

})();
