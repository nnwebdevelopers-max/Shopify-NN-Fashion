(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var T = window.theme || { routes: {}, strings: {} };
  var body = document.body;

  /* ---------- toast ---------- */
  function toast(msg) {
    var t = $('#Toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }

  /* ---------- palette switcher ---------- */
  var root = document.documentElement;
  function setPal(id) {
    if (id) root.setAttribute('data-palette', id); else root.removeAttribute('data-palette');
    $$('[data-palette-btn]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.paletteBtn === id); });
    if (window.theme && window.theme.designMode) return;
    try { if (id) localStorage.setItem('nn-palette', id); else localStorage.removeItem('nn-palette'); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var tg = e.target.closest('[data-palette-toggle]'), box = $('.palette');
    if (tg && box) { var o = !box.classList.contains('open'); box.classList.toggle('open', o); tg.setAttribute('aria-expanded', o); return; }
    var b = e.target.closest('[data-palette-btn]');
    if (!b) {
      if (box && box.classList.contains('open') && !e.target.closest('.palette')) { box.classList.remove('open'); var t2 = $('[data-palette-toggle]'); if (t2) t2.setAttribute('aria-expanded', 'false'); }
      return;
    }
    setPal(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.paletteBtn);
  });
  (function () { var cur = root.getAttribute('data-palette'); if (cur) setPal(cur); })();

  /* ---------- header ---------- */
  function initHeader() {
    var h = $('header.site'); if (!h) return;
    var onScroll = function () { h.classList.toggle('scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    var nav = $('nav.main', h), timer, openId = null;
    if (!nav) return;
    function closeAll() {
      clearTimeout(timer); openId = null;
      $$('.mega', h).forEach(function (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); });
      $$('.navbtn', h).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); b.parentNode.classList.remove('open'); });
    }
    function open(btn) {
      clearTimeout(timer);
      var id = btn.dataset.mi;
      if (openId === id) return;
      closeAll(); openId = id;
      btn.setAttribute('aria-expanded', 'true');
      var panel = $('.mega[data-panel="' + id + '"]', h);
      if (panel) { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); }
      else btn.parentNode.classList.add('open');
    }
    function lazyClose() { clearTimeout(timer); timer = setTimeout(closeAll, 160); }
    nav.addEventListener('mouseover', function (e) {
      var b = e.target.closest('.navbtn');
      if (b) open(b);
      else if (e.target.closest('nav.main > a')) closeAll();
    });
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('.navbtn'); if (!b) return;
      if (b.getAttribute('aria-expanded') === 'true') closeAll(); else open(b);
    });
    nav.addEventListener('mouseenter', function () { clearTimeout(timer); });
    nav.addEventListener('mouseleave', lazyClose);
    $$('.mega', h).forEach(function (m) {
      m.addEventListener('mouseenter', function () { clearTimeout(timer); });
      m.addEventListener('mouseleave', lazyClose);
      m.addEventListener('mouseover', function (e) {
        var t = e.target.closest('[data-mc]'); if (!t || t.getAttribute('aria-selected') === 'true') return;
        selectTab(m, t.dataset.mc);
      });
      m.addEventListener('focusin', function (e) {
        var t = e.target.closest('[data-mc]'); if (t) selectTab(m, t.dataset.mc);
      });
    });
    function selectTab(m, k) {
      $$('[data-mc]', m).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mc === k); });
      $$('[data-mcp]', m).forEach(function (p) { p.hidden = p.dataset.mcp !== k; });
    }
    document.addEventListener('click', function (e) { if (openId !== null && !e.target.closest('header.site')) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }

  /* ---------- surfaces (cart drawer, mobile menu) ---------- */
  function setCart(open) {
    body.classList.toggle('cart-open', open);
    var d = $('#CartDrawer'); if (d) d.setAttribute('aria-hidden', !open);
    if (open && d) setTimeout(function () { var c = $('[data-close-cart]', d); if (c) c.focus(); }, 60);
  }
  function setMenu(open) { body.classList.toggle('menu-open', open); }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-cart]')) {
      if (!$('#CartDrawer')) return;
      e.preventDefault(); setCart(true); return;
    }
    if (e.target.closest('[data-close-cart]')) { setCart(false); return; }
    if (e.target.closest('[data-open-menu]')) { setMenu(true); return; }
    if (e.target.closest('[data-close-menu]')) { setMenu(false); return; }
    if (e.target.closest('#Scrim')) { setCart(false); setMenu(false); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setCart(false); setMenu(false); closeSearch(); } });

  /* ---------- cart ---------- */
  function sectionsToRender() {
    var s = ['cart-drawer'];
    if ($('[data-cart-page]')) s.push($('[data-cart-page]').dataset.sectionId);
    return s;
  }
  function renderSections(sections) {
    if (!sections) return;
    Object.keys(sections).forEach(function (id) {
      var html = sections[id]; if (!html) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (id === 'cart-drawer') {
        var fresh = doc.querySelector('#CartDrawer'), cur = $('#CartDrawer');
        if (fresh && cur) {
          var keep = body.classList.contains('cart-open');
          cur.replaceWith(fresh);
          fresh.setAttribute('aria-hidden', !keep);
        }
        var c = doc.querySelector('[data-cart-count-src]');
        if (c) updateCount(+c.dataset.cartCountSrc);
      } else {
        var wrap = document.getElementById('shopify-section-' + id), inner = doc.querySelector('#shopify-section-' + id);
        if (wrap && inner) wrap.innerHTML = inner.innerHTML;
      }
    });
  }
  function updateCount(n) {
    $$('[data-cart-count]').forEach(function (c) {
      c.textContent = n > 0 ? n : '';
      c.classList.add('bump'); setTimeout(function () { c.classList.remove('bump'); }, 250);
    });
  }
  function addToCart(form) {
    var btn = form.querySelector('[type="submit"]');
    var t0 = Date.now(), ok = false;
    if (btn) {
      btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
      /* waving dots while the product is being added */
      if (!btn.querySelector('.atc-dots')) {
        var dots = document.createElement('span'); dots.className = 'atc-dots'; dots.setAttribute('aria-hidden', 'true');
        dots.innerHTML = '<i></i><i></i><i></i>'; btn.appendChild(dots);
        var chk = document.createElement('span'); chk.className = 'atc-done'; chk.setAttribute('aria-hidden', 'true');
        chk.innerHTML = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'; btn.appendChild(chk);
      }
      btn.classList.remove('is-added'); btn.classList.add('is-adding');
    }
    var fd = new FormData(form);
    fd.append('sections', sectionsToRender().join(','));
    fd.append('sections_url', window.location.pathname);
    return fetch(T.routes.cart_add_url + '.js', { method: 'POST', headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        /* keep the animation visible for at least a moment */
        return new Promise(function (resolve) { setTimeout(function () { resolve(res); }, Math.max(0, 900 - (Date.now() - t0))); });
      })
      .then(function (res) {
        if (!res.status) ok = true;
        if (res.status) {
          var err = form.querySelector('[data-form-error]');
          if (err) { err.textContent = res.description || res.message; err.hidden = false; }
          toast(res.description || res.message || T.strings.error);
          return;
        }
        var err2 = form.querySelector('[data-form-error]'); if (err2) err2.hidden = true;
        if (form.hasAttribute("data-quick-form")) closeQuick();
        renderSections(res.sections);
        if (T.cartType === 'drawer' && $('#CartDrawer')) setCart(true);
        else if (T.cartType === 'page') window.location = T.routes.cart_url;
        toast(T.strings.added);
      })
      .catch(function () { toast(T.strings.error); })
      .finally(function () {
        if (!btn) return;
        btn.removeAttribute('aria-busy'); btn.classList.remove('is-adding');
        if (!btn.hasAttribute('data-sold-out')) btn.disabled = false;
        if (ok) { btn.classList.add('is-added'); setTimeout(function () { btn.classList.remove('is-added'); }, 1500); }
      });
  }
  function changeLine(line, qty) {
    var d = $('#CartDrawer .lines'); if (d) d.classList.add('cart-loading');
    var page = $('[data-cart-page]'); if (page) page.classList.add('is-loading');
    return fetch(T.routes.cart_change_url + '.js', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: qty, sections: sectionsToRender(), sections_url: window.location.pathname })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.status) { toast(res.description || res.message); }
      renderSections(res.sections);
    }).catch(function () { toast(T.strings.error); })
      .finally(function () { var p = $('[data-cart-page]'); if (p) p.classList.remove('is-loading'); });
  }
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-cart-form]');
    if (!f || T.cartType === 'page_noajax') return;
    e.preventDefault(); addToCart(f);
  });
  document.addEventListener('click', function (e) {
    var q = e.target.closest('[data-line-qty]');
    if (q) { e.preventDefault(); changeLine(+q.dataset.line, Math.max(0, +q.dataset.lineQty)); }
  });
  document.addEventListener('change', function (e) {
    var i = e.target.closest('[data-line-input]');
    if (i) changeLine(+i.dataset.line, Math.max(0, parseInt(i.value, 10) || 0));
  });

  /* ---------- quick view: choose options from product cards ---------- */
  var qvLast;
  function closeQuick() {
    var m = $('#QuickView'); if (!m || m.hidden) return;
    m.classList.remove('on'); body.classList.remove('qv-open');
    setTimeout(function () { if (!m.classList.contains('on')) { m.hidden = true; var b = $('[data-quick-view-body]', m); if (b) b.innerHTML = ''; } }, 300);
    if (qvLast) { try { qvLast.focus(); } catch (e) {} }
  }
  function openQuick(trigger) {
    var m = $('#QuickView'); if (!m) return false;
    var url = trigger.getAttribute('data-quick-view');
    qvLast = trigger; trigger.setAttribute('aria-busy', 'true');
    fetch(url + (url.indexOf('?') > -1 ? '&' : '?') + 'section_id=quick-view')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var content = doc.querySelector('[data-quick-view-content]');
        if (!content) throw new Error('no content');
        var old = $('[data-quick-view-body]', m), fresh = document.createElement('div');
        fresh.setAttribute('data-quick-view-body', '');
        fresh.appendChild(document.importNode(content, true));
        old.replaceWith(fresh);
        setCart(false); setMenu(false);
        m.hidden = false; body.classList.add('qv-open');
        requestAnimationFrame(function () { m.classList.add('on'); });
        initProduct(fresh);
        setTimeout(function () { var f = $('.ob input:checked', fresh) || $('[data-close-quick-view]', m); if (f) f.focus(); }, 80);
      })
      .catch(function () { window.location = url; })
      .finally(function () { trigger.removeAttribute('aria-busy'); });
    return true;
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-quick-view]');
    if (t) { e.preventDefault(); openQuick(t); return; }
    if (e.target.closest('[data-close-quick-view]') || e.target === $('#QuickView')) closeQuick();
  });
  document.addEventListener('keydown', function (e) {
    var m = $('#QuickView'); if (!m || m.hidden) return;
    if (e.key === 'Escape') { closeQuick(); return; }
    if (e.key === 'Tab') {
      var f = $$('a[href],button:not([disabled]),input:not([type="hidden"]),[tabindex]:not([tabindex="-1"])', m).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- wishlist + compare (saved in the shopper's browser) ---------- */
  var LIST_KEYS = { wish: 'nn-wishlist', compare: 'nn-compare' };
  var comparePage = null, fragCache = {};
  var X_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function getList(k) {
    try {
      var v = JSON.parse(localStorage.getItem(LIST_KEYS[k]) || '[]');
      return Array.isArray(v) ? v.filter(function (h) { return typeof h === 'string' && h; }) : [];
    } catch (e) { return []; }
  }
  function setList(k, arr) {
    try { localStorage.setItem(LIST_KEYS[k], JSON.stringify(arr)); } catch (e) {}
    syncLists();
  }
  function setPressed(b, on) {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var s = $('span[data-on]', b); if (s) s.textContent = on ? s.dataset.on : s.dataset.off;
  }
  function syncLists() {
    var w = getList('wish'), c = getList('compare');
    $$('[data-wish]').forEach(function (b) { setPressed(b, w.indexOf(b.dataset.wish) > -1); });
    $$('[data-compare]').forEach(function (b) { setPressed(b, c.indexOf(b.dataset.compare) > -1); });
    $$('[data-wish-count]').forEach(function (el) { el.textContent = w.length ? w.length : ''; });
    renderCompareBar(c);
  }
  function productUrl(h) { return (T.routes.root || '/').replace(/\/$/, '') + '/products/' + encodeURIComponent(h); }
  function fetchFragment(h) {
    if (fragCache[h]) return fragCache[h];
    fragCache[h] = fetch(productUrl(h) + '?section_id=product-fragment')
      .then(function (r) {
        if (r.status === 404) return { handle: h, missing: true };
        if (!r.ok) throw new Error(r.status);
        return r.text().then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var j = doc.querySelector('[data-fragment-json]');
          if (!j) return { handle: h, missing: true };
          var d = JSON.parse(j.textContent);
          d.card = doc.querySelector('[data-fragment-card] .card');
          return d;
        });
      })
      .catch(function () { delete fragCache[h]; return { handle: h, error: true }; });
    return fragCache[h];
  }
  function dropMissing(k, items) {
    var gone = items.filter(function (d) { return d.missing; }).map(function (d) { return d.handle; });
    if (gone.length) setList(k, getList(k).filter(function (h) { return gone.indexOf(h) < 0; }));
  }
  function showEmpty(scope, on) { var e = $('[data-list-empty]', scope); if (e) e.hidden = !on; }

  function toggleWish(h) {
    var l = getList('wish'), i = l.indexOf(h);
    if (i > -1) { l.splice(i, 1); toast(T.strings.wishRemoved); } else { l.unshift(h); toast(T.strings.wishAdded); }
    setList('wish', l);
    var grid = i > -1 && $('[data-wishlist-grid]');
    if (grid) {
      $$('.card', grid).forEach(function (c) { if (c.dataset.handle === h) c.remove(); });
      if (!$('.card', grid)) showEmpty(grid.closest('[data-list-page]'), true);
    }
  }
  function toggleCompare(h) {
    var l = getList('compare'), i = l.indexOf(h), max = T.compareMax || 4;
    if (i > -1) { l.splice(i, 1); toast(T.strings.compareRemoved); }
    else {
      if (l.length >= max) { toast(T.strings.compareFull); return; }
      l.push(h); toast(T.strings.compareAdded); sideMin(false);
    }
    setList('compare', l);
    if (comparePage) renderComparePage();
  }

  document.addEventListener('click', function (e) {
    var w = e.target.closest('[data-wish]');
    if (w) { e.preventDefault(); toggleWish(w.dataset.wish); return; }
    var c = e.target.closest('[data-compare]');
    if (c) { e.preventDefault(); toggleCompare(c.dataset.compare); return; }
    var r = e.target.closest('[data-compare-remove]');
    if (r) { e.preventDefault(); toggleCompare(r.dataset.compareRemove); return; }
    if (e.target.closest('[data-compare-clear]')) {
      e.preventDefault(); setList('compare', []);
      if (comparePage) renderComparePage();
    }
  });
  document.addEventListener('change', function (e) {
    if (!e.target.matches('[data-compare-diff]')) return;
    var box = $('[data-compare-table]'); if (box) box.classList.toggle('only-diff', e.target.checked);
  });
  window.addEventListener('storage', function (e) {
    if (e.key !== LIST_KEYS.wish && e.key !== LIST_KEYS.compare) return;
    syncLists();
    if (e.key === LIST_KEYS.compare && comparePage) renderComparePage();
  });

  /* compare sidebar (right edge, vertically centred) */
  function thumbCache(h, d) {
    var all = {};
    try { all = JSON.parse(sessionStorage.getItem('nn-thumbs') || '{}'); } catch (e) {}
    if (!d) return all[h];
    all[h] = { title: d.title, image: d.image, url: d.url, price_html: d.price_html };
    try { sessionStorage.setItem('nn-thumbs', JSON.stringify(all)); } catch (e) {}
  }
  function fillThumb(slot, h, d) {
    slot.classList.remove('is-loading');
    slot.innerHTML =
      '<a class="cmp-item-img" href="' + esc(d.url || productUrl(h)) + '" tabindex="-1" aria-hidden="true">' + (d.image ? '<img src="' + esc(d.image) + '" alt="" width="80" height="80" loading="lazy">' : '') + '</a>' +
      '<div class="cmp-item-txt"><a class="cmp-item-t" href="' + esc(d.url || productUrl(h)) + '">' + esc(d.title) + '</a>' + (d.price_html || '') + '</div>' +
      '<button type="button" class="cmp-item-x" data-compare-remove="' + esc(h) + '" aria-label="' + esc(T.strings.compareRemove) + ': ' + esc(d.title) + '" title="' + esc(T.strings.compareRemove) + '">' + TRASH_SVG + '</button>';
  }
  var TRASH_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
  var cmpMin = true; /* always starts closed on every page load */
  function sideMin(v) {
    if (v === undefined) return cmpMin;
    cmpMin = !!v;
  }
  function applySide(bar, min) {
    bar.classList.toggle('is-min', min);
    $$('[data-compare-toggle]', bar).forEach(function (b) { b.setAttribute('aria-expanded', min ? 'false' : 'true'); });
    var tab = $('.cmp-tab', bar); if (tab) tab.setAttribute('aria-label', min ? T.strings.compareShow : T.strings.compareHide);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-compare-toggle]'); if (!t) return;
    var bar = t.closest('[data-compare-bar]'); if (!bar) return;
    var min = !bar.classList.contains('is-min');
    sideMin(min); applySide(bar, min);
    if (!min) { var f = $('.cmp-min', bar); if (f) f.focus(); } else { var tb = $('.cmp-tab', bar); if (tb) tb.focus(); }
  });
  function renderCompareBar(list, opened) {
    var bar = $('[data-compare-bar]'); if (!bar) return;
    if (!list.length || comparePage) { bar.hidden = true; body.classList.remove('cmp-on'); return; }
    var wasHidden = bar.hidden;
    bar.hidden = false; body.classList.add('cmp-on');
    if (opened) sideMin(false);
    applySide(bar, sideMin());
    if (wasHidden) { bar.classList.remove('in'); void bar.offsetWidth; bar.classList.add('in'); }
    var max = T.compareMax || 4;
    $('[data-compare-count]', bar).textContent = '(' + list.length + '/' + max + ')';
    $('[data-compare-n]', bar).textContent = list.length;
    $('[data-compare-hint]', bar).hidden = list.length > 1;
    var go = $('[data-compare-go]', bar);
    if (list.length > 1) { go.removeAttribute('aria-disabled'); go.removeAttribute('tabindex'); }
    else { go.setAttribute('aria-disabled', 'true'); go.setAttribute('tabindex', '-1'); }
    var items = $('[data-compare-thumbs]', bar), key = list.join('|');
    if (items.dataset.key === key) return;
    items.dataset.key = key;
    var html = list.map(function (h) { return '<li class="cmp-item is-loading" data-th="' + esc(h) + '"></li>'; }).join('');
    for (var i = list.length; i < max; i++) html += '<li class="cmp-item cmp-slot" aria-hidden="true"><span></span></li>';
    items.innerHTML = html;
    $$('.cmp-item[data-th]', items).forEach(function (slot) {
      var h = slot.dataset.th, cached = thumbCache(h);
      if (cached && cached.url) { fillThumb(slot, h, cached); return; }
      fetchFragment(h).then(function (d) {
        if (d.missing) { setList('compare', getList('compare').filter(function (x) { return x !== h; })); return; }
        if (d.error) return;
        thumbCache(h, d); fillThumb(slot, h, d);
      });
    });
  }
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-compare-go][aria-disabled="true"]');
    if (go) { e.preventDefault(); toast(go.closest('[data-compare-bar]').querySelector('[data-compare-hint]').textContent); }
  });

  /* wishlist page */
  function renderWishlistPage() {
    var scope = $('[data-list-page="wishlist"]'); if (!scope) return;
    var grid = $('[data-wishlist-grid]', scope), loading = $('[data-list-loading]', scope);
    var l = getList('wish');
    if (!l.length) { loading.hidden = true; showEmpty(scope, true); return; }
    Promise.all(l.map(fetchFragment)).then(function (items) {
      loading.hidden = true;
      dropMissing('wish', items);
      grid.innerHTML = '';
      items.filter(function (d) { return d.card; }).forEach(function (d, i) {
        var card = document.importNode(d.card, true);
        card.dataset.handle = d.handle;
        card.style.animationDelay = (i * 50) + 'ms';
        if (grid.dataset.tintMode === 'cycle') { var ph = $('.ph', card); if (ph) ph.style.background = 'var(--t' + (i % 4 + 1) + ')'; }
        grid.appendChild(card);
      });
      showEmpty(scope, !$('.card', grid));
      syncLists();
    });
  }

  /* compare page */
  function renderComparePage() {
    var scope = comparePage; if (!scope) return;
    var box = $('[data-compare-table]', scope), loading = $('[data-list-loading]', scope), tools = $('[data-compare-tools]', scope);
    var L = box.dataset, max = T.compareMax || 4;
    var l = getList('compare');
    function empty() { loading.hidden = true; box.innerHTML = ''; tools.hidden = true; showEmpty(scope, true); }
    if (!l.length) { empty(); return; }
    Promise.all(l.map(fetchFragment)).then(function (items) {
      loading.hidden = true;
      dropMissing('compare', items);
      items = items.filter(function (d) { return !d.missing && !d.error; });
      if (!items.length) { empty(); return; }
      showEmpty(scope, false); tools.hidden = false;

      function action(d) {
        if (L.showButtons !== 'true' || !d.available) return '';
        if (d.single) {
          return '<form method="post" action="' + esc(T.routes.cart_add_url) + '" data-cart-form><input type="hidden" name="id" value="' + esc(d.variant_id) + '"><input type="hidden" name="quantity" value="1"><button type="submit" class="btn primary cmp-btn">' + esc(L.lAdd) + '</button></form>';
        }
        return '<a href="' + esc(d.url) + '" class="btn primary cmp-btn" role="button" data-quick-view="' + esc(d.url) + '" aria-haspopup="dialog">' + esc(L.lChoose) + '</a>';
      }
      function text(v) { return v === '' || v == null ? '—' : esc(v); }
      var rows = [
        [L.lPrice, function (d) { return d.price_html; }],
        [L.lRating, function (d) { return d.rating ? '<span class="rate">' + d.stars_html + ' <small>' + esc(d.rating) + ' (' + esc(d.rating_count) + ')</small></span>' : '—'; }],
        [L.lBrand, function (d) { return text(d.vendor); }],
        [L.lType, function (d) { return text(d.type); }],
        [L.lSpec, function (d) { return text(d.spec); }]
      ];
      var optNames = [];
      items.forEach(function (d) { (d.options || []).forEach(function (o) { if (o.name !== 'Title' && optNames.indexOf(o.name) < 0) optNames.push(o.name); }); });
      optNames.forEach(function (n) {
        rows.push([n, function (d) {
          var o = (d.options || []).filter(function (x) { return x.name === n; })[0];
          return o ? o.values.map(esc).join(', ') : '—';
        }]);
      });
      rows.push([L.lAvailability, function (d) { return d.available ? '<span class="cmp-ok">' + esc(L.lInStock) + '</span>' : '<span class="cmp-no">' + esc(L.lSoldOut) + '</span>'; }]);

      var more = items.length < max;
      var html = '<table class="cmp" style="--n:' + (items.length + (more ? 1 : 0)) + '"><thead><tr><td></td>';
      items.forEach(function (d) {
        html += '<th scope="col"><div class="cmp-prod">' +
          '<button type="button" class="icon-btn cmp-x" data-compare-remove="' + esc(d.handle) + '" aria-label="' + esc(L.lRemove) + ': ' + esc(d.title) + '">' + X_SVG + '</button>' +
          '<a class="cmp-img" href="' + esc(d.url) + '" tabindex="-1" aria-hidden="true">' + (d.image ? '<img src="' + esc(d.image) + '" alt="" loading="lazy" width="500" height="500">' : '') + '</a>' +
          '<a class="cmp-title" href="' + esc(d.url) + '">' + esc(d.title) + '</a>' + action(d) + '</div></th>';
      });
      if (more) html += '<td class="cmp-more"><a href="' + esc(L.browseUrl) + '"><span aria-hidden="true">+</span>' + esc(L.lAddMore) + '</a></td>';
      html += '</tr></thead><tbody>';
      rows.forEach(function (r) {
        var cells = items.map(r[1]);
        var same = items.length > 1 && cells.every(function (c) { return c === cells[0]; });
        html += '<tr' + (same ? ' data-same' : '') + '><th scope="row">' + esc(r[0]) + '</th>' +
          cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + (more ? '<td class="cmp-more"></td>' : '') + '</tr>';
      });
      html += '</tbody></table>';
      box.innerHTML = html;
      var diff = $('[data-compare-diff]', scope);
      box.classList.toggle('only-diff', !!(diff && diff.checked));
    });
  }

  function initLists() {
    comparePage = $('[data-list-page="compare"]');
    syncLists();
    renderWishlistPage();
    renderComparePage();
    /* keep heart / compare buttons in sync when cards are added later (filters, search, tabs) */
    if ('MutationObserver' in window) {
      var pend;
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          for (var j = 0; j < muts[i].addedNodes.length; j++) {
            var n = muts[i].addedNodes[j];
            if (n.nodeType === 1 && (n.matches('[data-wish],[data-compare]') || n.querySelector('[data-wish],[data-compare]'))) {
              clearTimeout(pend); pend = setTimeout(syncLists, 30); return;
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  initLists();

  /* ---------- search overlay ---------- */
  var sov, sin, sTimer, sCtrl;
  function openSearch() {
    sov = $('#SearchOverlay'); if (!sov) return false;
    sin = $('input[type="search"]', sov);
    setCart(false); setMenu(false);
    sov.hidden = false;
    requestAnimationFrame(function () { sov.classList.add('on'); });
    setTimeout(function () { sin.focus(); }, 60);
    return true;
  }
  function closeSearch() {
    if (!sov || sov.hidden) return;
    sov.classList.remove('on');
    setTimeout(function () { if (!sov.classList.contains('on')) sov.hidden = true; }, 300);
  }
  function predictive(q) {
    var res = $('[data-predictive]', sov), title = $('[data-predictive-title]', sov), all = $('[data-predictive-all]', sov);
    if (!q) {
      res.innerHTML = res.dataset.default || ''; title.textContent = title.dataset.default || ''; all.innerHTML = ''; return;
    }
    if (!res.dataset.default) { res.dataset.default = res.innerHTML; title.dataset.default = title.textContent; }
    if (sCtrl) sCtrl.abort();
    sCtrl = 'AbortController' in window ? new AbortController() : null;
    fetch(T.routes.predictive_search_url + '?q=' + encodeURIComponent(q) + '&section_id=predictive-search&resources[type]=product,article,collection&resources[limit]=4&resources[options][fields]=title,product_type,variants.title,vendor,tag', sCtrl ? { signal: sCtrl.signal } : {})
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var inner = doc.querySelector('[data-predictive-results]');
        res.innerHTML = inner ? inner.innerHTML : '';
        var n = doc.querySelector('[data-predictive-count]');
        title.textContent = n ? n.dataset.predictiveCount : '';
        all.innerHTML = '<a class="link" href="' + T.routes.search_url + '?q=' + encodeURIComponent(q) + '&options[prefix]=last">' + (T.strings.seeAll || 'See all results') + ' “' + q.replace(/</g, '&lt;') + '”</a>';
      }).catch(function () {});
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-search]')) { if (openSearch()) e.preventDefault(); return; }
    if (e.target.closest('[data-close-search]')) { closeSearch(); return; }
    if (sov && e.target === sov) closeSearch();
    var chip = e.target.closest('[data-search-chip]');
    if (chip && sin) { e.preventDefault(); sin.value = chip.dataset.searchChip; predictive(sin.value); sin.focus(); }
  });
  document.addEventListener('input', function (e) {
    if (!sov || e.target !== sin) return;
    clearTimeout(sTimer); sTimer = setTimeout(function () { predictive(sin.value.trim()); }, 220);
  });

  /* ---------- tabs (featured collection) ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (!t) return;
    var scope = t.closest('[data-tabs]');
    $$('[data-tab]', scope).forEach(function (b) { b.setAttribute('aria-selected', b === t); b.tabIndex = b === t ? 0 : -1; });
    $$('[data-tabpanel]', scope).forEach(function (p) {
      var on = p.dataset.tabpanel === t.dataset.tab; p.hidden = !on;
      if (on) $$('.card', p).forEach(function (c, i) { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; c.style.animationDelay = (i * 60) + 'ms'; });
    });
  });

  /* ---------- hero parallax ---------- */
  function initParallax() {
    if (!window.matchMedia('(hover:hover)').matches || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    $$('[data-parallax]').forEach(function (stage) {
      var prod = $('.prod', stage); if (!prod) return;
      stage.addEventListener('mousemove', function (e) {
        var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        prod.style.transform = 'translate(' + x * 26 + 'px,' + y * 20 + 'px) rotate(' + x * 5 + 'deg)';
      });
      stage.addEventListener('mouseleave', function () { prod.style.transform = ''; });
    });
  }

  /* ---------- product page ---------- */
  function money(cents) {
    var fmt = T.moneyFormat || '${{amount}}';
    var v = (cents / 100).toFixed(2), parts = v.split('.');
    var withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (m, k) {
      if (k === 'amount_no_decimals') return withCommas;
      if (k === 'amount_with_comma_separator') return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + parts[1];
      return withCommas + '.' + parts[1];
    });
  }
  function initProduct(scope) {
    var dataEl = $('[data-product-json]', scope); if (!dataEl) return;
    var product = JSON.parse(dataEl.textContent);
    var form = $('form[data-product-form]', scope);
    var picker = $('[data-variant-picker]', scope);
    var idInput = form && $('input[name="id"]', form);

    function selected() {
      if (!picker) return [];
      return $$('fieldset', picker).map(function (fs) { var c = $('input:checked', fs); return c ? c.value : null; });
    }
    function find(opts) {
      return product.variants.filter(function (v) { return v.options.every(function (o, i) { return o === opts[i]; }); })[0];
    }
    function markAvailability(opts) {
      $$('fieldset', picker).forEach(function (fs, i) {
        $$('input', fs).forEach(function (inp) {
          var test = opts.slice(); test[i] = inp.value;
          var ok = product.variants.some(function (v) { return v.available && v.options.every(function (o, j) { return o === test[j]; }); });
          inp.classList.toggle('na', !ok);
        });
        var lbl = $('[data-selected-value]', fs); if (lbl) lbl.textContent = opts[i] || '';
      });
    }
    function update(e) {
      var opts = selected(), v = find(opts);
      markAvailability(opts);
      var btns = $$('[data-add-btn]', scope), priceEls = $$('[data-price]', scope);
      if (!v) {
        btns.forEach(function (b) { b.disabled = true; b.querySelector('span').textContent = T.strings.unavailable; });
        return;
      }
      if (idInput) { idInput.value = v.id; }
      btns.forEach(function (b) {
        b.disabled = !v.available;
        if (v.available) b.removeAttribute('data-sold-out'); else b.setAttribute('data-sold-out', '');
        b.querySelector('span').textContent = v.available ? T.strings.addToCart : T.strings.soldOut;
      });
      priceEls.forEach(function (p) {
        var html = money(v.price);
        if (v.compare_at_price && v.compare_at_price > v.price) {
          html += '<s>' + money(v.compare_at_price) + '</s>';
          if (p.hasAttribute('data-price-save')) html += '<span class="save">' + T.strings.save + ' ' + Math.round((1 - v.price / v.compare_at_price) * 100) + '%</span>';
        }
        p.innerHTML = html;
      });
      if (v.featured_media) { var ch = e && e.target && e.target.closest ? e.target.closest('fieldset') : null, lg = ch && ch.querySelector('legend'); showMedia(scope, v.featured_media.id, !!(lg && /colou?r/i.test(lg.textContent))); }
      if (window.history.replaceState && $('[data-update-url]', scope)) {
        var url = new URL(window.location.href); url.searchParams.set('variant', v.id);
        window.history.replaceState({}, '', url.toString());
      }
    }
    if (picker) { picker.addEventListener('change', update); markAvailability(selected()); }

    $$('[data-thumb]', scope).forEach(function (b) {
      b.addEventListener('click', function () { showMedia(scope, b.dataset.thumb); });
    });

    var qty = $('[data-qty-input]', scope);
    scope.addEventListener('click', function (e) {
      var s = e.target.closest('[data-qty-step]'); if (!s || !qty) return;
      qty.value = Math.max(1, Math.min(99, (+qty.value || 1) + (+s.dataset.qtyStep)));
    });

    var add = $('[data-add-btn]', form);
    var satc = $('[data-sticky-atc]', scope);
    if (add && satc && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var r = es[0].boundingClientRect;
        body.classList.toggle('sticky-on', !es[0].isIntersecting && r.top < 0);
      }).observe(add);
      satc.addEventListener('click', function (e) {
        if (e.target.closest('[data-add-btn]')) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.submit(); }
      });
    }
  }
  function showMedia(scope, id, doScroll) {
    var found = false;
    $$('[data-slide]', scope).forEach(function (s) { var on = s.dataset.slide == id; s.classList.toggle('on', on); if (on) found = true; });
    if (!found) return;
    $$('[data-thumb]', scope).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.thumb == id); });
    var tint = $('[data-slide="' + id + '"]', scope); var g = $('.gmain', scope);
    var stack = $('.gstack', scope);
    if (stack && tint && doScroll) {
      if (window.matchMedia('(max-width:989px)').matches) stack.scrollTo({ left: tint.offsetLeft - stack.offsetLeft - (parseFloat(getComputedStyle(stack).paddingLeft) || 0), behavior: 'smooth' });
      else { var r = tint.getBoundingClientRect(); if (r.top < 0 || r.bottom > window.innerHeight) tint.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    if (tint && g && tint.dataset.tint) g.style.background = 'var(--' + tint.dataset.tint + ')';
  }

  /* ---------- collection filters ---------- */
  function initFilters() {
    document.addEventListener('change', function (e) {
      var f = e.target.closest('form[data-filter-form]'); if (!f) return;
      if (e.target.matches('[data-price-input]')) return;
      filterSubmit(f);
    });
    document.addEventListener('submit', function (e) {
      var f = e.target.closest('form[data-filter-form]'); if (!f) return;
      e.preventDefault(); filterSubmit(f);
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-filter-link]'); if (a) { e.preventDefault(); loadCollection(a.href); return; }
      if (e.target.closest('[data-toggle-filters]')) { var fl = $('#Filters'); if (fl) fl.classList.toggle('open'); }
    });
    window.addEventListener('popstate', function () { if ($('[data-collection-section]')) loadCollection(window.location.href, true); });
  }
  function filterSubmit(f) {
    var params = new URLSearchParams(new FormData(f));
    $$('form[data-sort-form] select', document).forEach(function (s) { params.set(s.name, s.value); });
    // drop empty price inputs
    [].slice.call(params.keys()).forEach(function (k) { if (params.get(k) === '') params.delete(k); });
    loadCollection(window.location.pathname + '?' + params.toString());
  }
  function loadCollection(url, noPush) {
    var sec = $('[data-collection-section]'); if (!sec) { window.location = url; return; }
    var id = sec.dataset.sectionId, grid = $('[data-results]', sec);
    if (grid) grid.classList.add('is-loading');
    var u = new URL(url, window.location.origin); u.searchParams.set('section_id', id);
    fetch(u.toString()).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var fresh = doc.querySelector('[data-collection-section]');
      var wasOpen = $('#Filters') && $('#Filters').classList.contains('open');
      var openF = $('#Filters details[open]').map(function (d) { return d.dataset.f; });
      if (fresh) sec.replaceWith(fresh);
      if (wasOpen && $('#Filters')) $('#Filters').classList.add('open');
      openF.forEach(function (i) { var d = $('#Filters details[data-f="' + i + '"]'); if (d) d.open = true; });
      document.dispatchEvent(new CustomEvent('nn:collection-updated'));
      if (!noPush) { u.searchParams.delete('section_id'); history.pushState({}, '', u.pathname + u.search); }
    }).catch(function () { window.location = url; });
  }
  document.addEventListener('change', function (e) {
    var s = e.target.closest('form[data-sort-form] select'); if (!s) return;
    var f = $('form[data-filter-form]');
    if (f) { filterSubmit(f); return; }
    var u = new URL(window.location.href); u.searchParams.set(s.name, s.value); loadCollection(u.toString());
  });

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    if (!('IntersectionObserver' in window) || Shopify.designMode) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('pending'); io.unobserve(en.target); } });
    }, { threshold: .08 });
    $$('.rv').forEach(function (el) { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pending'); io.observe(el); } });
  }

  window.Shopify = window.Shopify || {};
  function init() {
    initHeader(); initParallax(); initFilters(); initReveal();
    $$('[data-product-section]').forEach(initProduct);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  /* theme editor support */
  document.addEventListener('shopify:section:load', function (e) {
    initHeader(); initParallax();
    $$('[data-product-section]', e.target).forEach(initProduct);
  });
  document.addEventListener('shopify:block:select', function (e) {
    var t = e.target.closest('[data-tabpanel]') ? null : e.target.closest('[data-tab]');
    if (t) t.click();
  });
})();
