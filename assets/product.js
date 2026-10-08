/**
 * ============================================================================
 * product.js — Product page
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (product template only, with "defer")
 * Works with:
 *   sections/product-main.liquid            → gallery, variants, add to cart, popups
 *   sections/product-details.liquid         → tabs
 *   sections/product-recommendations.liquid → "You may also like"
 * Needs: window.NNCards from assets/global-product-card.js (cart, toast,
 *        money format). The ♡ button is handled by global-product-card.js.
 *
 * What it does:
 *  1. Gallery: the main image is a scroll-snap slider (swipe on phones);
 *     thumbnails and the ‹ › arrows move it; the active thumbnail, the
 *     "2 / 5" counter and the progress bars follow the scroll position.
 *     "Zoom on hover" (desktop): the image enlarges and follows the mouse;
 *     a click opens the full-size zoom.
 *  2. Zoom (🔍): opens the current image at 2000px in a popup (<dialog>).
 *  3. Variants: option buttons / swatches pick a variant. Updates the
 *     pressed states, "Color: Olive" labels, crossed-out values (no
 *     available variant), price + compare price + "% off", the add button
 *     (Add to cart / Sold out / Unavailable), the hidden variant id, the
 *     variant's image and the URL (?variant=…, no reload).
 *  4. Add to cart: sends the form through NNCards.addToCart (no page
 *     change), toast + header cart refresh; errors under the button.
 *  5. Size guide: opens the size guide popup.
 *  6. Tabs (product details): click / ←→ keys switch panels; fires
 *     "product:tab" (detail.panel) on the section for the animations.
 *  7. Recommendations: loads "You may also like" from Shopify; fires
 *     "product:recs-loaded" on the section once the cards are in.
 * GSAP motion for these sections: assets/global-scroll-animations.js
 * (initProductMain / initProductDetails / initProductRecs).
 * All visible text comes from Liquid (locales / data-text-* attributes).
 * ============================================================================
 */

(function () {
  'use strict';

  /** Runs once window.NNCards (global-product-card.js) is available */
  function whenReady(callback) {
    if (window.NNCards) callback();
    else document.addEventListener('nncards:ready', callback, { once: true });
  }

  /** Opens a <dialog> as a modal (page scroll locked while open) */
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('overflow-hidden');
    dialog.addEventListener('close', () => document.body.classList.remove('overflow-hidden'), { once: true });
  }

  /* ==========================================================================
     Product main: gallery, variants, add to cart
     ========================================================================== */

  function initProduct(root, cards) {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';

    let data;
    try {
      data = JSON.parse(root.querySelector('[data-product-json]').textContent);
    } catch (error) {
      console.error('[NN product] Could not read the variant data.', error);
      return;
    }

    /* ---------- 1. Gallery ---------- */
    const gallery = root.querySelector('[data-gallery]');
    const slides = gallery.querySelector('[data-gallery-slides]');
    const slideItems = Array.from(slides.children);
    const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
    const counter = gallery.querySelector('[data-gallery-counter]');
    const bars = Array.from(gallery.querySelectorAll('[data-gallery-bar]'));
    let current = 0;

    /** Scrolls the main slider to slide `index` */
    function goTo(index, smooth = true) {
      const target = slideItems[index];
      if (!target) return;
      slides.scrollTo({ left: target.offsetLeft - slides.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
      setActive(index);
    }

    /** Marks thumbnail + counter for slide `index` */
    function setActive(index) {
      current = index;
      thumbs.forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === index)));
      // Keep the active thumbnail visible in its scrolling list
      const thumb = thumbs[index];
      if (thumb) {
        const list = thumb.closest('[data-gallery-thumbs]');
        const item = thumb.parentElement;
        const vertical = list.scrollHeight > list.clientHeight;
        if (vertical) list.scrollTo({ top: item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2, behavior: 'smooth' });
        else list.scrollTo({ left: item.offsetLeft - list.clientWidth / 2 + item.clientWidth / 2, behavior: 'smooth' });
      }
      if (counter) {
        counter.textContent = cards.fill(cards.fill(gallery.dataset.textCounter, 'number', index + 1), 'total', slideItems.length);
      }
      // Progress bars: the current one fills, earlier ones stay full
      bars.forEach((bar, i) => {
        bar.classList.toggle('is-active', i === index);
        bar.classList.toggle('is-done', i < index);
      });
    }

    /** Slide index for a Shopify media id (variant images) */
    function indexOfMedia(mediaId) {
      return slideItems.findIndex((slide) => Number(slide.dataset.mediaId) === Number(mediaId));
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => goTo(Number(thumb.dataset.galleryThumb)));
    });
    // ‹ › arrows on the main image (wrap around at the ends)
    const nextButton = gallery.querySelector('[data-gallery-next]');
    if (nextButton) nextButton.addEventListener('click', () => goTo((current + 1) % slideItems.length));
    const prevButton = gallery.querySelector('[data-gallery-prev]');
    if (prevButton) prevButton.addEventListener('click', () => goTo((current - 1 + slideItems.length) % slideItems.length));

    // Zoom on hover (desktop, mouse): the image enlarges and the zoomed spot
    // follows the pointer; a click opens the full-size zoom popup (below)
    const main = gallery.querySelector('[data-gallery-main]');
    if (main && main.classList.contains('product-gallery__main--hover-zoom') && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      slideItems.forEach((slide) => {
        const image = slide.querySelector('img.product-gallery__image');
        if (!image || !slide.dataset.zoomSrc) return;
        slide.addEventListener('pointermove', (event) => {
          const box = slide.getBoundingClientRect();
          image.style.transformOrigin = `${((event.clientX - box.left) / box.width) * 100}% ${((event.clientY - box.top) / box.height) * 100}%`;
        });
        slide.addEventListener('pointerenter', () => slide.classList.add('is-zoomed'));
        slide.addEventListener('pointerleave', () => {
          slide.classList.remove('is-zoomed');
          image.style.transformOrigin = '';
        });
        slide.addEventListener('click', () => {
          const zoom = gallery.querySelector('[data-gallery-zoom]');
          if (zoom) zoom.click();
        });
      });
    }

    // Swiping / scrolling the slider → update thumbnail + counter
    let scrollTimer;
    slides.addEventListener('scroll', () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const index = Math.round(slides.scrollLeft / slides.clientWidth);
        if (index !== current) setActive(index);
      }, 80);
    }, { passive: true });

    // Start on the selected variant's image
    const startIndex = indexOfMedia(data.startMediaId);
    if (startIndex > 0) goTo(startIndex, false);

    /* ---------- 2. Zoom ---------- */
    const zoomButton = gallery.querySelector('[data-gallery-zoom]');
    const zoomDialog = root.querySelector('[data-zoom-dialog]');
    if (zoomButton && zoomDialog) {
      const zoomImage = zoomDialog.querySelector('[data-zoom-image]');
      zoomButton.addEventListener('click', () => {
        const slide = slideItems[current];
        if (!slide || !slide.dataset.zoomSrc) return;
        const image = slide.querySelector('img');
        zoomImage.src = slide.dataset.zoomSrc;
        zoomImage.alt = image ? image.alt : '';
        openDialog(zoomDialog);
      });
      // A click on the big image closes it too
      zoomImage.addEventListener('click', () => zoomDialog.close());
    }

    /* ---------- 5. Size guide ---------- */
    const guide = root.querySelector('[data-size-guide]');
    root.querySelectorAll('[data-size-guide-open]').forEach((button) => {
      button.addEventListener('click', () => openDialog(guide));
    });

    // Popups: ✕ buttons and clicks on the dark backdrop close them
    root.querySelectorAll('.product-dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target.closest('[data-dialog-close]')) {
          dialog.close();
          return;
        }
        if (event.target === dialog) {
          const box = dialog.getBoundingClientRect();
          const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
          if (!inside) dialog.close();
        }
      });
    });

    /* ---------- 3. Variants ---------- */
    const optionButtons = Array.from(root.querySelectorAll('[data-option-index]'));
    const optionCount = root.querySelectorAll('[data-option]').length;
    const selected = [];
    optionButtons.forEach((button) => {
      if (button.getAttribute('aria-pressed') === 'true') selected[Number(button.dataset.optionIndex)] = button.dataset.optionValue;
    });

    const priceRow = root.querySelector('[data-price-row]');
    const priceNode = root.querySelector('[data-price]');
    const compareNode = root.querySelector('[data-compare-price]');
    const discountNode = root.querySelector('[data-discount]');
    const addButton = root.querySelector('[data-add-button]');
    const addLabel = root.querySelector('[data-add-label]');
    const variantInput = root.querySelector('[data-variant-input]');
    const errorBox = root.querySelector('[data-product-error]');

    /** The variant matching every selected value */
    function currentVariant() {
      return data.variants.find((variant) => variant.options.every((value, index) => value === selected[index]));
    }

    /**
     * Whether an available variant has `value` for option `index` together
     * with the other current choices (otherwise the value is crossed out).
     */
    function isAvailable(index, value) {
      return data.variants.some((variant) =>
        variant.available &&
        variant.options[index] === value &&
        variant.options.every((other, i) => i === index || selected[i] === undefined || other === selected[i])
      );
    }

    /** Applies the current selection to the page */
    function update(moveImage = true) {
      const variant = currentVariant();

      optionButtons.forEach((button) => {
        const index = Number(button.dataset.optionIndex);
        button.setAttribute('aria-pressed', String(selected[index] === button.dataset.optionValue));
        button.classList.toggle('is-unavailable', !isAvailable(index, button.dataset.optionValue));
      });
      root.querySelectorAll('[data-option]').forEach((fieldset) => {
        const label = fieldset.querySelector('[data-option-selected]');
        if (label) label.textContent = selected[Number(fieldset.dataset.option)] || '';
      });

      errorBox.hidden = true;

      if (!variant) {
        addButton.disabled = true;
        addLabel.textContent = addButton.dataset.textUnavailable;
        return;
      }

      // Price · compare price · % off
      const onSale = variant.compareAtPrice > variant.price;
      priceNode.textContent = variant.priceFormatted;
      priceNode.classList.toggle('product__price--sale', onSale);
      compareNode.hidden = !onSale;
      compareNode.querySelector('[data-compare-amount]').textContent = variant.compareFormatted;
      discountNode.hidden = !onSale;
      if (onSale) {
        const percent = Math.round(((variant.compareAtPrice - variant.price) * 100) / variant.compareAtPrice);
        discountNode.textContent = cards.fill(priceRow.dataset.textDiscount, 'percent', percent);
      }

      // Add button
      addButton.disabled = !variant.available;
      addLabel.textContent = variant.available ? addButton.dataset.textAdd : addButton.dataset.textSoldOut;
      variantInput.value = variant.id;

      // Variant image
      if (moveImage && variant.mediaId) {
        const index = indexOfMedia(variant.mediaId);
        if (index > -1 && index !== current) goTo(index);
      }

      // Shareable URL for this variant (no reload, no new history entry)
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    optionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        selected[Number(button.dataset.optionIndex)] = button.dataset.optionValue;
        update();
      });
    });
    if (optionCount) update(false);

    /* ---------- 4. Add to cart ---------- */
    const form = root.querySelector('[data-product-form]');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (addButton.disabled) return;
        addButton.classList.add('is-loading');
        addButton.disabled = true;
        errorBox.hidden = true;
        try {
          await cards.addToCart([{ id: Number(variantInput.value), quantity: 1 }]);
          const title = root.querySelector('[data-product-title]').textContent.trim();
          cards.showToast(cards.fill(cards.text.addedToCart, 'product', title));
        } catch (problem) {
          errorBox.textContent = problem.message || cards.text.error;
          errorBox.hidden = false;
        } finally {
          addButton.classList.remove('is-loading');
          const variant = currentVariant() || data.variants.find((item) => item.id === Number(variantInput.value));
          addButton.disabled = !(variant && variant.available);
        }
      });
    }
  }

  /* ==========================================================================
     6. Tabs (product details)
     ========================================================================== */

  function initTabs(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    root.classList.add('is-js');

    const tabs = Array.from(root.querySelectorAll('[data-tab]'));
    const panels = Array.from(root.querySelectorAll('[data-tab-panel]'));

    function select(index, focus = false) {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (panels[i]) panels[i].hidden = !active;
      });
      if (focus) tabs[index].focus();
      // Keep the chosen tab visible in the scrolling tab row (phones).
      // Only the row scrolls (scrollIntoView could move the whole page).
      const row = tabs[index].parentElement;
      const tab = tabs[index];
      if (tab.offsetLeft < row.scrollLeft || tab.offsetLeft + tab.offsetWidth > row.scrollLeft + row.clientWidth) {
        row.scrollTo({ left: tab.offsetLeft - 16, behavior: 'smooth' });
      }
    }

    /** Shopper picked a tab: select it and let the animations fade the panel in */
    function choose(index, focus = false) {
      select(index, focus);
      root.dispatchEvent(new CustomEvent('product:tab', { detail: { panel: panels[index] } }));
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => choose(index));
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') choose((index + 1) % tabs.length, true);
        if (event.key === 'ArrowLeft') choose((index - 1 + tabs.length) % tabs.length, true);
      });
    });
    if (tabs.length) select(0);
  }

  /* ==========================================================================
     7. Recommendations
     ========================================================================== */

  async function initRecommendations(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    try {
      const response = await fetch(root.dataset.url);
      if (!response.ok) return;
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const fresh = doc.querySelector('[data-recommendations]');
      if (!fresh || !fresh.innerHTML.trim()) return;
      root.innerHTML = fresh.innerHTML;

      // Leave out the product on this page (fallback collection) and keep to the limit
      const limit = Number(root.dataset.limit) || 4;
      const items = Array.from(root.querySelectorAll('[data-recs-handle]'));
      items
        .filter((item) => item.dataset.recsHandle === root.dataset.currentHandle)
        .forEach((item) => item.remove());
      Array.from(root.querySelectorAll('[data-recs-handle]')).slice(limit).forEach((item) => item.remove());
      if (!root.querySelector('[data-recs-handle]')) {
        root.innerHTML = '';
        return;
      }
      // The scroll animations (global-scroll-animations.js) reveal the new cards
      root.dispatchEvent(new CustomEvent('product:recs-loaded'));
    } catch (error) {
      /* recommendations are optional: leave the section empty */
    }
  }

  /* ==========================================================================
     Setup (also when sections are re-rendered in the theme editor)
     ========================================================================== */

  function init(scope) {
    scope.querySelectorAll('[data-product-tabs]').forEach(initTabs);
    scope.querySelectorAll('[data-recommendations]').forEach(initRecommendations);
    whenReady(() => {
      scope.querySelectorAll('[data-product]').forEach((root) => initProduct(root, window.NNCards));
    });
  }

  init(document);
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
