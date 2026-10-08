/**
 * ============================================================================
 * homepage.js — Home page behaviour
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (home page only, with "defer")
 * Works with: sections/homepage-slideshow.liquid       → class Slideshow
 *             sections/homepage-collection-tabs.liquid → class CollectionTabs
 *
 * Collection tabs: click / ← → switches the category; the theme editor
 * shows the tab whose block is selected. Without JavaScript the first
 * category is shown.
 * Scroll slider (collection tabs "Layout: Slider", brands) → class ScrollSlider:
 * arrows, dots, progress bar and optional autoplay on top of a native
 * scroll-snap row (swipe works without JS; controls appear with JS).
 *
 * What it does (slideshow):
 *  1. Arrows, dots, keyboard ← / → (while focus is inside the slideshow).
 *  2. Swipe left/right on touch screens.
 *  3. Autoplay (theme editor setting), paused while the shopper hovers or
 *     focuses the slideshow, while the browser tab is hidden, and never
 *     started for shoppers who prefer reduced motion.
 *  4. Only the current slide can be reached with Tab / screen readers
 *     (the others are "inert").
 *  5. Theme editor: selecting a slide block shows that slide.
 *
 * Features and categories need no JavaScript.
 * Without JavaScript the first slide is shown.
 * ============================================================================
 */

(function () {
  'use strict';

  /** Minimum finger movement (px) that counts as a swipe */
  const SWIPE_THRESHOLD = 50;

  /** True when the shopper asked their device to reduce motion */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  class Slideshow {
    /**
     * @param {HTMLElement} root - Element with [data-slideshow]
     */
    constructor(root) {
      this.root = root;
      this.track = root.querySelector('[data-slideshow-track]');
      this.slides = Array.from(root.querySelectorAll('[data-slide]'));
      this.dots = Array.from(root.querySelectorAll('[data-slideshow-dot]'));

      // Settings from the data-* attributes (theme editor values)
      this.autoplayEnabled = root.dataset.autoplay === 'true';
      this.speed = parseInt(root.dataset.speed, 10) || 5000;

      // State
      this.index = 0;
      this.timer = null;
      this.hovered = false;
      this.focused = false;
      this.editorSelected = false; // a slide block is selected in the theme editor
      this.pointerStartX = null;

      if (this.slides.length < 2) return; // nothing to slide

      this.bindEvents();
      this.startAutoplay();
    }

    /* ======================================================================
       Events
       ====================================================================== */

    bindEvents() {
      // Arrows and dots (one listener, event delegation)
      this.root.addEventListener('click', (event) => {
        if (event.target.closest('[data-slideshow-prev]')) {
          this.goTo(this.index - 1);
        } else if (event.target.closest('[data-slideshow-next]')) {
          this.goTo(this.index + 1);
        } else {
          const dot = event.target.closest('[data-slideshow-dot]');
          if (dot) this.goTo(parseInt(dot.dataset.slideshowDot, 10));
        }
      });

      // Keyboard: ← / → while focus is inside the slideshow
      this.root.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') this.goTo(this.index - 1);
        if (event.key === 'ArrowRight') this.goTo(this.index + 1);
      });

      // Pause while hovered or focused, resume afterwards
      this.root.addEventListener('mouseenter', () => { this.hovered = true; this.updateAutoplay(); });
      this.root.addEventListener('mouseleave', () => { this.hovered = false; this.updateAutoplay(); });
      this.root.addEventListener('focusin', () => { this.focused = true; this.updateAutoplay(); });
      this.root.addEventListener('focusout', (event) => {
        if (!this.root.contains(event.relatedTarget)) {
          this.focused = false;
          this.updateAutoplay();
        }
      });

      // Browser tab hidden → stop; visible again → resume
      document.addEventListener('visibilitychange', () => this.updateAutoplay());

      // Reduced-motion preference changed while on the page
      prefersReducedMotion.addEventListener('change', () => this.updateAutoplay());

      // Swipe: remember where the finger went down, compare where it comes up
      this.track.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse') this.pointerStartX = event.clientX;
      });
      this.track.addEventListener('pointerup', (event) => {
        if (this.pointerStartX === null) return;
        const distance = event.clientX - this.pointerStartX;
        this.pointerStartX = null;
        if (Math.abs(distance) < SWIPE_THRESHOLD) return;
        this.goTo(distance < 0 ? this.index + 1 : this.index - 1);
      });
      this.track.addEventListener('pointercancel', () => { this.pointerStartX = null; });
    }

    /* ======================================================================
       Navigation
       ====================================================================== */

    /**
     * Shows the slide at `index` (wraps around at both ends).
     * @param {number} index
     */
    goTo(index) {
      const count = this.slides.length;
      this.index = (index + count) % count;

      // "Slide" transition reads this to move the track
      this.track.style.setProperty('--slide-index', String(this.index));

      this.slides.forEach((slide, i) => {
        const active = i === this.index;
        slide.classList.toggle('is-active', active);
        slide.inert = !active; // hidden slides can't be tabbed into or read out
      });

      this.dots.forEach((dot, i) => {
        if (i === this.index) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });

      // Restart the countdown so a manual change gets a full interval
      this.updateAutoplay();
    }

    /* ======================================================================
       Autoplay
       ====================================================================== */

    /** @returns {boolean} Whether autoplay should be running right now */
    shouldAutoplay() {
      return (
        this.autoplayEnabled &&
        !prefersReducedMotion.matches &&
        !this.hovered &&
        !this.focused &&
        !this.editorSelected &&
        !document.hidden
      );
    }

    startAutoplay() {
      this.stopAutoplay();
      if (!this.shouldAutoplay()) return;
      this.timer = window.setInterval(() => this.goTo(this.index + 1), this.speed);
      // Moving slides shouldn't be announced constantly
      this.track.setAttribute('aria-live', 'off');
    }

    stopAutoplay() {
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
      // Manual changes are announced to screen readers
      this.track.setAttribute('aria-live', 'polite');
    }

    /** Starts or stops autoplay to match the current state */
    updateAutoplay() {
      if (this.shouldAutoplay()) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    }

    /* ======================================================================
       Theme editor
       ====================================================================== */

    /**
     * A slide block was selected in the editor sidebar → show it and hold it.
     * @param {HTMLElement} blockElement
     */
    selectBlock(blockElement) {
      const index = this.slides.indexOf(blockElement);
      if (index === -1) return;
      this.editorSelected = true;
      this.goTo(index);
    }

    deselectBlock() {
      this.editorSelected = false;
      this.updateAutoplay();
    }

    /** Stops timers before the editor replaces the section */
    destroy() {
      this.stopAutoplay();
    }
  }

  /* ==========================================================================
     Collection tabs (sections/homepage-collection-tabs.liquid)
     ========================================================================== */

  class CollectionTabs {
    /**
     * Switches which category's products are shown. Every panel (products +
     * its own "View all" link) is already in the HTML; this only shows one.
     * @param {HTMLElement} root - Element with [data-collection-tabs]
     */
    constructor(root) {
      this.root = root;
      this.tabs = Array.from(root.querySelectorAll('[data-tab]'));
      this.panels = Array.from(root.querySelectorAll('[data-panel]'));

      if (this.tabs.length < 2) return; // single category → nothing to switch

      // Tab click
      root.addEventListener('click', (event) => {
        const tab = event.target.closest('[data-tab]');
        if (tab) this.select(this.tabs.indexOf(tab));
      });

      // Keyboard: ← / → move between tabs (standard tab pattern)
      root.addEventListener('keydown', (event) => {
        const tab = event.target.closest('[data-tab]');
        if (!tab || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        event.preventDefault();
        const step = event.key === 'ArrowRight' ? 1 : -1;
        const next = (this.tabs.indexOf(tab) + step + this.tabs.length) % this.tabs.length;
        this.select(next);
        this.tabs[next].focus();
      });
    }

    /**
     * Shows the panel at `index`, hides the others, updates the tab states.
     * @param {number} index
     */
    select(index) {
      if (index < 0) return;

      this.tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      this.panels.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
    }

    /**
     * Theme editor: a tab block was selected in the sidebar → show its panel.
     * @param {HTMLElement} panel - The block's panel (it carries shopify_attributes)
     */
    selectBlock(panel) {
      this.select(this.panels.indexOf(panel));
    }
  }

  /* ==========================================================================
     Scroll slider (collection tabs "Layout: Slider", brands strip)
     ========================================================================== */

  class ScrollSlider {
    /**
     * Adds controls to a native scroll-snap row (product cards, brand logos):
     * arrows, dots, progress bar and optional autoplay — each only if its
     * element exists in the markup. Swiping / trackpad scrolling work on
     * their own.
     *
     * Markup hooks (inside [data-scroll-slider]):
     *   [data-slider-track]     the scrolling row (required)
     *   [data-slider-prev/next] arrow buttons (optional)
     *   [data-slider-dots]      empty box; one dot per page is built here (optional)
     *   [data-slider-progress]  progress bar fill (optional)
     * Settings (data-* on the root): autoplay, speed (ms), text-go-to
     * ("Go to page [number]", translated), dot-class (CSS class for dots).
     *
     * @param {HTMLElement} root - Element with [data-scroll-slider]
     */
    constructor(root) {
      this.root = root;
      this.track = root.querySelector('[data-slider-track]');
      this.prev = root.querySelector('[data-slider-prev]');
      this.next = root.querySelector('[data-slider-next]');
      this.dotsBox = root.querySelector('[data-slider-dots]');
      this.progress = root.querySelector('[data-slider-progress]');

      // Settings from the data-* attributes (theme editor values)
      this.autoplayEnabled = root.dataset.autoplay === 'true';
      this.speed = parseInt(root.dataset.speed, 10) || 5000;
      // Translated "Go to page [number]" for the dot labels
      this.goToText = root.dataset.textGoTo || '';
      // CSS class for the generated dots (each section styles its own)
      this.dotClass = root.dataset.dotClass || 'collection-tabs__dot';

      this.timer = null;
      this.paused = false;
      this.pageCount = 0;

      if (!this.track) return;

      if (this.prev) this.prev.addEventListener('click', () => this.scrollByPage(-1));
      if (this.next) this.next.addEventListener('click', () => this.scrollByPage(1));

      // Any scroll (arrows, dots, swipe, trackpad) → update arrows/dots/progress.
      // "scrollend" catches the final position after smooth scrolling/snapping.
      this.track.addEventListener('scroll', () => this.update(), { passive: true });
      this.track.addEventListener('scrollend', () => this.update());

      // Size changes (window resize, or the tab becoming visible) → rebuild
      this.resizeObserver = new ResizeObserver(() => this.refresh());
      this.resizeObserver.observe(this.track);

      // Pause autoplay while the shopper is interacting with the products
      root.addEventListener('mouseenter', () => { this.paused = true; });
      root.addEventListener('mouseleave', () => { this.paused = false; });
      root.addEventListener('focusin', () => { this.paused = true; });
      root.addEventListener('focusout', (event) => {
        if (!root.contains(event.relatedTarget)) this.paused = false;
      });
      this.track.addEventListener('pointerdown', () => { this.paused = true; });

      root.classList.add('is-ready'); // CSS shows the controls from now on
      this.refresh();
      this.startAutoplay();
    }

    /** Width of one "page" = the visible part of the row */
    pageWidth() {
      return this.track.clientWidth;
    }

    /** Recomputes pages and dots, e.g. after a resize */
    refresh() {
      const width = this.pageWidth();
      if (!width) return; // hidden tab: nothing to measure yet

      // Everything fits → no controls needed
      const scrollable = this.track.scrollWidth - width > 2;
      this.root.classList.toggle('is-static', !scrollable);

      // Pages = 1 + how many page-widths can be scrolled. The 0.1 tolerance
      // absorbs the gap after the last visible card (8 cards, 4 per view = 2
      // pages, not 3); a part-filled last page still counts as a page.
      const maxScroll = this.track.scrollWidth - width;
      this.pageCount = scrollable ? Math.ceil(maxScroll / width - 0.1) + 1 : 1;
      this.buildDots();
      this.update();
    }

    /** Builds one dot button per page (style "dots" only) */
    buildDots() {
      if (!this.dotsBox) return;
      this.dotsBox.innerHTML = '';
      for (let i = 0; i < this.pageCount; i += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = this.dotClass;
        dot.setAttribute('aria-label', this.goToText.replace('[number]', String(i + 1)));
        dot.addEventListener('click', () => this.scrollToPage(i));
        this.dotsBox.appendChild(dot);
      }
    }

    /** Index of the page currently in view */
    currentPage() {
      const max = this.track.scrollWidth - this.pageWidth();
      if (this.track.scrollLeft >= max - 2) return this.pageCount - 1; // at the end
      return Math.round(this.track.scrollLeft / this.pageWidth());
    }

    /** Updates arrow states, the active dot and the progress bar */
    update() {
      const width = this.pageWidth();
      if (!width) return;
      const max = this.track.scrollWidth - width;
      const left = this.track.scrollLeft;

      // At the start / end flags (used for arrows and autoplay looping)
      this.atStart = left <= 2;
      this.atEnd = left >= max - 2;
      if (this.prev) this.prev.disabled = this.atStart;
      if (this.next) this.next.disabled = this.atEnd;

      if (this.dotsBox) {
        const page = this.currentPage();
        Array.from(this.dotsBox.children).forEach((dot, i) => {
          if (i === page) {
            dot.setAttribute('aria-current', 'true');
          } else {
            dot.removeAttribute('aria-current');
          }
        });
      }

      if (this.progress) {
        // Bar width = share of the row in view; bar position = how far scrolled
        const size = (width / this.track.scrollWidth) * 100;
        const position = max > 0 ? (left / max) * (100 - size) : 0;
        this.progress.style.setProperty('--progress-size', `${size}%`);
        this.progress.style.setProperty('--progress-left', `${position}%`);
      }
    }

    /** @param {number} direction - 1 = next page, -1 = previous page */
    scrollByPage(direction) {
      this.track.scrollBy({ left: direction * this.pageWidth() });
      this.updateSoon();
    }

    /** @param {number} index - Page to show */
    scrollToPage(index) {
      this.track.scrollTo({ left: index * this.pageWidth() });
      this.updateSoon();
    }

    /**
     * Safety net for browsers without "scrollend": update again once a
     * smooth scroll has had time to finish.
     */
    updateSoon() {
      window.clearTimeout(this.updateTimer);
      this.updateTimer = window.setTimeout(() => this.update(), 600);
    }

    /* ---------- Autoplay ---------- */

    startAutoplay() {
      if (!this.autoplayEnabled || prefersReducedMotion.matches) return;
      this.timer = window.setInterval(() => {
        // Skip while paused, hidden tab panel, hidden browser tab, or nothing to scroll
        if (this.paused || document.hidden || !this.pageWidth() || this.root.classList.contains('is-static')) return;
        if (this.atEnd) {
          this.scrollToPage(0); // at the end → back to the start
        } else {
          this.scrollByPage(1);
        }
      }, this.speed);
    }

    /** Stops timers/observers before the theme editor replaces the section */
    destroy() {
      if (this.timer) window.clearInterval(this.timer);
      if (this.resizeObserver) this.resizeObserver.disconnect();
    }
  }

  /* ==========================================================================
     Setup
     ========================================================================== */

  /**
   * Creates a Slideshow / CollectionTabs for every matching section inside
   * `scope` that doesn't have one yet.
   * @param {ParentNode} scope
   */
  function init(scope) {
    scope.querySelectorAll('[data-slideshow]').forEach((root) => {
      if (!root.slideshow) root.slideshow = new Slideshow(root);
    });
    scope.querySelectorAll('[data-collection-tabs]').forEach((root) => {
      if (!root.collectionTabs) root.collectionTabs = new CollectionTabs(root);
    });
    scope.querySelectorAll('[data-scroll-slider]').forEach((root) => {
      if (!root.scrollSlider) root.scrollSlider = new ScrollSlider(root);
    });
  }

  /**
   * Finds the Slideshow instance for a theme editor event, if any.
   * @param {Event} event
   * @returns {Slideshow|undefined}
   */
  function slideshowFor(event) {
    const root = event.target.querySelector('[data-slideshow]') || event.target.closest('[data-slideshow]');
    return root ? root.slideshow : undefined;
  }

  init(document);

  // Theme editor: section re-rendered / removed / slide block selected
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:unload', (event) => {
    const slideshow = slideshowFor(event);
    if (slideshow) slideshow.destroy();
    // Scroll sliders (collection tabs, brands): stop autoplay timers / observers
    event.target.querySelectorAll('[data-scroll-slider]').forEach((root) => {
      if (root.scrollSlider) root.scrollSlider.destroy();
    });
  });
  document.addEventListener('shopify:block:select', (event) => {
    const slideshow = slideshowFor(event);
    if (slideshow && slideshow.slides.length > 1) slideshow.selectBlock(event.target);

    // Collection tab block selected → show that category's products
    const tabsRoot = event.target.closest('[data-collection-tabs]');
    if (tabsRoot && tabsRoot.collectionTabs) tabsRoot.collectionTabs.selectBlock(event.target);
  });
  document.addEventListener('shopify:block:deselect', (event) => {
    const slideshow = slideshowFor(event);
    if (slideshow && slideshow.slides.length > 1) slideshow.deselectBlock();
  });
})();
