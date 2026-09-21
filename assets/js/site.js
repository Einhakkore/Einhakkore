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

  /* ---------- Header 的捲動狀態與明暗 ----------
     膠囊下緣（--header-h）壓在哪一段上，那一段說了算。
     footer 永遠是深底，一起放進來當最後一段，捲到底時膠囊才跟著翻深。

     取法是「最後一個上緣已經越過膠囊下緣的區塊」，而不是「剛好包住那個
     點的區塊」—— 因為 section 之間還夾著不帶 data-surface 的東西
     （data-flow-divider 的裂／湧／流三種線稿轉場就是 section 的兄弟節點）。
     要求剛好包住的話，膠囊滑過 divider 的那段空檔會一個區塊都掃不到，
     於是掉回淺色預設，深藍底上突然冒出一顆白膠囊。
     色場在空檔裡本來就還是前一段的顏色（下一段要等上緣過視窗中線才換），
     所以沿用前一段才是對的。 */
  function initHeaderState() {
    const body = document.body;
    const zones = [...document.querySelectorAll("main [data-surface]")]
      .map(el => ({ el, surface: el.dataset.surface === "light" ? "light" : "dark" }));

    const footer = document.querySelector(".site-footer");
    if (footer) zones.push({ el: footer, surface: "dark" });

    // palette 的第一段就是該區塊漸層的上緣色，而膠囊正好浮在區塊上緣
    const tintOf = zone => {
      if (zone.el.classList.contains("site-footer")) return "var(--ink-900)";
      const pal = zone.el.dataset.flowPalette;
      if (pal) {
        const bg1 = String(pal).split("|")[0].trim();
        if (bg1) return bg1;
      }
      // 沒宣告色場的頁面（contact / terms）沿用主題自己的底色
      return zone.surface === "light" ? "var(--paper)" : "var(--ink-900)";
    };

    let lastTheme = null;
    let lastTint = null;

    function sync() {
      body.classList.toggle("is-scrolled", window.scrollY > 12);

      const line = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-h")
      ) || 80;
      // 取膠囊下緣再往上 1px：正好是「還壓在膠囊底下」的最後一列像素
      const probe = line - 1;

      let hit = null;
      for (const zone of zones) {
        if (zone.el.getBoundingClientRect().top > probe) break;
        hit = zone;
      }
      // 掃不到（還在第一段之上，或整頁都沒宣告 data-surface）才回到淺色預設
      const theme = hit ? hit.surface : "light";
      const tint = hit ? tintOf(hit) : "var(--paper)";

      if (theme !== lastTheme) { body.dataset.headerTheme = theme; lastTheme = theme; }
      if (tint !== lastTint) { body.style.setProperty("--header-tint", tint); lastTint = tint; }
    }

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; sync(); });
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  function initInteractivity() {

    // ---------- Header：捲動後才給膠囊底 ----------
    // 導覽列在頁面頂端是全透明的（只剩 logo 與連結浮在背景上）。一往下捲，
    // 內容就會從連結後面經過，這時才把 .is-scrolled 加上去讓膠囊淡出玻璃底。
    //
    // 同時還要決定膠囊自己的明暗：flow 頁面的背景會從深藍一路轉到奶紙白，
    // 色票綁死在 body[data-page] 的話，捲到底就是一顆深色膠囊壓在淺底上。
    // 這裡改成看「此刻壓在膠囊底下的是哪一段」——
    //   data-surface  → body[data-header-theme]，翻文字、邊框、active 色
    //   palette 的第一個顏色 → --header-tint，膠囊的底因此永遠是
    //                          「當下的背景再壓深一點」，不是外來的色塊
    // 兩者都在同一個判斷裡算完，才不會出現文字翻了、底還沒翻的半拍。
    initHeaderState();

    // ---------- Mobile menu ----------
    const menuBtn = document.getElementById("menuToggle");
    const nav = document.getElementById("nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
      // 浮卡式的選單不再是滿版，點到外面應該要收起來
      document.addEventListener("click", (e) => {
        if (!nav.classList.contains("open")) return;
        if (nav.contains(e.target) || menuBtn.contains(e.target)) return;
        nav.classList.remove("open");
      });
      nav.addEventListener("click", (e) => {
        if (e.target.closest("a")) nav.classList.remove("open");
      });
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
