/* ============================================================
   ENHAKORRE — Site JavaScript
   partials loader + scroll flow field + stagger reveal + 表單
   ============================================================ */

(function () {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // ---------- Shared partials loader ----------
  // 每頁把 <div data-include="header|footer|newsletter|aurora"></div>
  // 換成 assets/partials/*.html 的內容，nav / footer / 訂閱只要改一次。
  async function loadPartials() {
    const nodes = document.querySelectorAll("[data-include]");
    await Promise.all([...nodes].map(async node => {
      const name = node.dataset.include;
      try {
        const res = await fetch(`assets/partials/${name}.html`, { cache: "no-cache" });
        if (!res.ok) throw new Error(res.status);
        const html = await res.text();
        const tpl = document.createElement("template");
        tpl.innerHTML = html.trim();
        node.replaceWith(tpl.content);
      } catch (err) {
        console.warn(`[partials] failed to load "${name}"`, err);
      }
    }));
  }

  // ---------- #flow-bg：注入固定的整站背景場 ----------
  function injectFlowBg() {
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

  // ---------- Scroll flow field：從 CSS token 讀色站、單一 rAF 迴圈 ----------
  function initFlowField() {
    const cs = getComputedStyle(root);
    const T = (name, fb) => (cs.getPropertyValue(name).trim() || fb);

    const P_STOPS = [
      { p: 0.00, bg1: '--stop-0-bg1', bg2: '--stop-0-bg2', glow: '--stop-0-glow', fg: '--stop-0-fg' },
      { p: 0.42, bg1: '--stop-1-bg1', bg2: '--stop-1-bg2', glow: '--stop-1-glow', fg: '--stop-1-fg' },
      { p: 0.72, bg1: '--stop-2-bg1', bg2: '--stop-2-bg2', glow: '--stop-2-glow', fg: '--stop-2-fg' },
      { p: 0.90, bg1: '--stop-3-bg1', bg2: '--stop-3-bg2', glow: '--stop-3-glow', fg: '--stop-3-fg' },
      { p: 1.00, bg1: '--stop-4-bg1', bg2: '--stop-4-bg2', glow: '--stop-4-glow', fg: '--stop-4-fg' },
    ].map(s => ({
      p: s.p,
      bg1:  parseColor(T(s.bg1,  '#22394A')),
      bg2:  parseColor(T(s.bg2,  '#182C3B')),
      glow: parseColor(T(s.glow, 'rgba(232,163,61,.30)')),
      fg:   parseColor(T(s.fg,   '#F5F1E8')),
    }));

    function writeStops(p) {
      let i = 0;
      while (i < P_STOPS.length - 1 && P_STOPS[i + 1].p < p) i++;
      const a = P_STOPS[i];
      const b = P_STOPS[Math.min(i + 1, P_STOPS.length - 1)];
      const span = b.p - a.p;
      const t = span > 0 ? Math.min(1, Math.max(0, (p - a.p) / span)) : 0;
      root.style.setProperty('--bg1',  fmtColor(lerpColor(a.bg1,  b.bg1,  t)));
      root.style.setProperty('--bg2',  fmtColor(lerpColor(a.bg2,  b.bg2,  t)));
      root.style.setProperty('--glow', fmtColor(lerpColor(a.glow, b.glow, t)));
      root.style.setProperty('--fg',   fmtColor(lerpColor(a.fg,   b.fg,   t)));
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

    // ---------- Contact forms ----------
    document.querySelectorAll("form.contact-form").forEach(form => {
      form.addEventListener("submit", e => {
        e.preventDefault();
        form.innerHTML = `
          <div class="form-success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <div>
              <strong style="color:var(--fg);font-weight:500;">感謝您的來信。</strong><br>
              我們收到了。團隊會儘快回覆您。
            </div>
          </div>
        `;
      });
    });

    injectFlowBg();
    initFlowField();
    initReveal();
  }

  // 進站流程：先把 partials 塞好，再綁事件（保證 header/footer 都能找到 DOM）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => loadPartials().then(initInteractivity));
  } else {
    loadPartials().then(initInteractivity);
  }

})();
