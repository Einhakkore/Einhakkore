/* ============================================================
   ENHAKORRE — site.js
   Handles: mobile nav, active nav, forms, scroll reveal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile nav toggle ──────────────────────────────────────
  const toggle = document.getElementById('menuToggle');
  const nav    = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }

  // ── Active nav link ────────────────────────────────────────
  const currentPage = document.body.dataset.page;
  if (currentPage) {
    document.querySelectorAll('.nav a[data-page]').forEach(a => {
      if (a.dataset.page === currentPage) a.classList.add('active');
    });
  }

  // ── Newsletter forms ───────────────────────────────────────
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.outerHTML = `
        <div class="newsletter-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          已收到您的訂閱，感謝同行。
        </div>`;
    });
  });

  // ── Contact / volunteer / donate forms ────────────────────
  document.querySelectorAll('.contact-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.innerHTML = `
        <div class="form-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div>
            <strong>感謝您的來信！</strong><br>
            我們收到了。團隊會儘快回覆您。
          </div>
        </div>`;
    });
  });

  // ── Scroll reveal ──────────────────────────────────────────
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '-50px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

});
