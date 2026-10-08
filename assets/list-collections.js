/**
 * ============================================================================
 * list-collections.js — All collections page: find + sort
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (template "list-collections"), with "defer"
 * Works with: sections/list-collections-main.liquid,
 *             snippets/list-collections-card.liquid (data-title, data-count,
 *             data-index on each card)
 * CSS:        assets/list-collections.css
 *
 * What it does (works with or without the GSAP animations):
 *  1. Shows the "Find a collection" box and the "Sort" menu (hidden without JS).
 *  2. Find: hides cards whose name doesn't contain the typed words; shows
 *     "No collection matches …" when none is left.
 *  3. Sort: Featured (page order) / Name A–Z / Name Z–A / Most products.
 *  While finding or sorting, the grid gets .is-filtered (the large first card
 *  of the mosaic becomes a normal card). Fires "lc:filtered" on the section
 *  so the animations show every card at once.
 * Texts come from Liquid (locales via data-text).
 * ============================================================================
 */

(function () {
  'use strict';

  document.querySelectorAll('[data-list-collections]').forEach((section) => {
    const grid = section.querySelector('[data-lc-grid]');
    if (!grid || section.dataset.lcReady) return;
    section.dataset.lcReady = 'true';

    const cards = Array.from(grid.querySelectorAll('[data-lc-card]'));
    const find = section.querySelector('[data-lc-find]');
    const input = section.querySelector('[data-lc-find-input]');
    const clear = section.querySelector('[data-lc-find-clear]');
    const sortBox = section.querySelector('[data-lc-sort]');
    const select = section.querySelector('[data-lc-sort-select]');
    const none = section.querySelector('[data-lc-none]');

    // Tools are only useful with a few collections to choose from
    if (cards.length > 3) {
      find.hidden = false;
      sortBox.hidden = false;
    }

    const notify = () => section.dispatchEvent(new CustomEvent('lc:filtered'));

    /** Finds + sorts, then marks the grid while it's not in its first state */
    function update() {
      const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      cards.forEach((card) => {
        const match = words.every((word) => card.dataset.title.includes(word));
        card.hidden = !match;
        if (match) shown += 1;
      });
      clear.hidden = !words.length;
      none.hidden = shown > 0;
      if (!shown) none.textContent = none.dataset.text.replace('[terms]', input.value.trim());

      const sort = select.value;
      const sorted = cards.slice().sort((a, b) => {
        if (sort === 'az') return a.dataset.title.localeCompare(b.dataset.title);
        if (sort === 'za') return b.dataset.title.localeCompare(a.dataset.title);
        if (sort === 'count') return Number(b.dataset.count) - Number(a.dataset.count);
        return Number(a.dataset.index) - Number(b.dataset.index);
      });
      sorted.forEach((card) => grid.appendChild(card));
      grid.classList.toggle('is-filtered', words.length > 0 || sort !== 'featured');
      notify();
    }

    let timer;
    input.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 100);
    });
    select.addEventListener('change', update);
    clear.addEventListener('click', () => {
      input.value = '';
      update();
      input.focus();
    });
  });
})();
