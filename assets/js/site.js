/* ============================================================
   ENHAKORRE — Site JavaScript
   全站共用：選單、表單、scroll reveal、nav 高亮
   ============================================================ */

(function () {
  // Mobile menu toggle
  const menuBtn = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }

  // Highlight current page in nav based on body[data-page]
  const currentPage = document.body.getAttribute("data-page");
  if (currentPage) {
    document.querySelectorAll(".nav a[data-page]").forEach((a) => {
      if (a.getAttribute("data-page") === currentPage) {
        a.classList.add("active");
      }
    });
  }

  // Newsletter form — inline success
  document.querySelectorAll("form.newsletter-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const success = document.createElement("div");
      success.className = "newsletter-success";
      success.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        已收到您的訂閱，感謝同行。
      `;
      form.replaceWith(success);
    });
  });

  // Contact form — inline success
  document.querySelectorAll("form.contact-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.innerHTML = `
        <div class="form-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <div>
            <strong>感謝您的來信！</strong><br>
            我們收到了。團隊會儘快回覆您。
          </div>
        </div>
      `;
    });
  });

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "-50px" }
    );
    reveals.forEach((el) => io.observe(el));
  }
})();
