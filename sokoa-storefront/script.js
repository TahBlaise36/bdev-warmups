/* ============================================================
   SOKOA STOREFRONT — shared script.js
   One file shared across all 6 pages. Every page only runs the
   bits whose elements it actually contains, so this is safe to
   include everywhere. Vanilla JS, addEventListener only.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Theme toggle (persisted) ---------------------------- */
  var THEME_KEY = 'sokoa-theme';
  try {
    var savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) root.setAttribute('data-theme', savedTheme);
  } catch (e) {}
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---- Fixed nav: hamburger + scroll border ---------------- */
  var nav = document.getElementById('nav');
  var hamburger = document.getElementById('hamburger');
  if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('#mobileMenu a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- Hero count-up counters ------------------------------ */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    function format(v, d) {
      return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    }
    if (reduceMotion) { el.textContent = format(target, decimals) + suffix; return; }
    var dur = 1600, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = format(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = format(target, decimals) + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    counters.forEach(function (c) { animateCount(c); });
  }

  /* ---- Home category filter -------------------------------- */
  var filters = document.getElementById('filters');
  var grid = document.getElementById('productGrid');
  if (filters && grid) {
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-chip');
      if (!btn) return;
      filters.querySelectorAll('.filter-chip').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');
      grid.querySelectorAll('.product-card').forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  }

  /* ---- Newsletter email validation ------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var newsForm = document.getElementById('newsForm');
  if (newsForm) {
    var newsEmail = document.getElementById('newsEmail');
    var newsMsg = document.getElementById('newsMsg');
    newsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = newsEmail.value.trim();
      if (!EMAIL_RE.test(val)) {
        newsMsg.textContent = 'Please enter a valid email address.';
        newsMsg.className = 'news-msg error';
        return;
      }
      newsMsg.textContent = 'You\u2019re in! Watch your inbox for this week\u2019s drops.';
      newsMsg.className = 'news-msg success';
      newsForm.reset();
    });
  }

  /* ---- Contact form real-time validation ------------------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var fields = {
      name: { el: document.getElementById('cName'), valid: function (v) { return v.trim().length > 0; } },
      email: { el: document.getElementById('cEmail'), valid: function (v) { return EMAIL_RE.test(v.trim()); } },
      message: { el: document.getElementById('cMessage'), valid: function (v) { return v.trim().length >= 10; } }
    };
    function validateField(key) {
      var f = fields[key];
      var wrap = f.el.closest('.field');
      var ok = f.valid(f.el.value);
      wrap.classList.toggle('invalid', !ok);
      return ok;
    }
    Object.keys(fields).forEach(function (key) {
      fields[key].el.addEventListener('input', function () {
        if (fields[key].el.closest('.field').classList.contains('invalid')) validateField(key);
      });
      fields[key].el.addEventListener('blur', function () { validateField(key); });
    });
    var contactMsg = document.getElementById('contactMsg');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = Object.keys(fields).map(validateField).every(Boolean);
      if (allOk) {
        contactMsg.textContent = 'Thanks! Your message is on its way — we usually reply within a day.';
        contactMsg.className = 'form-msg success';
        contactForm.reset();
      } else {
        contactMsg.textContent = '';
        contactMsg.className = 'form-msg';
      }
    });
  }

  /* ---- Shop: deals single / bundle toggle ------------------ */
  var dealToggle = document.getElementById('dealToggle');
  if (dealToggle) {
    dealToggle.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var mode = btn.getAttribute('data-mode');
      dealToggle.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('[data-single]').forEach(function (priceEl) {
        var v = priceEl.getAttribute(mode === 'bundle' ? 'data-bundle' : 'data-single');
        priceEl.firstChild.textContent = v + ' ';
      });
    });
  }

  /* ---- Shop: FAQ accordion --------------------------------- */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var ans = item.querySelector('.faq-a');
      var isOpen = item.classList.toggle('open');
      ans.style.maxHeight = isOpen ? ans.scrollHeight + 'px' : '0';
    });
  });

  /* ---- Auth: show / hide password -------------------------- */
  document.querySelectorAll('.pw-toggle').forEach(function (tog) {
    tog.addEventListener('click', function () {
      var input = document.getElementById(tog.getAttribute('data-target'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      tog.classList.toggle('show', show);
    });
  });

  /* ---- Sign-up: password strength -------------------------- */
  var pwInput = document.getElementById('signupPw');
  var pwStrength = document.getElementById('pwStrength');
  var pwLabel = document.getElementById('pwLabel');
  if (pwInput && pwStrength) {
    pwInput.addEventListener('input', function () {
      var v = pwInput.value;
      var score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      var level = 'weak', text = '';
      if (v.length === 0) { level = ''; text = ''; }
      else if (score <= 1) { level = 'weak'; text = 'Weak password'; }
      else if (score === 2 || score === 3) { level = 'medium'; text = 'Medium strength'; }
      else { level = 'strong'; text = 'Strong password'; }
      pwStrength.className = 'pw-strength ' + level;
      if (pwLabel) pwLabel.textContent = text;
    });
  }

  /* ---- Scroll reveal via IntersectionObserver -------------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

})();
