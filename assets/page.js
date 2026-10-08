/**
 * ============================================================================
 * page.js — Default page: scroll animations for the page content
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (default page template, with "defer")
 * Works with: sections/page-main.liquid (only when "Animate content on
 *             scroll" is on → [data-page-animate])
 * CSS:        assets/page.css → "Scroll animations"
 *
 * The page content is written in Shopify admin, so it has no animation
 * markup of its own. This script finds its parts and adds modern,
 * scroll-driven effects (in the style of premium themes like Athora):
 *
 *  1. Reveal on scroll — sections fade and rise in; items in rows (cards,
 *     columns) come in one after another.                    (.reveal)
 *  2. Word-by-word headings — each word of a big heading slides up from
 *     behind a mask when the heading appears.                 (.split-words)
 *  3. Image zoom — large images sit enlarged in their frame and zoom out
 *     to normal as you scroll past (scroll-linked).          (.zoom-media)
 *  4. Grow panels — colored boxes (e.g. the dark "what we stand for"
 *     panel) open up from a narrower, rounder shape to full size as they
 *     come into view (scroll-linked).                         (.grow-panel)
 *  5. Scroll-filled quote — the words of a quote fill in from faint to
 *     solid as it scrolls up the screen (scroll-linked).     (.fill-words)
 *  6. Cards lift on hover once shown.
 *
 * Scroll-linked effects share one scroll listener (requestAnimationFrame,
 * only for elements near the screen) and only change transform / opacity /
 * clip-path, which the browser animates smoothly.
 * Nothing is hidden without JavaScript, and nothing moves when the
 * shopper's device asks for reduced motion — the content just shows.
 * ============================================================================
 */

(function () {
  'use strict';

  const root = document.querySelector('[data-page-animate] .page-rte');
  if (!root || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isDesktop = window.matchMedia('(min-width: 750px)');

  /** Reveal timing: delay between items of a row, and its cap */
  const STAGGER = 90;
  const MAX_DELAY = 540;

  /* ==========================================================================
     Helpers
     ========================================================================== */

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const hasBackground = (element) => {
    const color = window.getComputedStyle(element).backgroundColor;
    return color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent';
  };

  /** True for an element laying out 2+ children side by side (flex row / grid) */
  function isRow(element) {
    if (element.children.length < 2) return false;
    const style = window.getComputedStyle(element);
    if (style.display.includes('grid')) return true;
    return style.display.includes('flex') && !style.flexDirection.startsWith('column');
  }

  /** A row item with an image or its own background box → a "card" */
  function isCard(element) {
    return Boolean(element.querySelector('img, .zoom-media')) || hasBackground(element);
  }

  /**
   * Splits an element's text into word spans (only when it holds plain
   * text and <br>s — markup like links is left alone). Spaces stay real
   * text, so screen readers read the sentence normally.
   * @returns {HTMLElement[]} the word spans
   */
  function splitWords(element, inner = false) {
    const plain = Array.from(element.childNodes).every((node) => node.nodeType === 3 || node.nodeName === 'BR');
    if (!plain || !element.textContent.trim()) return [];
    const words = [];
    const fragment = document.createDocumentFragment();
    element.childNodes.forEach((node) => {
      if (node.nodeName === 'BR') {
        fragment.appendChild(document.createElement('br'));
        return;
      }
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(' '));
          return;
        }
        const word = document.createElement('span');
        word.className = 'word';
        if (inner) {
          // Mask + moving inner span (slide up from behind the line)
          const span = document.createElement('span');
          span.className = 'word__inner';
          span.textContent = part;
          word.appendChild(span);
        } else {
          word.textContent = part;
        }
        fragment.appendChild(word);
        words.push(word);
      });
    });
    element.replaceChildren(fragment);
    return words;
  }

  /* ==========================================================================
     Find the parts of the content
     ========================================================================== */

  /** A designed page usually wraps everything in one box: its children are the parts */
  let container = root;
  while (container.children.length === 1 && container.firstElementChild.children.length > 0) {
    container = container.firstElementChild;
  }
  const sections = Array.from(container.children).filter((node) => !['SCRIPT', 'STYLE', 'BR'].includes(node.tagName));

  /* ---------- 3. Image zoom: wrap large images in a clipping frame ---------- */
  const zoomFrames = [];
  root.querySelectorAll('img').forEach((image) => {
    if (image.getBoundingClientRect().width < 220) return; // icons, logos
    const style = window.getComputedStyle(image);
    const frame = document.createElement('div');
    frame.className = 'zoom-media';
    // The frame takes the image's place in the layout (corners, flex, margins)
    frame.style.borderRadius = style.borderRadius;
    frame.style.flex = style.flex;
    frame.style.alignSelf = style.alignSelf;
    frame.style.margin = style.margin;
    image.style.margin = '0';
    image.parentNode.insertBefore(frame, image);
    frame.appendChild(image);
    zoomFrames.push(frame);
  });

  /* ---------- 1. Reveal targets ---------- */
  const revealTargets = [];
  function mark(element, delay = 0, variant = '') {
    element.classList.add('reveal');
    if (variant) element.classList.add(variant);
    if (delay) element.style.setProperty('--reveal-delay', `${Math.min(delay, MAX_DELAY)}ms`);
    revealTargets.push(element);
  }

  const growPanels = [];
  const fillQuotes = [];

  sections.forEach((section) => {
    const children = Array.from(section.children);

    // 4. A colored, rounded box (dark panel, quote box) → grows open on scroll
    const radius = parseFloat(window.getComputedStyle(section).borderTopLeftRadius) || 0;
    if (hasBackground(section) && radius > 0 && section.getBoundingClientRect().width > 400) {
      section.classList.add('grow-panel');
      section.style.setProperty('--panel-radius', `${radius}px`);
      growPanels.push(section);
    }

    // A lone image frame → one reveal
    if (children.length === 1 && children[0].classList.contains('zoom-media')) {
      mark(section, 0, 'reveal--image');
      return;
    }
    if (isRow(section)) {
      children.forEach((child, index) => mark(child, index * STAGGER, isCard(child) ? 'reveal--card' : ''));
      return;
    }
    if (!children.length) {
      mark(section);
      return;
    }

    let step = 0;
    children.forEach((child) => {
      if (isRow(child)) {
        Array.from(child.children).forEach((item) => {
          mark(item, step * STAGGER, isCard(item) ? 'reveal--card' : '');
          step += 1;
        });
      } else if (child.classList.contains('zoom-media')) {
        mark(child, step * STAGGER, 'reveal--image');
        step += 1;
      } else {
        mark(child, step * STAGGER);
        step += 1;
      }
    });
  });

  /* ---------- 2. Word-by-word headings / 5. scroll-filled quote ---------- */
  root.querySelectorAll('h1, h2, h3, p, blockquote').forEach((element) => {
    const text = element.textContent.trim();
    const size = parseFloat(window.getComputedStyle(element).fontSize);

    // A quote ("…" in big type) → words fill in with the scroll
    if (/^[“"«]/.test(text) && size >= 20 && text.length < 320) {
      const words = splitWords(element);
      if (words.length) {
        element.classList.add('fill-words');
        fillQuotes.push({ element, words });
      }
      return;
    }
    // Big headings → word-by-word slide up when shown
    if (/^H[1-3]$/.test(element.tagName) && size >= 24) {
      const words = splitWords(element, true);
      words.forEach((word, index) => word.style.setProperty('--word-index', index));
      if (words.length) element.classList.add('split-words');
    }
  });

  /* ==========================================================================
     Reveal: IntersectionObserver (once per element)
     ========================================================================== */

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      element.classList.add('is-visible');
      revealObserver.unobserve(element);
      // After the entrance: quick transitions (hover lift on cards)
      const delay = parseInt(element.style.getPropertyValue('--reveal-delay'), 10) || 0;
      window.setTimeout(() => element.classList.add('is-done'), 900 + delay);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  revealTargets.forEach((element) => revealObserver.observe(element));

  // Headings animate their words when they come into view (own observer:
  // a heading can sit inside a larger reveal target)
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      headingObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.3 });
  root.querySelectorAll('.split-words').forEach((heading) => headingObserver.observe(heading));

  /* ==========================================================================
     Scroll-linked effects (zoom, grow panels, quote fill)
     ========================================================================== */

  // Only elements near the screen are updated on scroll
  const active = new Set();
  const nearObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) active.add(entry.target);
      else active.delete(entry.target);
    });
    requestUpdate();
  }, { rootMargin: '20% 0px 20% 0px' });

  zoomFrames.forEach((frame) => nearObserver.observe(frame));
  growPanels.forEach((panel) => nearObserver.observe(panel));
  fillQuotes.forEach((quote) => nearObserver.observe(quote.element));

  /**
   * How far an element has travelled through the screen:
   * 0 = its top at the bottom edge, 1 = its bottom at the top edge.
   */
  function travel(rect, height) {
    return clamp((height - rect.top) / (height + rect.height));
  }

  function update() {
    ticking = false;
    const height = window.innerHeight;

    active.forEach((element) => {
      const rect = element.getBoundingClientRect();

      // 3. Image zoom: 1.15 → 1 while the image crosses the screen
      if (element.classList.contains('zoom-media')) {
        const progress = travel(rect, height);
        element.style.setProperty('--zoom', (1.15 - 0.15 * clamp(progress * 1.4)).toFixed(4));
        return;
      }

      // 4. Grow panel: from inset 6% (rounder) to full size by the time its
      //    top reaches 35% of the screen. Desktop only (like Athora).
      if (element.classList.contains('grow-panel')) {
        const progress = isDesktop.matches ? clamp((height - rect.top) / (height * 0.65)) : 1;
        element.style.setProperty('--grow', progress.toFixed(4));
        return;
      }

      // 5. Quote: words fill in while it moves from 85% to 40% of the screen
      const quote = fillQuotes.find((item) => item.element === element);
      if (quote) {
        const progress = clamp((height * 0.85 - rect.top) / (height * 0.45));
        const lit = Math.round(progress * quote.words.length);
        quote.words.forEach((word, index) => word.classList.toggle('is-lit', index < lit));
      }
    });
  }

  let ticking = false;
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  isDesktop.addEventListener('change', requestUpdate);
  root.classList.add('is-animated');
  requestUpdate();

  // Printing: show everything in its final state
  window.addEventListener('beforeprint', () => {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
    root.querySelectorAll('.split-words').forEach((heading) => heading.classList.add('is-visible'));
    fillQuotes.forEach((quote) => quote.words.forEach((word) => word.classList.add('is-lit')));
  });
})();
