/* NN Mono extras: cart drawer tools (select + bulk remove, note, discount, related products, clear), countdown strips. */
(function () {
  var T = window.theme || {};
  var R = (T.routes || {});
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function toast(msg) {
    var t = $('#Toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.classList.remove('on'); }, 2400);
  }
  function drawerOpen() { return document.body.classList.contains('cart-open'); }

  /* ---------- refresh the drawer without touching theme.js internals ---------- */
  function refreshDrawer() {
    return fetch((R.root || '/') + '?sections=cart-drawer', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        var html = s['cart-drawer']; if (!html) return;
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.querySelector('#CartDrawer'), cur = $('#CartDrawer');
        if (fresh && cur) {
          cur.replaceWith(fresh); fresh.setAttribute('aria-hidden', drawerOpen() ? 'false' : 'true');
        }
        var c = doc.querySelector('[data-cart-count-src]');
        if (c) $$('[data-cart-count]').forEach(function (el) { var n = +c.getAttribute('data-cart-count-src'); el.textContent = n > 0 ? n : ''; });
        hydrate();
      });
  }

  /* ---------- selection and bulk remove ---------- */
  function syncSelection() {
    var d = $('#CartDrawer'); if (!d) return;
    var boxes = $$('[data-line-select]', d), on = boxes.filter(function (b) { return b.checked; });
    var all = $('[data-select-all]', d), btn = $('[data-remove-selected]', d), n = $('[data-sel-n]', d);
    if (all) { all.checked = boxes.length > 0 && on.length === boxes.length; all.indeterminate = on.length > 0 && on.length < boxes.length; }
    if (btn) btn.hidden = on.length === 0;
    if (n) n.textContent = on.length;
    boxes.forEach(function (b) { var l = b.closest('.line'); if (l) l.classList.toggle('picked', b.checked); });
  }
  function postJSON(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function removeSelected() {
    var d = $('#CartDrawer'); if (!d) return;
    var picked = $$('[data-line-select]:checked', d).map(function (b) { return +b.value; });
    if (!picked.length) return;
    d.querySelector('.lines').classList.add('cart-loading');
    fetch((R.cart_url || '/cart') + '.js').then(function (r) { return r.json(); }).then(function (cart) {
      var updates = cart.items.map(function (it, i) { return picked.indexOf(i + 1) > -1 ? 0 : it.quantity; });
      return postJSON((R.cart_url || '/cart') + '/update.js', { updates: updates });
    }).then(function () { toast(picked.length + ' ' + (picked.length > 1 ? 'items' : 'item') + ' removed'); return refreshDrawer(); })
      .catch(function () { toast((T.strings || {}).error || 'Error'); refreshDrawer(); });
  }
  function clearCart() {
    postJSON((R.cart_url || '/cart') + '/clear.js', {}).then(function () { return refreshDrawer(); });
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-select-all]')) { $$('[data-line-select]', $('#CartDrawer')).forEach(function (b) { b.checked = t.checked; }); syncSelection(); }
    else if (t.matches && t.matches('[data-line-select]')) syncSelection();
    else if (t.matches && t.matches('[data-cart-note]')) {
      postJSON((R.cart_url || '/cart') + '/update.js', { note: t.value }).then(function () { toast('Note saved'); });
    }
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-discount-input]')) {
      var v = t.value.trim();
      try { sessionStorage.setItem('nn-discount', v); } catch (x) {}
      var h = $('[data-discount-hidden]'); if (h) h.value = v;
    }
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-remove-selected]')) { e.preventDefault(); removeSelected(); }
    else if (e.target.closest('[data-clear-cart]')) { e.preventDefault(); clearCart(); }
  });

  /* ---------- related products ---------- */
  var relCache = {};
  function loadRelated() {
    $$('[data-cart-related]').forEach(function (box) {
      if (box.getAttribute('data-ready')) return;
      var id = box.getAttribute('data-product-id'); if (!id || box.hidden) return;
      box.setAttribute('data-ready', '1');
      if (relCache[id] !== undefined) { box.innerHTML = relCache[id]; if (!relCache[id]) box.hidden = true; return; }
      var url = '/recommendations/products?section_id=cart-related&product_id=' + id + '&limit=' + (box.getAttribute('data-limit') || 4) + '&intent=related';
      fetch(url).then(function (r) { return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var c = doc.querySelector('[data-cart-related-content]');
        relCache[id] = c ? c.outerHTML : '';
        box.innerHTML = relCache[id]; if (!relCache[id]) box.hidden = true;
      }).catch(function () { box.hidden = true; });
    });
  }

  /* ---------- run after the drawer is (re)drawn ---------- */
  function hydrate() {
    syncSelection(); loadRelated();
    var v = ''; try { v = sessionStorage.getItem('nn-discount') || ''; } catch (x) {}
    var i = $('[data-discount-input]'), h = $('[data-discount-hidden]');
    if (i && v) { i.value = v; var det = i.closest('details'); if (det) det.open = true; }
    if (h) h.value = v;
  }
  var mo = new MutationObserver(function (list) {
    for (var k = 0; k < list.length; k++) {
      var added = list[k].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j]; if (n.nodeType === 1 && (n.id === 'CartDrawer' || (n.querySelector && n.querySelector('[data-cart-related]')))) { hydrate(); return; }
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', hydrate); if (document.readyState !== 'loading') hydrate();

  /* ---------- countdown strips ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function countdown(el) {
    var out = $('[data-cd-out]', el), raw = el.getAttribute('data-countdown'), hrs = +el.getAttribute('data-hours') || 24, end = raw ? Date.parse(raw.replace(' ', 'T')) : NaN;
    function tick() {
      var now = Date.now(), left;
      if (isNaN(end)) { var span = hrs * 3600000; left = span - (now % span); } else left = Math.max(0, end - now);
      var s = Math.floor(left / 1000), d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600); s -= h * 3600; var m = Math.floor(s / 60); s -= m * 60;
      out.textContent = (d > 0 ? d + 'd : ' : '') + pad(h) + ' : ' + pad(m) + ' : ' + pad(s);
    }
    tick(); setInterval(tick, 1000);
  }
  function bootCd() { $$('[data-countdown]').forEach(function (el) { if (!el.__cd) { el.__cd = 1; countdown(el); } }); }
  if (document.readyState !== 'loading') bootCd(); else document.addEventListener('DOMContentLoaded', bootCd);
  document.addEventListener('shopify:section:load', bootCd);
})();

/* ---------- dropdown and checkbox option styles drive the hidden radios ---------- */
(function () {
  function pick(fs, value) {
    var radios = [].slice.call(fs.querySelectorAll('input[type="radio"]'));
    var r = radios.filter(function (x) { return x.value === value; })[0];
    if (!r) return;
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-opt-select]')) pick(t.closest('fieldset'), t.value);
    else if (t.matches && t.matches('[data-opt-check]')) pick(t.closest('fieldset'), t.checked ? t.getAttribute('data-on') : t.getAttribute('data-off'));
  });
  /* keep the dropdown / checkbox in step when the variant changes from elsewhere (e.g. sold-out fallback) */
  document.addEventListener('change', function (e) {
    var t = e.target; if (!(t.matches && t.matches('input[type="radio"]'))) return;
    var fs = t.closest('fieldset'); if (!fs) return;
    var sel = fs.querySelector('[data-opt-select]'); if (sel) sel.value = t.value;
    var ck = fs.querySelector('[data-opt-check]'); if (ck) ck.checked = (t.value === ck.getAttribute('data-on'));
  });
})();

/* ---------- filters: one dropdown open at a time, close on outside click / Esc ---------- */
(function () {
  function closeAll(except) { [].slice.call(document.querySelectorAll('.fdrop[open]')).forEach(function (d) { if (d !== except) d.removeAttribute('open'); }); }
  document.addEventListener('toggle', function (e) { var d = e.target; if (d && d.classList && d.classList.contains('fdrop') && d.open) closeAll(d); }, true);
  document.addEventListener('click', function (e) { if (!e.target.closest('.fdrop')) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
})();

/* ---------- cart: close the You-may-like panel (comes back next time the cart opens) ---------- */
(function () {
  var b = document.body;
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close-related]')) { e.preventDefault(); b.classList.add('rel-closed'); } });
  new MutationObserver(function () { if (!b.classList.contains('cart-open')) b.classList.remove('rel-closed'); }).observe(b, { attributes: true, attributeFilter: ['class'] });
})();
