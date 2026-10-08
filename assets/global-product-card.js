/**
 * ============================================================================
 * global-product-card.js — Product card quick actions
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (every page, with "defer")
 * Works with:
 *   snippets/global-product-card.liquid → the action dock on each card
 *   snippets/global-quick-add.liquid    → quick-add popup, toast, texts (JSON)
 *
 * What it does:
 *  1. Wishlist / compare buttons: toggle the product (by handle) in a list
 *     saved in the shopper's browser (localStorage). Compare has a limit
 *     (Theme settings > Product cards). Buttons show their saved state on
 *     every page, including cards added later (collection filtering, tabs).
 *  2. Add to cart, product without options: adds the one variant through
 *     Shopify's Ajax cart API (/cart/add.js), no page reload.
 *  3. Add to cart, product with options: opens the quick-add popup, built
 *     from /products/<handle>.js — color swatches, option buttons (values
 *     with no available variant are crossed out), quantity, live price.
 *  4. After adding: a toast ("Added to cart: …") and the header cart count
 *     and total ([data-cart-count], [data-cart-total]) are refreshed from
 *     /cart.js. A "cart:updated" event is sent for future cart drawers.
 *  5. Header badges [data-wishlist-count] / [data-compare-count] show how
 *     many products are saved; the floating compare button
 *     ([data-compare-float]) appears once a product is in compare, and its
 *     🗑 button ([data-compare-float-clear]) empties the compare list.
 *  5b. Wishlist sign-in (Theme settings > Customer accounts): while signed
 *     out, ♡ opens the sign-in popup (window.NNAccount, global-account.js)
 *     and the product is added right after signing in. Signed-in customers
 *     each have their own list ("nn-wishlist-<customer id>").
 *  6. window.NNCards: shared helpers (lists, cart, toast, money) used by the
 *     wishlist / compare / cart pages. "nncards:ready" fires once it exists.
 *     Events on document: wishlist:updated, compare:updated, cart:updated.
 *
 * All visible text comes from locales via the #ProductCardData JSON block.
 * ============================================================================
 */

(function () {
  'use strict';

  /**
   * Texts, money format, URLs and settings from Liquid (global-quick-add.liquid).
   * If the block is missing or unreadable, the script says so in the browser
   * console instead of failing silently.
   */
  const dataElement = document.getElementById('ProductCardData');
  if (!dataElement) {
    console.warn('[NN product cards] #ProductCardData not found: is "Show quick actions on cards" on in Theme settings > Product cards?');
    return;
  }
  let data;
  try {
    data = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error('[NN product cards] Could not read #ProductCardData (snippets/global-quick-add.liquid).', error);
    return;
  }
  /**
   * Translated texts. Shopify's t filter HTML-escapes its output (e.g. an
   * apostrophe becomes &#39;), which is right for HTML but these strings are
   * shown with textContent, so decode the entities once here.
   */
  const decoder = document.createElement('textarea');
  const text = {};
  Object.entries(data.text || {}).forEach(([key, value]) => {
    decoder.innerHTML = value;
    text[key] = decoder.value;
  });

  /**
   * Wishlist sign-in rules (Theme settings > Customer accounts):
   * - wishlistLocked: signed out while the wishlist needs an account →
   *   the list reads as empty and ♡ opens the sign-in popup instead
   * - wishlistPerCustomer: each signed-in customer has their own list
   *   ("nn-wishlist-<customer id>"), so people sharing a browser don't mix
   */
  const wishlistLocked = Boolean(data.wishlistLocked);
  const wishlistKey = data.wishlistPerCustomer && data.customerId ? `nn-wishlist-${data.customerId}` : 'nn-wishlist';

  /** localStorage keys for the saved lists (product handles) */
  const STORAGE_KEYS = { wishlist: wishlistKey, compare: 'nn-compare' };

  /** sessionStorage: product the shopper tried to ♡ before signing in */
  const PENDING_KEY = 'nn-wishlist-pending';

  /** Option names treated as colors → shown as swatches in the popup */
  const colorOptionNames = (data.colorOptionNames || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  /** Color names → CSS colors ("cream" → "#f3ead8"), from global-swatch-color.liquid */
  const swatchColors = data.swatchColors || {};

  /**
   * CSS background for a color value, same rules as the Liquid snippet:
   * the color list (full name, first word, last word), else the name as a
   * CSS color. null when nothing fits → the value is shown as text.
   * @param {string} value - e.g. "Charcoal", "Black Floral"
   */
  function swatchFor(value) {
    const key = String(value).trim().toLowerCase();
    const words = key.split(/\s+/);
    const listed = swatchColors[key] || swatchColors[words[0]] || swatchColors[words[words.length - 1]];
    if (listed) return listed;
    const cssName = key.replace(/\s+/g, '');
    return window.CSS && CSS.supports('color', cssName) ? cssName : null;
  }

  /* ==========================================================================
     Helpers
     ========================================================================== */

  /**
   * Fills a translated text's [placeholder], e.g. fill(text.addedToCart, 'product', 'Shirt').
   * @param {string} template
   * @param {string} key
   * @param {string|number} value
   */
  function fill(template, key, value) {
    return template.replace(`[${key}]`, String(value));
  }

  /**
   * Creates an element. Text is set with textContent (never parsed as HTML).
   * @param {string} tag
   * @param {object} [attrs] - attributes; "text" sets textContent, "class" the className
   * @param {Array<Node>} [children]
   */
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === 'text') node.textContent = value;
      else if (key === 'class') node.className = value;
      else node.setAttribute(key, value === true ? '' : value);
    });
    children.forEach((child) => child && node.appendChild(child));
    return node;
  }

  /**
   * Formats cents with the shop's money format (e.g. "${{amount}}" → "$54.95").
   * Supports Shopify's standard format placeholders.
   * @param {number} cents
   */
  function formatMoney(cents) {
    const format = data.moneyFormat || '${{amount}}';
    const value = Number(cents) / 100;

    const withSeparators = (number, decimals, thousands, decimal) => {
      const [whole, fraction] = number.toFixed(decimals).split('.');
      const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return fraction ? `${grouped}${decimal}${fraction}` : grouped;
    };

    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (match, placeholder) => {
      switch (placeholder) {
        case 'amount_no_decimals': return withSeparators(value, 0, ',', '.');
        case 'amount_with_comma_separator': return withSeparators(value, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return withSeparators(value, 0, '.', ',');
        case 'amount_with_apostrophe_separator': return withSeparators(value, 2, "'", '.');
        case 'amount_with_space_separator': return withSeparators(value, 2, ' ', ',');
        default: return withSeparators(value, 2, ',', '.');
      }
    });
  }

  /** Title of the product on a card (used in toast messages) */
  function cardTitle(card) {
    // [data-product-title]: the product page's title (its ♡ uses this script too)
    const title = card.querySelector('[data-product-title], .product-card__title');
    return title ? title.textContent.trim() : '';
  }

  /* ==========================================================================
     Saved lists (wishlist, compare) — localStorage, product handles
     ========================================================================== */

  /** @param {'wishlist'|'compare'} list @returns {string[]} */
  function readList(list) {
    if (list === 'wishlist' && wishlistLocked) return []; // signed out: no wishlist
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEYS[list]) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return []; // storage blocked or corrupted → start empty
    }
  }

  /** @param {'wishlist'|'compare'} list @param {string[]} handles */
  function writeList(list, handles) {
    try {
      window.localStorage.setItem(STORAGE_KEYS[list], JSON.stringify(handles));
    } catch (error) {
      console.warn('[NN product cards] Browser storage is blocked; the list is not saved.', error);
    }
    updateCounts();
    document.dispatchEvent(new CustomEvent(`${list}:updated`, { detail: { handles } }));
  }

  /**
   * List sizes on the page:
   * - [data-wishlist-count] / [data-compare-count]: header badges, hidden at 0
   * - [data-wishlist-total] / [data-compare-total]: plain numbers, always shown
   *   (account dashboard, floating compare button)
   * - [data-compare-float]: the floating compare button, shown from 1 product
   */
  function updateCounts() {
    ['wishlist', 'compare'].forEach((list) => {
      const count = readList(list).length;
      document.querySelectorAll(`[data-${list}-count]`).forEach((node) => {
        node.textContent = count;
        node.hidden = count === 0;
      });
      document.querySelectorAll(`[data-${list}-total]`).forEach((node) => {
        node.textContent = count;
      });
    });
    updateCompareFloat();
  }

  /**
   * Floating compare button (snippets/global-compare-float.liquid):
   * slides in once a product is in compare, out when the list is empty,
   * and "pops" when the number changes.
   */
  function updateCompareFloat() {
    const count = readList('compare').length;
    document.querySelectorAll('[data-compare-float]').forEach((button) => {
      const previous = Number(button.dataset.count || 0);
      button.dataset.count = count;
      const link = button.querySelector('[data-compare-float-link]');
      if (link && link.dataset.textLabel) link.setAttribute('aria-label', fill(link.dataset.textLabel, 'number', count));

      if (count === 0) {
        button.classList.remove('is-visible');
        return;
      }
      if (button.hidden) {
        // Unhide, let the browser lay out the off-screen position (reading
        // offsetWidth forces that), then add the class so it slides in
        button.hidden = false;
        void button.offsetWidth;
      }
      button.classList.add('is-visible');
      if (previous && previous !== count) {
        button.classList.remove('is-bumped');
        void button.offsetWidth; // restart the animation
        button.classList.add('is-bumped');
      }
    });
  }

  /**
   * ♡ while signed out: remembers the product (added after signing in, see
   * "Setup") and opens the sign-in popup (assets/global-account.js). If the
   * popup isn't on the page, goes to the login page instead.
   * @param {HTMLElement} card
   */
  function askToSignIn(card) {
    try {
      window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ handle: card.dataset.productHandle, title: cardTitle(card) }));
    } catch (error) {
      /* storage blocked: the shopper just taps ♡ again after signing in */
    }
    if (window.NNAccount && window.NNAccount.open('login', { message: text.loginForWishlist })) return;
    window.location.href = data.accountLoginUrl;
  }

  /**
   * Shows the saved state on a card's wishlist/compare buttons
   * (pressed + "Remove from …" label when the product is in the list).
   * @param {HTMLElement} card
   */
  function syncCard(card) {
    const handle = card.dataset.productHandle;
    [['wishlist', text.wishlist, text.wishlistRemove], ['compare', text.compare, text.compareRemove]].forEach(
      ([list, addLabel, removeLabel]) => {
        const button = card.querySelector(`[data-card-action="${list}"]`);
        if (!button) return;
        const saved = readList(list).includes(handle);
        button.setAttribute('aria-pressed', String(saved));
        button.setAttribute('aria-label', saved ? removeLabel : addLabel);
        button.dataset.tip = saved ? removeLabel : addLabel;
      }
    );
  }

  /** Syncs every card inside `scope` */
  function syncCards(scope) {
    scope.querySelectorAll('[data-product-card]').forEach(syncCard);
  }

  /**
   * Toggles a product in a list and updates every card of that product.
   * @param {'wishlist'|'compare'} list
   * @param {HTMLElement} card
   */
  function toggleInList(list, card) {
    if (list === 'wishlist' && wishlistLocked) {
      askToSignIn(card);
      return;
    }
    const handle = card.dataset.productHandle;
    const handles = readList(list);
    const index = handles.indexOf(handle);
    const title = cardTitle(card);

    if (index > -1) {
      handles.splice(index, 1);
      showToast(fill(list === 'wishlist' ? text.removedFromWishlist : text.removedFromCompare, 'product', title));
    } else {
      // Compare has a maximum number of products
      if (list === 'compare' && handles.length >= data.compareLimit) {
        showToast(fill(text.compareFull, 'limit', data.compareLimit), true);
        return;
      }
      handles.push(handle);
      showToast(fill(list === 'wishlist' ? text.addedToWishlist : text.addedToCompare, 'product', title));
    }

    writeList(list, handles);
    // The same product can appear in several sections → update all its cards
    document.querySelectorAll(`[data-product-card][data-product-handle="${CSS.escape(handle)}"]`).forEach(syncCard);
  }

  /* ==========================================================================
     Toast
     ========================================================================== */

  const toast = document.querySelector('[data-card-toast]');
  const toastText = toast ? toast.querySelector('[data-card-toast-text]') : null;
  let toastTimer;

  /**
   * Shows a short message at the bottom of the screen.
   * @param {string} message
   * @param {boolean} [isError]
   */
  function showToast(message, isError = false) {
    if (!toast) return;
    toastText.textContent = message;
    toast.classList.toggle('card-toast--error', isError);
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
  }

  /* ==========================================================================
     Cart (Shopify Ajax API)
     ========================================================================== */

  /**
   * Adds items to the cart. Throws with Shopify's message on failure
   * (e.g. "All 3 Twill Overshirt - M are in your cart.").
   * @param {Array<{id: number, quantity: number}>} items
   */
  async function addToCart(items) {
    const response = await fetch(data.cartAddUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.description || text.error);
    await refreshCart();
    return result;
  }

  /** Updates the header cart count / total and tells other scripts */
  async function refreshCart() {
    try {
      const response = await fetch(data.cartUrl, { headers: { Accept: 'application/json' } });
      const cart = await response.json();
      document.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = cart.item_count; });
      document.querySelectorAll('[data-cart-total]').forEach((node) => { node.textContent = formatMoney(cart.total_price); });
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
    } catch (error) {
      /* the item was added; only the header numbers couldn't refresh */
    }
  }

  /**
   * Shows a loading state on a button while `task` runs.
   * @param {HTMLButtonElement} button
   * @param {() => Promise<void>} task
   */
  async function withLoading(button, task) {
    button.classList.add('is-loading');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      await task();
    } finally {
      button.classList.remove('is-loading');
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  /* ==========================================================================
     Quick-add popup (products with options)
     ========================================================================== */

  const quickAdd = {
    root: document.querySelector('[data-quick-add]'),
    dialog: document.querySelector('[data-quick-add-dialog]'),
    body: document.querySelector('[data-quick-add-body]'),
    product: null,
    selected: [],
    quantity: 1,
    trigger: null,
    requestId: 0,

    /**
     * Opens the popup for a card and loads the product's options.
     * @param {HTMLElement} card
     * @param {HTMLElement} trigger - button to return focus to on close
     */
    async open(card, trigger) {
      if (!this.root) return;
      this.trigger = trigger;
      this.body.replaceChildren(el('p', { class: 'quick-add__loading', text: text.loading }));
      this.root.hidden = false;
      document.body.classList.add('overflow-hidden');
      this.dialog.focus();

      // Ignore late answers if the popup was closed / reopened meanwhile
      const requestId = ++this.requestId;
      try {
        const response = await fetch(`${card.dataset.productUrl}.js`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('product request failed');
        const product = await response.json();
        if (requestId !== this.requestId || this.root.hidden) return;
        this.start(product);
      } catch (error) {
        if (requestId !== this.requestId) return;
        this.close();
        showToast(text.error, true);
      }
    },

    /** Sets the starting selection and builds the popup */
    start(product) {
      this.product = product;
      this.quantity = 1;
      this.names = product.options.map((option) => (typeof option === 'string' ? option : option.name));

      // Values per option, in the order they appear in the variants
      this.values = this.names.map((name, index) => {
        const seen = [];
        product.variants.forEach((variant) => {
          const value = variant.options[index];
          if (!seen.includes(value)) seen.push(value);
        });
        return seen;
      });

      // Pre-select options with only one value, and colors (from the first
      // available variant). Sizes etc. stay empty so the shopper chooses.
      const firstAvailable = product.variants.find((variant) => variant.available) || product.variants[0];
      this.selected = this.names.map((name, index) => {
        if (this.values[index].length === 1) return this.values[index][0];
        if (this.isColor(name)) return firstAvailable.options[index];
        return null;
      });

      this.render();
      this.update();
    },

    /** @param {string} name - option name, e.g. "Color" */
    isColor(name) {
      return colorOptionNames.includes(name.trim().toLowerCase());
    },

    /** Builds the popup content (all text via textContent) */
    render() {
      const product = this.product;

      const image = el('img', { class: 'quick-add__image', alt: '', 'data-quick-add-image': true, loading: 'lazy' });
      this.setImage(image, product.featured_image);

      const head = el('div', { class: 'quick-add__head' }, [
        el('div', { class: 'quick-add__media' }, [image]),
        el('div', { class: 'quick-add__summary' }, [
          el('h2', { class: 'quick-add__title', id: 'QuickAddTitle', text: product.title }),
          el('p', { class: 'quick-add__price', 'data-quick-add-price': true }),
        ]),
        el('button', { type: 'button', class: 'quick-add__close', 'aria-label': text.close, 'data-quick-add-close': true, text: '×' }),
      ]);

      // One group per option (Color → swatches, others → buttons)
      const groups = this.names.map((name, index) => {
        const isColor = this.isColor(name);
        const buttons = this.values[index].map((value) => {
          const cssColor = isColor ? swatchFor(value) : null;
          const asSwatch = Boolean(cssColor);
          const button = el('button', {
            type: 'button',
            class: asSwatch ? 'quick-add__swatch' : 'quick-add__value',
            'data-option-index': index,
            'data-option-value': value,
            'aria-pressed': 'false',
            'aria-label': asSwatch ? value : null,
            title: asSwatch ? value : null,
            text: asSwatch ? null : value,
          });
          if (asSwatch) button.style.setProperty('--swatch', cssColor);
          return button;
        });

        return el('fieldset', { class: 'quick-add__option' }, [
          el('legend', { class: 'quick-add__legend' }, [
            document.createTextNode(`${name}: `),
            el('b', { 'data-option-label': index }),
          ]),
          el('div', { class: 'quick-add__values' }, buttons),
        ]);
      });

      const quantity = el('div', { class: 'quick-add__option' }, [
        el('span', { class: 'quick-add__legend', text: text.quantity }),
        el('div', { class: 'quick-add__qty' }, [
          el('button', { type: 'button', 'data-qty': '-1', 'aria-label': text.decrease, text: '−' }),
          el('output', { 'data-qty-value': true, 'aria-live': 'polite', text: '1' }),
          el('button', { type: 'button', 'data-qty': '1', 'aria-label': text.increase, text: '+' }),
        ]),
      ]);

      const error = el('p', { class: 'quick-add__error', role: 'alert', 'data-quick-add-error': true, hidden: true });
      // Shared button system (assets/global-buttons.css)
      const add = el('button', { type: 'button', class: 'button button--primary button--lg button--full quick-add__submit', 'data-quick-add-submit': true });

      this.body.replaceChildren(head, ...groups, quantity, error, add);
    },

    /**
     * Shows an image URL at a sensible size (Shopify CDN width parameter).
     * @param {HTMLImageElement} img
     * @param {string|{src: string}} source
     */
    setImage(img, source) {
      const url = source && (typeof source === 'string' ? source : source.src);
      if (!url) {
        img.hidden = true;
        return;
      }
      img.hidden = false;
      img.src = `${url}${url.includes('?') ? '&' : '?'}width=300`;
    },

    /** The variant matching every selected value, or undefined */
    currentVariant() {
      if (this.selected.some((value) => value === null)) return undefined;
      return this.product.variants.find((variant) =>
        variant.options.every((value, index) => value === this.selected[index])
      );
    },

    /**
     * Whether some available variant has `value` for option `index` and
     * matches the other selected options (crossed out if not).
     */
    isValueAvailable(index, value) {
      return this.product.variants.some((variant) =>
        variant.available &&
        variant.options[index] === value &&
        variant.options.every((other, otherIndex) =>
          otherIndex === index || this.selected[otherIndex] === null || other === this.selected[otherIndex]
        )
      );
    },

    /** Refreshes selection states, price, image and the add button */
    update() {
      const product = this.product;
      const variant = this.currentVariant();

      // Option buttons: pressed / unavailable; legend shows the chosen value
      this.body.querySelectorAll('[data-option-index]').forEach((button) => {
        const index = Number(button.dataset.optionIndex);
        const value = button.dataset.optionValue;
        button.setAttribute('aria-pressed', String(this.selected[index] === value));
        button.classList.toggle('is-unavailable', !this.isValueAvailable(index, value));
      });
      this.names.forEach((name, index) => {
        const label = this.body.querySelector(`[data-option-label="${index}"]`);
        label.textContent = this.selected[index] || fill(text.chooseOption, 'option', name.toLowerCase());
      });

      // Price: the variant's, else the product's lowest price
      const priceNode = this.body.querySelector('[data-quick-add-price]');
      const price = variant ? variant.price : product.price;
      const compareAt = variant ? variant.compare_at_price : product.compare_at_price;
      priceNode.replaceChildren(el('span', { text: formatMoney(price) }));
      if (compareAt && compareAt > price) {
        priceNode.appendChild(el('s', { class: 'quick-add__compare' }, [
          el('span', { class: 'visually-hidden', text: `${text.regularPrice} ` }),
          document.createTextNode(formatMoney(compareAt)),
        ]));
      }

      // Image: the variant's own image when it has one
      if (variant && variant.featured_image) {
        this.setImage(this.body.querySelector('[data-quick-add-image]'), variant.featured_image);
      }

      // Add button: label + enabled state follow the selection
      const submit = this.body.querySelector('[data-quick-add-submit]');
      const missingIndex = this.selected.findIndex((value) => value === null);
      if (missingIndex > -1) {
        submit.textContent = fill(text.chooseOption, 'option', this.names[missingIndex].toLowerCase());
        submit.disabled = true;
      } else if (!variant) {
        submit.textContent = text.unavailable;
        submit.disabled = true;
      } else if (!variant.available) {
        submit.textContent = text.soldOut;
        submit.disabled = true;
      } else {
        submit.textContent = text.addToCart;
        submit.disabled = false;
      }
      this.body.querySelector('[data-quick-add-error]').hidden = true;
    },

    /** Adds the selected variant, then closes */
    async submit(button) {
      const variant = this.currentVariant();
      if (!variant) return;
      const error = this.body.querySelector('[data-quick-add-error]');
      await withLoading(button, async () => {
        try {
          await addToCart([{ id: variant.id, quantity: this.quantity }]);
          const title = this.product.title;
          this.close();
          showToast(fill(text.addedToCart, 'product', title));
        } catch (problem) {
          error.textContent = problem.message || text.error;
          error.hidden = false;
        }
      });
    },

    close() {
      if (!this.root || this.root.hidden) return;
      this.requestId += 1; // cancel a product request still loading
      this.root.hidden = true;
      document.body.classList.remove('overflow-hidden');
      if (this.trigger && document.contains(this.trigger)) this.trigger.focus();
    },

    /** Event handlers for the popup (set up once) */
    bind() {
      if (!this.root) return;

      this.root.addEventListener('click', (event) => {
        if (event.target.closest('[data-quick-add-close]')) {
          this.close();
          return;
        }
        const option = event.target.closest('[data-option-index]');
        if (option) {
          const index = Number(option.dataset.optionIndex);
          this.selected[index] = option.dataset.optionValue;
          this.update();
          return;
        }
        const qty = event.target.closest('[data-qty]');
        if (qty) {
          this.quantity = Math.max(1, this.quantity + Number(qty.dataset.qty));
          this.body.querySelector('[data-qty-value]').textContent = this.quantity;
          return;
        }
        const submit = event.target.closest('[data-quick-add-submit]');
        if (submit && !submit.disabled) this.submit(submit);
      });

      // Escape closes; Tab stays inside the popup
      this.root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
          return;
        }
        if (event.key !== 'Tab') return;
        const focusable = Array.from(
          this.dialog.querySelectorAll('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])')
        );
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
    },
  };

  /* ==========================================================================
     Card buttons (one listener for every card on the page)
     ========================================================================== */

  document.addEventListener('click', (event) => {
    // Floating compare tab → 🗑 "Clear compare list": empty the list; the tab
    // slides out (updateCompareFloat), every card's ⇄ un-presses, toast confirms
    const clearCompare = event.target.closest('[data-compare-float-clear]');
    if (clearCompare) {
      writeList('compare', []);
      syncCards(document);
      showToast(clearCompare.dataset.textCleared || '');
      return;
    }

    const button = event.target.closest('[data-card-action]');
    if (!button) return;
    const card = button.closest('[data-product-card]');
    if (!card) return;
    event.preventDefault();

    switch (button.dataset.cardAction) {
      case 'wishlist':
      case 'compare':
        toggleInList(button.dataset.cardAction, card);
        break;

      case 'add':
        withLoading(button, async () => {
          try {
            await addToCart([{ id: Number(button.dataset.variantId), quantity: 1 }]);
            showToast(fill(text.addedToCart, 'product', cardTitle(card)));
          } catch (problem) {
            showToast(problem.message || text.error, true);
          }
        });
        break;

      case 'quick-add':
        quickAdd.open(card, button);
        break;

      default:
        break;
    }
  });

  /* ==========================================================================
     Setup
     ========================================================================== */

  quickAdd.bind();

  /**
   * Signed in with a per-customer wishlist:
   * 1. A list saved before sign-in was required ("nn-wishlist") is moved into
   *    this customer's list once, so nothing saved earlier is lost.
   * 2. The product the shopper tapped ♡ on before signing in is added now.
   */
  if (!wishlistLocked && wishlistKey !== 'nn-wishlist') {
    try {
      const guestList = JSON.parse(window.localStorage.getItem('nn-wishlist') || '[]');
      if (Array.isArray(guestList) && guestList.length) {
        const merged = readList('wishlist');
        guestList.forEach((handle) => { if (!merged.includes(handle)) merged.push(handle); });
        window.localStorage.setItem(wishlistKey, JSON.stringify(merged));
      }
      window.localStorage.removeItem('nn-wishlist');
    } catch (error) {
      /* storage blocked: nothing to move */
    }
  }
  if (!wishlistLocked) {
    try {
      const pending = JSON.parse(window.sessionStorage.getItem(PENDING_KEY) || 'null');
      window.sessionStorage.removeItem(PENDING_KEY);
      if (pending && pending.handle) {
        const handles = readList('wishlist');
        if (!handles.includes(pending.handle)) {
          handles.push(pending.handle);
          writeList('wishlist', handles);
        }
        showToast(fill(text.addedToWishlist, 'product', pending.title || pending.handle));
      }
    } catch (error) {
      /* storage blocked or corrupted: skip */
    }
  }

  syncCards(document);
  updateCounts();

  /**
   * Shared helpers for the wishlist, compare and cart pages
   * (assets/wishlist.js, compare.js, cart.js), so they don't repeat this code.
   */
  window.NNCards = {
    readList,
    writeList,
    storageKey: (list) => STORAGE_KEYS[list],
    wishlistLocked,
    addToCart,
    refreshCart,
    showToast,
    formatMoney,
    fill,
    text,
    data,
  };
  document.dispatchEvent(new CustomEvent('nncards:ready'));

  // Cards added later (collection filtering, theme editor, tabs) → show saved state
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches('[data-product-card]')) syncCard(node);
        else syncCards(node);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  // Another tab changed the lists → refresh this page's buttons and badges
  window.addEventListener('storage', (event) => {
    if (Object.values(STORAGE_KEYS).includes(event.key)) {
      syncCards(document);
      updateCounts();
    }
  });
})();
