/**
 * ============================================================================
 * global-scroll-animations.js — GSAP scroll effects for the About,
 *                               Contact and Blog pages
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (page templates "about", "contact", "faq",
 *            blog, article, search, list-collections and product
 *            templates), after
 *            assets/global-gsap.min.js
 *            and assets/global-gsap-scrolltrigger.min.js
 *            (GSAP 3.13, free "standard" license — see the file headers)
 * Works with: sections/about-*.liquid   ([data-about="<type>"])
 *             sections/contact-*.liquid, blog-main, article-main,
 *             article-related ([data-scroll-fx="<type>"])
 * CSS:        assets/about.css, assets/contact.css, assets/blog.css (static
 *             layout + ".is-animated" layout where an effect needs one)
 *
 * Each section type has its own effect (see the section files for pictures):
 * Blog:
 *   blog-main        title words rise; topic pills pop in; featured photo
 *                    opens from an inset card (scrubbed); cards rise in groups,
 *                    photos unveil + zoom out          → initBlogMain()
 *   article-main     photo header opens and zooms out on load, then parallax;
 *                    title words rise; share buttons slide in; text blocks
 *                    fade up; reading progress bar     → initArticleMain()
 *   article-related  heading + cards as on the blog page → initArticleRelated()
 *   (+ the "Copy link" button, without GSAP)
 * Search results (sections/search-main.liquid):
 *   search-main  title words rise; eyebrow, count, search box, tabs and
 *                popular chips pop in; the huge outlined search word slides
 *                sideways with the scroll; result cards rise in groups (again
 *                after filtering: "collection:updated" from collection.js)
 *                                                       → initSearchMain()
 * Product page (sections/product-*.liquid; behaviour in assets/product.js):
 *   product-main     main photo opens from an inset card + zooms out, then
 *                    eases back (smaller, rounder) while scrolling past;
 *                    thumbnails slide in + drift; title letters flip up in
 *                    3D; price counts up; parts rise; sizes / swatches pop;
 *                    Add to cart shine + magnetic; trust row slides in
 *                                                     → initProductMain()
 *   product-marquee  big name band: rises in, pushed sideways by the
 *                    scroll, letters lean with the scroll speed
 *                                                     → initProductMarquee()
 *   product-details  tab pills drop in; text rises, ✓ items slide in, checks
 *                    spin; side photo opens as a growing circle + zooms
 *                    out (scrubbed); a new tab replays it ("product:tab")
 *                                                     → initProductDetails()
 *   product-recs     heading words rise, "View all" slides in; cards tip
 *                    forward in 3D, photos unveil; cards float at different
 *                    paces ("product:recs-loaded")    → initProductRecs()
 * All collections (sections/list-collections-main.liquid):
 *   list-collections-main  title words rise; eyebrow / text / tools pop in;
 *                outlined word slides with the scroll; cards rise in groups,
 *                photos unveil + zoom out; all shown at once when finding /
 *                sorting ("lc:filtered")            → initListCollections()
 * FAQ page (markup built / filtered by assets/faq.js, loaded first):
 *   faq-hero   heading words rise, text + search fade up   → initFaqHero()
 *   faq-main   topics menu slides in; topic icons pop; questions rise in
 *              groups; smooth open/close (shared with the Contact FAQ:
 *              smoothAccordion); all shown at once when searching
 *              ("faq:filtered" from faq.js)                 → initFaqMain()
 *   faq-cta    card opens from a rounder, smaller shape (desktop, scrubbed),
 *              content rises, magnetic button              → initFaqCta()
 * Contact page:
 *   contact-hero  heading words rise; the wide photo grows from an inset,
 *                 rounded card to full width (scrubbed) → initContactHero()
 *   contact-main  info rows slide in, icons pop; form card and fields slide
 *                 in one by one; send button fill follows the mouse +
 *                 magnetic; check mark draws after sending → initContactMain()
 *   contact-map   map wipe reveal; store card slides up + parallax → initContactMap()
 *   contact-faq   questions stagger in; answers open/close with a smooth
 *                 height animation                       → initContactFaq()
 * About page:
 *   hero        pinned stage: headline rises in, floating photos fly
 *               outward, the main photo grows from a card to full screen,
 *               overlay text appears                       → initHero()
 *   split       photo curtain wipe + parallax, heading words rise → initSplit()
 *   marquee     endless text band; scroll speeds it up / reverses it,
 *               letters lean with the scroll speed         → initMarquee()
 *   stack       sticky cards stack; cards underneath shrink and dim → initStack()
 *   horizontal  pinned; vertical scroll moves the cards sideways,
 *               photo parallax, progress bar (≥ 750px)    → initHorizontal()
 *   quote       words fill in with the scroll, quote mark turns → initQuote()
 *   cta         background zooms out, heading rises, magnetic buttons → initCta()
 * Shared: [data-split] headings reveal word by word, [data-fade] parts
 * fade up, when they scroll into view.
 *
 * Every section runs inside gsap.matchMedia(): nothing animates when the
 * device asks for reduced motion, and everything is undone cleanly when the
 * screen size changes or the section is edited in the theme editor
 * (shopify:section:load / unload). Without GSAP the page stays static
 * (assets/about.css default layout).
 * ============================================================================
 */

(function () {
  'use strict';

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) {
    console.warn('[NN scroll animations] GSAP did not load: the page shows without animations.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ==========================================================================
     Helpers
     ========================================================================== */

  /**
   * Wraps each word of a plain-text element in spans and returns the inner
   * spans. masked: true → mask + inner span (slide up from behind a line);
   * false → one span per word (for the quote fill). Runs once per element.
   */
  function splitWords(element, masked = true) {
    if (!element) return [];
    if (element.dataset.splitDone) return Array.from(element.querySelectorAll(masked ? '.word__inner' : '.fill'));
    const text = element.textContent.trim();
    if (!text) return [];
    element.dataset.splitDone = 'true';
    element.setAttribute('aria-label', text); // screen readers read the sentence once
    const fragment = document.createDocumentFragment();
    const targets = [];
    text.split(/\s+/).forEach((word, index) => {
      if (index) fragment.appendChild(document.createTextNode(' '));
      const outer = document.createElement('span');
      outer.setAttribute('aria-hidden', 'true');
      if (masked) {
        outer.className = 'word';
        const inner = document.createElement('span');
        inner.className = 'word__inner';
        inner.textContent = word;
        outer.appendChild(inner);
        targets.push(inner);
      } else {
        outer.className = 'fill';
        outer.textContent = word;
        targets.push(outer);
      }
      fragment.appendChild(outer);
    });
    element.replaceChildren(fragment);
    return targets;
  }

  /** Heading words slide up from behind their line when it scrolls into view */
  function revealWords(element, delay = 0) {
    const words = splitWords(element);
    if (!words.length) return;
    gsap.from(words, {
      yPercent: 115,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.05,
      delay,
      scrollTrigger: { trigger: element, start: 'top 88%', once: true },
    });
  }

  /** [data-fade] parts rise and fade in, one after another */
  function revealFades(section) {
    section.querySelectorAll('[data-fade]').forEach((element, index) => {
      gsap.from(element, {
        y: 36,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.15 + index * 0.05,
        scrollTrigger: { trigger: element, start: 'top 90%', once: true },
      });
    });
  }

  /** Shared text reveals for a section (not the hero: it has its own entrance) */
  function revealText(section) {
    section.querySelectorAll('[data-split]').forEach((heading) => revealWords(heading));
    revealFades(section);
  }

  /* ==========================================================================
     Hero: pinned stage, card → full-screen photo
     ========================================================================== */

  function initHero(section, isDesktop) {
    section.classList.add('is-animated');
    const stage = section.querySelector('[data-hero-stage]');
    const intro = section.querySelector('[data-hero-intro]');
    const heading = intro.querySelector('[data-split]');
    const fades = intro.querySelectorAll('[data-hero-fade]');
    const media = section.querySelector('[data-hero-media]');
    const image = section.querySelector('[data-hero-frame] img, [data-hero-frame] svg');
    const overlay = section.querySelector('[data-hero-overlay]');
    const floats = Array.from(section.querySelectorAll('[data-hero-float]')).filter((item) => item.offsetParent !== null);
    const hint = section.querySelector('[data-hero-hint]');

    // Card shape the photo starts from — same values as about.css. Written
    // out in full (4 sides + radius): the browser reports the CSS value in a
    // shortened form that GSAP would mix up while animating.
    const startClip = isDesktop ? 'inset(56% 35% 6% 35% round 24px)' : 'inset(52% 10% 8% 10% round 20px)';

    // 1. Entrance (plays once on load)
    const words = splitWords(heading);
    const entrance = gsap.timeline({ delay: 0.1 });
    entrance
      .from(words, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.06 })
      .from(fades, { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, '-=0.8')
      .from(media, { y: 120, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, '-=0.9')
      .from(floats.map((item) => item.firstElementChild), { scale: 1.5, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08 }, '<0.1')
      .from(hint, { autoAlpha: 0, duration: 0.6 }, '-=0.6');

    // 2. Scroll (scrubbed over the section's 3 screens)
    const scroll = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1 },
    });
    scroll
      .to(intro, { yPercent: -40, autoAlpha: 0, duration: 0.3 }, 0)
      .to(hint, { autoAlpha: 0, duration: 0.1 }, 0)
      .fromTo(media, { clipPath: startClip }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.6, ease: 'power2.inOut' }, 0.05)
      .fromTo(image, { scale: 1.3 }, { scale: 1, duration: 0.75 }, 0);

    // Floating photos move away from the center, grow and fade
    const box = stage.getBoundingClientRect();
    floats.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - (box.left + box.width / 2);
      const dy = rect.top + rect.height / 2 - (box.top + box.height / 2);
      scroll.to(item, { x: dx * 0.9, y: dy * 0.9 - 80, scale: 1.25, autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, 0.02);
    });

    if (overlay) {
      scroll
        .to(overlay, { autoAlpha: 1, duration: 0.12 }, 0.66)
        .from(overlay.children, { y: 60, duration: 0.22, stagger: 0.05, ease: 'power2.out' }, 0.66);
    }
    scroll.to({}, { duration: 0.12 }); // hold the full photo a moment before moving on
  }

  /* ==========================================================================
     Image with text: curtain wipe + parallax
     ========================================================================== */

  function initSplit(section) {
    revealText(section);
    const media = section.querySelector('[data-split-media]');
    const parallax = section.querySelector('[data-parallax]');
    const image = parallax && parallax.firstElementChild;
    const badge = section.querySelector('[data-badge]');

    const wipe = gsap.timeline({ scrollTrigger: { trigger: media, start: 'top 82%', once: true } });
    wipe
      .fromTo(media, { clipPath: 'inset(100% 0% 0% 0% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.5, ease: 'expo.inOut' })
      .from(image, { scale: 1.4, duration: 1.8, ease: 'expo.out' }, 0.2);
    if (badge) wipe.from(badge, { scale: 0.4, autoAlpha: 0, duration: 0.8, ease: 'back.out(2)' }, '-=0.9');

    gsap.fromTo(parallax, { yPercent: -8 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  /* ==========================================================================
     Marquee: endless band, scroll velocity boosts / reverses it
     ========================================================================== */

  function initMarquee(section) {
    section.classList.add('is-animated');
    const track = section.querySelector('[data-marquee-track]');
    const items = section.querySelectorAll('.about-marquee__item');
    const seconds = Number(section.dataset.speed) || 26;

    const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: seconds, repeat: -1 });
    loop.totalTime(seconds * 1000); // room to run backwards too

    let direction = 1;
    const lean = gsap.quickTo(items, 'skewX', { duration: 0.6, ease: 'power3' });
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        direction = self.direction;
        const speed = Math.min(Math.abs(self.getVelocity()) / 300, 5);
        gsap.to(loop, { timeScale: direction * (1 + speed), duration: 0.25, overwrite: true });
        gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.3, ease: 'power2.out' });
        lean(gsap.utils.clamp(-12, 12, self.getVelocity() / -200));
        gsap.delayedCall(0.25, () => lean(0));
      },
    });
  }

  /* ==========================================================================
     Stacking cards
     ========================================================================== */

  function initStack(section) {
    section.classList.add('is-animated');
    revealText(section);
    const cards = Array.from(section.querySelectorAll('[data-stack-card]'));

    cards.forEach((card, index) => {
      // Each card rises in the first time
      // (y / opacity only: scale, tilt and brightness belong to the stacking below)
      gsap.from(card, {
        y: 120,
        autoAlpha: 0,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 92%', once: true },
      });

      // When the next card slides over it: shrink, tip back, darken
      const next = cards[index + 1];
      if (!next) return;
      gsap.fromTo(card, { scale: 1, rotationX: 0, filter: 'brightness(1)' }, {
        scale: 0.9,
        rotationX: 6,
        filter: 'brightness(0.55)',
        ease: 'none',
        transformPerspective: 1200,
        immediateRender: false,
        scrollTrigger: {
          trigger: next,
          start: 'top bottom',
          end: () => `top ${window.innerHeight * 0.14 + (index + 1) * 22}px`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });
  }

  /* ==========================================================================
     Horizontal gallery (pinned, ≥ 750px)
     ========================================================================== */

  function initHorizontal(section, isDesktop) {
    revealText(section);
    if (!isDesktop) return undefined; // phones: native swipe row

    section.classList.add('is-animated');
    const track = section.querySelector('[data-h-track]');
    const progress = section.querySelector('[data-h-progress]');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const slide = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }),
      },
    });

    // Photos drift inside their frames while the row moves (parallax)
    section.querySelectorAll('[data-h-card]').forEach((card) => {
      const image = card.querySelector('.about-hscroll__media img, .about-hscroll__media svg');
      if (!image) return;
      gsap.fromTo(image, { xPercent: 8 }, {
        xPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
      });
      // Cards lift in as they enter from the right
      gsap.from(card, {
        y: 80,
        rotation: 3,
        autoAlpha: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 92%', once: true },
      });
    });

    return () => section.classList.remove('is-animated');
  }

  /* ==========================================================================
     Quote: words fill with the scroll
     ========================================================================== */

  function initQuote(section) {
    revealFades(section);
    const text = section.querySelector('[data-fill]');
    const words = splitWords(text, false);
    const mark = section.querySelector('[data-quote-mark]');

    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: text, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
    gsap.fromTo(mark, { rotation: -30, scale: 0.4, autoAlpha: 0 }, {
      rotation: 0,
      scale: 1,
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 25%', scrub: true },
    });
  }

  /* ==========================================================================
     Call to action: background zoom, magnetic buttons
     ========================================================================== */

  function initCta(section) {
    revealText(section);
    const background = section.querySelector('[data-cta-bg]');
    if (background) {
      gsap.fromTo(background, { scale: 1.3 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    }

    section.querySelectorAll('[data-magnetic]').forEach((button) => magnetic(button, section));
  }

  /**
   * Magnetic button: leans toward the mouse while hovered (mouse /
   * trackpad only). Listeners are added once; they do nothing while the
   * section's animations are switched off (reduced motion, editor reload).
   * @param {HTMLElement} button
   * @param {HTMLElement} section - the section running the animations
   * @param {number} [strength] - share of the mouse offset to follow
   */
  function magnetic(button, section, strength = 0.35) {
    // .button elements: global-buttons.js handles magnetic ([data-magnetic]) site-wide
    if (button.classList.contains('button')) {
      button.setAttribute('data-magnetic', '');
      return;
    }
    if (!window.matchMedia('(pointer: fine)').matches || button.dataset.magneticReady) return;
    button.dataset.magneticReady = 'true';
    const active = () => running.has(section) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    button.addEventListener('mousemove', (event) => {
      if (!active()) return;
      const rect = button.getBoundingClientRect();
      gsap.to(button, {
        x: (event.clientX - rect.left - rect.width / 2) * strength,
        y: (event.clientY - rect.top - rect.height / 2) * strength,
        duration: 0.6,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    });
    button.addEventListener('mouseleave', () => {
      gsap.to(button, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
    });
  }

  /* ==========================================================================
     Contact hero: words rise, photo grows to full width
     ========================================================================== */

  function initContactHero(section, isDesktop) {
    revealFades(section);
    const heading = section.querySelector('[data-split]');
    const words = splitWords(heading);
    gsap.from(words, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.08, delay: 0.1 });

    const media = section.querySelector('[data-grow-media]');
    if (!media) return;
    const image = media.querySelector('img');
    const start = isDesktop ? 'inset(0% 6% 0% 6% round 32px)' : 'inset(0% 4% 0% 4% round 20px)';
    gsap.fromTo(media, { clipPath: start }, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      ease: 'none',
      scrollTrigger: { trigger: media, start: 'top 90%', end: 'top 15%', scrub: true },
    });
    if (image) {
      gsap.fromTo(image, { scale: 1.25 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  }

  /* ==========================================================================
     Contact form: info rows, form fields, send button, success check
     ========================================================================== */

  function initContactMain(section) {
    revealText(section);

    // Info rows slide in from the left; their icons pop and spin in
    const list = section.querySelector('.contact-main__items');
    if (list) {
      const trigger = { trigger: list, start: 'top 85%', once: true };
      gsap.from(list.querySelectorAll('[data-contact-item]'), { x: -50, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, scrollTrigger: trigger });
      gsap.from(list.querySelectorAll('[data-contact-icon]'), { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(2.2)', stagger: 0.12, delay: 0.15, scrollTrigger: { ...trigger } });
    }

    // Form card rises; its fields slide in one after another
    const card = section.querySelector('[data-contact-card]');
    const fields = section.querySelectorAll('[data-contact-field]');
    const send = section.querySelector('[data-contact-send]');
    const cardTrigger = { trigger: card, start: 'top 85%', once: true };
    gsap.from(card, { y: 90, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: cardTrigger });
    if (fields.length) gsap.from(fields, { x: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.25, scrollTrigger: { ...cardTrigger } });

    if (send) {
      gsap.from(send, { scale: 0.85, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.8)', delay: 0.6, scrollTrigger: { ...cardTrigger } });
      magnetic(send, section, 0.12);
      // The fill circle grows from where the mouse enters (CSS --x / --y)
      if (!send.dataset.fillReady) {
        send.dataset.fillReady = 'true';
        const place = (event) => {
          const rect = send.getBoundingClientRect();
          send.style.setProperty('--x', `${event.clientX - rect.left}px`);
          send.style.setProperty('--y', `${event.clientY - rect.top}px`);
        };
        send.addEventListener('mouseenter', place);
        send.addEventListener('mousemove', place);
        // Sending: "Sending…" and no double submits (the form posts normally)
        send.closest('form').addEventListener('submit', () => {
          send.classList.add('is-sending');
          const label = send.querySelector('[data-send-label]');
          if (label && send.dataset.textSending) label.textContent = send.dataset.textSending;
        });
      }
    }

    // After sending: the check mark draws itself, the texts rise in
    const success = section.querySelector('[data-contact-success]');
    if (success) {
      success.focus({ preventScroll: true });
      const [circle, tick] = success.querySelectorAll('circle, path');
      const draw = (shape) => {
        const length = shape.getTotalLength();
        return [{ strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0 }];
      };
      const [circleFrom, circleTo] = draw(circle);
      const [tickFrom, tickTo] = draw(tick);
      gsap.timeline({ delay: 0.3 })
        .fromTo(circle, circleFrom, { ...circleTo, duration: 0.9, ease: 'power2.inOut' })
        .fromTo(tick, tickFrom, { ...tickTo, duration: 0.5, ease: 'power2.out' }, '-=0.2')
        .from(success.querySelectorAll('h3, p'), { y: 20, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, '-=0.2');
    }
  }

  /* ==========================================================================
     Contact map: wipe reveal, store card slides up + parallax
     ========================================================================== */

  function initContactMap(section, isDesktop) {
    const frame = section.querySelector('[data-map-frame]');
    const card = section.querySelector('[data-map-card]');
    const reveal = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 80%', once: true } });
    reveal.fromTo(frame, { clipPath: 'inset(0% 100% 0% 0% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.6, ease: 'expo.inOut' });
    if (!card) return;
    reveal.from(card, { y: 100, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, '-=0.6');
    if (isDesktop) {
      // Parallax on yPercent (the entrance uses y, so they add up, not clash)
      gsap.fromTo(card, { yPercent: 12 }, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  }

  /* ==========================================================================
     Contact FAQ: staggered questions, smooth accordion
     ========================================================================== */

  function initContactFaq(section) {
    section.classList.add('is-animated');
    revealText(section);
    const items = Array.from(section.querySelectorAll('[data-faq]'));
    gsap.from(items, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: items[0], start: 'top 88%', once: true },
    });

    smoothAccordion(section, items);
  }

  /**
   * Smooth open / close for <details> questions (Contact FAQ, FAQ page).
   * Listeners are added once; while the section's animations are off (no
   * .is-animated: reduced motion, editor reload) the native <details> works.
   * @param {HTMLElement} section
   * @param {HTMLDetailsElement[]} items - each with a [data-faq-answer] panel
   */
  function smoothAccordion(section, items) {
    items.forEach((details) => {
      if (details.dataset.faqReady) return;
      details.dataset.faqReady = 'true';
      const answer = details.querySelector('[data-faq-answer]');
      details.querySelector('summary').addEventListener('click', (event) => {
        if (!section.classList.contains('is-animated')) return;
        event.preventDefault();
        if (details.open) {
          gsap.to(answer, {
            height: 0,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: () => {
              details.open = false;
              gsap.set(answer, { clearProps: 'height' });
            },
          });
        } else {
          details.open = true;
          gsap.fromTo(answer, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'power3.out', clearProps: 'height' });
          gsap.from(answer.firstElementChild, { y: -12, autoAlpha: 0, duration: 0.5, delay: 0.1, ease: 'power2.out' });
        }
      });
    });
  }

  /* ==========================================================================
     FAQ page: hero, topics + questions, "Still have questions?"
     ========================================================================== */

  function initFaqHero(section) {
    revealFades(section);
    const heading = section.querySelector('[data-split]');
    gsap.from(splitWords(heading), { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.06, delay: 0.1 });
  }

  function initFaqMain(section) {
    section.classList.add('is-animated');
    const nav = section.querySelector('[data-faq-nav]');
    if (nav && !nav.hidden) {
      gsap.from(nav.querySelectorAll('.faq-nav__title, .faq-nav__link'), { x: -30, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.2 });
    }

    // Topic titles: icon pops, title slides up
    section.querySelectorAll('[data-faq-group]').forEach((group) => {
      const title = group.querySelector('.faq-group__title');
      if (!title) return;
      const trigger = { trigger: group, start: 'top 85%', once: true };
      gsap.from(title, { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: trigger });
      const icon = title.querySelector('.faq-group__icon');
      if (icon) gsap.from(icon, { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(2.2)', delay: 0.1, scrollTrigger: { ...trigger } });
    });

    // Questions rise in, in small groups as they scroll into view
    const items = Array.from(section.querySelectorAll('[data-faq]'));
    gsap.set(items, { y: 30, autoAlpha: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', stagger: 0.07 }),
    });
    // Searching moves questions around: show them all right away (listener once)
    if (!section.dataset.faqFilterBound) {
      section.dataset.faqFilterBound = 'true';
      document.addEventListener('faq:filtered', () => {
        gsap.to(section.querySelectorAll('[data-faq]'), { y: 0, autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
      });
    }

    smoothAccordion(section, items);
  }

  function initFaqCta(section, isDesktop) {
    const card = section.querySelector('[data-faq-cta-card]');
    if (isDesktop) {
      gsap.fromTo(card, { clipPath: 'inset(8% 10% 8% 10% round 56px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 28px)',
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 95%', end: 'top 45%', scrub: true },
      });
    }
    gsap.from(card.children, { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
    section.querySelectorAll('[data-magnetic]').forEach((button) => magnetic(button, section));
  }

  /* ==========================================================================
     Blog: cards (shared by the blog page and related posts)
     ========================================================================== */

  /**
   * Blog cards rise in, in small groups as they scroll into view; each
   * photo unveils from the bottom (clip-path) and zooms out.
   * @param {Element[]} cards - [data-blog-card] elements
   */
  function revealCards(cards) {
    if (!cards.length) return;
    gsap.set(cards, { y: 70, autoAlpha: 0 });
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: 0.12 });
        const media = batch.map((card) => card.querySelector('[data-blog-media]')).filter(Boolean);
        gsap.fromTo(media, { clipPath: 'inset(100% 0% 0% 0% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.3, ease: 'expo.inOut', stagger: 0.12 });
        const images = media.map((item) => item.querySelector('img, svg')).filter(Boolean);
        gsap.fromTo(images, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'expo.out', stagger: 0.12, clearProps: 'transform' });
      },
    });
  }

  /* ==========================================================================
     Blog page: title, topics, featured post, cards
     ========================================================================== */

  function initBlogMain(section) {
    revealFades(section);
    const heading = section.querySelector('[data-split]');
    gsap.from(splitWords(heading), { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.07, delay: 0.1 });

    // Topic pills pop in one after another
    const tags = section.querySelectorAll('[data-blog-tag]');
    if (tags.length) gsap.from(tags, { y: 20, scale: 0.85, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.05, delay: 0.45 });

    // Featured post: photo opens from an inset card (scrubbed), text rises
    const featured = section.querySelector('[data-blog-featured]');
    if (featured) {
      const media = featured.querySelector('[data-blog-media]');
      const image = media && media.querySelector('img, svg');
      gsap.fromTo(media, { clipPath: 'inset(10% 10% 10% 10% round 48px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 28px)',
        ease: 'none',
        scrollTrigger: { trigger: featured, start: 'top 95%', end: 'top 35%', scrub: true },
      });
      if (image) {
        gsap.fromTo(image, { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: featured, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
      gsap.from(featured.querySelector('.blog-card__info').children, {
        y: 40,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: featured, start: 'top 75%', once: true },
      });
    }

    revealCards(Array.from(section.querySelectorAll('.blog-grid [data-blog-card]')));
  }

  /* ==========================================================================
     Blog post: photo header, title, share, text, progress
     ========================================================================== */

  function initArticleMain(section) {
    revealFades(section);
    const media = section.querySelector('[data-article-media]');
    const image = media && media.querySelector('img');
    const heading = section.querySelector('[data-split]');

    // Header: the photo opens from an inset card and zooms out (on load)…
    const intro = gsap.timeline({ delay: 0.05 });
    if (media) {
      intro
        .fromTo(media, { clipPath: 'inset(6% 8% 6% 8% round 48px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.6, ease: 'expo.out' }, 0)
        .fromTo(image, { scale: 1.35 }, { scale: 1.08, duration: 2, ease: 'expo.out' }, 0);
      // …then drifts while you scroll past it (parallax)
      gsap.fromTo(image, { yPercent: 0 }, {
        yPercent: 10,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: { trigger: media, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
    intro.from(splitWords(heading), { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.05 }, 0.35);

    // Share buttons slide in one by one
    const share = section.querySelector('[data-article-share]');
    if (share) {
      gsap.from(share.querySelectorAll('.article-share__label, .article-share__button'), {
        x: -24,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: share, start: 'top 85%', once: true },
      });
    }

    // Text: paragraphs, headings, images and quotes fade up as you reach them
    const content = section.querySelector('[data-article-content]');
    if (content) {
      const blocks = Array.from(content.children);
      gsap.set(blocks, { y: 30, autoAlpha: 0 });
      ScrollTrigger.batch(blocks, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
      });

      // Reading progress (top bar) follows the position in the text
      const progress = section.querySelector('[data-article-progress]');
      if (progress) {
        gsap.fromTo(progress, { scaleX: 0 }, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: content, start: 'top 70%', end: 'bottom 70%', scrub: true },
        });
      }
    }
  }

  /* ==========================================================================
     Related posts under a blog post
     ========================================================================== */

  function initArticleRelated(section) {
    revealText(section);
    revealCards(Array.from(section.querySelectorAll('[data-blog-card]')));
  }

  /* ==========================================================================
     Search results: top band, chips / tabs, result cards
     ========================================================================== */

  function initSearchMain(section, isDesktop) {
    // Title words rise; eyebrow, count, search box, tabs and chips pop in
    const intro = gsap.timeline({ delay: 0.05 });
    intro.from(splitWords(section.querySelector('.search-hero__title')), { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.06 }, 0);
    const hero = section.querySelector('.search-hero');
    const pops = Array.from(hero.querySelectorAll('[data-search-pop]'));
    if (pops.length) intro.from(pops, { y: 24, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.06 }, 0.25);

    // Outlined search word: drifts in from the right, then slides with the scroll
    const ghost = section.querySelector('[data-search-ghost]');
    if (ghost) {
      gsap.from(ghost, { xPercent: 12, autoAlpha: 0, duration: 1.6, ease: 'expo.out' });
      gsap.to(ghost, {
        xPercent: isDesktop ? -30 : -45,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: '+=1400', scrub: 0.6 },
      });
    }

    // Popular chips below the band (empty search / no results)
    const chips = section.querySelectorAll('.search-empty [data-search-pop]');
    if (chips.length) {
      gsap.from(chips, { y: 20, scale: 0.85, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.05, delay: 0.4 });
    }
    section.querySelectorAll('.search-empty [data-split]').forEach((heading) => revealWords(heading));

    // Result cards rise in, in small groups as they scroll into view
    const revealResults = () => {
      const cards = Array.from(section.querySelectorAll('[data-search-card]:not([data-search-shown])'));
      if (!cards.length) return;
      cards.forEach((card) => { card.dataset.searchShown = 'true'; });
      gsap.set(cards, { y: 60, autoAlpha: 0 });
      ScrollTrigger.batch(cards, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' }),
      });
    };
    revealResults();

    // Filters / sort / page changes (assets/collection.js) bring new cards
    const onUpdate = () => {
      revealResults();
      ScrollTrigger.refresh();
    };
    section.addEventListener('collection:updated', onUpdate);
    return () => {
      section.removeEventListener('collection:updated', onUpdate);
      section.querySelectorAll('[data-search-shown]').forEach((card) => card.removeAttribute('data-search-shown'));
    };
  }

  /* ==========================================================================
     All collections: top band, tools, collection cards
     ========================================================================== */

  function initListCollections(section, isDesktop) {
    // Title words rise; eyebrow, text, count and tools pop in
    const intro = gsap.timeline({ delay: 0.05 });
    intro.from(splitWords(section.querySelector('.lc-hero__title')), { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.07 }, 0);
    const pops = Array.from(section.querySelectorAll('[data-lc-pop]')).filter((element) => !element.hidden);
    if (pops.length) intro.from(pops, { y: 24, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.07 }, 0.25);

    // Outlined word: drifts in, then slides sideways with the scroll
    const ghost = section.querySelector('[data-lc-ghost]');
    if (ghost) {
      gsap.from(ghost, { xPercent: 10, autoAlpha: 0, duration: 1.6, ease: 'expo.out' });
      gsap.to(ghost, {
        xPercent: isDesktop ? -25 : -40,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: '+=1400', scrub: 0.6 },
      });
    }

    // Cards rise in groups; each photo unveils from the bottom and zooms out
    const cards = Array.from(section.querySelectorAll('[data-lc-card]'));
    gsap.set(cards, { y: 60, autoAlpha: 0 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
        const media = batch.map((card) => card.querySelector('[data-lc-media]')).filter(Boolean);
        gsap.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: 0.08, clearProps: 'clipPath' });
        const images = media.map((item) => item.querySelector('img, svg')).filter(Boolean);
        gsap.fromTo(images, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' });
      },
    });

    // Finding / sorting moves cards around: show them all at once
    const onFiltered = () => {
      gsap.to(cards, { y: 0, autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
      ScrollTrigger.refresh();
    };
    section.addEventListener('lc:filtered', onFiltered);
    return () => section.removeEventListener('lc:filtered', onFiltered);
  }

  /* ==========================================================================
     Product page: gallery + info, details tabs, recommendations
     ========================================================================== */

  /**
   * Splits a heading into letters (each word kept on one line) and returns
   * the letter spans. Runs once per element; screen readers read the label.
   */
  function splitChars(element) {
    if (!element) return [];
    if (element.dataset.charsDone) return Array.from(element.querySelectorAll('.char'));
    const text = element.textContent.trim();
    if (!text) return [];
    element.dataset.charsDone = 'true';
    element.setAttribute('aria-label', text);
    element.classList.add('is-split');
    const fragment = document.createDocumentFragment();
    const chars = [];
    text.split(/\s+/).forEach((word, index) => {
      if (index) fragment.appendChild(document.createTextNode(' '));
      const wrap = document.createElement('span');
      wrap.className = 'char-word';
      wrap.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach((letter) => {
        const char = document.createElement('span');
        char.className = 'char';
        char.textContent = letter;
        wrap.appendChild(char);
        chars.push(char);
      });
      fragment.appendChild(wrap);
    });
    element.replaceChildren(fragment);
    return chars;
  }

  /**
   * Counts a price up from zero ("$0.00" → "$109.00"), keeping the shop's
   * money format (currency sign, thousands / decimal separators). Stops at
   * once if product.js changes the price meanwhile (another variant).
   * @returns {Function} cleanup — puts the real price back if interrupted
   */
  function countUpPrice(node, delay) {
    const original = node.textContent;
    const match = original.match(/\d[\d.,\s]*\d|\d/);
    if (!match) return () => {};
    const raw = match[0];
    const decimalMatch = raw.match(/[.,](\d{2})$/);
    const decimals = decimalMatch ? 2 : 0;
    const decimalSep = decimalMatch ? raw[raw.length - 3] : '';
    const integerPart = decimals ? raw.slice(0, -3) : raw;
    const thousandsMatch = integerPart.match(/[.,\s]/);
    const thousandsSep = thousandsMatch ? thousandsMatch[0] : '';
    const target = Number(raw.replace(/\D/g, '')) / 10 ** decimals;
    if (!target) return () => {};

    const format = (value) => {
      const [int, dec] = value.toFixed(decimals).split('.');
      const grouped = thousandsSep ? int.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep) : int;
      return original.replace(raw, dec !== undefined ? grouped + decimalSep + dec : grouped);
    };
    const counter = { value: 0 };
    let written = format(0);
    node.textContent = written;
    const tween = gsap.to(counter, {
      value: target,
      duration: 1.4,
      delay,
      ease: 'power3.out',
      onUpdate: () => {
        if (node.textContent !== written) { tween.kill(); return; } // variant changed it
        written = format(counter.value);
        node.textContent = written;
      },
      onComplete: () => {
        if (node.textContent === written) node.textContent = original;
      },
    });
    return () => {
      tween.kill();
      if (node.textContent === written) node.textContent = original;
    };
  }

  function initProductMain(section, isDesktop) {
    const intro = gsap.timeline({ delay: 0.05 });
    const cleanups = [];

    // Main photo opens from an inset rounded card and zooms out
    const main = section.querySelector('.product-gallery__main');
    if (main) {
      intro.fromTo(main, { clipPath: 'inset(6% 6% 6% 6% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.4, ease: 'expo.out', clearProps: 'clipPath' }, 0);
      // Arrows, counter, zoom and progress bars fade in once the photo is open
      const overlay = main.querySelectorAll('.product-gallery__counter, .product-gallery__zoom, .product-gallery__bars');
      if (overlay.length) intro.from(overlay, { autoAlpha: 0, y: 10, duration: 0.6, ease: 'power3.out', stagger: 0.08, clearProps: 'opacity,visibility,transform' }, 0.8);
      const firstImage = main.querySelector('.product-gallery__slide img');
      if (firstImage) intro.fromTo(firstImage, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0);
    }
    // Thumbnails slide in one by one (from the side on desktop, from below on phones)
    const thumbs = section.querySelectorAll('.product-gallery__thumb');
    if (thumbs.length) {
      // clearProps: the CSS dims inactive thumbnails (opacity) — hand it back afterwards
      intro.from(thumbs, { x: isDesktop ? -30 : 0, y: isDesktop ? 0 : 20, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, clearProps: 'opacity,visibility,transform' }, 0.2);
    }

    // Scroll: the photo frame eases back (smaller, rounder) as you scroll
    // past it, the thumbnail rail drifts at its own pace (desktop)
    if (main && isDesktop) {
      gsap.to(main, {
        scale: 0.9,
        borderRadius: 48,
        transformOrigin: '50% 0%',
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      const rail = section.querySelector('.product-gallery__thumbs');
      if (rail) gsap.to(rail, { y: 60, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    }

    const info = section.querySelector('.product__info');
    if (info) {
      // Title: letters flip up in 3D, one after another
      const title = info.querySelector('.product__title');
      const chars = splitChars(title);
      if (chars.length) {
        intro.from(chars, { yPercent: 100, rotationX: -90, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.022 }, 0.15);
      }

      // Price, text, options, buttons and trust row rise one after another
      const parts = Array.from(info.children).filter((child) => child !== title && !child.hidden && !child.contains(title));
      intro.from(parts, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, clearProps: 'opacity,visibility,transform' }, 0.35);

      // Price counts up from zero
      const price = info.querySelector('[data-price]');
      if (price) cleanups.push(countUpPrice(price, 0.45));

      // Size buttons and color swatches pop in with a bounce
      const values = info.querySelectorAll('.quick-add__value, .quick-add__swatch');
      if (values.length) intro.from(values, { scale: 0.4, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.6)', stagger: 0.035, clearProps: 'opacity,visibility,transform' }, 0.7);

      // Add to cart: a light streak sweeps across once it's in; the button
      // and ♡ lean towards the mouse (magnetic)
      const add = info.querySelector('.product__add');
      if (add) {
        intro.call(() => {
          add.classList.remove('is-shine');
          void add.offsetWidth; // restart the CSS animation
          add.classList.add('is-shine');
        }, null, 1.5);
        magnetic(add, section, 0.12);
      }
      const wish = info.querySelector('.product__wishlist');
      if (wish) magnetic(wish, section, 0.35);

      // Trust row: items slide in from the right, icons spin in
      const trustItems = info.querySelectorAll('.product__trust-item');
      if (trustItems.length) intro.from(trustItems, { x: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, clearProps: 'opacity,visibility,transform' }, 1);
      const trustIcons = info.querySelectorAll('.product__trust-icon');
      if (trustIcons.length) intro.from(trustIcons, { scale: 0, rotation: -180, duration: 0.9, ease: 'back.out(2)', stagger: 0.1 }, 1.05);
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }

  /* Big name band between the product and its details */
  function initProductMarquee(section) {
    const track = section.querySelector('[data-marquee-track]');
    if (!track) return undefined;
    const items = section.querySelectorAll('.product-marquee__item, .product-marquee__star');

    // Entrance: the band rises in
    gsap.from(track, { yPercent: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: section, start: 'top 92%', once: true } });

    // Scroll pushes the band sideways (on top of its own CSS drift)…
    gsap.fromTo(track, { xPercent: 0 }, {
      xPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
    });

    // …and the letters lean with the scroll speed, then straighten up
    const lean = gsap.quickTo(items, 'skewX', { duration: 0.5, ease: 'power3.out' });
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => lean(gsap.utils.clamp(-14, 14, self.getVelocity() / -250)),
    });
    const settle = () => lean(0);
    ScrollTrigger.addEventListener('scrollEnd', settle);
    return () => {
      trigger.kill();
      ScrollTrigger.removeEventListener('scrollEnd', settle);
      gsap.set(items, { clearProps: 'transform' });
    };
  }

  function initProductDetails(section, isDesktop) {
    const trigger = { trigger: section, start: 'top 80%', once: true };
    const reveal = gsap.timeline({ scrollTrigger: trigger });

    // Tab pills drop in with a bounce
    const tabs = section.querySelectorAll('.product-details__tab');
    if (tabs.length) reveal.from(tabs, { y: -30, scale: 0.7, autoAlpha: 0, duration: 0.8, ease: 'back.out(2.2)', stagger: 0.08 }, 0);

    // Open panel: text rises; ✓ list items slide in, their checks spin in
    const playPanel = (panel, timeline, at) => {
      const blocks = Array.from(panel.querySelectorAll('.product-details__rte > *, .product-details__panel-title'));
      const items = panel.querySelectorAll('.product-details__list li');
      const checks = panel.querySelectorAll('.product-details__check');
      if (blocks.length) timeline.from(blocks, { y: 30, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, at);
      if (items.length) timeline.from(items, { x: -40, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, at + 0.2);
      if (checks.length) timeline.from(checks, { scale: 0, rotation: -180, duration: 0.7, ease: 'back.out(2.5)', stagger: 0.08 }, at + 0.3);
    };
    const openPanel = section.querySelector('[data-tab-panel]:not([hidden])');
    if (openPanel) playPanel(openPanel, reveal, 0.2);

    // Side photo: opens as a growing circle while you scroll, the image
    // zooms out and drifts (scrubbed — follows the scroll both ways)
    const media = section.querySelector('.product-details__media');
    if (media) {
      gsap.fromTo(media, { clipPath: 'circle(12% at 50% 50%)' }, {
        clipPath: 'circle(75% at 50% 50%)',
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
      });
      const image = media.querySelector('img');
      if (image) {
        gsap.fromTo(image, { scale: 1.45, yPercent: isDesktop ? -6 : 0 }, {
          scale: 1.05,
          yPercent: isDesktop ? 6 : 0,
          ease: 'none',
          scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      }
    }

    // Switching tabs: the new panel plays the same entrance, quicker
    const onTab = (event) => {
      const panel = event.detail && event.detail.panel;
      if (!panel) return;
      const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } }).timeScale(1.6);
      playPanel(panel, timeline, 0);
    };
    section.addEventListener('product:tab', onTab);
    return () => section.removeEventListener('product:tab', onTab);
  }

  function initProductRecs(section) {
    // Cards arrive later (product.js fetches them): animate once they're in
    const reveal = () => {
      if (section.dataset.recsAnimated) return;
      const cards = Array.from(section.querySelectorAll('.product-recs__item'));
      if (!cards.length) return;
      section.dataset.recsAnimated = 'true';

      // Heading words rise, "View all" slides in from the right
      const title = section.querySelector('.product-recs__title');
      if (title) revealWords(title);
      const link = section.querySelector('.product-recs__link');
      if (link) gsap.from(link, { x: 60, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: link, start: 'top 90%', once: true } });

      // Cards tip forward in 3D (like pages turning), photos unveil from the bottom
      gsap.set(cards, { y: 100, rotationX: -40, autoAlpha: 0, transformPerspective: 1100, transformOrigin: '50% 0%' });
      ScrollTrigger.batch(cards, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { y: 0, rotationX: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out', stagger: 0.12, clearProps: 'transform' });
          const media = batch.map((card) => card.querySelector('.product-card__media')).filter(Boolean);
          gsap.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: 0.12, clearProps: 'clipPath' });
        },
      });

      // Afterwards every other card floats at a different pace (desktop)
      if (window.matchMedia('(min-width: 750px)').matches) {
        cards.forEach((card, index) => {
          const inner = card.firstElementChild;
          if (!inner) return;
          gsap.fromTo(inner, { y: index % 2 ? 40 : 0 }, {
            y: index % 2 ? -20 : 0,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          });
        });
      }
      ScrollTrigger.refresh();
    };
    reveal();
    section.addEventListener('product:recs-loaded', reveal);
    return () => {
      section.removeEventListener('product:recs-loaded', reveal);
      delete section.dataset.recsAnimated;
    };
  }

  /* ==========================================================================
     Blog post "Copy link" button (works with or without animations)
     ========================================================================== */

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-copy-link]');
    if (!button) return;
    const status = button.closest('[data-article-share]')?.querySelector('[data-copy-status]');
    const done = () => {
      if (!status) return;
      status.textContent = button.dataset.textCopied || '';
      window.setTimeout(() => { status.textContent = ''; }, 2500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(button.dataset.copyLink).then(done).catch(() => window.prompt('', button.dataset.copyLink));
    } else {
      window.prompt('', button.dataset.copyLink);
    }
  });

  /* ==========================================================================
     Setup per section (gsap.matchMedia: reduced motion + breakpoints)
     ========================================================================== */

  const INIT = {
    hero: initHero,
    split: initSplit,
    marquee: initMarquee,
    stack: initStack,
    horizontal: initHorizontal,
    quote: initQuote,
    cta: initCta,
    'contact-hero': initContactHero,
    'contact-main': initContactMain,
    'contact-map': initContactMap,
    'contact-faq': initContactFaq,
    'blog-main': initBlogMain,
    'article-main': initArticleMain,
    'article-related': initArticleRelated,
    'faq-hero': initFaqHero,
    'faq-main': initFaqMain,
    'faq-cta': initFaqCta,
    'search-main': initSearchMain,
    'list-collections-main': initListCollections,
    'product-main': initProductMain,
    'product-details': initProductDetails,
    'product-marquee': initProductMarquee,
    'product-recs': initProductRecs,
  };
  const running = new Map();
  /** Sections with effects: About ([data-about]) and Contact ([data-scroll-fx]) */
  const SELECTOR = '[data-about], [data-scroll-fx]';

  function start(section) {
    const init = INIT[section.dataset.scrollFx || section.dataset.about];
    if (!init || running.has(section)) return;
    const mm = gsap.matchMedia();
    // GSAP only calls this when at least one condition matches, so "motion"
    // (no reduced-motion preference) is what normally matches — phones included
    mm.add(
      { motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 750px)' },
      (context) => {
        if (!context.conditions.motion) return undefined;
        const cleanup = init(section, context.conditions.desktop);
        return () => {
          if (typeof cleanup === 'function') cleanup();
          section.classList.remove('is-animated');
        };
      }
    );
    running.set(section, mm);
  }

  function stop(section) {
    const mm = running.get(section);
    if (!mm) return;
    mm.revert();
    running.delete(section);
  }

  function startAll(scope) {
    scope.querySelectorAll(SELECTOR).forEach(start);
    ScrollTrigger.refresh();
  }

  startAll(document);
  // Images / fonts change heights: measure again once everything is loaded
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // Theme editor: rebuild a section after it's edited
  document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll(SELECTOR).forEach(stop);
  });
  document.addEventListener('shopify:section:load', (event) => startAll(event.target));
})();
