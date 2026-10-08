/**
 * ============================================================================
 * global-buttons.js — GSAP micro-interactions for every .button
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid on every page (defer), after
 *            assets/global-gsap.min.js
 * Styles:    assets/global-buttons.css (the button system)
 *
 * What it does (event delegation on the document, so buttons added later —
 * quick-add popup, Ajax results, theme editor — work too):
 *  1. Hover (mouse only): the button grows very slightly (scale 1.03); a
 *     trailing icon (arrow) nudges forward, a leading icon tilts.
 *  2. Press (mouse + touch): quick squeeze (0.96) and a springy release.
 *  3. Magnetic (mouse only): buttons marked .button--magnetic or
 *     [data-magnetic] lean a few pixels towards the cursor.
 * Fast (0.2–0.5s) and small on purpose. Nothing runs when the device asks
 * for reduced motion, and disabled / loading buttons are left alone.
 * Without GSAP the buttons still have their CSS hover / focus / active states.
 * ============================================================================
 */

(function () {
  'use strict';

  const gsap = window.gsap;
  if (!gsap) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const SELECTOR = '.button';

  /** The button under an event, unless it's disabled / loading */
  function buttonFrom(target) {
    const button = target instanceof Element ? target.closest(SELECTOR) : null;
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || button.classList.contains('is-loading')) return null;
    return button;
  }

  /**
   * Icons inside a button: "trail" = the last icon when it comes after the
   * label (an arrow), "lead" = the first icon when it comes before it (a bag).
   */
  function icons(button) {
    const svgs = Array.from(button.querySelectorAll('svg'));
    if (!svgs.length) return { lead: null, trail: null };
    const last = svgs[svgs.length - 1];
    const trail = isAfterText(button, last) ? last : null;
    const lead = svgs[0] !== trail && !isAfterText(button, svgs[0]) ? svgs[0] : null;
    return { lead, trail };
  }

  /** True when `icon` comes after some visible text inside `button` */
  function isAfterText(button, icon) {
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.textContent.trim() && (node.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING)) return true;
      node = walker.nextNode();
    }
    return false;
  }

  const isMagnetic = (button) => button.classList.contains('button--magnetic') || button.hasAttribute('data-magnetic');

  /* ---------- 1. Hover ---------- */
  document.addEventListener('pointerover', (event) => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const button = buttonFrom(event.target);
    if (!button || button.contains(event.relatedTarget)) return;
    gsap.to(button, { scale: 1.03, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
    const { lead, trail } = icons(button);
    if (trail) gsap.to(trail, { x: 4, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    if (lead) gsap.to(lead, { rotation: -10, scale: 1.12, duration: 0.35, ease: 'back.out(2.5)', overwrite: 'auto' });
  });

  document.addEventListener('pointerout', (event) => {
    if (event.pointerType !== 'mouse') return;
    const button = event.target instanceof Element ? event.target.closest(SELECTOR) : null;
    if (!button || button.contains(event.relatedTarget)) return;
    gsap.to(button, { scale: 1, x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    const { lead, trail } = icons(button);
    if (trail) gsap.to(trail, { x: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    if (lead) gsap.to(lead, { rotation: 0, scale: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
  });

  /* ---------- 2. Press ---------- */
  document.addEventListener('pointerdown', (event) => {
    if (reduced.matches) return;
    const button = buttonFrom(event.target);
    if (!button) return;
    gsap.to(button, { scale: 0.96, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
    const release = () => {
      const hovering = finePointer.matches && button.matches(':hover');
      gsap.to(button, { scale: hovering ? 1.03 : 1, duration: 0.45, ease: 'elastic.out(1.1, 0.45)', overwrite: 'auto' });
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  });

  /* ---------- 3. Magnetic CTAs ---------- */
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const button = buttonFrom(event.target);
    if (!button || !isMagnetic(button)) return;
    const box = button.getBoundingClientRect();
    gsap.to(button, {
      x: (event.clientX - box.left - box.width / 2) * 0.18,
      y: (event.clientY - box.top - box.height / 2) * 0.3,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  });
})();
