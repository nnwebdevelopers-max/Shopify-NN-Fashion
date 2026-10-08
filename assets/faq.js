/**
 * ============================================================================
 * faq.js — FAQ page: page text → questions, topics menu, search
 * ----------------------------------------------------------------------------
 * Loaded by: layout/theme.liquid (page template "faq"), with "defer",
 *            BEFORE assets/global-scroll-animations.js (which animates the
 *            markup built here)
 * Works with: sections/faq-main.liquid (+ snippets/faq-item.liquid),
 *             sections/faq-hero.liquid (search box)
 * CSS:        assets/faq.css
 *
 * What it does (all work without the GSAP animations):
 *  1. Page text → questions: when the FAQ page has its own text
 *     ([data-faq-page-content]), it is rebuilt into topics and questions:
 *       Heading 2  → a topic (group)
 *       Heading 3  → a question
 *       anything else → the answer of the question above it (before any
 *                       question: an intro under the topic title)
 *     Same markup as snippets/faq-item.liquid.
 *  2. Topics menu ([data-faq-nav]): one link per titled topic, with the
 *     number of questions; the topic in view is highlighted.
 *  3. Search (hero): filters questions by their question and answer text;
 *     topics without matches hide; "3 answers found" / no-results message.
 *  4. Deep links: a URL ending in a question's id (#faq-…) opens it.
 * Texts come from Liquid (locales via data-text-* attributes).
 * ============================================================================
 */

(function () {
  'use strict';

  const list = document.querySelector('[data-faq-list]');
  if (!list) return;

  /** "Orders & shipping" → "orders-shipping" (unique per page) */
  const used = new Set();
  function slug(text) {
    const base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'item';
    let id = `faq-${base}`;
    let n = 2;
    while (used.has(id) || document.getElementById(id)) id = `faq-${base}-${n++}`;
    used.add(id);
    return id;
  }

  /** Builds one question (same markup as snippets/faq-item.liquid) */
  function buildItem(questionText) {
    const details = document.createElement('details');
    details.className = 'faq-item';
    details.id = slug(questionText);
    details.dataset.faq = '';
    details.innerHTML = '<summary class="faq-item__question"><span></span><span class="faq-item__icon" aria-hidden="true"></span></summary><div class="faq-item__answer" data-faq-answer><div class="faq-item__answer-inner"></div></div>';
    details.querySelector('summary span').textContent = questionText;
    return details;
  }

  /** Builds one topic group (title may be empty) */
  function buildGroup(titleText) {
    const group = document.createElement('section');
    group.className = 'faq-group';
    group.id = slug(titleText || 'questions');
    group.dataset.faqGroup = '';
    if (titleText) {
      const heading = document.createElement('h2');
      heading.className = 'faq-group__title';
      const title = document.createElement('span');
      title.dataset.faqGroupTitle = '';
      title.textContent = titleText;
      heading.appendChild(title);
      group.appendChild(heading);
    }
    const items = document.createElement('div');
    items.className = 'faq-group__items';
    group.appendChild(items);
    return group;
  }

  /* ---------- 1. Page text → topics + questions ---------- */
  const pageContent = list.querySelector('[data-faq-page-content]');
  if (pageContent) {
    const fragment = document.createDocumentFragment();
    let group = null;
    let answer = null;
    Array.from(pageContent.childNodes).forEach((node) => {
      if (node.nodeType !== 1) return; // text / comments between blocks
      const tag = node.tagName;
      if (tag === 'H2') {
        group = buildGroup(node.textContent.trim());
        fragment.appendChild(group);
        answer = null;
      } else if (tag === 'H3' || tag === 'H4') {
        if (!group) {
          group = buildGroup('');
          fragment.appendChild(group);
        }
        const item = buildItem(node.textContent.trim());
        group.querySelector('.faq-group__items').appendChild(item);
        answer = item.querySelector('.faq-item__answer-inner');
      } else if (answer) {
        answer.appendChild(node);
      } else {
        // Text before the first question of a topic: intro under its title
        if (!group) {
          group = buildGroup('');
          fragment.appendChild(group);
        }
        node.classList.add('faq-group__intro');
        group.insertBefore(node, group.querySelector('.faq-group__items'));
      }
    });
    // Only replace when at least one question was found (otherwise keep the text)
    if (fragment.querySelector('[data-faq]')) pageContent.replaceWith(fragment);
  }

  const groups = Array.from(list.querySelectorAll('[data-faq-group]'));
  const items = Array.from(list.querySelectorAll('[data-faq]'));

  /* ---------- 2. Topics menu ---------- */
  const nav = document.querySelector('[data-faq-nav]');
  const navLinks = [];
  if (nav) {
    const navList = nav.querySelector('[data-faq-nav-list]');
    groups.forEach((group) => {
      const title = group.querySelector('[data-faq-group-title]');
      if (!title) return;
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'faq-nav__link';
      link.href = `#${group.id}`;
      link.innerHTML = '<span></span><span class="faq-nav__count"></span>';
      link.firstElementChild.textContent = title.textContent.trim();
      link.lastElementChild.textContent = group.querySelectorAll('[data-faq]').length;
      li.appendChild(link);
      navList.appendChild(li);
      navLinks.push({ link, group });
    });
    if (navLinks.length >= 2) {
      nav.hidden = false;
      list.closest('.faq-main__layout').classList.add('has-nav');
    }

    // Highlight the topic in view (the last one whose top passed 35% of the screen)
    let ticking = false;
    let lastActive = -1;
    const update = () => {
      ticking = false;
      let active = 0;
      navLinks.forEach(({ group }, index) => {
        if (!group.hidden && group.getBoundingClientRect().top < window.innerHeight * 0.35) active = index;
      });
      if (active === lastActive || !navLinks.length) return;
      lastActive = active;
      navLinks.forEach(({ link }, index) => link.setAttribute('aria-current', String(index === active)));
      // Phones: the menu is a sideways row of pills — keep the active one in view
      if (navList.scrollWidth > navList.clientWidth) {
        const link = navLinks[active].link;
        navList.scrollTo({ left: link.offsetLeft - navList.offsetLeft - 24, behavior: 'smooth' });
      }
    };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- 3. Search ---------- */
  const search = document.querySelector('[data-faq-search]');
  if (search && items.length) {
    const input = search.querySelector('[data-faq-search-input]');
    const clear = search.querySelector('[data-faq-search-clear]');
    const status = document.querySelector('[data-faq-search-status]');
    const empty = list.querySelector('[data-faq-empty]');
    const haystack = new Map(items.map((item) => [item, item.textContent.toLowerCase()]));
    search.hidden = false;

    const run = () => {
      const terms = input.value.trim().toLowerCase();
      const words = terms.split(/\s+/).filter(Boolean);
      let shown = 0;
      items.forEach((item) => {
        const match = words.every((word) => haystack.get(item).includes(word));
        item.hidden = !match;
        if (match) shown += 1;
        // Open the matches while searching (closed again when cleared)
        if (words.length) item.open = match && shown <= 3;
      });
      groups.forEach((group) => {
        group.hidden = !group.querySelector('[data-faq]:not([hidden])');
      });
      navLinks.forEach(({ link, group }) => { link.parentElement.hidden = group.hidden; });
      clear.hidden = !terms;

      if (!words.length) {
        status.textContent = '';
        empty.hidden = true;
        items.forEach((item) => { item.open = false; });
        return;
      }
      status.textContent = shown === 1 ? status.dataset.textOne : status.dataset.textOther.replace('[number]', shown);
      empty.hidden = shown > 0;
      if (!shown) empty.textContent = status.dataset.textNone.replace('[terms]', input.value.trim());
    };
    // Let the animations know (questions not yet scrolled into view are shown at once)
    const notify = () => document.dispatchEvent(new CustomEvent('faq:filtered'));

    let timer;
    input.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        run();
        notify();
      }, 120);
    });
    clear.addEventListener('click', () => {
      input.value = '';
      run();
      notify();
      input.focus();
    });
  }

  /* ---------- 4. Deep link to a question ---------- */
  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && target.matches('[data-faq]')) {
      target.open = true;
      window.setTimeout(() => target.scrollIntoView({ block: 'center' }), 300);
    }
  }
})();
