/* ReVerity Ledger — shared interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav condense ---------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll("[data-reveal],[data-reveal-stagger]");
  if (revealEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.hasAttribute("data-reveal-stagger")) {
          Array.prototype.forEach.call(el.children, function (child, i) {
            child.style.transitionDelay = (i * 70) + "ms";
          });
        }
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Count-up ----------
     data-count="1234567" data-prefix="$" data-suffix="+" data-decimals="1" */
  var counters = document.querySelectorAll("[data-count]");
  var fmt = function (v, dec) {
    return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = prefix + fmt(target, dec) + suffix; return; }
    var dur = 1600, start = null;
    var tick = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * eased, dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- Model flow sequential lighting ---------- */
  var flows = document.querySelectorAll(".model-flow[data-animate]");
  flows.forEach(function (flow) {
    var steps = flow.querySelectorAll(".step");
    if (!steps.length) return;
    if (reduceMotion) { steps.forEach(function (s) { s.classList.add("is-lit"); }); return; }
    var i = 0;
    var lightNext = function () {
      if (i > 0) steps[i - 1].classList.remove("is-lit");
      if (i >= steps.length) { i = 0; setTimeout(lightNext, 900); return; }
      steps[i].classList.add("is-lit");
      i++;
      setTimeout(lightNext, 1100);
    };
    if ("IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { lightNext(); fio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      fio.observe(flow);
    } else { lightNext(); }
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll(".acc__head").forEach(function (head) {
    head.addEventListener("click", function () {
      var item = head.closest(".acc__item");
      var open = item.classList.toggle("is-open");
      head.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = group.querySelectorAll(".tab");
    var name = group.getAttribute("data-tabs");
    var panels = document.querySelectorAll('[data-tabpanel="' + name + '"]');
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        var key = tab.getAttribute("data-tab");
        panels.forEach(function (p) {
          p.hidden = p.getAttribute("data-panel") !== key;
        });
      });
    });
  });

  /* ---------- Sortable tables ---------- */
  document.querySelectorAll(".table th[data-sort]").forEach(function (th) {
    th.addEventListener("click", function () {
      var table = th.closest("table");
      var tbody = table.querySelector("tbody");
      var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
      var dir = th.getAttribute("data-sort") === "asc" ? "desc" : "asc";
      table.querySelectorAll("th[data-sort]").forEach(function (h) { h.setAttribute("data-sort", ""); });
      th.setAttribute("data-sort", dir);
      var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
      rows.sort(function (a, b) {
        var av = a.children[idx].textContent.trim();
        var bv = b.children[idx].textContent.trim();
        var an = parseFloat(av.replace(/[^0-9.\-]/g, ""));
        var bn = parseFloat(bv.replace(/[^0-9.\-]/g, ""));
        var cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : av.localeCompare(bv);
        return dir === "asc" ? cmp : -cmp;
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
    });
  });

  /* ---------- Select prefill from query param ----------
     <select data-prefill="tier"> — matches option whose value or text contains the param */
  document.querySelectorAll("select[data-prefill]").forEach(function (sel) {
    var key = sel.getAttribute("data-prefill");
    var val = new URLSearchParams(window.location.search).get(key);
    if (!val) return;
    var lower = val.toLowerCase();
    Array.prototype.some.call(sel.options, function (opt, i) {
      if (opt.value.toLowerCase() === lower || opt.text.toLowerCase().indexOf(lower) !== -1) {
        sel.selectedIndex = i;
        return true;
      }
      return false;
    });
  });

  /* ---------- Form validation + success ----------
     <form data-validate data-success="successId" data-ref="refId"> */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var urlRe = /^https?:\/\/[^\s]+\.[^\s]{2,}$/i;
  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll(".field").forEach(function (field) {
        var input = field.querySelector("input,select,textarea");
        if (!input) return;
        var bad = false;
        var v = input.value.trim();
        if (input.required && !v) bad = true;
        else if (v && input.type === "email" && !emailRe.test(v)) bad = true;
        else if (v && input.type === "url" && !urlRe.test(v)) bad = true;
        field.classList.toggle("invalid", bad);
        if (bad && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }
      var successId = form.getAttribute("data-success");
      var success = successId && document.getElementById(successId);
      if (success) {
        var refEl = form.getAttribute("data-ref") && document.getElementById(form.getAttribute("data-ref"));
        if (refEl) {
          refEl.textContent = "RVL-" + String(Math.floor(100000 + Math.random() * 900000));
        }
        form.style.display = "none";
        success.classList.add("is-shown");
        success.focus({ preventScroll: false });
        success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });
    form.querySelectorAll("input,select,textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field) field.classList.remove("invalid");
      });
    });
  });
})();
