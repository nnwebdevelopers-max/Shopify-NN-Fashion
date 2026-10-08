/**
 * ============================================================================
 * wishlist.js — Wishlist page
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (only on the wishlist page template,
 *            template "page.wishlist", with "defer")
 * Works with: sections/wishlist-main.liquid
 * Needs:      window.NNCards from assets/global-product-card.js
 *
 * What it does:
 *  1. Reads the saved handles (localStorage "nn-wishlist", or
 *     "nn-wishlist-<customer id>" when the wishlist needs an account).
 *     Signed out while it needs an account → the section shows a "Sign in"
 *     screen instead (no [data-wishlist]), so this script does nothing.
 *  2. Fetches each product's card from /products/<handle>?view=card
 *     (templates/product.card.json) and shows them in saved order.
 *     Products that no longer exist are removed from the list.
 *  3. Keeps the page in sync: when a ♡ is clicked off (here or in another
 *     tab) the card disappears; "Clear wishlist" empties the list.
 *  4. Shows the count ("3 saved products") and the empty state.
 * ============================================================================
 */

(function () {
  'use strict';

  /** Runs once window.NNCards (global-product-card.js) is available */
  function whenReady(callback) {
    if (window.NNCards) callback();
    else document.addEventListener('nncards:ready', callback, { once: true });
  }

  whenReady(() => {
    const root = document.querySelector('[data-wishlist]');
    if (!root) return;

    const cards = window.NNCards;
    const grid = root.querySelector('[data-wishlist-grid]');
    const loading = root.querySelector('[data-wishlist-loading]');
    const empty = root.querySelector('[data-wishlist-empty]');
    const summary = root.querySelector('[data-wishlist-summary]');
    const clearButton = root.querySelector('[data-wishlist-clear]');

    /** Cache of fetched card HTML per handle (avoids refetching) */
    const cardCache = new Map();

    /**
     * Fetches one product's card markup.
     * @param {string} handle
     * @returns {Promise<Element|null>} the card, or null if the product is gone
     */
    async function fetchCard(handle) {
      if (cardCache.has(handle)) return cardCache.get(handle).cloneNode(true);
      try {
        const response = await fetch(`${window.Shopify && Shopify.routes ? Shopify.routes.root : '/'}products/${encodeURIComponent(handle)}?view=card`);
        if (!response.ok) return null;
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const card = doc.querySelector('[data-product-card]');
        if (!card) return null;
        cardCache.set(handle, card);
        return card.cloneNode(true);
      } catch (error) {
        return null;
      }
    }

    /** Updates the count text, clear button and empty state */
    function updateSummary(count) {
      const template = count === 1 ? root.dataset.textCountOne : root.dataset.textCountOther;
      summary.textContent = count > 0 ? cards.fill(template, 'number', count) : '';
      clearButton.hidden = count === 0;
      empty.hidden = count > 0;
      grid.hidden = count === 0;
    }

    /** Builds the grid from the saved list */
    async function render() {
      const handles = cards.readList('wishlist');
      loading.hidden = handles.length === 0;
      if (handles.length === 0) {
        grid.replaceChildren();
        updateSummary(0);
        return;
      }

      const results = await Promise.all(handles.map((handle) => fetchCard(handle)));
      loading.hidden = true;

      // Drop products that no longer exist from the saved list
      const missing = handles.filter((handle, index) => !results[index]);
      if (missing.length) {
        cards.writeList('wishlist', handles.filter((handle) => !missing.includes(handle)));
        return; // writeList fires wishlist:updated → render() runs again
      }

      grid.replaceChildren(
        ...results.map((card) => {
          const item = document.createElement('li');
          item.className = 'wishlist__item';
          item.appendChild(card);
          return item;
        })
      );
      updateSummary(results.length);
    }

    // Clear all → empty list (the update event re-renders the page)
    clearButton.addEventListener('click', () => {
      cards.writeList('wishlist', []);
    });

    // List changed (♡ clicked on a card here, or "clear") → re-render
    document.addEventListener('wishlist:updated', render);

    // Changed in another tab
    window.addEventListener('storage', (event) => {
      if (event.key === cards.storageKey('wishlist')) render();
    });

    render();
  });
})();
