/* ============================================================
   ENHAKORRE — Site JavaScript
   ============================================================ */

(function () {

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

  // ---------- Newsletter forms ----------
  document.querySelectorAll("form.newsletter-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const div = document.createElement("div");
      div.className = "newsletter-success";
      div.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:10px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        已收到您的訂閱，感謝同行。
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
            <strong style="color:var(--text-1);font-weight:500;">感謝您的來信。</strong><br>
            我們收到了。團隊會儘快回覆您。
          </div>
        </div>
      `;
    });
  });

  // ---------- Scroll reveal ----------
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "-50px" });
    reveals.forEach(el => io.observe(el));
  }

  // ---------- Aurora parallax on scroll ----------
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          document.querySelectorAll('.aurora-blob').forEach((el, i) => {
            const speed = 0.04 + i * 0.025;
            el.style.translate = `0 ${y * speed * -1}px`;
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

})();
