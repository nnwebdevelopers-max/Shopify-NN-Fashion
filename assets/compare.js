/**
 * ============================================================================
 * compare.js — Compare page
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (only on the compare page template,
 *            template "page.compare", with "defer")
 * Works with: sections/compare-main.liquid
 * Needs:      window.NNCards from assets/global-product-card.js
 *
 * What it does:
 *  1. Reads the saved handles (localStorage "nn-compare").
 *  2. For each product fetches its card (/products/<handle>?view=card) and
 *     its data (/products/<handle>.js), then builds a table:
 *       header row: card + ✕ remove button per product
 *       rows (chosen in the theme editor): price, availability, brand, type,
 *       one row per option name (Size, Color…), description
 *     Products that no longer exist are removed from the list.
 *  3. Re-builds when the list changes (✕, the ⇄ on a card, another tab).
 *  All text comes from data-text-* attributes (locales → compare.*).
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
    const root = document.querySelector('[data-compare]');
    if (!root) return;

    const cards = window.NNCards;
    const t = root.dataset; // translated texts: textPrice, textInStock, …
    const rows = (root.dataset.rows || '').split(',').filter(Boolean);
    const table = root.querySelector('[data-compare-table]');
    const scroll = root.querySelector('[data-compare-scroll]');
    const loading = root.querySelector('[data-compare-loading]');
    const empty = root.querySelector('[data-compare-empty]');
    const clearButton = root.querySelector('[data-compare-clear]');
    const base = window.Shopify && Shopify.routes ? Shopify.routes.root : '/';

    /** Cache per handle: { card: Element, product: object } */
    const cache = new Map();

    /**
     * Loads one product's card and data.
     * @param {string} handle
     * @returns {Promise<{card: Element, product: object}|null>}
     */
    async function load(handle) {
      if (cache.has(handle)) return cache.get(handle);
      try {
        const url = `${base}products/${encodeURIComponent(handle)}`;
        const [cardResponse, dataResponse] = await Promise.all([fetch(`${url}?view=card`), fetch(`${url}.js`)]);
        if (!cardResponse.ok || !dataResponse.ok) return null;
        const doc = new DOMParser().parseFromString(await cardResponse.text(), 'text/html');
        const card = doc.querySelector('[data-product-card]');
        const product = await dataResponse.json();
        if (!card) return null;
        const entry = { card, product };
        cache.set(handle, entry);
        return entry;
      } catch (error) {
        return null;
      }
    }

    /** Small element helper (text via textContent) */
    function cell(tag, attrs = {}, content = '') {
      const node = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      if (content instanceof Node) node.appendChild(content);
      else node.textContent = content;
      return node;
    }

    /** Plain-text description, ~40 words */
    function shortDescription(html) {
      const div = document.createElement('div');
      div.innerHTML = html || '';
      const words = (div.textContent || '').trim().split(/\s+/).filter(Boolean);
      return words.length > 40 ? `${words.slice(0, 40).join(' ')}…` : words.join(' ');
    }

    /** Option names across all products, in first-seen order (Size, Color…) */
    function optionNames(products) {
      const names = [];
      products.forEach((product) => {
        product.options.forEach((option) => {
          const name = typeof option === 'string' ? option : option.name;
          if (name !== 'Title' && !names.includes(name)) names.push(name);
        });
      });
      return names;
    }

    /** Values of one option for a product, e.g. "S, M, L" (or "—") */
    function optionValues(product, name) {
      const index = product.options.findIndex((option) => (typeof option === 'string' ? option : option.name) === name);
      if (index === -1) return '—';
      const values = [];
      product.variants.forEach((variant) => {
        const value = variant.options[index];
        if (!values.includes(value)) values.push(value);
      });
      return values.join(', ');
    }

    /** Price cell: price (+ crossed-out compare-at price) */
    function priceCell(product) {
      const wrap = document.createElement('span');
      wrap.className = 'compare__price';
      wrap.appendChild(document.createTextNode(cards.formatMoney(product.price)));
      if (product.compare_at_price && product.compare_at_price > product.price) {
        const s = document.createElement('s');
        s.textContent = cards.formatMoney(product.compare_at_price);
        wrap.appendChild(s);
      }
      return wrap;
    }

    /** Builds the whole table */
    function buildTable(entries, handles) {
      const products = entries.map((entry) => entry.product);

      // Header row: empty corner + one card per product with a ✕ button
      const headRow = document.createElement('tr');
      headRow.appendChild(cell('td', { class: 'compare__corner' }));
      entries.forEach((entry, index) => {
        const th = cell('th', { scope: 'col', class: 'compare__product' });
        const remove = cell('button', {
          type: 'button',
          class: 'compare__remove',
          'data-compare-remove': handles[index],
          'aria-label': cards.fill(t.textRemove, 'product', entry.product.title),
        }, '×');
        th.appendChild(remove);
        th.appendChild(entry.card.cloneNode(true));
        headRow.appendChild(th);
      });
      const thead = document.createElement('thead');
      thead.appendChild(headRow);

      // Body rows
      const tbody = document.createElement('tbody');
      const addRow = (label, getValue, extraClass = '') => {
        const tr = cell('tr', extraClass ? { class: extraClass } : {});
        tr.appendChild(cell('th', { scope: 'row' }, label));
        products.forEach((product) => {
          const value = getValue(product);
          tr.appendChild(cell('td', {}, value instanceof Node ? value : String(value || '—')));
        });
        tbody.appendChild(tr);
      };

      rows.forEach((row) => {
        switch (row) {
          case 'price':
            addRow(t.textPrice, priceCell);
            break;
          case 'availability':
            addRow(t.textAvailability, (product) => {
              const badge = document.createElement('span');
              badge.className = `compare__stock ${product.available ? 'compare__stock--in' : 'compare__stock--out'}`;
              badge.textContent = product.available ? t.textInStock : t.textOutOfStock;
              return badge;
            });
            break;
          case 'vendor':
            addRow(t.textVendor, (product) => product.vendor);
            break;
          case 'type':
            addRow(t.textType, (product) => product.type);
            break;
          case 'options':
            optionNames(products).forEach((name) => addRow(name, (product) => optionValues(product, name)));
            break;
          case 'description':
            addRow(t.textDescription, (product) => shortDescription(product.description), 'compare__row--description');
            break;
          default:
            break;
        }
      });

      table.replaceChildren(thead, tbody);
    }

    /** Loads everything and shows the table or the empty state */
    async function render() {
      const handles = cards.readList('compare');
      clearButton.hidden = handles.length === 0;
      empty.hidden = handles.length > 0;
      if (handles.length === 0) {
        loading.hidden = true;
        scroll.hidden = true;
        table.replaceChildren();
        return;
      }

      loading.hidden = false;
      const entries = await Promise.all(handles.map(load));
      loading.hidden = true;

      // Products that no longer exist → drop them from the list
      const missing = handles.filter((handle, index) => !entries[index]);
      if (missing.length) {
        cards.writeList('compare', handles.filter((handle) => !missing.includes(handle)));
        return; // compare:updated → render() runs again
      }

      buildTable(entries, handles);
      scroll.hidden = false;
    }

    // ✕ on a column
    table.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-compare-remove]');
      if (!remove) return;
      const handle = remove.dataset.compareRemove;
      cards.writeList('compare', cards.readList('compare').filter((saved) => saved !== handle));
    });

    clearButton.addEventListener('click', () => cards.writeList('compare', []));
    document.addEventListener('compare:updated', render);
    window.addEventListener('storage', (event) => {
      if (event.key === 'nn-compare') render();
    });

    render();
  });
})();
