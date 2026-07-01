/* ============================================================
   FVS Advogados — interações globais
   (menu mobile, dropdown, header sticky, reveal on-scroll)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Header: sombra ao rolar ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menu mobile (hambúrguer) ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  /* ---------- Dropdown "Áreas" ---------- */
  var dropdownItems = document.querySelectorAll(".has-dropdown");
  dropdownItems.forEach(function (item) {
    var toggle = item.querySelector(".nav-drop-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = item.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Desktop: abre no hover (além do clique, para acessibilidade)
    var mq = window.matchMedia("(min-width: 861px)");
    item.addEventListener("mouseenter", function () {
      if (!mq.matches) return;
      item.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    });
    item.addEventListener("mouseleave", function () {
      if (!mq.matches) return;
      item.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  // Fecha dropdown ao clicar fora ou pressionar Esc
  document.addEventListener("click", function () {
    dropdownItems.forEach(function (item) {
      item.classList.remove("is-open");
      var t = item.querySelector(".nav-drop-toggle");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    dropdownItems.forEach(function (item) {
      item.classList.remove("is-open");
      var t = item.querySelector(".nav-drop-toggle");
      if (t) t.setAttribute("aria-expanded", "false");
    });
    if (mainNav && mainNav.classList.contains("is-open")) {
      mainNav.classList.remove("is-open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });

  /* ---------- Animações sutis on-scroll ---------- */
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && !prefersReduced && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Ano do copyright ---------- */
  var yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
