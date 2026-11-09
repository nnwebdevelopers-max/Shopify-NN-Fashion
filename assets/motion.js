/* NN Fashion motion layer. GSAP + ScrollTrigger when available (Theme settings > Motion), CSS fallbacks otherwise. */
(function () {
  'use strict';
  var d = document, body = d.body;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var designMode = window.Shopify && window.Shopify.designMode;
  var useGsap = function () { return !!(window.gsap && body.dataset.gsap === 'true' && !reduce); };

  /* ---- collection: grid density toggle + load more (no GSAP needed) ---- */
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cols]');
    if (t) {
      var grid = $('[data-results]'); if (!grid) return;
      grid.style.setProperty('--cols', t.dataset.cols);
      $$('[data-cols]').forEach(function (b) { b.setAttribute('aria-pressed', b === t ? 'true' : 'false'); });
      return;
    }
    var more = e.target.closest('[data-load-next]');
    if (more) {
      e.preventDefault();
      var grid2 = $('[data-results]'); if (!grid2 || more.getAttribute('aria-busy') === 'true') return;
      more.setAttribute('aria-busy', 'true'); more.classList.add('busy');
      fetch(more.href).then(function (r) { return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var g = $('[data-results]', doc);
        if (g) $$('article.card, .ptile', g).forEach(function (el) { if (el.classList.contains('ptile')) return; grid2.appendChild(d.importNode(el, true)); });
        var lm = $('[data-loadmore]', doc), cur = $('[data-loadmore]');
        if (lm && cur) cur.replaceWith(d.importNode(lm, true)); else if (cur) cur.remove();
        var pg = $('.pagination', doc), curPg = $('.pagination'); if (pg && curPg) curPg.replaceWith(d.importNode(pg, true));
        revealNew(grid2);
      }).catch(function () { window.location = more.href; });
    }
  });

  function revealNew(grid) {
    var cards = $$('article.card', grid).slice(-24);
    if (useGsap()) { window.gsap.fromTo(cards.slice(-12), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .05, ease: 'power3.out', clearProps: 'all' }); }
  }

  /* ---- smooth anchors / header hide on scroll ---- */
  var lastY = 0;
  if (body.dataset.smooth === 'true' && !reduce) {
    var hdr = $('.section-header');
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (hdr) hdr.classList.toggle('hide-up', y > lastY && y > 400 && !body.classList.contains('menu-open'));
      lastY = y;
    }, { passive: true });
  }

  /* ---- GSAP ---- */
  var inited = false;
  function initGsap(scope) {
    if (!useGsap() || designMode && inited && !scope) return;
    var g = window.gsap, ST = window.ScrollTrigger;
    if (ST) g.registerPlugin(ST);
    inited = true;
    scope = scope || d;

    // hero entrance
    $$('[data-motion="hero"]', scope).forEach(function (h) {
      var tl = g.timeline({ defaults: { ease: 'power4.out' } });
      tl.from($$('.hl > span', h), { yPercent: 110, duration: 1.1, stagger: .12 })
        .from($$('.hfade', h), { y: 24, opacity: 0, duration: .9, stagger: .1 }, '-=.6')
        .from($$('.bt', h), { y: 60, opacity: 0, scale: .94, duration: 1, stagger: .09 }, '-=1.1');
      $$('.drift', h).forEach(function (el, i) { g.to(el, { y: -14, rotation: i % 2 ? 3 : -3, duration: 4 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
    });

    // collection banner + product title
    $$('[data-motion="chero"]', scope).forEach(function (h) {
      g.from($$('h1, .eyebrow, .rte', h), { y: 40, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out' });
      g.from($$('.cf', h), { y: 80, rotation: 0, opacity: 0, duration: 1.2, stagger: .15, ease: 'power3.out' });
    });
    $$('.pb-title .mask > span', scope).forEach(function (el, i) { g.from(el, { yPercent: 110, duration: 1.1, delay: i * .12, ease: 'power4.out' }); });
    $$('.gstack .gslide', scope).forEach(function (el, i) { g.from(el, { y: 60, opacity: 0, duration: 1, delay: .15 + i * .1, ease: 'power3.out' }); });
    $$('[data-motion="buy"]', scope).forEach(function (el) { g.from(el, { y: 50, opacity: 0, duration: 1, delay: .3, ease: 'power3.out' }); });

    if (!ST) return;
    // generic reveals
    $$('.rv', scope).forEach(function (el) {
      el.classList.remove('pending');
      g.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-stagger]', scope).forEach(function (wrap) {
      g.from(wrap.children, { y: 50, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    });
    $$('.bx', scope).forEach(function (el, i) { g.from(el, { y: 60, opacity: 0, duration: .9, delay: i * .08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }); });
    $$('.bento .cat', scope).forEach(function (el, i) { g.from(el, { y: 70, scale: .94, opacity: 0, duration: .9, delay: (i % 4) * .07, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }); });

    // parallax on elements flagged data-parallax="speed"
    if (body.dataset.parallax === 'true') {
      $$('[data-parallax]', scope).forEach(function (el) {
        var sp = parseFloat(el.dataset.parallax) || .15;
        g.to(el, { yPercent: -sp * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }

    // animated counters
    $$('[data-count]', scope).forEach(function (el) {
      var end = parseFloat(el.dataset.count) || 0, o = { v: 0 }, dec = (String(el.dataset.count).split('.')[1] || '').length;
      ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { g.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = o.v.toFixed(dec); } }); } });
    });

    // horizontal text marquee speed-up on scroll
    $$('.mqtrack', scope).forEach(function (tr) {
      if (tr.dataset.mq) return; tr.dataset.mq = '1';
      var dur = parseFloat(getComputedStyle(tr).getPropertyValue('--speed')) || 40;
      var tw = g.to(tr, { xPercent: -50, duration: dur, ease: 'none', repeat: -1 });
      ST.create({ trigger: tr, start: 'top bottom', end: 'bottom top', onUpdate: function (s) { tw.timeScale(1 + Math.min(Math.abs(s.getVelocity() / 400), 5) * (s.direction)); g.to(tw, { timeScale: 1, duration: 1, overwrite: true, delay: .1 }); } });
    });
  }

  /* ---- magnetic buttons ---- */
  function initMagnetic() {
    if (body.dataset.magnetic !== 'true' || reduce || !window.gsap || !window.matchMedia('(hover:hover)').matches) return;
    $$('.btn.primary, .chip.mag').forEach(function (b) {
      if (b.dataset.mag) return; b.dataset.mag = '1';
      var qx = window.gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), qy = window.gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .22); qy((e.clientY - r.top - r.height / 2) * .3); });
      b.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });
  }

  /* ---- mega menu panel stagger (adds to existing CSS) ---- */
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-mc]'); if (!t) return;
    if (!window.gsap || reduce) return;
    var p = $('[data-mcp="' + t.dataset.mc + '"]'); if (p) window.gsap.from(p.children, { y: 16, opacity: 0, duration: .45, stagger: .06, ease: 'power2.out' });
  });

  function start() {
    // if GSAP is blocked/slow, make sure revealed content is visible
    var tries = 0;
    (function wait() {
      if (window.gsap && (window.ScrollTrigger || !body.dataset.gsap)) { initGsap(); initMagnetic(); return; }
      if (++tries > 40) { return; }
      setTimeout(wait, 100);
    })();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
  d.addEventListener('shopify:section:load', function (e) { if (window.gsap) { initGsap(e.target); initMagnetic(); } });
  d.addEventListener('nn:collection-updated', function () { initMagnetic(); });
})();
