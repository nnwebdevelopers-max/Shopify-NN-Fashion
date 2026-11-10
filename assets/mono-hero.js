/* Hero slider: tabs with progress, wipe transition, arrows, keys, swipe, pause, hover pause. No dependencies. */
(function () {
  function init(root) {
    if (root.__mh) return; root.__mh = true;
    var slides = [].slice.call(root.querySelectorAll('.mh-slide'));
    var texts = [].slice.call(root.querySelectorAll('.mh-t'));
    var looks = [].slice.call(root.querySelectorAll('.mh-look'));
    var tabs = [].slice.call(root.querySelectorAll('.mh-tab'));
    var now = root.querySelector('[data-mh-now]');
    var dur = (parseInt(root.getAttribute('data-duration'), 10) || 7) * 1000;
    var auto = root.getAttribute('data-autoplay') === 'true';
    var idx = 0, paused = !auto, hover = false, timer = null, left = dur, started = 0, busy = false;
    if (slides.length < 2) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setBars() {
      tabs.forEach(function (t, i) {
        var u = t.querySelector('u'); u.style.transition = 'none';
        u.style.width = i < idx ? '100%' : '0%';
      });
    }
    function run() {
      clearTimeout(timer);
      var u = tabs[idx].querySelector('u');
      u.style.transition = 'none'; u.style.width = (100 - left / dur * 100) + '%';
      if (paused || hover) return;
      void u.offsetWidth;
      u.style.transition = 'width ' + left + 'ms linear'; u.style.width = '100%';
      started = Date.now();
      timer = setTimeout(function () { go((idx + 1) % slides.length, 1); }, left);
    }
    function freeze() {
      if (!timer) return; clearTimeout(timer); timer = null;
      left = Math.max(300, left - (Date.now() - started));
      var u = tabs[idx].querySelector('u'); var w = u.getBoundingClientRect().width / u.parentNode.getBoundingClientRect().width * 100;
      u.style.transition = 'none'; u.style.width = w + '%';
    }
    function go(n, dir) {
      if (n === idx || busy) return;
      busy = true; dir = dir || (n > idx ? 1 : -1);
      var from = idx, cur = slides[from], nxt = slides[n];
      freeze(); clearTimeout(timer);
      idx = n; left = dur;
      tabs[from].classList.remove('on'); tabs[n].classList.add('on');
      if (now) now.textContent = '0' + (n + 1);
      setBars();
      nxt.style.zIndex = 3; nxt.classList.add('on', 'enter');
      nxt.style.clipPath = dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      void nxt.offsetWidth;
      nxt.style.transition = reduce ? 'none' : 'clip-path 1.1s cubic-bezier(.77,0,.18,1)';
      nxt.style.clipPath = 'inset(0 0 0 0)';
      texts[from].classList.add('out'); looks[from] && looks[from].classList.add('out');
      setTimeout(function () {
        texts[from].classList.remove('on', 'out'); texts[n].classList.add('on');
        if (looks[from]) { looks[from].classList.remove('on', 'out'); }
        if (looks[n]) looks[n].classList.add('on');
      }, reduce ? 0 : 420);
      setTimeout(function () {
        cur.classList.remove('on'); nxt.classList.remove('enter'); nxt.style.cssText = ''; nxt.classList.add('on'); cur.style.cssText = '';
        busy = false; run();
      }, reduce ? 30 : 1150);
    }
    function next() { go((idx + 1) % slides.length, 1); }
    function prev() { go((idx - 1 + slides.length) % slides.length, -1); }

    tabs.forEach(function (t) { t.addEventListener('click', function () { go(parseInt(t.getAttribute('data-go'), 10)); }); });
    var bn = root.querySelector('[data-mh-next]'), bp = root.querySelector('[data-mh-prev]');
    if (bn) bn.addEventListener('click', next); if (bp) bp.addEventListener('click', prev);
    var pb = root.querySelector('[data-mh-pause]');
    function paintPause() { if (pb) { pb.innerHTML = paused ? '&#9654;' : '&#10073;&#10073;'; pb.setAttribute('aria-label', paused ? 'Play' : 'Pause'); } }
    if (pb) pb.addEventListener('click', function () { paused = !paused; paintPause(); if (paused) freeze(); else run(); });
    root.addEventListener('mouseenter', function () { hover = true; freeze(); });
    root.addEventListener('mouseleave', function () { hover = false; if (!paused && !busy) run(); });
    root.addEventListener('focusin', function () { hover = true; freeze(); });
    root.addEventListener('focusout', function () { hover = false; if (!paused && !busy) run(); });
    document.addEventListener('keydown', function (e) {
      var r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
      if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev();
    });
    var sx = null, sy = null;
    root.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
    }, { passive: true });
    var ro = window.IntersectionObserver ? new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (!x.isIntersecting) freeze(); else if (!paused && !hover && !busy) run(); });
    }, { threshold: .2 }) : null;
    if (ro) ro.observe(root);
    paintPause(); setBars(); run();
  }
  function boot() { document.querySelectorAll('[data-mhero]').forEach(init); }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('shopify:section:load', boot);
})();
