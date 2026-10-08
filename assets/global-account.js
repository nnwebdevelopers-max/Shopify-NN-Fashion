/**
 * ============================================================================
 * global-account.js — Sign-in card + sign-in popup
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (with "defer"), when the shopper is signed
 *            out or on a customer account template
 * Works with:
 *   snippets/global-account-forms.liquid → the card ([data-account-card])
 *   snippets/global-account-field.liquid → password show/hide buttons
 *   snippets/global-account-popup.liquid → the popup ([data-account-popup])
 *
 * What it does:
 *  1. Views: switches a card between login / register / recover without a
 *     reload (tabs [data-account-tab], links [data-account-switch]); the URL
 *     hash (#recover, #register) picks the starting view.
 *  2. Tabs: ←/→ keys move between "Sign in" and "Create account".
 *  3. Password fields: show/hide button ([data-password-toggle]).
 *  4. Forms: a spinner on the button while the form is sending.
 *  5. Popup: window.NNAccount.open(view, { message, returnTo }) / close().
 *     Opened by any element with data-account-open="login|register"
 *     (optional data-account-message, data-account-return), and on load
 *     when the page has [data-account-autoopen] (wishlist page, signed out).
 *     Escape / ✕ / backdrop close it; Tab stays inside it.
 *     "nnaccount:ready" fires on document once window.NNAccount exists.
 *
 * All visible text comes from Liquid (locales), none is written here.
 * ============================================================================
 */

(function () {
  'use strict';

  const VIEWS = ['login', 'register', 'recover'];

  /* ==========================================================================
     1–2. Card views and tabs
     ========================================================================== */

  /**
   * Shows one view of a card and updates the tabs.
   * @param {HTMLElement} card - [data-account-card]
   * @param {'login'|'register'|'recover'} view
   * @param {boolean} [focus] - move focus to the first field of the view
   */
  function setView(card, view, focus = false) {
    if (!VIEWS.includes(view) || !card.querySelector(`[data-account-view="${view}"]`)) return;
    card.dataset.view = view;
    card.querySelectorAll('[data-account-view]').forEach((panel) => {
      panel.hidden = panel.dataset.accountView !== view;
    });
    card.querySelectorAll('[data-account-tab]').forEach((tab) => {
      const selected = tab.dataset.accountTab === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected || (view === 'recover' && tab.dataset.accountTab === 'login') ? 0 : -1;
    });
    if (focus) {
      const field = card.querySelector(`[data-account-view="${view}"] input:not([type="hidden"])`);
      if (field) field.focus({ preventScroll: true });
    }
  }

  /** Clicks inside any card: tabs, view links, password toggles */
  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-account-card]');
    if (!card) return;

    const tab = event.target.closest('[data-account-tab]');
    if (tab) {
      setView(card, tab.dataset.accountTab);
      return;
    }

    const switcher = event.target.closest('[data-account-switch]');
    if (switcher) {
      event.preventDefault(); // stay here instead of loading the page in href
      setView(card, switcher.dataset.accountSwitch, true);
      return;
    }

    const toggle = event.target.closest('[data-password-toggle]');
    if (toggle) {
      const input = document.getElementById(toggle.getAttribute('aria-controls'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(show));
      toggle.setAttribute('aria-label', show ? toggle.dataset.textHide : toggle.dataset.textShow);
    }
  });

  /** Arrow keys move between the two tabs (standard tab keyboard pattern) */
  document.addEventListener('keydown', (event) => {
    const tab = event.target.closest && event.target.closest('[data-account-tab]');
    if (!tab || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    const card = tab.closest('[data-account-card]');
    const next = tab.dataset.accountTab === 'login' ? 'register' : 'login';
    event.preventDefault();
    setView(card, next);
    card.querySelector(`[data-account-tab="${next}"]`).focus();
  });

  /** Spinner on the submit button while a form is sending */
  document.addEventListener('submit', (event) => {
    if (!event.target.closest('[data-account-card], [data-account-form]')) return;
    const button = event.target.querySelector('.account-form__submit');
    if (button) button.classList.add('is-loading');
  });
  // Back/forward cache: a page restored from history keeps the spinner → clear it
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('.account-form__submit.is-loading').forEach((button) => button.classList.remove('is-loading'));
  });

  /** Starting view from the URL, e.g. /account/login#recover */
  const hashView = window.location.hash.replace('#', '');
  if (VIEWS.includes(hashView)) {
    document.querySelectorAll('.account-card--page[data-account-card]').forEach((card) => setView(card, hashView));
  }

  /* ==========================================================================
     5. Popup
     ========================================================================== */

  const popup = document.querySelector('[data-account-popup]');
  const dialog = popup ? popup.querySelector('[data-account-dialog]') : null;
  const card = popup ? popup.querySelector('[data-account-card]') : null;
  let trigger = null;
  let closeTimer;

  /**
   * Opens the popup.
   * @param {'login'|'register'} [view]
   * @param {object} [options]
   * @param {string} [options.message]  - note at the top (e.g. why it opened)
   * @param {string} [options.returnTo] - page to come back to after signing in
   *                                      (default: the current page)
   */
  function open(view = 'login', options = {}) {
    if (!popup) return false;
    window.clearTimeout(closeTimer);
    trigger = document.activeElement;

    // Note at the top ("Sign in to save products to your wishlist.")
    const notice = card.querySelector('[data-account-notice]');
    if (notice) {
      notice.querySelector('[data-account-notice-text]').textContent = options.message || '';
      notice.hidden = !options.message;
    }

    // Where Shopify sends the shopper after signing in / creating the account
    const returnTo = options.returnTo || window.location.pathname + window.location.search;
    card.querySelectorAll('[data-account-return]').forEach((input) => { input.value = returnTo; });

    setView(card, view);
    popup.classList.remove('is-closing');
    popup.hidden = false;
    document.body.classList.add('overflow-hidden');

    // Focus the first field (just after showing it, so the opening animation runs)
    window.setTimeout(() => {
      const field = card.querySelector(`[data-account-view="${card.dataset.view}"] input:not([type="hidden"])`);
      (field || dialog).focus({ preventScroll: true });
    }, 30);
    return true;
  }

  /** Closes the popup (short closing animation), focus goes back to the trigger */
  function close() {
    if (!popup || popup.hidden || popup.classList.contains('is-closing')) return;
    popup.classList.add('is-closing');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    closeTimer = window.setTimeout(() => {
      popup.hidden = true;
      popup.classList.remove('is-closing');
      document.body.classList.remove('overflow-hidden');
      if (trigger && document.contains(trigger) && trigger !== document.body) trigger.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 240);
  }

  if (popup) {
    // ✕ and backdrop
    popup.addEventListener('click', (event) => {
      if (event.target.closest('[data-account-close]')) close();
    });

    // Escape closes; Tab / Shift+Tab stay inside the popup
    popup.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        dialog.querySelectorAll('button, [href], input:not([type="hidden"]), [tabindex]:not([tabindex="-1"])')
      ).filter((node) => !node.disabled && node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /**
   * Links / buttons that open the popup instead of loading a page
   * (header account + wishlist links when signed out, wishlist page buttons).
   * Without the popup (e.g. on the account pages) the link works normally.
   */
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-account-open]');
    if (!opener || !popup) return;
    // Ctrl/⌘-click etc. → let the browser open the link in a new tab
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
    event.preventDefault();
    open(opener.dataset.accountOpen, {
      message: opener.dataset.accountMessage,
      returnTo: opener.dataset.accountReturn,
    });
  });

  /** Shared API (used by assets/global-product-card.js for the ♡ button) */
  window.NNAccount = { open, close, setView };
  document.dispatchEvent(new CustomEvent('nnaccount:ready'));

  /** Wishlist page while signed out → open the popup right away */
  const autoOpen = document.querySelector('[data-account-autoopen]');
  if (autoOpen && popup) {
    open(autoOpen.dataset.accountAutoopen || 'login', {
      message: autoOpen.dataset.accountMessage,
      returnTo: autoOpen.dataset.accountReturn,
    });
  }
})();
