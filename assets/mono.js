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
    var page = $('[data-cart-page]'), pid = page && page.getAttribute('data-section-id');
    var ids = 'cart-drawer' + (pid ? ',' + pid : '');
    return fetch((page ? window.location.pathname : (R.root || '/')) + '?sections=' + ids, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        var html = s['cart-drawer'];
        if (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fresh = doc.querySelector('#CartDrawer'), cur = $('#CartDrawer');
          if (fresh && cur) { cur.replaceWith(fresh); fresh.setAttribute('aria-hidden', drawerOpen() ? 'false' : 'true'); }
          var c = doc.querySelector('[data-cart-count-src]');
          if (c) $$('[data-cart-count]').forEach(function (el) { var n = +c.getAttribute('data-cart-count-src'); el.textContent = n > 0 ? n : ''; });
        }
        if (pid && s[pid]) {
          var d2 = new DOMParser().parseFromString(s[pid], 'text/html');
          var wrap = document.getElementById('shopify-section-' + pid), inner = d2.querySelector('#shopify-section-' + pid);
          if (wrap && inner) wrap.innerHTML = inner.innerHTML;
        }
        busy(false);
        hydrate();
      });
  }

  /* ---------- selection and bulk remove ---------- */
  function roots() { return $$('#CartDrawer, [data-cart-page]'); }
  function money(c) {
    var f = T.moneyFormat || '${{amount}}', n = (c / 100).toFixed(2), parts = n.split('.');
    var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return f.replace(/\{\{\s*amount_no_decimals\s*\}\}/, whole).replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, whole + ',' + parts[1]).replace(/\{\{\s*amount\s*\}\}/, whole + '.' + parts[1]).replace(/<[^>]+>/g, '');
  }
  function syncSelection() {
    roots().forEach(function (d) {
      var boxes = $$('[data-line-select]', d), on = boxes.filter(function (b) { return b.checked; });
      var all = $('[data-select-all]', d), btn = $('[data-remove-selected]', d);
      if (all) { all.checked = boxes.length > 0 && on.length === boxes.length; all.indeterminate = on.length > 0 && on.length < boxes.length; }
      if (btn && d.id === 'CartDrawer') btn.hidden = on.length === 0;
      $$('[data-sel-n],[data-sel-n2]', d).forEach(function (n) { n.textContent = on.length; });
      var act = $('[data-sel-actions]', d), inf = $('[data-sel-info]', d);
      if (act) act.hidden = on.length === 0; if (inf) inf.hidden = on.length === 0;
      var row = $('[data-sel-total-row]', d);
      if (row) {
        var sum = 0; on.forEach(function (b) { var l = b.closest('.line'); sum += +(l && l.getAttribute('data-line-total')) || 0; });
        row.hidden = on.length === 0;
        var tt = $('[data-sel-total]', row); if (tt) tt.textContent = money(sum);
      }
      boxes.forEach(function (b) { var l = b.closest('.line'); if (l) l.classList.toggle('picked', b.checked); });
    });
  }
  function pickedLines(el) {
    var root = el.closest('#CartDrawer, [data-cart-page]') || document;
    return $$('[data-line-select]:checked', root).map(function (b) { return +b.value; });
  }
  function reselect(lines) {
    roots().forEach(function (d) { $$('[data-line-select]', d).forEach(function (b) { b.checked = lines.indexOf(+b.value) > -1; }); });
    syncSelection();
  }
  function getCart() { return fetch((R.cart_url || '/cart') + '.js').then(function (r) { return r.json(); }); }
  function busy(on) { var p = $('[data-cart-page]'); if (p) p.classList.toggle('is-loading', on); var l = $('#CartDrawer .lines'); if (l) l.classList.toggle('cart-loading', on); }
  function readList(k) { try { var v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (x) { return []; } }
  function writeList(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) {} }
  function bumpWishCount() { var n = readList('nn-wishlist').length; $$('[data-wish-count]').forEach(function (el) { el.textContent = n ? n : ''; }); }
  function handlesOf(lines, root) {
    var out = [];
    lines.forEach(function (i) { var b = $('[data-line-select][value="' + i + '"]', root); var l = b && b.closest('.line'); var h = l && l.getAttribute('data-handle'); if (h && out.indexOf(h) < 0) out.push(h); });
    return out;
  }
  function moveToWishlist(lines, root) {
    var hs = handlesOf(lines, root), w = readList('nn-wishlist');
    hs.forEach(function (h) { if (w.indexOf(h) < 0) w.unshift(h); });
    writeList('nn-wishlist', w); bumpWishCount();
    busy(true);
    return getCart().then(function (cart) {
      var updates = cart.items.map(function (it, i) { return lines.indexOf(i + 1) > -1 ? 0 : it.quantity; });
      return postJSON((R.cart_url || '/cart') + '/update.js', { updates: updates });
    }).then(function () { toast(hs.length + ' ' + ((T.strings || {}).movedWish || 'moved to wishlist')); return refreshDrawer(); }).catch(function () { busy(false); });
  }
  function addToCompare(lines, root) {
    var hs = handlesOf(lines, root), c = readList('nn-compare'), max = T.compareMax || 4, added = 0;
    hs.forEach(function (h) { if (c.indexOf(h) < 0 && c.length < max) { c.push(h); added++; } });
    writeList('nn-compare', c);
    toast(added ? added + ' ' + ((T.strings || {}).comparedAdd || 'added to compare') : ((T.strings || {}).compareFull || 'Compare list is full'));
  }
  function bulkQty(lines, delta) {
    busy(true);
    return getCart().then(function (cart) {
      var updates = cart.items.map(function (it, i) { return lines.indexOf(i + 1) > -1 ? Math.max(0, it.quantity + delta) : it.quantity; });
      return postJSON((R.cart_url || '/cart') + '/update.js', { updates: updates });
    }).then(function (cart) { var n = cart.items.length; return refreshDrawer().then(function () { var cur = $$('[data-line-select]').length; reselect(cur === n ? lines : []); }); }).then(null, function () { busy(false); toast((T.strings || {}).error || 'Error'); });
  }
  function postJSON(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function removeSelected(root) {
    var picked = pickedLines(root); if (!picked.length) return;
    busy(true);
    getCart().then(function (cart) {
      var updates = cart.items.map(function (it, i) { return picked.indexOf(i + 1) > -1 ? 0 : it.quantity; });
      return postJSON((R.cart_url || '/cart') + '/update.js', { updates: updates });
    }).then(function () { toast(picked.length + ' ' + (picked.length > 1 ? 'items' : 'item') + ' removed'); return refreshDrawer(); })
      .catch(function () { toast((T.strings || {}).error || 'Error'); refreshDrawer(); });
  }
  function clearCart() {
    busy(true);
    postJSON((R.cart_url || '/cart') + '/clear.js', {}).then(function () { return refreshDrawer(); });
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-select-all]')) { var rt = t.closest('#CartDrawer, [data-cart-page]'); $$('[data-line-select]', rt).forEach(function (b) { b.checked = t.checked; }); syncSelection(); }
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
      $$('[data-discount-hidden]').forEach(function (h) { h.value = v; });
      $$('[data-discount-input]').forEach(function (i) { if (i !== t) i.value = t.value; });
    }
  });
  document.addEventListener('click', function (e) {
    var t = e.target, el;
    if ((el = t.closest('[data-remove-selected]'))) { e.preventDefault(); removeSelected(el); }
    else if (t.closest('[data-clear-cart]')) { e.preventDefault(); clearCart(); }
    else if ((el = t.closest('[data-bulk-wish]'))) { e.preventDefault(); moveToWishlist(pickedLines(el), el.closest('[data-cart-page]')); }
    else if ((el = t.closest('[data-bulk-compare]'))) { e.preventDefault(); addToCompare(pickedLines(el), el.closest('[data-cart-page]')); }
    else if ((el = t.closest('[data-bulk-qty]'))) { e.preventDefault(); bulkQty(pickedLines(el), +el.getAttribute('data-bulk-qty')); }
    else if ((el = t.closest('[data-line-wish]'))) { e.preventDefault(); moveToWishlist([+el.getAttribute('data-line')], el.closest('[data-cart-page]')); }
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
    $('[data-discount-input]').forEach(function (i) { if (v) { i.value = v; var det = i.closest('details'); if (det) det.open = true; } });
    $('[data-discount-hidden]').forEach(function (h) { h.value = v; });
  }
  var mo = new MutationObserver(function (list) {
    for (var k = 0; k < list.length; k++) {
      var added = list[k].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j]; if (n.nodeType === 1 && (n.id === 'CartDrawer' || (n.querySelector && n.querySelector('[data-cart-related],[data-line-select]')))) { hydrate(); return; }
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
  new MutationObserver(function () { if (!b.classList.contains('cart-open') && b.classList.contains('rel-closed')) b.classList.remove('rel-closed'); }).observe(b, { attributes: true, attributeFilter: ['class'] });
})();

/* ---------- product gallery dots (phones / tablets) ---------- */
(function () {
  function build(stack) {
    if (stack.__dots) return;
    var slides = [].slice.call(stack.querySelectorAll('.gslide'));
    if (slides.length < 2) return;
    stack.__dots = 1;
    var box = document.createElement('div'); box.className = 'gdots'; box.setAttribute('role', 'tablist');
    slides.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Image ' + (i + 1));
      b.addEventListener('click', function () { stack.scrollTo({ left: s.offsetLeft - stack.offsetLeft - (parseFloat(getComputedStyle(stack).paddingLeft) || 0), behavior: 'smooth' }); });
      box.appendChild(b);
    });
    stack.insertAdjacentElement('afterend', box);
    function sync() {
      var x = stack.scrollLeft + stack.clientWidth / 3, idx = 0;
      slides.forEach(function (s, i) { if (s.offsetLeft - stack.offsetLeft <= x) idx = i; });
      [].forEach.call(box.children, function (b, i) { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    }
    var t; stack.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 40); }, { passive: true });
    sync();
  }
  function init() { [].forEach.call(document.querySelectorAll('.gstack'), build); }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('shopify:section:load', init);
})();
