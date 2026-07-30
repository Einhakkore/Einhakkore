/* ============================================================
   EINHAKKORE — Site JavaScript
   partials loader + scroll flow field + stagger reveal + 表單
   ============================================================ */

(function () {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // ---------- Shared partials loader ----------
  // 每頁把 <div data-include="header|footer|newsletter|aurora|page-hero"></div>
  // 換成 assets/partials/*.html 的內容，nav / footer / 訂閱只要改一次。
  // 支援兩種輕量樣板語法，讓 page-hero 這類「殼相同、內容不同」的區塊也能共用一份 partial：
  //   {{attr}}      → 換成 include 節點的 data-attr 值
  //   <slot></slot> → 換成 include 節點原本的子節點（頁面自己寫的 h1 / p 等）
  //   data-extra-class → 加到 partial 根節點的 class（例如 donate 頁的 .donate-hero）
  async function loadPartials() {
    const nodes = document.querySelectorAll("[data-include]");
    await Promise.all([...nodes].map(async node => {
      const name = node.dataset.include;
      try {
        const res = await fetch(`assets/partials/${name}.html`, { cache: "no-cache" });
        if (!res.ok) throw new Error(res.status);
        const html = await res.text();
        const filled = html.replace(/\{\{(\w+)\}\}/g, (_, key) => node.dataset[key] || "");
        const tpl = document.createElement("template");
        tpl.innerHTML = filled.trim();
        const slot = tpl.content.querySelector("slot");
        if (slot) slot.replaceWith(...node.childNodes);
        if (node.dataset.extraClass) {
          const root = tpl.content.firstElementChild;
          if (root) root.classList.add(node.dataset.extraClass);
        }
        node.replaceWith(tpl.content);
      } catch (err) {
        console.warn(`[partials] failed to load "${name}"`, err);
      }
    }));
  }

  // ---------- #flow-bg：只在 home / donate / about 三頁注入 ----------
  function isFlowPage() {
    const p = document.body.getAttribute('data-page');
    return p === 'home' || p === 'donate' || p === 'about';
  }
  function injectFlowBg() {
    if (!isFlowPage()) return;
    if (document.getElementById('flow-bg')) return;
    const el = document.createElement('div');
    el.id = 'flow-bg';
    el.setAttribute('aria-hidden', 'true');
    document.body.prepend(el);
  }

  // ---------- Color parsing / lerp ----------
  function parseColor(str) {
    str = String(str || '').trim();
    if (str[0] === '#') {
      let s = str.slice(1);
      if (s.length === 3) s = s.split('').map(c => c + c).join('');
      const n = parseInt(s, 16);
      return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff, a: 1 };
    }
    const m = str.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      const p = m[1].split(',').map(v => parseFloat(v.trim()));
      return {
        r: p[0] || 0, g: p[1] || 0, b: p[2] || 0,
        a: (p[3] === undefined) ? 1 : p[3]
      };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  function lerpColor(a, b, t) {
    return {
      r: lerp(a.r, b.r, t),
      g: lerp(a.g, b.g, t),
      b: lerp(a.b, b.b, t),
      a: lerp(a.a, b.a, t),
    };
  }
  const fmtColor = c => `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${(+c.a).toFixed(3)})`;

  // ---------- Scroll flow field：只在 home / donate / about 跑 ----------
  function initFlowField() {
    if (!isFlowPage()) return;
    const cs = getComputedStyle(root);
    // 寫入 <body> 而非 <html>：body 有 CSS 變數宣告（page-scoped 深色主題），
    // 直接寫在 <html> 的 inline style 反而會被 body 的宣告覆蓋掉。
    const target = document.body;
    const T = (name, fb) => (cs.getPropertyValue(name).trim() || fb);

    const P_STOPS = [
      { p: 0.00, bg1: '--stop-0-bg1', bg2: '--stop-0-bg2', fg: '--stop-0-fg' },
      { p: 0.42, bg1: '--stop-1-bg1', bg2: '--stop-1-bg2', fg: '--stop-1-fg' },
      { p: 0.72, bg1: '--stop-2-bg1', bg2: '--stop-2-bg2', fg: '--stop-2-fg' },
      { p: 0.90, bg1: '--stop-3-bg1', bg2: '--stop-3-bg2', fg: '--stop-3-fg' },
      { p: 1.00, bg1: '--stop-4-bg1', bg2: '--stop-4-bg2', fg: '--stop-4-fg' },
    ].map(s => ({
      p: s.p,
      bg1:  parseColor(T(s.bg1,  '#22394A')),
      bg2:  parseColor(T(s.bg2,  '#182C3B')),
      fg:   parseColor(T(s.fg,   '#F5F1E8')),
    }));

    function writeStops(p) {
      let i = 0;
      while (i < P_STOPS.length - 1 && P_STOPS[i + 1].p < p) i++;
      const a = P_STOPS[i];
      const b = P_STOPS[Math.min(i + 1, P_STOPS.length - 1)];
      const span = b.p - a.p;
      const t = span > 0 ? Math.min(1, Math.max(0, (p - a.p) / span)) : 0;
      target.style.setProperty('--bg1',  fmtColor(lerpColor(a.bg1,  b.bg1,  t)));
      target.style.setProperty('--bg2',  fmtColor(lerpColor(a.bg2,  b.bg2,  t)));
      target.style.setProperty('--fg',   fmtColor(lerpColor(a.fg,   b.fg,   t)));
    }

    if (reducedMotion) {
      writeStops(0);
      return;
    }

    let targetY = window.scrollY;
    let curY = targetY;
    let docHeight = document.documentElement.scrollHeight;
    let winHeight = window.innerHeight;
    function recomputeHeights() {
      docHeight = document.documentElement.scrollHeight;
      winHeight = window.innerHeight;
    }

    window.addEventListener('scroll', () => { targetY = window.scrollY; }, { passive: true });
    window.addEventListener('resize', recomputeHeights, { passive: true });
    window.addEventListener('load', recomputeHeights);

    let sinceRecomp = 0;
    function tick() {
      const diff = targetY - curY;
      if (Math.abs(diff) < 0.5) curY = targetY;
      else curY += diff * 0.14;

      const maxScroll = Math.max(1, docHeight - winHeight);
      const p = Math.min(1, Math.max(0, curY / maxScroll));
      writeStops(p);

      if (++sinceRecomp > 60) { recomputeHeights(); sinceRecomp = 0; }
      requestAnimationFrame(tick);
    }
    writeStops(0);
    requestAnimationFrame(tick);
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

  function initEmailCopy() {
    document.querySelectorAll('.email-card').forEach(card => {
      card.addEventListener('click', async () => {
        const email = card.dataset.email;
        if (!email) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(email);
          } else {
            const ta = document.createElement('textarea');
            ta.value = email;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          showSnackbar('已複製 Email');
        } catch (e) {
          showSnackbar('複製失敗，請手動選取');
        }
      });
    });
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

    // ---------- Newsletter forms (Substack no-cors POST) ----------
    document.querySelectorAll("form.newsletter-form").forEach(form => {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const body = new URLSearchParams();
        new FormData(form).forEach((v, k) => body.append(k, v));
        fetch(form.action, { method: "POST", mode: "no-cors", body })
          .catch(() => { /* opaque response 讀不到，失敗也吞 */ });
        const div = document.createElement("div");
        div.className = "newsletter-success";
        div.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:10px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          已收到！請至信箱點擊確認連結，完成訂閱。
        `;
        form.replaceWith(div);
      });
    });

    // ---------- Contact guide cards ↔ Category select ----------
    initContactGuides();
    initEmailCopy();

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
    // ---------- Contact / volunteer forms ----------
    // 表單送出改由各頁面底部的 Firebase module（volunteer.html / contact.html）
    // 直接處理：寫入 Firestore、App Check 驗證、honeypot 檢查與狀態訊息。
    // 這裡不再攔截 submit，以免覆蓋掉真正的送出邏輯。

    injectFlowBg();
    initFlowField();
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
