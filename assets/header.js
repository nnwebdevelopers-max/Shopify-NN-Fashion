/**
 * ============================================================================
 * header.js — Header area behaviour
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (every page, with "defer")
 * Works with:
 *   sections/header-top-bar.liquid    → announcement rotation + close button
 *   snippets/header-localization-form.liquid → submit on currency/language change
 *   snippets/header-drawer.liquid     → mobile menu drawer
 *   sections/header.liquid            → ☰ button that opens the drawer
 *
 * The search popup has its own file: assets/header-search.js
 * Desktop dropdown menus need no JS (CSS :hover / :focus-within).
 * ============================================================================
 */

(function () {
  'use strict';

  /** localStorage key that remembers a closed top bar announcement */
  const DISMISS_STORAGE_KEY = 'nn-top-bar-dismissed';

  /** Width (px) where the desktop layout starts — matches header.css */
  const DESKTOP_MIN_WIDTH = 990;

  /* ==========================================================================
     Safe localStorage helpers
     (localStorage can throw in private browsing or when storage is blocked)
     ========================================================================== */

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
      /* Storage unavailable: the choice just isn't remembered */
    }
  }

  /* ==========================================================================
     1. Top bar: rotating announcements + close button
     ========================================================================== */

  /**
   * Sets up one top bar.
   * @param {HTMLElement} bar - Element with [data-top-bar]
   */
  function initTopBar(bar) {
    if (bar.dataset.ready) return; // already set up
    bar.dataset.ready = 'true';

    // Hide straight away if the shopper closed these same announcements before
    // (the key changes when the merchant edits the text)
    const dismissKey = bar.dataset.dismissKey;
    if (dismissKey && storageGet(DISMISS_STORAGE_KEY) === dismissKey) {
      bar.classList.add('is-dismissed');
    }

    // Close (×) button
    const closeButton = bar.querySelector('[data-top-bar-close]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        bar.classList.add('is-dismissed');
        storageSet(DISMISS_STORAGE_KEY, dismissKey);
      });
    }

    // Rotation: only with 2+ messages and the "Rotate announcements" setting on
    const messages = bar.querySelectorAll('.top-bar__message');
    if (messages.length < 2 || bar.dataset.autoplay !== 'true') return;

    let index = 0;
    let paused = false;

    // Pause while the shopper hovers or focuses the bar (time to read/click)
    bar.addEventListener('mouseenter', () => { paused = true; });
    bar.addEventListener('mouseleave', () => { paused = false; });
    bar.addEventListener('focusin', () => { paused = true; });
    bar.addEventListener('focusout', () => { paused = false; });

    window.setInterval(() => {
      if (paused) return;
      messages[index].classList.remove('is-active');
      index = (index + 1) % messages.length;
      messages[index].classList.add('is-active');
    }, parseInt(bar.dataset.speed, 10) || 5000);
  }

  /* ==========================================================================
     2. Currency / language selectors: submit as soon as a value changes
     ========================================================================== */

  // One listener for every localization form on the page (event delegation)
  document.addEventListener('change', (event) => {
    const select = event.target.closest('.localization select');
    if (select) select.form.submit();
  });

  /* ==========================================================================
     3. Mobile menu drawer
     ========================================================================== */

  /**
   * Sets up the drawer inside one header.
   * @param {HTMLElement} header - Element with [data-header]
   */
  function initDrawer(header) {
    if (header.dataset.ready) return;
    header.dataset.ready = 'true';

    const drawer = header.querySelector('[data-drawer]');
    const openButton = header.querySelector('[data-drawer-open]');
    if (!drawer || !openButton) return;

    const panel = drawer.querySelector('.drawer__panel');

    /**
     * Opens or closes the drawer.
     * @param {boolean} open
     */
    function toggle(open) {
      drawer.classList.toggle('is-open', open);
      drawer.inert = !open; // closed drawer can't be reached with Tab
      openButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('overflow-hidden', open);

      // Focus moves into the drawer, then back to the ☰ button on close
      if (open) {
        panel.focus();
      } else {
        openButton.focus();
      }
    }

    openButton.addEventListener('click', () => toggle(true));

    // Close button and overlay both carry [data-drawer-close]
    drawer.addEventListener('click', (event) => {
      if (event.target.closest('[data-drawer-close]')) toggle(false);
    });

    // Escape closes it
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) toggle(false);
    });

    // Resized to desktop while open → close it (the drawer is mobile-only)
    window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).addEventListener('change', (event) => {
      if (event.matches && drawer.classList.contains('is-open')) toggle(false);
    });
  }

  /* ==========================================================================
     Setup
     ========================================================================== */

  /**
   * Sets up every top bar and header inside `scope`.
   * @param {ParentNode} scope
   */
  function init(scope) {
    scope.querySelectorAll('[data-top-bar]').forEach(initTopBar);
    scope.querySelectorAll('[data-header]').forEach(initDrawer);
  }

  init(document);

  // Theme editor: a section is re-rendered after a setting change → set it up again
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
