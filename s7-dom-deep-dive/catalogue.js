/* ============================================================
   SOKOA CATALOGUE — catalogue.js
   Section 7 · DOM Deep Dive · BDev Academy

   A small, framework-free app that shows the core DOM skills:
     • build elements with createElement (no innerHTML for cards)
     • render a list from a data array
     • filter with ONE delegated listener
     • add + delete items, persisting to localStorage
     • keep a live cart count in memory

   Read it top to bottom — each section has a heading comment.
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     1 · DATA
     SEED is the starting catalogue. The live `products` array is
     loaded from localStorage if the student has added/removed
     items before; otherwise it falls back to a copy of SEED.
     ---------------------------------------------------------- */
  var IMG = 'https://images.unsplash.com/photo-';
  var IMG_OPTS = '?w=600&h=400&fit=crop&q=80';

  // Each product carries an `image` URL plus an `imgId`. Live, we use
  // the URL. When this file is bundled into a standalone offline HTML,
  // the photo is inlined and exposed on window.__resources[imgId] (see
  // the ext-resource-dependency meta tags in the HTML head); we resolve
  // that at render time — see resolveImg() — because window.__resources
  // is populated slightly after this script first runs.
  var SEED = [
    { id: 1, name: 'Tecno Spark 20 Pro',         price: 112000, category: 'phones',    rating: 4.7, imgId: 't1', image: IMG + '1598965402089-897ce52e8355' + IMG_OPTS },
    { id: 2, name: 'Infinix Hot 40i',            price: 95000,  category: 'phones',    rating: 4.5, imgId: 't2', image: IMG + '1607252650355-f7fd0460ccdb' + IMG_OPTS },
    { id: 3, name: 'itel A70',                   price: 48000,  category: 'phones',    rating: 4.2, imgId: 't3', image: IMG + '1596742578443-7682ef5251cd' + IMG_OPTS },
    { id: 4, name: 'Ankara wax · 6 yds',         price: 11000,  category: 'fashion',   rating: 4.8, imgId: 't4', image: IMG + '1768212565424-efa3a3852b81' + IMG_OPTS },
    { id: 5, name: 'Leather sandals',            price: 14500,  category: 'fashion',   rating: 4.6, imgId: 't5', image: IMG + '1627388484741-74dcc56ec343' + IMG_OPTS },
    { id: 6, name: 'Ndolé (500g)',               price: 3500,   category: 'groceries', rating: 4.9, imgId: 't6', image: IMG + '1575303093127-18b3c4ef8c41' + IMG_OPTS },
    { id: 7, name: 'Palmnut oil · 5L',           price: 6800,   category: 'groceries', rating: 4.4, imgId: 't7', image: IMG + '1630960411440-10f7b59717ba' + IMG_OPTS },
    { id: 8, name: 'Beignets de haricot (×10)',  price: 1500,   category: 'groceries', rating: 4.7, imgId: 't8', image: IMG + '1558907530-83566904e778' + IMG_OPTS }
  ];

  // Fallback photo per category — used for products a student adds
  // (which have no image of their own) so every card shows a photo.
  var CATEGORY_IMAGES = {
    phones:    IMG + '1596742578443-7682ef5251cd' + IMG_OPTS,
    fashion:   IMG + '1552710307-537199cd41c0' + IMG_OPTS,
    groceries: IMG + '1488459716781-31db52582fe9' + IMG_OPTS
  };
  var CATEGORY_IMG_IDS = { phones: 'cph', fashion: 'cfa', groceries: 'cgr' };

  // Prefer the inlined blob (offline bundle) when present, else the URL.
  function resolveImg(imgId, url) {
    if (imgId && window.__resources && window.__resources[imgId]) return window.__resources[imgId];
    return url;
  }

  // Bumped when the product photos / image ids changed, so saved
  // catalogues re-seed with the current data instead of stale entries.
  var STORAGE_KEY = 'sokoa-products-v4';

  // App state — plain English names.
  var products = loadProducts();
  var activeFilter = 'all';
  var cartCount = 0;

  // Element references we use repeatedly.
  var listEl   = document.getElementById('list');
  var emptyEl  = document.getElementById('emptyState');
  var filtersEl = document.getElementById('filters');
  var formEl   = document.getElementById('add-form');

  var CATEGORY_LABELS = { phones: 'Phones', fashion: 'Fashion', groceries: 'Groceries' };


  /* ----------------------------------------------------------
     2 · RENDER
     renderProducts() is the single source of truth for what's on
     screen. It clears the list, filters the data, then builds and
     appends one card per product. makeCard() does the DOM building.
     ---------------------------------------------------------- */
  function renderProducts(filter) {
    listEl.innerHTML = '';

    var filtered = filter === 'all'
      ? products
      : products.filter(function (p) { return p.category === filter; });

    // Empty state shows only when nothing matches.
    emptyEl.hidden = filtered.length > 0;

    filtered.forEach(function (product) {
      var card = makeCard(product);
      listEl.append(card);
    });
  }

  function makeCard(p) {
    // <article class="card" data-id data-category>
    var card = document.createElement('article');
    card.className = 'card';                  // settled/visible by default
    card.setAttribute('data-id', p.id);
    card.setAttribute('data-category', p.category);

    // image placeholder, tinted by category, with a category badge
    var ph = document.createElement('div');
    ph.className = 'ph ' + p.category;

    // real product photo — its own if it has one, else a category photo
    var img = document.createElement('img');
    if (p.image) {
      img.src = resolveImg(p.imgId, p.image);
    } else {
      img.src = resolveImg(CATEGORY_IMG_IDS[p.category], CATEGORY_IMAGES[p.category]);
    }
    img.alt = p.name;
    img.loading = 'lazy';
    ph.append(img);

    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = CATEGORY_LABELS[p.category] || p.category;
    ph.append(badge);

    // body: name, rating, then a footer row (price + actions)
    var body = document.createElement('div');
    body.className = 'card-body';

    var name = document.createElement('h3');
    name.className = 'card-name';
    name.textContent = p.name;

    var rating = document.createElement('div');
    rating.className = 'card-rating';
    rating.append(makeStarIcon());
    var ratingText = document.createElement('span');
    if (p.rating > 0) {
      ratingText.textContent = p.rating.toFixed(1);
    } else {
      ratingText.className = 'new-tag';
      ratingText.textContent = 'New';
    }
    rating.append(ratingText);

    var foot = document.createElement('div');
    foot.className = 'card-foot';

    var price = document.createElement('div');
    price.className = 'price';
    price.append(document.createTextNode(formatPrice(p.price) + ' '));
    var cur = document.createElement('small');
    cur.textContent = 'XAF';
    price.append(cur);

    // action buttons: Add to cart (+) and Delete (×)
    var actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.append(
      makeActionButton('add', 'Add ' + p.name + ' to cart'),
      makeActionButton('del', 'Delete ' + p.name)
    );

    foot.append(price, actions);
    body.append(name, rating, foot);
    card.append(ph, body);

    return card;
  }

  // Add a card to the DOM, then drop the .enter class one frame
  // later so the CSS transition plays (fade + slide up).
  function appendWithAnimation(product) {
    var card = makeCard(product);
    card.classList.add('enter');     // start hidden (opacity:0, shifted down)
    listEl.append(card);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { card.classList.remove('enter'); });
    });
  }


  /* ----------------------------------------------------------
     3 · FILTER
     ONE click listener on the #filters bar (event delegation),
     not one per button. We read data-filter off whichever chip
     was clicked, move the .active class, and re-render.
     ---------------------------------------------------------- */
  filtersEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.filter-chip');
    if (!chip) return;

    activeFilter = chip.getAttribute('data-filter');

    // highlight the active chip, clear the others (classList only)
    var chips = filtersEl.querySelectorAll('.filter-chip');
    chips.forEach(function (c) { c.classList.remove('active'); });
    chip.classList.add('active');

    renderProducts(activeFilter);
  });


  /* ----------------------------------------------------------
     4 · ADD FORM
     Validate name / price / category, show inline errors (never
     alert), then push a new product, persist, re-render, reset.
     ---------------------------------------------------------- */
  formEl.addEventListener('submit', function (e) {
    e.preventDefault();

    var nameInput  = document.getElementById('new-name');
    var priceInput = document.getElementById('new-price');
    var catInput   = document.getElementById('new-cat');

    var name = nameInput.value.trim();
    var price = Number(priceInput.value);
    var category = catInput.value;

    // Clear previous errors first.
    clearError(nameInput, 'err-name');
    clearError(priceInput, 'err-price');
    clearError(catInput, 'err-cat');

    var valid = true;
    if (!name) { showError(nameInput, 'err-name', 'Enter a product name.'); valid = false; }
    if (!(price > 0)) { showError(priceInput, 'err-price', 'Price must be above 0.'); valid = false; }
    if (!category) { showError(catInput, 'err-cat', 'Pick a category.'); valid = false; }
    if (!valid) return;

    var newProduct = {
      id: Date.now(),          // unique enough for a teaching app
      name: name,
      price: price,
      category: category,
      rating: 0                // brand new — shows a "New" tag
    };

    products.push(newProduct);
    saveProducts();

    // If the new product matches the current filter, animate it in;
    // otherwise a plain re-render keeps the grid correct.
    if (activeFilter === 'all' || activeFilter === category) {
      emptyEl.hidden = true;
      appendWithAnimation(newProduct);
    } else {
      renderProducts(activeFilter);
    }

    formEl.reset();
    nameInput.focus();
  });


  /* ----------------------------------------------------------
     5 · DELETE
     ONE click listener on the #list (event delegation). We find
     the card with closest('[data-id]'), remove that product from
     the array by id, persist, and re-render.
     ---------------------------------------------------------- */
  listEl.addEventListener('click', function (e) {
    var addBtn = e.target.closest('.act-add');
    var delBtn = e.target.closest('.act-del');
    var card = e.target.closest('[data-id]');
    if (!card) return;

    var id = Number(card.getAttribute('data-id'));

    if (addBtn) {
      addToCart();
      return;
    }

    if (delBtn) {
      products = products.filter(function (p) { return p.id !== id; });
      saveProducts();
      renderProducts(activeFilter);
    }
  });


  /* ----------------------------------------------------------
     6 · CART
     A simple in-memory counter (not persisted). Every Add-to-Cart
     bumps it; the nav badge shows the number and pops on change.
     ---------------------------------------------------------- */
  var cartBadge = document.getElementById('cartBadge');

  function addToCart() {
    cartCount += 1;
    updateCartBadge();
  }

  function updateCartBadge() {
    cartBadge.textContent = cartCount;
    cartBadge.classList.toggle('show', cartCount > 0);

    // Restart the pop animation by removing then re-adding the class.
    cartBadge.classList.remove('pop');
    void cartBadge.offsetWidth;   // force reflow so the animation replays
    cartBadge.classList.add('pop');
  }


  /* ----------------------------------------------------------
     7 · STORAGE
     loadProducts() reads + parses saved JSON (falling back to a
     copy of SEED). saveProducts() writes the current array. Both
     wrap localStorage in try/catch so a blocked store never breaks
     the page.
     ---------------------------------------------------------- */
  function loadProducts() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) { /* ignore bad/blocked storage */ }
    return SEED.slice();   // copy, so we never mutate SEED itself
  }

  function saveProducts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) { /* storage full or blocked — ignore */ }
  }


  /* ----------------------------------------------------------
     HELPERS — small, single-purpose utilities
     ---------------------------------------------------------- */

  // 112000 -> "112,000"
  function formatPrice(value) {
    return value.toLocaleString('en-US');
  }

  function showError(input, errId, message) {
    input.classList.add('invalid');
    document.getElementById(errId).textContent = message;
  }

  function clearError(input, errId) {
    input.classList.remove('invalid');
    document.getElementById(errId).textContent = '';
  }

  // SVG builders (so cards are 100% createElement, no innerHTML).
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var key in attrs) { el.setAttribute(key, attrs[key]); }
    return el;
  }

  function makeStarIcon() {
    var s = svg('svg', { viewBox: '0 0 24 24', fill: 'currentColor', class: 'star' });
    s.append(svg('path', { d: 'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z' }));
    return s;
  }

  function makeActionButton(kind, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'act ' + (kind === 'add' ? 'act-add' : 'act-del');
    btn.setAttribute('aria-label', label);
    var icon = svg('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    if (kind === 'add') {
      icon.append(svg('path', { d: 'M12 5v14M5 12h14' }));
    } else {
      icon.append(svg('path', { d: 'M6 6l12 12M18 6 6 18' }));
    }
    btn.append(icon);
    return btn;
  }


  /* ----------------------------------------------------------
     THEME TOGGLE (persisted) — same behaviour as the storefront
     ---------------------------------------------------------- */
  var THEME_KEY = 'sokoa-theme';
  var root = document.documentElement;
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


  /* ----------------------------------------------------------
     START — first paint. The script tag sits at the end of <body>,
     so the DOM is already parsed; render immediately, but also
     guard the (unlikely) case the event hasn't fired yet.
     ---------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderProducts(activeFilter);
    });
  } else {
    renderProducts(activeFilter);
  }

  // In the offline bundle, inlined photos (window.__resources) can land a
  // beat after first paint. Poll briefly and re-render once they're ready
  // so cards swap from the CDN URL to the inlined blob. In live mode the
  // object never appears, so we simply give up after a few seconds.
  (function waitForBundledImages() {
    if (window.__resources) { renderProducts(activeFilter); return; }
    var tries = 0;
    var iv = setInterval(function () {
      if (window.__resources) { clearInterval(iv); renderProducts(activeFilter); }
      else if (++tries > 60) { clearInterval(iv); }
    }, 50);
  })();

})();
