/* Terra Verity Ledger — shared site behavior (all pages) */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Sticky nav condense */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll("[data-reveal],[data-reveal-stagger]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.hasAttribute("data-reveal-stagger")) {
          Array.prototype.forEach.call(el.children, function (child, i) { child.style.transitionDelay = i * 70 + "ms"; });
        }
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* Hero spine */
  var spine = document.getElementById("spine");
  if (spine) {
    if (reduceMotion) spine.classList.add("is-in");
    else setTimeout(function () { spine.classList.add("is-in"); }, 350);
  }

  /* Count-up */
  function formatNum(n, prefix) { return (prefix || "") + Math.round(n).toLocaleString("en-US"); }
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduceMotion) { el.textContent = formatNum(target, prefix); return; }
    var dur = 1600, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = formatNum(target * (1 - Math.pow(1 - p, 3)), prefix);
      if (p < 1) requestAnimationFrame(tick); else el.textContent = formatNum(target, prefix);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(function (el) { el.textContent = formatNum(parseFloat(el.getAttribute("data-count")), el.getAttribute("data-prefix") || ""); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) { countUp(entry.target); cio.unobserve(entry.target); } });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* Contact form: pricing-tier prefill via ?tier= or hash */
  var budget = document.getElementById("f-budget");
  if (budget) {
    var params = new URLSearchParams(window.location.search);
    var tier = params.get("tier");
    if (tier) {
      for (var i = 0; i < budget.options.length; i++) {
        if (budget.options[i].value === tier || budget.options[i].text.indexOf(tier) !== -1) { budget.selectedIndex = i; break; }
      }
    }
  }

  /* Intake form validation + success */
  var form = document.getElementById("intakeForm");
  var success = document.getElementById("formSuccess");
  if (form) {
    var fieldOf = function (input) { return input.closest(".field"); };
    var setInvalid = function (input, invalid) { var f = fieldOf(input); if (f) f.classList.toggle("invalid", invalid); };
    var validateField = function (input) {
      var val = input.value.trim(), ok = true;
      if (input.hasAttribute("required") && !val) ok = false;
      if (ok && input.type === "email" && val) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (ok && input.type === "url" && val) ok = /^https?:\/\/.+\..+/.test(val);
      setInvalid(input, !ok);
      return ok;
    };
    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { if (input.hasAttribute("required") || input.value.trim()) validateField(input); });
      input.addEventListener("input", function () { if (fieldOf(input) && fieldOf(input).classList.contains("invalid")) validateField(input); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null, allOk = true;
      form.querySelectorAll("input, textarea").forEach(function (input) {
        if (input.hasAttribute("required") || (input.type === "url" && input.value.trim())) {
          if (!validateField(input)) { allOk = false; if (!firstInvalid) firstInvalid = input; }
        }
      });
      if (!allOk) { if (firstInvalid) firstInvalid.focus(); return; }
      var ref = "VRT-" + Math.floor(100000 + Math.random() * 900000);
      var refEl = document.getElementById("refId");
      if (refEl) refEl.textContent = ref;
      form.style.display = "none";
      if (success) { success.classList.add("is-shown"); success.focus(); success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
    });
  }
})();
