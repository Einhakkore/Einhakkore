#!/usr/bin/env node
/**
 * 全站文字對比稽核 —— WCAG 2.1 AA
 *
 * 為什麼不用「讀 CSS 算一算」：背景是漸層、照片、fixed 的色場、還有一層層
 * 半透明卡片疊上去，光看宣告值算不出實際落在文字後面的顏色。這支腳本改成
 * 量真正畫出來的像素：
 *
 *   1. 收集每個文字節點的色值、字級、字重，以及祖先鏈上的 opacity 乘積
 *   2. 把全站文字塗成透明，得到一張「只有背景」的畫面
 *   3. 逐視窗捲動截圖（不能用 fullPage —— position: fixed 的色場在 fullPage
 *      截圖裡只會畫在最頂端，下面的區塊會取到錯的背景）
 *   4. 在每個文字元素的矩形內取樣像素中位數當作背景色
 *   5. 文字色先依有效 alpha 疊到背景上，再算對比
 *
 * 門檻：一般文字 4.5:1；大字（≥24px，或 ≥18.66px 且 ≥700）3:1。
 *
 * 用法：
 *     python3 -m http.server 8000 &
 *     node tools/contrast-audit.js                  # 稽核全部頁面
 *     node tools/contrast-audit.js serve.html       # 只看單一頁
 *     BASE=http://127.0.0.1:8000 node tools/contrast-audit.js
 *
 * 失敗時以 exit code 1 結束，可以直接接進 CI。
 */

const path = require('path');
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const { chromium } = require(PW);

const BASE = process.env.BASE || 'http://127.0.0.1:8000';
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['index.html', 'about.html', 'serve.html', 'give.html', 'contact.html', 'terms.html'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

/* ---------- 色彩工具 ---------- */
const srgb = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ({ r, g, b }) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = (fg, bg, alpha) => ({
  r: fg.r * alpha + bg.r * (1 - alpha),
  g: fg.g * alpha + bg.g * (1 - alpha),
  b: fg.b * alpha + bg.b * (1 - alpha),
});
const required = (px, weight) =>
  (px >= 24 || (px >= 18.66 && weight >= 700)) ? 3.0 : 4.5;

/* ---------- 在頁面裡蒐集文字節點 ---------- */
const COLLECT = () => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const text = n.textContent.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    if (/^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(el.tagName)) continue;
    seen.add(el);

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;

    // 祖先鏈上的 opacity 會一路乘下來，實際畫出來的文字比宣告值更淡
    let alpha = 1, p = el;
    while (p && p !== document.documentElement) {
      alpha *= parseFloat(getComputedStyle(p).opacity);
      p = p.parentElement;
    }
    // SVG 的 <text>/<tspan> 是用 fill 上色，讀 color 會拿到繼承來的、
    // 根本沒畫出來的值（圖表標籤因此整批誤判）
    const isSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
    const paint = isSvg ? cs.fill : cs.color;
    if (!paint || paint === 'none') continue;
    const m = paint.match(/[\d.]+/g);
    if (!m) continue;                       // url(#gradient) 這類沒辦法直接比，跳過
    const mm = m.map(Number);
    alpha *= (mm[3] === undefined ? 1 : mm[3]);
    if (isSvg) alpha *= parseFloat(cs.fillOpacity || 1);
    if (alpha < 0.06) continue;   // 進場動畫還沒跑到的元素，等它現身再量

    el.dataset.caId = out.length;
    out.push({
      id: out.length,
      tag: el.tagName.toLowerCase(),
      cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().split(' ').filter(Boolean).slice(0, 3).join('.'),
      text: text.slice(0, 28),
      color: { r: mm[0], g: mm[1], b: mm[2] },
      alpha,
      px: parseFloat(cs.fontSize),
      weight: parseInt(cs.fontWeight, 10) || 400,
    });
  }
  return out;
};

const HIDE_TEXT = `
  *, *::before, *::after {
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
    caret-color: transparent !important;
  }
  svg text, svg tspan { fill: transparent !important; }
`;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const failures = [];
  let checked = 0;

  for (const pageName of PAGES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const url = `${BASE}/${pageName}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch (e) {
        console.log(`  ! 跳過 ${pageName} @${vp.name}：${e.message.split('\n')[0]}`);
        await page.close();
        continue;
      }
      await page.waitForTimeout(2000);

      // 先把整頁捲過一遍，讓 IntersectionObserver 的進場動畫全部觸發，
      // 否則 .reveal 還停在 opacity: 0，量到的都是「還沒現身」
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += vp.height * 0.8) {
        await page.evaluate(v => window.scrollTo(0, v), y);
        await page.waitForTimeout(160);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1800);   // 同上：回到頂端後也要等色場退回第一段

      const items = await page.evaluate(COLLECT);
      await page.addStyleTag({ content: HIDE_TEXT });
      await page.waitForTimeout(400);

      // 逐視窗取樣：fixed 的色場在 fullPage 截圖裡不會跟著捲，只能一格一格量
      const sampler = await browser.newPage();
      const results = new Map();
      for (let y = 0; y < h; y += vp.height * 0.85) {
        await page.evaluate(v => window.scrollTo(0, v), y);
        // 背景色場是逐段交叉淡入的（1.2s），等它收斂再拍；
        // 只等 300ms 會拍到上一段的顏色還沒退乾淨，量出一堆假的低對比
        await page.waitForTimeout(1500);
        const inView = await page.evaluate((ids) => {
          const res = [];
          for (const id of ids) {
            const el = document.querySelector(`[data-ca-id="${id}"]`);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            if (r.top >= 0 && r.bottom <= window.innerHeight && r.width > 4 && r.height > 4) {
              res.push({ id, x: r.x, y: r.y, w: r.width, h: r.height });
            }
          }
          return res;
        }, items.filter(i => !results.has(i.id)).map(i => i.id));
        if (!inView.length) continue;

        const shot = await page.screenshot({ type: 'png' });
        const dataUrl = 'data:image/png;base64,' + shot.toString('base64');
        const sampled = await sampler.evaluate(async ({ dataUrl, rects }) => {
          const img = new Image();
          img.src = dataUrl;
          await img.decode();
          const c = document.createElement('canvas');
          c.width = img.width; c.height = img.height;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          return rects.map(({ id, x, y, w, h }) => {
            // 在矩形內取 5×5 網格，用中位數避開邊框與圓角這類離群點
            const px = [];
            for (let i = 1; i <= 5; i++) for (let j = 1; j <= 5; j++) {
              const sx = Math.min(img.width - 1, Math.max(0, Math.round(x + w * i / 6)));
              const sy = Math.min(img.height - 1, Math.max(0, Math.round(y + h * j / 6)));
              const d = ctx.getImageData(sx, sy, 1, 1).data;
              px.push([d[0], d[1], d[2]]);
            }
            const med = k => { const v = px.map(p => p[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
            return { id, bg: { r: med(0), g: med(1), b: med(2) } };
          });
        }, { dataUrl, rects: inView });
        sampled.forEach(s => results.set(s.id, s.bg));
      }
      await sampler.close();
      await page.close();

      for (const it of items) {
        const bg = results.get(it.id);
        if (!bg) continue;                       // 量不到（一直在視窗外）就跳過
        checked++;
        const fg = over(it.color, bg, it.alpha);
        const ratio = contrast(fg, bg);
        const need = required(it.px, it.weight);
        if (ratio < need) {
          failures.push({
            page: pageName, vp: vp.name, ratio: +ratio.toFixed(2), need,
            sel: `${it.tag}${it.cls ? '.' + it.cls : ''}`,
            px: Math.round(it.px), text: it.text,
            fg: `rgb(${[fg.r, fg.g, fg.b].map(Math.round)})`,
            bg: `rgb(${[bg.r, bg.g, bg.b].map(v => Math.round(v))})`,
          });
        }
      }
      console.log(`  ${pageName} @${vp.name} — 量到 ${results.size} 個文字元素`);
    }
  }
  await browser.close();

  console.log(`\n共檢查 ${checked} 個文字元素，${failures.length} 個未達 AA\n`);
  failures.sort((a, b) => a.ratio - b.ratio);
  for (const f of failures) {
    console.log(`✗ ${f.ratio.toFixed(2)}:1 (需 ${f.need}) ${f.page} @${f.vp}  ${f.sel}  ${f.px}px`);
    console.log(`    「${f.text}」  ${f.fg} on ${f.bg}`);
  }
  process.exit(failures.length ? 1 : 0);
})();
