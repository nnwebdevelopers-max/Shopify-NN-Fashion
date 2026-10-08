/**
 * ============================================================================
 * customer.js — Account pages (dashboard, order, addresses)
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (customer account templates only, "defer")
 * Works with:
 *   sections/customer-addresses.liquid      → address popups, delete buttons
 *   snippets/customer-address-form.liquid   → country / state selects
 *
 * What it does:
 *  1. Popups: [data-dialog-open="<dialog id>"] opens that <dialog>
 *     (showModal: backdrop, Escape and focus handling are built in);
 *     [data-dialog-close] or a click on the backdrop closes it. A dialog
 *     with data-open-on-load opens right away (its form came back with errors).
 *  2. Delete address: asks for confirmation (text from data-confirm) before
 *     the delete form is sent.
 *  3. Country → state: fills each form's state list for the chosen country
 *     and hides it for countries without states, using Shopify's
 *     Shopify.CountryProvinceSelector (shopify_common.js, loaded by the
 *     addresses section). The saved country/state are pre-selected
 *     (data-default on the selects).
 *
 * No visible text is written here; it all comes from Liquid (locales).
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Dialogs
     ========================================================================== */

  /** @param {HTMLDialogElement} dialog */
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', ''); // very old browsers: shown in place
    document.body.classList.add('overflow-hidden');
  }

  /** @param {HTMLDialogElement} dialog */
  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-dialog-open]');
    if (opener) {
      openDialog(document.getElementById(opener.dataset.dialogOpen));
      return;
    }
    const closer = event.target.closest('[data-dialog-close]');
    if (closer) {
      closeDialog(closer.closest('dialog'));
      return;
    }
    // Click on the backdrop: the event target is the <dialog> itself
    if (event.target.matches && event.target.matches('dialog.customer-dialog')) {
      const box = event.target.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) closeDialog(event.target);
    }
  });

  // Page scroll comes back whenever a dialog closes (button, Escape, backdrop)
  document.querySelectorAll('dialog.customer-dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog.customer-dialog[open]')) document.body.classList.remove('overflow-hidden');
    });
  });

  /* ==========================================================================
     2. Delete confirmation
     ========================================================================== */

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-address-delete]');
    if (form && !window.confirm(form.dataset.confirm)) event.preventDefault();
  });

  /* ==========================================================================
     3. Country → state selects
     ========================================================================== */

  /**
   * Sets up every country select. Runs after all deferred scripts, so
   * shopify_common.js (loaded later in the page) is available.
   */
  function initCountrySelects() {
    if (!window.Shopify || typeof window.Shopify.CountryProvinceSelector !== 'function') {
      console.warn('[NN account] shopify_common.js is missing: state lists will not follow the country.');
      return;
    }
    document.querySelectorAll('[data-address-country]').forEach((select) => {
      if (select.dataset.ready) return;
      select.dataset.ready = 'true';
      // eslint-disable-next-line no-new
      new window.Shopify.CountryProvinceSelector(select.id, select.dataset.provinceId, {
        hideElement: select.dataset.provinceWrap,
      });
    });
  }

  function start() {
    initCountrySelects();
    // A form that came back with errors: reopen its popup
    openDialog(document.querySelector('dialog[data-open-on-load]'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
