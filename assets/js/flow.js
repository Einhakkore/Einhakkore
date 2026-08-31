/* ============================================================
   FLOW — 「泉」形狀素材的行為層
   ------------------------------------------------------------
   搭配 assets/css/flow.css 與 assets/partials/flow.html 使用。

     data-flow-divider="contour|rift|well"  → 產生線條並做描繪動畫
     data-flow-palette="bg1 | bg2 | glow | glow 位置"
                                            → 該 section 自己宣告一組背景色，
                                              進出時 tween 過去
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

  /* ---------- 背景色場：每個 section 自己宣告一組顏色 ----------
     data-flow-palette="#14232E | #0E1A23 | rgba(127,166,78,.13) | 78% 42%"
       第 1、2 段  線性漸層的上下兩色
       第 3 段     徑向光暈的顏色（可省略 → 不畫光暈）
       第 4 段     光暈落在哪（可省略 → 50% 50%）

     兩層 ping-pong：新顏色寫進閒置的那一層，再淡入。整片漸層每一幀重寫
     會讓整個視窗重新光柵化，只動 opacity 則交給合成器，捲動時不掉幀。 */
  function parsePalette(raw) {
    const parts = String(raw).split('|').map(v => v.trim());
    if (!parts[0] || !parts[1]) return null;
    return {
      bg1: parts[0],
      bg2: parts[1],
      glow: parts[2] || 'transparent',
      at: parts[3] || '50% 50%',
    };
  }

  function initPalettes(gsapReady) {
    const field = document.querySelector('.flow-field');
    const sections = [...document.querySelectorAll('[data-flow-palette]')];
    if (!field || !sections.length) return;

    const layers = [...field.querySelectorAll('.flow-field__layer')];
    if (layers.length < 2) return;

    let front = layers[0];
    let back = layers[1];
    let current = null;

    function paint(layer, pal) {
      layer.style.setProperty('--flow-bg1', pal.bg1);
      layer.style.setProperty('--flow-bg2', pal.bg2);
      layer.style.setProperty('--flow-glow', pal.glow);
      layer.style.setProperty('--flow-glow-at', pal.at);
    }

    function applyTo(pal) {
      if (!pal) return;
      const key = pal.bg1 + pal.bg2 + pal.glow + pal.at;
      if (current === key) return;
      current = key;

      paint(back, pal);
      // 強制讓瀏覽器先套用新顏色，再切 opacity，否則同一幀內兩件事會合併
      void back.offsetWidth;
      back.classList.add('is-on');
      front.classList.remove('is-on');
      const tmp = front; front = back; back = tmp;
    }

    // 有宣告 data-surface 的區塊自己畫底：
    // 明暗會翻的版面不能只靠固定色場 —— 色場是在「視窗中線」換色的，
    // 於是 section 的標題會有一段時間壓在前一段的背景上，暗底看到暗字、
    // 亮底看到亮字。讓這些區塊自己不透明地鋪一層，就沒有那個空窗期。
    // 轉亮那一段的顏色寫到專用的亮色層上；它的 opacity 由 CSS 的
    // scroll-driven animation 綁在該區塊的進場進度上（見 flow.css）。
    const lightLayer = field.querySelector('.flow-field__light');
    const lightSection = sections.find(x => x.dataset.surface === 'light');
    if (lightLayer && lightSection) {
      const pal = parsePalette(lightSection.dataset.flowPalette);
      if (pal) paint(lightLayer, pal);
      // 零高度的哨兵：view-timeline 掛在它身上，轉場的捲動區間才會固定
      // 是「一個視窗高」，不會被 section 自己的高度拉長（見 flow.css）。
      //
      // 一定要插在 section「前面」當兄弟節點，不能 prepend 進 section 裡：
      // 淺色段的上留白（56vh）是內距，prepend 進去的哨兵會落在內距「之下」，
      // 跟著第一行字一起往下走 —— 於是色場永遠等到字都進畫面了才開始翻，
      // 就會看到深色字壓在還沒轉完的海藍底上。放在 section 前面，哨兵才
      // 正好落在深淺兩段交界、也就是上下各 56vh 空白帶的正中央。
      if (!(lightSection.previousElementSibling &&
            lightSection.previousElementSibling.classList.contains('flow-turn'))) {
        const stale = lightSection.querySelector(':scope > .flow-turn');
        if (stale) stale.remove();
        const turn = document.createElement('span');
        turn.className = 'flow-turn';
        turn.setAttribute('aria-hidden', 'true');
        lightSection.parentNode.insertBefore(turn, lightSection);
      }
    }

    // 深色段落之間仍然用兩層 ping-pong 換色 —— 相鄰的深色色差很小，
    // 交叉淡入看不出接縫；真正會被看見的極性翻轉交給上面那一層。
    const darkSections = sections.filter(x => x.dataset.surface !== 'light');

    // 第一段直接上色，不淡入
    const first = parsePalette((darkSections[0] || sections[0]).dataset.flowPalette);
    if (first) {
      paint(front, first);
      front.classList.add('is-on');
      current = first.bg1 + first.bg2 + first.glow + first.at;
    }

    if (gsapReady) {
      // ScrollTrigger：往下捲用 onEnter、往回捲用 onEnterBack，
      // 交界固定在視窗中線，換色時機就永遠對齊 section 邊界。
      darkSections.forEach(section => {
        const pal = parsePalette(section.dataset.flowPalette);
        if (!pal) return;
        ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => applyTo(pal),
          onEnterBack: () => applyTo(pal),
        });
      });
      return;
    }

    // 沒有 GSAP：用 IntersectionObserver 取「離視窗中線最近的那一段」
    const visible = new Set();
    function pick() {
      if (!visible.size) return;
      const mid = window.innerHeight / 2;
      let best = null, bestDist = Infinity;
      visible.forEach(node => {
        const r = node.getBoundingClientRect();
        const dist = (r.top <= mid && r.bottom >= mid)
          ? 0
          : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (dist < bestDist) { bestDist = dist; best = node; }
      });
      if (best) applyTo(parsePalette(best.dataset.flowPalette));
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      pick();
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    darkSections.forEach(s => io.observe(s));

    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; pick(); });
    }, { passive: true });
    pick();

    // 沒有 scroll-driven animation 的瀏覽器：亮色層改用 IntersectionObserver
    // 交叉淡入，一樣會轉亮，只是不跟捲動同步。
    if (lightLayer && lightSection &&
        !CSS.supports('animation-timeline', 'view()')) {
      lightLayer.style.transition = 'opacity 1.2s cubic-bezier(.16, 1, .3, 1)';
      new IntersectionObserver(entries => {
        entries.forEach(e => { lightLayer.style.opacity = e.isIntersecting ? '1' : '0'; });
      }, { rootMargin: '0px 0px -45% 0px', threshold: 0 }).observe(lightSection);
    }
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
    initPalettes(gsapReady);
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
