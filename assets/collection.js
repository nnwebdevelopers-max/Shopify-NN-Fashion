/**
 * ============================================================================
 * collection.js — Collection page behaviour
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (template "collection" and "search",
 *            with "defer", so the HTML is parsed before this runs)
 * Works with: sections/collection-main.liquid
 *             sections/search-main.liquid (same markup; form action /search)
 *             snippets/collection-filters.liquid
 * Event:     "collection:updated" (bubbles from [data-collection]) after
 *            new results are swapped in
 *
 * What it does:
 *  1. Live filtering & sorting: when a filter or the sort dropdown changes,
 *     fetches the updated section HTML with Shopify's Section Rendering API
 *     (same URL + ?section_id=...) and swaps in the new results. No page reload.
 *  2. Ajax links: active filter pills, "Clear all" and pagination.
 *  3. Keeps the browser URL in sync (pushState), so filtered pages can be
 *     shared/bookmarked, and the back/forward buttons work.
 *  4. Mobile filter drawer: open/close, overlay click, Escape key.
 *
 * Without JavaScript the page still works: the form submits as a normal GET.
 * ============================================================================
 */

(function () {
  'use strict';

  /**
   * Regions replaced after every update (marked with these data attributes
   * in collection-main.liquid). Everything else (the drawer, the form itself)
   * stays in place, so an open drawer stays open.
   */
  const UPDATE_SELECTORS = [
    '[data-filters-body]',   // filter groups (counts / disabled values change)
    '[data-active-filters]', // active filter pills
    '[data-active-count]',   // "(2)" on the mobile Filter button
    '[data-product-count]',  // "24 products"
    '[data-sort]',           // sort dropdown (keeps it in sync on back/forward)
    '[data-results]',        // product grid / empty state + pagination
  ];

  class CollectionPage {
    /**
     * @param {HTMLElement} root - The section wrapper with [data-collection]
     */
    constructor(root) {
      this.root = root;
      this.sectionId = root.dataset.sectionId;
      this.form = root.querySelector('[data-filters-form]');
      this.toggleButton = root.querySelector('[data-filters-open]');
      this.abortController = null;

      // Tells the CSS that JS is running: enables the mobile drawer and
      // hides the no-JS "Apply" / "Sort" buttons.
      root.classList.add('is-js');

      this.bindEvents();
    }

    /* ---------- Event listeners ---------- */

    bindEvents() {
      if (this.form) {
        // Any checkbox, price field or sort change → update the results
        this.form.addEventListener('change', () => this.render(this.getFormUrl()));

        // Pressing Enter in a price field submits the form → use Ajax instead
        this.form.addEventListener('submit', (event) => {
          event.preventDefault();
          this.render(this.getFormUrl());
        });
      }

      // One click listener on the whole section (event delegation), so it
      // keeps working for elements that get replaced after an update.
      this.root.addEventListener('click', (event) => {
        // Pills, "Clear all", pagination
        const link = event.target.closest('[data-ajax-link]');
        if (link) {
          event.preventDefault();
          this.render(link.href, { scrollToTop: link.hasAttribute('data-scroll-top') });
          return;
        }

        // Mobile drawer buttons
        if (event.target.closest('[data-filters-open]')) {
          this.toggleDrawer(true);
        } else if (event.target.closest('[data-filters-close]')) {
          this.toggleDrawer(false);
        }
      });
    }

    /* ---------- URL building ---------- */

    /**
     * Builds the page URL from the current form values.
     * - Empty values (e.g. blank price fields) are left out.
     * - "page" is never included, so a new filter always starts on page 1.
     * @returns {string} e.g. "/collections/shirts?filter.v.option.size=M&sort_by=price-ascending"
     */
    getFormUrl() {
      const params = new URLSearchParams();
      for (const [key, value] of new FormData(this.form)) {
        if (value !== '') params.append(key, value);
      }
      const query = params.toString();
      return window.location.pathname + (query ? `?${query}` : '');
    }

    /* ---------- Fetch & render ---------- */

    /**
     * Fetches the section for the given URL and swaps in the new HTML.
     * @param {string} url - Page URL with filter / sort / page params
     * @param {object} [options]
     * @param {boolean} [options.updateHistory=true] - Push the URL to the browser history
     * @param {boolean} [options.scrollToTop=false] - Scroll to the top of the section after
     */
    async render(url, { updateHistory = true, scrollToTop = false } = {}) {
      // Cancel a request still running (e.g. several filters clicked quickly)
      if (this.abortController) this.abortController.abort();
      const controller = new AbortController();
      this.abortController = controller;

      // Adding section_id makes Shopify return only this section's HTML
      const fetchUrl = new URL(url, window.location.origin);
      fetchUrl.searchParams.set('section_id', this.sectionId);

      this.root.classList.add('is-loading');

      try {
        const response = await fetch(fetchUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        this.updateDom(await response.text());

        if (updateHistory) {
          fetchUrl.searchParams.delete('section_id');
          window.history.pushState({}, '', fetchUrl.pathname + fetchUrl.search);
        }

        if (scrollToTop) {
          this.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (error) {
        // Cancelled on purpose by a newer request → nothing to do
        if (error.name === 'AbortError') return;

        // Anything else failed → fall back to a normal page load
        window.location.href = url;
      } finally {
        // Only the latest request removes the loading state
        if (this.abortController === controller) {
          this.root.classList.remove('is-loading');
        }
      }
    }

    /**
     * Replaces each update region with the matching part of the new HTML,
     * keeping open/closed filter groups and keyboard focus as they were.
     * @param {string} html - Section HTML returned by Shopify
     */
    updateDom(html) {
      const newDocument = new DOMParser().parseFromString(html, 'text/html');

      // Remember UI state the new HTML would reset
      const openState = new Map();
      this.root.querySelectorAll('details[data-filter-id]').forEach((details) => {
        openState.set(details.dataset.filterId, details.open);
      });
      const focusedId = document.activeElement ? document.activeElement.id : '';

      // Swap the regions
      UPDATE_SELECTORS.forEach((selector) => {
        const current = this.root.querySelector(selector);
        const updated = newDocument.querySelector(selector);
        if (current && updated) current.innerHTML = updated.innerHTML;
      });

      // Restore open/closed filter groups
      this.root.querySelectorAll('details[data-filter-id]').forEach((details) => {
        const id = details.dataset.filterId;
        if (openState.has(id)) details.open = openState.get(id);
      });

      // Restore focus (e.g. the checkbox the shopper just clicked)
      if (focusedId) {
        const element = document.getElementById(focusedId);
        if (element && this.root.contains(element)) element.focus({ preventScroll: true });
      }

      // Let other scripts know (search page animations measure again)
      this.root.dispatchEvent(new CustomEvent('collection:updated', { bubbles: true }));
    }

    /* ---------- Mobile drawer ---------- */

    /**
     * Opens or closes the mobile filter drawer.
     * @param {boolean} open
     */
    toggleDrawer(open) {
      this.root.classList.toggle('filters-open', open);
      document.body.classList.toggle('overflow-hidden', open);
      if (this.toggleButton) this.toggleButton.setAttribute('aria-expanded', String(open));

      // Move focus into the drawer when opening, back to the button when closing
      if (open) {
        const closeButton = this.root.querySelector('.collection-filters__close');
        if (closeButton) closeButton.focus();
      } else if (this.toggleButton) {
        this.toggleButton.focus();
      }
    }

    /** @returns {boolean} Whether the mobile drawer is open */
    isDrawerOpen() {
      return this.root.classList.contains('filters-open');
    }
  }

  /* ---------- Setup ---------- */

  /**
   * Creates a CollectionPage for every [data-collection] inside `scope`
   * that doesn't have one yet.
   * @param {ParentNode} scope
   */
  function init(scope) {
    scope.querySelectorAll('[data-collection]').forEach((root) => {
      if (!root.collectionPage) root.collectionPage = new CollectionPage(root);
    });
  }

  /** Runs `callback` for every initialised CollectionPage on the page. */
  function forEachPage(callback) {
    document.querySelectorAll('[data-collection]').forEach((root) => {
      if (root.collectionPage) callback(root.collectionPage);
    });
  }

  init(document);

  // Back / forward buttons: show the results for the URL the browser moved to
  // (without adding another history entry)
  window.addEventListener('popstate', () => {
    forEachPage((page) => page.render(window.location.href, { updateHistory: false }));
  });

  // Escape closes an open drawer
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    forEachPage((page) => {
      if (page.isDrawerOpen()) page.toggleDrawer(false);
    });
  });

  // Theme editor: re-initialise when the section is re-rendered after a setting change
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
