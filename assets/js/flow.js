/* ============================================================
   FLOW — 「泉」形狀素材的行為層
   ------------------------------------------------------------
   搭配 assets/css/flow.css 與 assets/partials/flow.html 使用。

     data-flow-divider="contour|rift|well"  → 產生線條並做描繪動畫
     data-flow-tint="dawn|deep|…"           → 該 section 進入視窗中線時換背景色層
     data-flow-parallax                     → .flow-figure 的圖在框內做視差

   有 GSAP + ScrollTrigger 時走 scrub（線條跟著捲動一點一點畫出來）；
   沒有的話退回 IntersectionObserver + CSS transition（進場時一次畫完）。
   偏好減弱動態時，全部直接顯示終態。

   載入順序：必須排在 site.js（負責把 partials/flow.html 塞進 DOM）
   與 GSAP / ScrollTrigger 之後。
   ============================================================ */

(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 線條圖庫 ----------
     座標都畫在各自的 viewBox 裡；contour / rift 橫向拉滿（preserveAspectRatio
     none），靠 CSS 的 vector-effect: non-scaling-stroke 維持線寬。
     well 有正圓的漣漪，所以維持等比。 */
  const DIVIDERS = {
    // 流 — 四道漸次擴散的水面等高線
    contour: {
      viewBox: '0 0 1440 200',
      preserve: 'none',
      // 四道波的相位刻意錯開（720 / 760 / 740 / 765），才不會看起來像四條平行線
      paths: [
        'M0 44 C240 4 480 84 720 44 C960 4 1200 84 1440 44',
        'M0 80 C260 34 500 122 760 80 C990 42 1220 118 1440 82',
        'M0 116 C230 76 490 158 740 118 C980 80 1210 154 1440 120',
        'M0 152 C250 114 500 192 765 154 C1000 118 1220 188 1440 156',
      ],
    },
    // 裂 — 一條線走到中央斷開，錯位成上下兩支（士 15:19「窪處裂開」）
    rift: {
      viewBox: '0 0 1440 120',
      preserve: 'none',
      // 兩支的端點在水平上互相越過（左支收在 752、右支起於 688），
      // 錯位才看得出來是「裂開」，而不是一條線折了個角
      paths: [
        'M0 70 C320 70 540 68 680 58 C716 55 738 46 752 27',
        'M688 97 C702 78 726 69 764 66 C910 56 1130 55 1440 55',
      ],
      seeds: [{ cx: 720, cy: 62, r: 3.5 }],
    },
    // 湧 — 一道落線打在水面上，漣漪往兩側擴散
    well: {
      viewBox: '0 0 1440 200',
      preserve: 'xMidYMid meet',
      // 兩側的水平線拉到畫布邊緣，交給 CSS 的 mask 把線頭淡掉，
      // 不要在半路留一個硬切口
      paths: [
        'M720 0 C720 40 718 66 720 96',
        'M0 100 C200 100 460 100 656 100',
        'M1440 100 C1240 100 980 100 784 100',
      ],
      ellipses: [
        { cx: 720, cy: 100, rx: 62, ry: 9 },
        { cx: 720, cy: 100, rx: 134, ry: 19 },
        { cx: 720, cy: 100, rx: 226, ry: 30 },
      ],
      seeds: [{ cx: 720, cy: 100, r: 3 }],
    },
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs) => {
    const node = document.createElementNS(SVG_NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  };

  /* ---------- 產生線條 ---------- */
  function buildDividers() {
    const nodes = document.querySelectorAll('[data-flow-divider]');
    nodes.forEach(node => {
      const spec = DIVIDERS[node.dataset.flowDivider];
      if (!spec || node.querySelector('svg')) return;

      node.classList.add('flow-divider', 'flow-divider--' + node.dataset.flowDivider);
      node.setAttribute('aria-hidden', 'true');

      const svg = el('svg', {
        viewBox: spec.viewBox,
        preserveAspectRatio: spec.preserve,
        focusable: 'false',
      });
      // 漣漪畫在線的下面，才不會蓋掉落點
      (spec.ellipses || []).forEach(e => svg.appendChild(el('ellipse', e)));
      spec.paths.forEach(d => svg.appendChild(el('path', { d })));
      (spec.seeds || []).forEach(s => {
        const c = el('circle', s);
        c.setAttribute('class', 'flow-divider__seed');
        svg.appendChild(c);
      });
      node.appendChild(svg);
    });
    return [...nodes];
  }

  /* ---------- 描繪動畫 ---------- */
  function initDividerDraw(dividers, gsapReady) {
    dividers.forEach(node => {
      const paths = [...node.querySelectorAll('path')];
      if (!paths.length) return;

      if (reducedMotion) {
        node.classList.add('is-drawn');
        return;
      }

      const lengths = paths.map(p => p.getTotalLength());

      if (gsapReady) {
        // scrub：線隨捲動一點一點長出來。dasharray 由 GSAP 寫成 inline style，
        // 不加 .is-measured，避免和 CSS 的 transition 版本互相覆寫。
        paths.forEach((p, i) => {
          gsap.set(p, { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] });
        });
        gsap.to(paths, {
          strokeDashoffset: 0,
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: {
            trigger: node,
            start: 'top 95%',
            end: 'bottom 50%',
            scrub: 0.6,
          },
        });
        ScrollTrigger.create({
          trigger: node,
          start: 'top 85%',
          once: true,
          onEnter: () => node.classList.add('is-drawn'),
        });
      } else {
        // 沒有 GSAP：量完長度交給 CSS transition，進場時一次畫完
        paths.forEach((p, i) => {
          p.style.setProperty('--len', lengths[i]);
          p.style.setProperty('--draw-delay', (i * 140) + 'ms');
          p.classList.add('is-measured');
        });
        const io = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-drawn');
            io.unobserve(entry.target);
          });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
        io.observe(node);
      }
    });
  }

  /* ---------- 背景色場：以 section 為單位換色 ----------
     用視窗中線判斷「現在讀到哪一段」，而不是整頁捲動進度——
     這樣換色的時機永遠對齊 section 邊界，跟視窗高度無關。 */
  function initTints() {
    const field = document.querySelector('.flow-field');
    const sections = [...document.querySelectorAll('[data-flow-tint]')];
    if (!field || !sections.length) return;

    const layers = new Map();
    field.querySelectorAll('.flow-field__layer').forEach(layer => {
      layers.set(layer.dataset.tint, layer);
    });

    let active = null;
    function activate(name) {
      const layer = layers.get(name);
      if (!layer || active === layer) return;
      if (active) active.classList.remove('is-on');
      layer.classList.add('is-on');
      active = layer;
    }

    const visible = new Set();
    function pick() {
      if (!visible.size) return;
      const mid = window.innerHeight / 2;
      let best = null, bestDist = Infinity;
      visible.forEach(node => {
        const r = node.getBoundingClientRect();
        // 區塊已經跨過中線 → 距離 0；否則取離中線最近的邊
        const dist = (r.top <= mid && r.bottom >= mid)
          ? 0
          : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (dist < bestDist) { bestDist = dist; best = node; }
      });
      if (best) activate(best.dataset.flowTint);
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      pick();
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    sections.forEach(s => io.observe(s));

    // IO 只在交界處回報，捲動中途要靠這裡把「最接近中線」重算一次
    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; pick(); });
    }, { passive: true });

    pick();
  }

  /* ---------- 遮罩圖的圖內視差 ----------
     圖比框高 18%、上緣先退 9%，所以 ±6% 的位移不會露出框外。 */
  function initFigureParallax(gsapReady) {
    if (!gsapReady || reducedMotion) return;
    document.querySelectorAll('[data-flow-parallax]').forEach(fig => {
      const img = fig.querySelector('img');
      if (!img) return;
      gsap.fromTo(img,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: fig,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        }
      );
    });
  }

  /* ---------- 啟動 ---------- */
  function boot() {
    const gsapReady =
      typeof gsap !== 'undefined' &&
      typeof ScrollTrigger !== 'undefined' &&
      !document.documentElement.classList.contains('no-anim');

    const dividers = buildDividers();
    initDividerDraw(dividers, gsapReady);
    initTints();
    initFigureParallax(gsapReady);

    if (gsapReady) ScrollTrigger.refresh();
  }

  // site.js 是用 fetch() 塞 partials 的，flow.html 進 DOM 的時間比
  // DOMContentLoaded 晚，所以這裡等 .flow-field 出現再啟動（最多等 3 秒）。
  function waitForPartials(done) {
    if (document.querySelector('.flow-field')) return done();
    let waited = 0;
    const timer = setInterval(() => {
      waited += 50;
      if (document.querySelector('.flow-field') || waited >= 3000) {
        clearInterval(timer);
        done();
      }
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForPartials(boot));
  } else {
    waitForPartials(boot);
  }
})();
