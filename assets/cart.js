/**
 * ============================================================================
 * cart.js — Cart page
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (only on the cart template, with "defer")
 * Works with: sections/cart-main.liquid, snippets/cart-tools.liquid
 * Needs:      window.NNCards from assets/global-product-card.js,
 *             Shopify.CountryProvinceSelector from shopify_common.js
 *             (loaded by cart-main.liquid when the shipping estimate is on)
 *
 * What it does (without JS the page still works as a normal form):
 *  1. Quantity − / + buttons and typed quantities, and the remove (trash)
 *     links, update the cart instantly through /cart/change.js.
 *  2. The same request asks Shopify for this section's new HTML (bundled
 *     Section Rendering: "sections" parameter), which replaces the cart
 *     markup — prices, discounts and subtotal always come from Shopify.
 *  3. The header cart count / total refresh (NNCards.refreshCart).
 *  4. Discount codes: Apply / ✕ send the new list of codes to
 *     /cart/update.js ({ discount: "A,B" }) and re-render the cart. A code
 *     Shopify can't use for this cart is reported under the field.
 *  5. Shipping estimate: country / state / ZIP → Shopify's shipping rates
 *     (prepare_shipping_rates.json, then async_shipping_rates.json, which
 *     answers 202 "still calculating" until the rates are ready).
 *  6. Order note: saves while typing (/cart/update.js), "Note saved" hint.
 *  6b. Bulk delete: a checkbox per item + "Select all"; "Delete selected (n)"
 *     is disabled until something is checked, then removes all checked
 *     lines in one /cart/update.js request ({ updates: { <line key>: 0 } }).
 *     Checked items stay checked when the cart re-renders.
 *  7. Errors (e.g. "only 3 left") show under the checkout button.
 * Requests run one after another so fast clicks can't overtake each other.
 * After each re-render the panels keep their open/closed state, typed
 * values and shipping results.
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
    const root = document.querySelector('[data-cart]');
    if (!root) return;

    const cards = window.NNCards;
    const urls = cards.data;
    const sectionId = root.dataset.sectionId;
    const status = root.querySelector('[data-cart-status]');

    /** Tells the CSS that JS is running (hides "Update cart", shows the JS-only panels) */
    root.classList.add('is-js');

    /** Each update waits for the previous one */
    let queue = Promise.resolve();

    /* ==========================================================================
       Cart updates (shared by quantities and discount codes)
       ========================================================================== */

    /**
     * Sends one cart request, asks for this section's new HTML in the same
     * request and swaps it in. Queued after earlier updates.
     * @param {string} url - /cart/change.js or /cart/update.js
     * @param {object} body - request JSON (without the sections fields)
     * @returns {Promise<object|null>} the cart JSON, or null after an error
     */
    function runUpdate(url, body) {
      const job = queue.then(async () => {
        root.classList.add('is-updating');
        status.textContent = status.dataset.textUpdating;
        let errorMessage = '';
        let result = null;

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ ...body, sections: [sectionId], sections_url: window.location.pathname }),
          });
          const json = await response.json();

          if (!response.ok) {
            // e.g. 422 "You can only add 3 of this item to your cart."
            errorMessage = json.description || json.message || status.dataset.textError;
            await rerender(); // show the cart as it really is
          } else {
            result = json;
            if (json.sections && json.sections[sectionId]) replaceSection(json.sections[sectionId]);
            else await rerender();
          }
          await cards.refreshCart();
        } catch (error) {
          errorMessage = status.dataset.textError;
        } finally {
          root.classList.remove('is-updating');
          status.textContent = '';
          showError(errorMessage);
        }
        return result;
      });
      queue = job.catch(() => null);
      return job;
    }

    /**
     * Changes one line's quantity (0 removes it).
     * @param {number} line - 1-based line number
     * @param {number} quantity
     */
    function changeLine(line, quantity) {
      return runUpdate(urls.cartChangeUrl, { line, quantity });
    }

    /** Fetches the section again (fallback when the bundled HTML is missing) */
    async function rerender() {
      const response = await fetch(`${urls.cartPageUrl}?section_id=${encodeURIComponent(sectionId)}`);
      if (response.ok) replaceSection(await response.text());
    }

    /**
     * Swaps in the new cart markup. Keeps what the new HTML would reset:
     * keyboard focus, open panels, typed values (discount field, shipping
     * address) and the shipping results (recalculated for the new cart).
     * @param {string} html - the section's HTML from Shopify
     */
    function replaceSection(html) {
      const focused = document.activeElement;
      const focusedId = focused && root.contains(focused) ? focused.id : '';

      // Remember panel state
      const openTools = Array.from(root.querySelectorAll('[data-cart-tool]')).map((tool) => [tool.dataset.cartTool, tool.open]);
      const values = {};
      root.querySelectorAll('[data-discount-input], [data-shipping-country], [data-shipping-province], [data-shipping-zip]').forEach((field) => {
        values[field.id] = field.value;
      });
      const resultsBox = root.querySelector('[data-shipping-results]');
      const hadRates = resultsBox && !resultsBox.hidden;
      const selectedKeys = selectedLines().map((row) => row.dataset.cartKey);
      const discountMessage = root.querySelector('[data-discount-message]');
      const message = discountMessage && !discountMessage.hidden
        ? { text: discountMessage.textContent, error: discountMessage.classList.contains('is-error') }
        : null;

      // Swap
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = doc.querySelector('[data-cart-section]');
      const current = root.querySelector('[data-cart-section]');
      if (fresh && current) current.innerHTML = fresh.innerHTML;

      // Restore panel state
      openTools.forEach(([name, open]) => {
        const tool = root.querySelector(`[data-cart-tool="${name}"]`);
        if (tool && open) tool.open = true;
      });
      Object.entries(values).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (!field) return;
        field.value = value;
        // The country/state helper picks its starting values from data-default
        if (field.tagName === 'SELECT') field.dataset.default = value;
      });
      // Items still in the cart stay checked
      root.querySelectorAll('[data-cart-key]').forEach((row) => {
        const box = row.querySelector('[data-cart-select]');
        if (box && selectedKeys.includes(row.dataset.cartKey)) box.checked = true;
      });
      updateBulk();
      initCountrySelect();
      if (message) showDiscountMessage(message.text, message.error);
      if (hadRates) estimateShipping(); // rates depend on the cart: refresh them

      if (focusedId) {
        const again = document.getElementById(focusedId);
        if (again) again.focus({ preventScroll: true });
      }
    }

    /** Shows (or clears) the error message under Check out */
    function showError(message) {
      const box = root.querySelector('[data-cart-error]');
      if (!box) {
        if (message) cards.showToast(message, true);
        return;
      }
      box.textContent = message;
      box.hidden = !message;
    }

    /** Line number of the row an element belongs to */
    function lineOf(element) {
      const row = element.closest('[data-cart-line]');
      return row ? Number(row.dataset.cartLine) : 0;
    }

    /* ==========================================================================
       Bulk delete (checkbox per item, Select all, Delete selected)
       ========================================================================== */

    /** Rows whose checkbox is checked */
    function selectedLines() {
      return Array.from(root.querySelectorAll('[data-cart-key]')).filter((row) => {
        const box = row.querySelector('[data-cart-select]');
        return box && box.checked;
      });
    }

    /**
     * Button enabled only with something checked, label "Delete selected (2)";
     * "Select all" checked when all are, half-checked when some are.
     */
    function updateBulk() {
      const button = root.querySelector('[data-cart-delete-selected]');
      if (!button) return;
      const boxes = root.querySelectorAll('[data-cart-select]');
      const count = selectedLines().length;
      button.disabled = count === 0;
      button.querySelector('[data-cart-delete-label]').textContent = count
        ? cards.fill(button.dataset.textLabelCount, 'number', count)
        : button.dataset.textLabel;
      const all = root.querySelector('[data-cart-select-all]');
      if (all) {
        all.checked = count > 0 && count === boxes.length;
        all.indeterminate = count > 0 && count < boxes.length;
      }
    }

    /** Removes every checked line in one request ({ updates: { key: 0, … } }) */
    function deleteSelected() {
      const updates = {};
      selectedLines().forEach((row) => { updates[row.dataset.cartKey] = 0; });
      if (!Object.keys(updates).length) return;
      runUpdate(urls.cartUpdateUrl, { updates });
    }

    /* ==========================================================================
       Discount codes
       ========================================================================== */

    /** Codes currently on the cart (from the rendered list) */
    function currentCodes() {
      return Array.from(root.querySelectorAll('[data-discount-code]')).map((item) => item.dataset.discountCode);
    }

    /**
     * Message under the discount field.
     * @param {string} text - empty hides it
     * @param {boolean} [isError]
     */
    function showDiscountMessage(text, isError = false) {
      const box = root.querySelector('[data-discount-message]');
      if (!box) return;
      box.textContent = text;
      box.hidden = !text;
      box.classList.toggle('is-error', isError);
    }

    /** Apply: adds the typed code to the cart's codes */
    async function applyDiscount() {
      const panel = root.querySelector('[data-discount]');
      const input = root.querySelector('[data-discount-input]');
      const code = input.value.trim();
      if (!code) {
        showDiscountMessage(panel.dataset.textEmpty, true);
        input.focus();
        return;
      }
      const codes = currentCodes().filter((existing) => existing.toLowerCase() !== code.toLowerCase());
      codes.push(code);

      const cart = await runUpdate(urls.cartUpdateUrl, { discount: codes.join(',') });
      const texts = root.querySelector('[data-discount]') || panel; // fresh panel after re-render
      if (!cart) {
        showDiscountMessage(texts.dataset.textError, true);
        return;
      }
      // Did Shopify accept it for this cart?
      const added = (cart.discount_codes || []).find((item) => item.code.toLowerCase() === code.toLowerCase());
      if (added && added.applicable) {
        const field = root.querySelector('[data-discount-input]');
        if (field) field.value = '';
        showDiscountMessage(cards.fill(texts.dataset.textApplied, 'code', added.code));
      } else {
        showDiscountMessage(cards.fill(texts.dataset.textInvalid, 'code', code), true);
      }
    }

    /** ✕ on a code: sends the list without it ("" removes the last one) */
    async function removeDiscount(code) {
      const codes = currentCodes().filter((existing) => existing !== code);
      showDiscountMessage('');
      await runUpdate(urls.cartUpdateUrl, { discount: codes.join(',') });
    }

    /* ==========================================================================
       Shipping estimate
       ========================================================================== */

    /** Sets up the country → state list (Shopify's helper) once it exists */
    function initCountrySelect() {
      const country = root.querySelector('[data-shipping-country]');
      if (!country || country.dataset.ready) return;
      if (!window.Shopify || typeof window.Shopify.CountryProvinceSelector !== 'function') return;
      country.dataset.ready = 'true';
      // eslint-disable-next-line no-new
      new window.Shopify.CountryProvinceSelector('CartShippingCountry', 'CartShippingProvince', {
        hideElement: 'CartShippingProvinceWrap',
      });
    }
    // shopify_common.js loads after this file (it's in the page body): wait for it
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCountrySelect);
    else initCountrySelect();

    let estimateId = 0;

    /** Asks Shopify for shipping rates for the entered address and lists them */
    async function estimateShipping() {
      const panel = root.querySelector('[data-shipping]');
      if (!panel) return;
      const results = panel.querySelector('[data-shipping-results]');
      const button = panel.querySelector('[data-shipping-calculate]');
      const provinceWrap = document.getElementById('CartShippingProvinceWrap');
      const province = panel.querySelector('[data-shipping-province]');

      const params = new URLSearchParams();
      params.set('shipping_address[country]', panel.querySelector('[data-shipping-country]').value);
      params.set('shipping_address[province]', provinceWrap && provinceWrap.style.display === 'none' ? '' : province.value);
      params.set('shipping_address[zip]', panel.querySelector('[data-shipping-zip]').value.trim());

      const id = ++estimateId; // a newer request wins
      button.disabled = true;
      button.classList.add('is-loading');
      results.hidden = false;
      results.classList.remove('is-error');
      results.replaceChildren(textNode('p', panel.dataset.textCalculating, 'cart-tool__hint'));

      try {
        // 1. Start the calculation
        const prepare = await fetch(`${panel.dataset.prepareUrl}?${params}`, { method: 'POST', headers: { Accept: 'application/json' } });
        if (!prepare.ok && prepare.status !== 422) throw new Error('prepare failed');
        if (prepare.status === 422) {
          renderShippingError(results, await prepare.json(), panel.dataset.textError);
          return;
        }
        // 2. Poll until Shopify has the rates (202 = still working)
        let rates = null;
        for (let attempt = 0; attempt < 15 && !rates; attempt += 1) {
          const response = await fetch(`${panel.dataset.ratesUrl}?${params}`, { headers: { Accept: 'application/json' } });
          if (id !== estimateId) return;
          if (response.status === 200) {
            const json = await response.json();
            if (json && json.shipping_rates) rates = json.shipping_rates;
            else if (json === null) await wait(500); // some stores answer 200 + null while working
          } else if (response.status === 202) {
            await wait(500);
          } else if (response.status === 422) {
            renderShippingError(results, await response.json(), panel.dataset.textError);
            return;
          } else {
            throw new Error(`rates ${response.status}`);
          }
        }
        if (!rates) throw new Error('no answer');
        if (id === estimateId) renderRates(results, rates, panel);
      } catch (error) {
        if (id !== estimateId) return;
        results.classList.add('is-error');
        results.replaceChildren(textNode('p', panel.dataset.textError));
      } finally {
        if (id === estimateId) {
          button.disabled = false;
          button.classList.remove('is-loading');
        }
      }
    }

    /** Lists the rates: "Standard ........ $4.99" (Free for 0) */
    function renderRates(results, rates, panel) {
      if (!rates.length) {
        results.classList.add('is-error');
        results.replaceChildren(textNode('p', panel.dataset.textNone));
        return;
      }
      const heading = rates.length === 1
        ? panel.dataset.textResultsOne
        : cards.fill(panel.dataset.textResultsOther, 'number', rates.length);
      const list = document.createElement('ul');
      list.className = 'cart-tool__rates';
      list.setAttribute('role', 'list');
      rates.forEach((rate) => {
        const cents = Math.round(parseFloat(rate.price) * 100);
        const item = document.createElement('li');
        item.append(
          textNode('span', rate.presentment_name || rate.name),
          textNode('span', cents === 0 ? panel.dataset.textFree : cards.formatMoney(cents), 'cart-tool__rate-price')
        );
        list.appendChild(item);
      });
      results.replaceChildren(textNode('p', heading, 'cart-tool__rates-title'), list);
    }

    /**
     * Shopify's address errors, e.g. { zip: ["is not valid for India"] }
     * → "Zip is not valid for India" (Shopify's own wording, translated by Shopify).
     */
    function renderShippingError(results, errors, fallback) {
      const messages = [];
      Object.entries(errors || {}).forEach(([field, list]) => {
        (Array.isArray(list) ? list : [list]).forEach((text) => {
          const name = field.charAt(0).toUpperCase() + field.slice(1);
          messages.push(`${name} ${text}`);
        });
      });
      results.hidden = false;
      results.classList.add('is-error');
      results.replaceChildren(textNode('p', messages.join(' · ') || fallback));
    }

    /** Small helpers */
    function textNode(tag, text, className) {
      const node = document.createElement(tag);
      node.textContent = text;
      if (className) node.className = className;
      return node;
    }
    function wait(ms) {
      return new Promise((resolve) => { window.setTimeout(resolve, ms); });
    }

    /* ==========================================================================
       Events (delegated: the markup is replaced after each update)
       ========================================================================== */

    root.addEventListener('click', (event) => {
      // − / +
      const step = event.target.closest('[data-cart-step]');
      if (step) {
        const input = step.parentElement.querySelector('[data-cart-qty]');
        const next = Math.max(0, Number(input.value || 0) + Number(step.dataset.cartStep));
        input.value = next;
        changeLine(lineOf(step), next);
        return;
      }
      // Remove (trash)
      const remove = event.target.closest('[data-cart-remove]');
      if (remove) {
        event.preventDefault();
        changeLine(lineOf(remove), 0);
        return;
      }
      // Delete selected
      if (event.target.closest('[data-cart-delete-selected]')) {
        deleteSelected();
        return;
      }
      // Discount: Apply / ✕
      if (event.target.closest('[data-discount-apply]')) {
        applyDiscount();
        return;
      }
      const removeCode = event.target.closest('[data-discount-remove]');
      if (removeCode) {
        removeDiscount(removeCode.dataset.discountRemove);
        return;
      }
      // Shipping: Calculate
      if (event.target.closest('[data-shipping-calculate]')) estimateShipping();
    });

    // Typed quantity: apply when the field changes (blur / Enter)
    root.addEventListener('change', (event) => {
      // Checkboxes: Select all ticks / unticks every item
      if (event.target.closest('[data-cart-select-all]')) {
        root.querySelectorAll('[data-cart-select]').forEach((box) => { box.checked = event.target.checked; });
        updateBulk();
        return;
      }
      if (event.target.closest('[data-cart-select]')) {
        updateBulk();
        return;
      }

      const input = event.target.closest('[data-cart-qty]');
      if (!input) return;
      const quantity = Math.max(0, parseInt(input.value, 10) || 0);
      changeLine(lineOf(input), quantity);
    });

    // Enter: apply the quantity / discount / estimate instead of submitting the cart form
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      if (event.target.closest('[data-cart-qty]')) {
        event.preventDefault();
        event.target.blur();
      } else if (event.target.closest('[data-discount-input]')) {
        event.preventDefault();
        applyDiscount();
      } else if (event.target.closest('[data-shipping-zip]')) {
        event.preventDefault();
        estimateShipping();
      }
    });

    // Order note: save shortly after the shopper stops typing
    let noteTimer;
    root.addEventListener('input', (event) => {
      const note = event.target.closest('[data-cart-note]');
      if (!note) return;
      const noteStatus = root.querySelector('[data-note-status]');
      if (noteStatus) noteStatus.textContent = '';
      window.clearTimeout(noteTimer);
      noteTimer = window.setTimeout(() => {
        fetch(urls.cartUpdateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ note: note.value }),
        })
          .then((response) => {
            const statusNow = root.querySelector('[data-note-status]');
            if (response.ok && statusNow) statusNow.textContent = statusNow.dataset.textSaved;
          })
          .catch(() => { /* the note is also sent with the checkout form */ });
      }, 600);
    });

    // Browsers can restore ticked boxes on back/forward: match the button to them
    updateBulk();

    // Something was added from a product card on this page → refresh the list
    document.addEventListener('cart:updated', (event) => {
      if (!root.classList.contains('is-updating') && event.detail && event.detail.cart) {
        const lines = root.querySelectorAll('[data-cart-line]').length;
        if (lines !== event.detail.cart.items.length) rerender();
      }
    });
  });
})();
