/**
 * ============================================================================
 * policy.js — Policy pages: contents list, reading progress, back to top
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (pages with the "policy" template, and
 *            Shopify's own /policies/… pages), with "defer"
 * Works with:
 *   sections/policy-main.liquid → [data-policy] (with its own empty contents
 *                                  list [data-policy-toc] and progress bar)
 *   Shopify's policy pages      → .shopify-policy__container (the list and
 *                                  progress bar are created here)
 * CSS: assets/policy.css
 *
 * What it does:
 *  1. Contents list ("On this page"): one link per h2 heading of the policy
 *     text (headings get ids). Shown only when there are 2+ headings.
 *  2. The section being read is highlighted in the list (the last heading
 *     above the top third of the screen); on phones (list = dropdown) a
 *     tap on a link closes the dropdown.
 *  3. Reading progress bar: fills while scrolling through the text.
 *  4. Back to top button: appears after scrolling down a screen.
 * Visible texts come from Liquid (locales): policy-main.liquid renders its
 * own list title; on Shopify's own policy pages the title is read from
 * #PolicyTexts (data-toc-title), rendered by layout/theme.liquid.
 * ============================================================================
 */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** "Personal Information We Collect" → "personal-information-we-collect" */
  function slug(text, used) {
    let base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section';
    let id = base;
    let n = 2;
    while (used.has(id) || document.getElementById(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  }

  /**
   * Sets up one policy page.
   * @param {HTMLElement} content - the policy text
   * @param {HTMLElement} toc - nav for the contents list (with [data-policy-toc-list])
   * @param {HTMLElement|null} progress - progress bar fill span
   * @param {HTMLElement|null} topButton - back-to-top link
   * @param {() => void} onHasToc - called when the list is shown (layout switch)
   */
  function setup(content, toc, progress, topButton, onHasToc) {
    /* ---------- 1. Contents list ---------- */
    const headings = Array.from(content.querySelectorAll('h2')).filter((h) => h.textContent.trim());
    const links = [];
    if (headings.length >= 2 && toc) {
      const list = toc.querySelector('[data-policy-toc-list]');
      const used = new Set();
      headings.forEach((heading) => {
        if (!heading.id) heading.id = slug(heading.textContent, used);
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'policy-toc__link';
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent.trim();
        item.appendChild(link);
        list.appendChild(item);
        links.push(link);
      });
      toc.hidden = false;
      onHasToc();

      const details = toc.querySelector('details');
      const isDropdown = window.matchMedia('(max-width: 989px)');
      // Phones / tablets: start folded (the text comes first)
      if (details && isDropdown.matches) details.open = false;

      list.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;
        event.preventDefault();
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        window.history.replaceState(null, '', link.hash);
        if (details && isDropdown.matches) details.open = false;
        // Move keyboard focus to the section without scrolling again
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    }

    /* ---------- 2–4. On scroll: active link, progress, back to top ---------- */
    let ticking = false;
    function update() {
      ticking = false;
      const viewport = window.innerHeight;

      // 2. Active section: the last heading above the top third of the screen
      if (links.length) {
        let active = 0;
        headings.forEach((heading, index) => {
          if (heading.getBoundingClientRect().top < viewport * 0.33) active = index;
        });
        // End of the text reached: the last section (too short to reach the line) is active
        const textBottom = content.getBoundingClientRect().bottom;
        const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atPageEnd || textBottom < viewport * 0.6) active = headings.length - 1;
        links.forEach((link, index) => link.setAttribute('aria-current', String(index === active)));
      }

      // 3. Progress through the text
      if (progress) {
        const rect = content.getBoundingClientRect();
        const total = rect.height - viewport * 0.5;
        const done = Math.min(1, Math.max(0, (viewport * 0.5 - rect.top) / Math.max(total, 1)));
        progress.style.transform = `scaleX(${done.toFixed(4)})`;
      }

      // 4. Back to top after one screen
      if (topButton) topButton.classList.toggle('is-visible', window.scrollY > viewport);
    }
    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    if (topButton) {
      topButton.hidden = false;
      topButton.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
    update();
  }

  /* ---------- The "policy" page template (sections/policy-main.liquid) ---------- */
  document.querySelectorAll('[data-policy]').forEach((root) => {
    const content = root.querySelector('[data-policy-content]');
    if (!content) return;
    setup(
      content,
      root.querySelector('[data-policy-toc]'),
      root.querySelector('[data-policy-progress]'),
      root.querySelector('[data-policy-top]'),
      () => root.querySelector('.policy__layout').classList.add('has-toc')
    );
  });

  /* ---------- Shopify's own policy pages (/policies/…) ---------- */
  const shopifyPolicy = document.querySelector('.shopify-policy__container');
  if (shopifyPolicy) {
    const content = shopifyPolicy.querySelector('.shopify-policy__body');
    const texts = document.getElementById('PolicyTexts');
    const label = texts ? texts.dataset.tocTitle : '';
    // Contents list, built like the one in policy-main.liquid
    const toc = document.createElement('nav');
    toc.className = 'policy-toc';
    toc.hidden = true;
    if (label) toc.setAttribute('aria-label', label);
    toc.innerHTML = '<details class="policy-toc__box" open><summary class="policy-toc__title"></summary><ol class="policy-toc__list" data-policy-toc-list></ol></details>';
    toc.querySelector('summary').textContent = label;
    shopifyPolicy.insertBefore(toc, content);
    // Progress bar
    const bar = document.createElement('div');
    bar.className = 'policy-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span></span>';
    shopifyPolicy.prepend(bar);

    if (content) setup(content, toc, bar.firstElementChild, null, () => shopifyPolicy.classList.add('has-toc'));
  }
})();
