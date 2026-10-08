/**
 * ============================================================================
 * header-search.js — Live search popup in the header
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (every page, with "defer")
 * Works with:
 *   snippets/header-search.liquid     → search bar + popup markup (settings in data-*)
 *   sections/header-search-results.liquid → results HTML returned by Shopify
 *
 * What it does:
 *  1. Opens the popup when the search bar is focused (popular searches + history).
 *  2. After the shopper types `data-min-chars` characters (default 3), waits
 *     until they pause typing, then asks Shopify's Predictive Search API for
 *     results and shows them in the popup. Results are cached per term.
 *  3. Products / Categories tabs inside the results.
 *  4. Popular search chips + search history chips fill the search bar and search.
 *  5. Search history: saved in localStorage when the shopper submits a search
 *     or clicks a result; trash button clears it.
 *  6. Eye button hides/shows the popular searches (remembered).
 *  7. Closes on ×, overlay click, Escape, or when focus leaves the search.
 *
 * Without JavaScript the search bar is a normal form → /search?q=…
 * ============================================================================
 */

(function () {
  'use strict';

  /** localStorage keys */
  const HISTORY_KEY = 'nn-search-history';
  const POPULAR_HIDDEN_KEY = 'nn-popular-search-hidden';

  /** How many past searches to keep */
  const HISTORY_MAX = 10;

  /** Wait this long (ms) after the last keystroke before searching */
  const DEBOUNCE_MS = 300;

  /* ---------- Safe localStorage helpers (storage can be blocked) ---------- */

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Not remembered, but the search still works */
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  }

  class PredictiveSearch {
    /**
     * @param {HTMLElement} root - Element with [data-predictive-search]
     */
    constructor(root) {
      this.root = root;

      // Settings from the data-* attributes (theme editor values)
      this.url = root.dataset.url;
      this.sectionId = root.dataset.sectionId;
      this.minChars = parseInt(root.dataset.minChars, 10) || 3;
      this.limit = parseInt(root.dataset.limit, 10) || 8;
      this.types = root.dataset.types || 'product';
      this.historyEnabled = root.dataset.history === 'true';

      // Translated text (data-text-* in header-search.liquid ← locales/<language>.json).
      // No text is hard-coded here, so every language works.
      this.text = {
        showPopular: root.dataset.textShowPopular || '',
        hidePopular: root.dataset.textHidePopular || '',
        unavailable: root.dataset.textUnavailable || '',
      };

      // Elements
      this.form = root.querySelector('[data-search-form]');
      this.input = root.querySelector('[data-search-input]');
      this.popup = root.querySelector('[data-search-popup]');
      this.overlay = root.querySelector('.search-popup__overlay');
      this.results = root.querySelector('[data-search-results]');
      this.hint = root.querySelector('[data-search-hint]');
      this.popularGroup = root.querySelector('[data-popular]');
      this.historyGroup = root.querySelector('[data-history-group]');
      this.historyList = root.querySelector('[data-history-list]');

      // State
      this.cache = new Map(); // search term → results HTML
      this.abortController = null;
      this.debounceTimer = null;

      this.restorePopularState();
      this.bindEvents();
    }

    /* ======================================================================
       Events
       ====================================================================== */

    bindEvents() {
      // Focus or click the search bar → open the popup
      this.input.addEventListener('focus', () => this.open());
      this.input.addEventListener('click', () => this.open());

      // Typing → search (after a short pause)
      this.input.addEventListener('input', () => {
        window.clearTimeout(this.debounceTimer);
        this.debounceTimer = window.setTimeout(() => this.onInput(), DEBOUNCE_MS);
      });

      // Enter → full search page; remember the term first.
      // Empty search → stay here instead of loading an empty results page.
      this.form.addEventListener('submit', (event) => {
        const term = this.getTerm();
        if (!term) {
          event.preventDefault();
          return;
        }
        this.addToHistory(term);
      });

      // Clicks inside the search area (one listener, event delegation)
      this.root.addEventListener('click', (event) => {
        // ×  or overlay → close
        if (event.target.closest('[data-search-close]')) {
          this.close();
          return;
        }

        // Popular / history chip → put the term in the search bar and search
        const chip = event.target.closest('[data-search-term]');
        if (chip) {
          event.preventDefault();
          this.input.value = chip.dataset.searchTerm;
          this.input.focus();
          this.onInput();
          return;
        }

        // Eye button → hide/show popular searches
        if (event.target.closest('[data-popular-toggle]')) {
          this.togglePopular();
          return;
        }

        // Trash button → clear history
        if (event.target.closest('[data-history-clear]')) {
          this.clearHistory();
          return;
        }

        // Products / Categories tab
        const tab = event.target.closest('[data-tab]');
        if (tab) {
          this.selectTab(tab);
          return;
        }

        // A result or "Show all results" → the shopper found what they wanted: remember the term
        if (event.target.closest('.search-popup__results a')) {
          this.addToHistory(this.getTerm());
        }
      });

      // Keyboard: Escape closes; arrow keys move between tabs
      this.root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isOpen()) {
          event.preventDefault();
          this.close();
          this.input.focus();
          return;
        }

        const tab = event.target.closest('[data-tab]');
        if (tab && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
          const tabs = Array.from(this.root.querySelectorAll('[data-tab]'));
          const step = event.key === 'ArrowRight' ? 1 : -1;
          const next = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length];
          this.selectTab(next);
          next.focus();
        }
      });

      // Focus moved outside the search area (e.g. Tab past the popup) → close
      this.root.addEventListener('focusout', (event) => {
        if (event.relatedTarget && !this.root.contains(event.relatedTarget)) this.close();
      });

      // Keep the popup attached to the search bar and fitted to the screen
      window.addEventListener('resize', () => {
        if (this.isOpen()) this.positionPopup();
      });
    }

    /* ======================================================================
       Open / close
       ====================================================================== */

    /** @returns {boolean} */
    isOpen() {
      return this.root.classList.contains('is-open');
    }

    open() {
      if (this.isOpen()) return;

      this.renderHistory();
      this.updateHint();
      this.popup.hidden = false;
      this.overlay.hidden = false;
      this.root.classList.add('is-open');
      this.input.setAttribute('aria-expanded', 'true');
      document.body.classList.add('overflow-hidden'); // page doesn't scroll behind the popup
      this.positionPopup();

      // Re-opening with a term already typed → show its results again
      if (this.getTerm().length >= this.minChars) this.onInput();
    }

    close() {
      if (!this.isOpen()) return;

      if (this.abortController) this.abortController.abort();
      window.clearTimeout(this.debounceTimer);

      this.popup.hidden = true;
      this.overlay.hidden = true;
      this.root.classList.remove('is-open', 'is-loading');
      this.input.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    }

    /**
     * Places the popup directly under the search bar (no gap) and limits its
     * height to the space left down to the bottom of the screen, so it fills
     * the screen and scrolls inside.
     *
     * The popup is absolutely positioned against .site-header__main (so it can
     * span the full header width); the search bar is vertically centered in
     * that row, so its bottom edge is measured rather than assumed.
     */
    positionPopup() {
      const formBottom = this.form.getBoundingClientRect().bottom;
      const container = this.popup.offsetParent;

      if (container) {
        const offsetTop = formBottom - container.getBoundingClientRect().top;
        this.popup.style.top = `${offsetTop}px`;
      }

      const available = Math.max(window.innerHeight - formBottom, 200);
      this.root.style.setProperty('--search-popup-max-height', `${available}px`);
    }

    /* ======================================================================
       Searching
       ====================================================================== */

    /** @returns {string} The trimmed text in the search bar */
    getTerm() {
      return this.input.value.trim();
    }

    /** Shows "Type at least N characters" only while the term is too short */
    updateHint() {
      if (this.hint) this.hint.hidden = this.getTerm().length >= this.minChars;
    }

    /** Runs after the shopper pauses typing */
    onInput() {
      const term = this.getTerm();
      this.open();
      this.updateHint();

      // Too short → clear old results and wait for more characters
      if (term.length < this.minChars) {
        if (this.abortController) this.abortController.abort();
        this.results.innerHTML = '';
        this.root.classList.remove('is-loading');
        return;
      }

      this.fetchResults(term);
    }

    /**
     * Fetches results from Shopify's Predictive Search API and shows them.
     * @param {string} term
     */
    async fetchResults(term) {
      // Already searched this term → show the saved results instantly
      const cacheKey = term.toLowerCase();
      if (this.cache.has(cacheKey)) {
        this.showResults(this.cache.get(cacheKey));
        return;
      }

      // Cancel an older request still running (shopper kept typing)
      if (this.abortController) this.abortController.abort();
      const controller = new AbortController();
      this.abortController = controller;

      // /search/suggest?q=…&resources[…]=…&section_id=header-search-results
      const params = new URLSearchParams({
        q: term,
        'resources[type]': this.types,
        'resources[limit]': String(this.limit),
        'resources[limit_scope]': 'each', // limit applies to products and collections separately
        'resources[options][unavailable_products]': 'last', // sold-out products go to the end
        'resources[options][fields]': 'title,product_type,variants.title,vendor,tag',
        section_id: this.sectionId,
      });

      this.root.classList.add('is-loading');

      try {
        const response = await fetch(`${this.url}?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        // Shopify returns the whole section; keep only the results markup
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const resultsElement = doc.querySelector('[data-predictive-search-results]');
        const resultsHtml = resultsElement ? resultsElement.outerHTML : '';

        this.cache.set(cacheKey, resultsHtml);

        // Only show it if the shopper hasn't changed the term meanwhile
        if (this.getTerm().toLowerCase() === cacheKey) this.showResults(resultsHtml);
      } catch (error) {
        if (error.name === 'AbortError') return; // replaced by a newer search
        // Built with textContent so the translated text is never parsed as HTML
        const message = document.createElement('p');
        message.className = 'predictive-search__empty';
        message.textContent = this.text.unavailable;
        this.results.replaceChildren(message);
      } finally {
        if (this.abortController === controller) this.root.classList.remove('is-loading');
      }
    }

    /**
     * Inserts the results HTML into the popup.
     * @param {string} html
     */
    showResults(html) {
      this.root.classList.remove('is-loading');
      if (this.isOpen()) this.results.innerHTML = html;
    }

    /* ======================================================================
       Tabs (Products / Categories)
       ====================================================================== */

    /**
     * Shows the panel for the given tab and hides the others.
     * @param {HTMLElement} selectedTab - Element with [data-tab]
     */
    selectTab(selectedTab) {
      this.results.querySelectorAll('[data-tab]').forEach((tab) => {
        const selected = tab === selectedTab;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;

        const panel = this.results.querySelector(`[data-panel="${tab.dataset.tab}"]`);
        if (panel) panel.hidden = !selected;
      });
    }

    /* ======================================================================
       Popular searches (eye button)
       ====================================================================== */

    /** Applies the remembered hidden/shown state on page load */
    restorePopularState() {
      if (this.popularGroup && storageGet(POPULAR_HIDDEN_KEY) === 'true') {
        this.setPopularCollapsed(true);
      }
    }

    togglePopular() {
      const collapsed = !this.popularGroup.classList.contains('is-collapsed');
      this.setPopularCollapsed(collapsed);
      storageSet(POPULAR_HIDDEN_KEY, String(collapsed));
    }

    /** @param {boolean} collapsed */
    setPopularCollapsed(collapsed) {
      this.popularGroup.classList.toggle('is-collapsed', collapsed);
      const button = this.popularGroup.querySelector('[data-popular-toggle]');
      button.setAttribute('aria-pressed', String(collapsed));
      button.setAttribute('aria-label', collapsed ? this.text.showPopular : this.text.hidePopular);
    }

    /* ======================================================================
       Search history
       ====================================================================== */

    /** @returns {string[]} Saved terms, newest first */
    getHistory() {
      try {
        const saved = JSON.parse(storageGet(HISTORY_KEY) || '[]');
        return Array.isArray(saved) ? saved : [];
      } catch (error) {
        return []; // corrupted value → start fresh
      }
    }

    /**
     * Saves a term at the front of the history (no duplicates, max HISTORY_MAX).
     * @param {string} term
     */
    addToHistory(term) {
      if (!this.historyEnabled || term.length < this.minChars) return;

      const lower = term.toLowerCase();
      const history = this.getHistory().filter((item) => item.toLowerCase() !== lower);
      history.unshift(term);
      storageSet(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)));
    }

    clearHistory() {
      storageRemove(HISTORY_KEY);
      this.renderHistory();
      this.input.focus();
    }

    /** Builds the history chips (hidden when there is no history) */
    renderHistory() {
      if (!this.historyGroup || !this.historyList) return;

      const history = this.getHistory();
      this.historyList.innerHTML = '';

      history.forEach((term) => {
        // Built with textContent (not innerHTML) so saved text can't inject HTML
        const item = document.createElement('li');
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'search-popup__chip';
        chip.dataset.searchTerm = term;
        chip.textContent = term;
        item.appendChild(chip);
        this.historyList.appendChild(item);
      });

      this.historyGroup.hidden = history.length === 0;
    }
  }

  /* ==========================================================================
     Setup
     ========================================================================== */

  /**
   * Creates a PredictiveSearch for every search inside `scope` not set up yet.
   * @param {ParentNode} scope
   */
  function init(scope) {
    scope.querySelectorAll('[data-predictive-search]').forEach((root) => {
      if (!root.predictiveSearch) root.predictiveSearch = new PredictiveSearch(root);
    });
  }

  init(document);

  // Theme editor: header re-rendered after a setting change → set it up again
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
