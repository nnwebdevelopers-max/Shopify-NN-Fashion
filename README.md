# NN Fashion – Shopify Theme

A custom Online Store 2.0 Shopify theme, built one page at a time.

This README maps **every page and area of the store to the files its code comes from** (HTML/Liquid, CSS, JavaScript, JSON and settings). Update it whenever a file is added, renamed, moved or deleted. See [Keeping this README up to date](#keeping-this-readme-up-to-date).

---

## Contents

- [Status](#status)
- [Folder structure](#folder-structure)
- [How a page is built](#how-a-page-is-built)
- [Global (every page)](#global-every-page)
- [Header area](#header-area)
  - [Top bar](#top-bar)
  - [Header](#header)
  - [Search popup](#search-popup)
  - [Mobile menu drawer](#mobile-menu-drawer)
  - [Promo bar](#promo-bar)
- [Footer area](#footer-area)
- [Pages](#pages)
  - [Home page](#home-page)
  - [Collection page](#collection-page)
  - [Cart page](#cart-page)
  - [Wishlist page](#wishlist-page)
  - [Compare page](#compare-page)
  - [Customer accounts](#customer-accounts)
  - [Pages not built yet](#pages-not-built-yet)
- [Reusable sections](#reusable-sections)
- [Snippets](#snippets)
- [Theme settings and translations](#theme-settings-and-translations)
- [Where CSS and JavaScript live](#where-css-and-javascript-live)
- [Conventions](#conventions)
- [Local development](#local-development)
- [Keeping this README up to date](#keeping-this-readme-up-to-date)

---

## Status

| Area / page | Status |
|---|---|
| Global layout | Done |
| Header (top bar, header with search popup, menu, mobile drawer, promo bar) | Done |
| Footer | Done |
| Home page | In progress: slideshow, features, categories, collection tabs, promo banners, sale banner, about, testimonials, blog posts, brands, rich text |
| Collection page | Done: banner, text areas, filters, sorting, grid, pagination |
| Search results page (`/search`) | Not started. The header popup's "Show all results" links to it |
| Cart page | Done: items, quantities, remove, discounts, note, checkout, Ajax updates |
| Wishlist page / compare page | Done (page templates `page.wishlist` / `page.compare`; create the pages in admin). Wishlist needs an account (setting); floating compare button |
| Customer accounts (sign-in popup, login, register, account, order, addresses, activate, reset password) | Done (needs **legacy** customer accounts, see [Customer accounts](#customer-accounts)) |
| Product page | Done: gallery, variants, add to cart, wishlist, size guide, details tabs, recommendations |
| Default page (About us…) / 404 | Done |
| Animated About page (`page.about`, GSAP) | Done — assign the template to the About us page in admin |
| Animated Contact page (`page.contact`, GSAP) | Done — assign the template to the Contact page in admin |
| Policy pages (`page.policy`) + Shopify `/policies/…` styling | Done — assign the template to the Privacy policy page in admin |
| FAQ page (`page.faq`, GSAP) | Done — create the FAQ page in admin (template **faq**) and add it to the Main menu |
| Blog page + blog posts (GSAP) | Done — add posts in admin (`blog-sample-posts.md`); post page to be checked once a post exists |
| Search results page (`search.json`, GSAP) | Done: filters, sort, type tabs, journal / page cards, popular searches + trending when nothing is found |
| All collections page (`list-collections.json`, GSAP) | Done: photo cards (mosaic), find + sort, pagination |
| Password, gift card | Not started |

---

## Folder structure

Shopify requires these folders to be **flat**: subfolders inside them are ignored or rejected. Files are grouped by **name prefix** instead (`header-`, `footer-`, `homepage-`, `collection-`, `global-`). See [Conventions](#conventions).

```
NN-Fashion/
├── assets/
│   ├── header.css                        Header: top bar, header, mega menus, mobile drawer, promo bar
│   ├── header.js                         Header: top bar rotation/close, mobile drawer, currency selector
│   ├── footer.css                        Footer: columns, newsletter, bottom bar
│   ├── header-search.css                 Header: search bar + results popup
│   ├── header-search.js                  Header: live search popup
│   ├── homepage.css                      Home page: styles for all homepage-* sections
│   ├── homepage.js                       Home page: Slideshow (hero + testimonials), CollectionTabs, ScrollSlider
│   ├── collection.css                    Collection page styles
│   ├── collection.js                     Collection + search page filtering / sorting / drawer
│   ├── search.css                        Search results page styles
│   ├── list-collections.css / .js        All collections page styles / find + sort
│   ├── cart.css / cart.js                Cart page styles / Ajax quantity, remove, note
│   ├── wishlist.css / wishlist.js        Wishlist page styles / saved-products grid
│   ├── compare.css / compare.js          Compare page styles / comparison table
│   ├── global-product-card.css           Shared: product card, action dock, quick-add popup, toast
│   ├── global-product-card.js            Shared: card actions (wishlist, compare, add to cart, quick add)
│   ├── global-buttons.css / .js          Shared: the one button system + its GSAP micro-interactions
├── blocks/                               Theme blocks reusable across sections (empty so far)
├── config/
│   └── settings_schema.json              Global theme settings (Theme editor > Theme settings)
├── layout/
│   └── theme.liquid                      Base HTML wrapper for every page
├── locales/
│   └── en.default.json                   English text strings (translations)
├── sections/
│   ├── header-group.json                 Header group: top bar + header + promo bar
│   ├── header-top-bar.liquid             Header: thin top bar
│   ├── header.liquid                     Header: search, logo, icons, main menu
│   ├── header-promo-bar.liquid           Header: colored deal bar
│   ├── header-search-results.liquid      Header: search popup results (rendered via API only)
│   ├── search-main.liquid                Search results page (/search)
│   ├── list-collections-main.liquid      All collections page (/collections)
│   ├── footer-group.json                 Footer group: footer
│   ├── footer.liquid                     Footer
│   ├── homepage-slideshow.liquid         Home page: hero banner slider
│   ├── homepage-features.liquid          Home page: icon + text strip
│   ├── homepage-categories.liquid        Home page: collection cards
│   ├── homepage-collection-tabs.liquid   Home page: collection tabs + products + View all
│   ├── homepage-promo-banners.liquid     Home page: promo cards (text panel + image)
│   ├── homepage-sale-banner.liquid       Home page: full-width sale banner
│   ├── homepage-about.liquid             Home page: about (image + text)
│   ├── homepage-testimonials.liquid      Home page: customer reviews slider
│   ├── homepage-blog-posts.liquid        Home page: latest blog articles
│   ├── homepage-brands.liquid            Home page: brand logo strip
│   ├── collection-banner.liquid          Collection page: banner
│   ├── collection-text.liquid            Collection page: text areas (top + bottom)
│   ├── collection-main.liquid            Collection page: filters, sort, product grid
│   └── global-rich-text.liquid           Shared: content section (any page; used on home page)
├── snippets/
│   ├── header-search.liquid              Header: search bar + popup markup
│   ├── header-mega-menu.liquid           Header: mega menu panel (columns + promo card)
│   ├── homepage-blog-meta.liquid         Home page: blog date · author line
│   ├── header-drawer.liquid              Header: mobile menu drawer
│   ├── header-localization-form.liquid   Header: currency / language selectors
│   ├── collection-filters.liquid         Collection page: filter groups
│   ├── global-product-card.liquid        Shared: one product in a grid (+ action dock)
│   ├── global-quick-add.liquid           Shared: quick-add popup, toast, texts for card actions (once per page)
│   └── global-icon.liquid                Shared: inline SVG icons
├── templates/                            Names fixed by Shopify (cannot be prefixed)
│   ├── index.json                        Home page
│   ├── collection.json                   Collection page
│   ├── cart.json                         Cart page
│   ├── search.json                       Search results page (/search)
│   ├── list-collections.json             All collections page (/collections)
│   ├── page.wishlist.json                Wishlist page (assign to a page in admin)
│   ├── page.compare.json                 Compare page (assign to a page in admin)
│   └── product.card.json                 Helper: one product card (/products/x?view=card), no layout
└── README.md
```

---

## How a page is built

Every storefront page is assembled in this order:

```
layout/theme.liquid
 ├── <head>                       meta, title, global CSS, global + page CSS/JS, content_for_header
 ├── sections 'header-group'      → sections/header-group.json
 │     ├── top-bar                → sections/header-top-bar.liquid
 │     ├── header                 → sections/header.liquid
 │     │     ├── mega menus       → snippets/header-mega-menu.liquid
 │     │     ├── search           → snippets/header-search.liquid
 │     │     │     └── results    → sections/header-search-results.liquid (fetched live)
 │     │     └── mobile drawer    → snippets/header-drawer.liquid
 │     └── promo-bar              → sections/header-promo-bar.liquid
 ├── <main> content_for_layout    → templates/<page>.json
 │     └── each section listed    → sections/<section>.liquid
 │           └── snippets         → snippets/<snippet>.liquid
 └── sections 'footer-group'      → sections/footer-group.json
       └── footer                 → sections/footer.liquid
```

- **Templates** (`templates/*.json`) only list which sections a page uses, plus their settings and order. They hold no HTML.
- **Sections** (`sections/*.liquid`) hold the markup and a `{% schema %}` for theme editor settings. Small, shared sections keep their CSS in a `{% stylesheet %}` block; the header and page sections load CSS/JS from `assets/` instead.
- **Snippets** (`snippets/*.liquid`) are reusable pieces of markup rendered by sections with `{% render %}`.
- **Section groups** (`sections/*-group.json`) work like templates but appear on every page (header and footer).

---

## Global (every page)

Code that loads on every page, regardless of template.

| Type | File | What it does |
|---|---|---|
| HTML / Liquid | `layout/theme.liquid` | `<html>`, `<head>` and `<body>` wrapper; renders the header group, page content and footer group |
| Meta / SEO | `layout/theme.liquid` | Charset, viewport, canonical URL, favicon, `<title>`, meta description |
| Shopify scripts | `layout/theme.liquid` → `{{ content_for_header }}` | Required by Shopify: analytics, apps, theme editor, and all section `{% stylesheet %}` CSS |
| CSS | `layout/theme.liquid` → inline `<style>` | Global base styles (see below) |
| Global assets | `layout/theme.liquid` → "Global assets" | `global-buttons.css` (first), `header.css`, `header-search.css`, `footer.css`, `global-product-card.css`, `header.js`, `header-search.js`, `global-product-card.js`, `global-gsap.min.js` (GSAP core), `global-buttons.js`; plus `global-account.css/js` when signed out (sign-in popup) |
| End of `<body>` | `layout/theme.liquid` | `global-quick-add` (popup, toast, card data), `global-compare-float` (floating compare button), `global-account-popup` (signed out only) |
| Page-specific assets | `layout/theme.liquid` → "Page-specific assets" | Loads `assets/` CSS/JS only on the template that needs them |
| Settings | `config/settings_schema.json` | Theme info, Contact (store phone), Social media, Product cards, Customer accounts |
| Text | `locales/en.default.json` | All storefront text (see [Translations](#translations-multi-language)) |

**Global CSS classes** (defined in `theme.liquid`, usable anywhere):

| Class | Purpose |
|---|---|
| `.page-width` | Content container: max 1200px, 16px side gutter |
| `.visually-hidden` | Hidden on screen, still read by screen readers |
| `.skip-link` | "Skip to content" link, visible on keyboard focus |
| `body.overflow-hidden` | Stops page scrolling behind open drawers/popups |

### Buttons (one system for the whole site)

Every button on the site — calls to action, form buttons, card / cart / account buttons, link buttons, the header cart — uses the shared **`.button`** class, so they share one look: pill shape, the site font at weight 700, uppercase with 0.08em letter spacing, 1.5px border, the same hover / focus / press / disabled / loading states. New buttons get it by adding the class.

| File | What it does |
|---|---|
| `assets/global-buttons.css` | The system: base, variants, sizes, states, `--btn-*` variables. Loaded on every page **before** the other stylesheets so a section's own CSS can recolour its buttons |
| `assets/global-buttons.js` | GSAP micro-interactions for every `.button` (event delegation, so popups / Ajax content work too): grows 3% on hover, trailing arrow nudges 4px forward, leading icon tilts, quick squeeze on press with a springy release; **magnetic** lean towards the cursor for `[data-magnetic]` / `.button--magnetic` CTAs (slideshow, sale banner, Add to cart, Check out, 404, About / Contact / FAQ CTAs). Mouse-only effects stay off on touch; nothing moves with reduced motion |
| `assets/global-gsap.min.js` | GSAP core, now loaded on every page (ScrollTrigger still only on animated pages) |

| Class | Use |
|---|---|
| `.button` | Base: dark pill (#121212) → brand red on hover. 48px tall |
| `.button--primary` | Brand red (#c8102e) → dark on hover (Add to cart, Check out, Search, 404 home) |
| `.button--dark` | Same as the base, for clarity |
| `.button--outline` | Transparent with a border in the text colour → filled dark on hover |
| `.button--light` | White, for dark backgrounds / photos → red on hover |
| `.button--ghost-light` | White outline on photos → white on hover |
| `.button--link` | Text button (no box): underline grows from the left on hover |
| `.button--sm` / `.button--lg` | 40px / 56px tall (52px on phones) |
| `.button--full` | Full width |
| `.button--icon` | Round icon-only button (♡, share, newsletter →) |
| `.is-loading` | Label hidden, spinner shown (set by scripts while sending) |

**Recolouring from section settings:** set the variables in the section's CSS instead of colours — `--btn-bg`, `--btn-text`, `--btn-border`, `--btn-hover-bg`, `--btn-hover-text`, `--btn-hover-border`, `--btn-focus` (ring), and sizes `--btn-height`, `--btn-pad-x`, `--btn-font-size`. Example: `.slideshow__button { --btn-bg: var(--slideshow-accent); }`. Old per-section button classes (`.slideshow__button`, `.cart__checkout`, `.account-form__submit`…) now only set these variables and spacing.

**Not part of the system (on purpose):** choice controls and inline adornments that aren't buttons in the CTA sense — tabs and filter / search chips, size buttons and colour swatches, quantity steppers, slider arrows and dots, the card action dock icons, icons inside search fields, close (✕) buttons.

---

## Header area

Shown at the top of every page. Rendered by `layout/theme.liquid` via `{% sections 'header-group' %}`.

```
┌ Top bar ────────────────────────────────────────────────────────────────────────┐
│ SHOP MAN  SHOP WOMAN  SHOP KIDS │ Announcement  Discover Now  × │ ☎ phone │ USD $ │
├ Header ─────────────────────────────────────────────────────────────────────────┤
│ [ Search products...  🔍 ]          DINOSAUR          👤 ACCOUNT  🎁 GIFTS  [🛍 $0] │
│ ─────────────────────────────────────────────────────────────────────────────── │
│      ALL PRODUCT ⌄   JACKETS & SWEATERS ⌄   TOP   JEANS   ON SALE   BLOG         │
├ Promo bar ──────────────────────────────────────────────────────────────────────┤
│              UP TO + 30% OFF OUTLET!   It's Mystery - Deal Time   [SHOP NOW]     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Type | File |
|---|---|
| Group (which sections, their order and default settings) | `sections/header-group.json` |
| Sections | `sections/header-top-bar.liquid`, `sections/header.liquid`, `sections/header-promo-bar.liquid` |
| Snippets | `snippets/header-search.liquid`, `snippets/header-mega-menu.liquid`, `snippets/header-drawer.liquid`, `snippets/header-localization-form.liquid`, `snippets/global-icon.liquid` |
| CSS | `assets/header.css`, `assets/header-search.css` (search) |
| JavaScript | `assets/header.js`, `assets/header-search.js` (search) |

**Edit in:** Theme editor > Header. All three sections can be hidden (eye icon), reordered or removed there.

### Top bar

Thin dark bar: small menu on the left, announcements in the center, phone and currency selector on the right. On mobile only the announcement is shown; the rest moves into the [mobile menu drawer](#mobile-menu-drawer).

| Type | Source |
|---|---|
| HTML / Liquid | `sections/header-top-bar.liquid` |
| CSS | `assets/header.css` → "1. Top bar" (`.top-bar*`), "2. Localization form" (`.localization*`) |
| JavaScript | `assets/header.js` → "1. Top bar" (rotation, pause on hover, close button), "2. Currency / language selectors" (submit on change) |
| Currency/language markup | `snippets/header-localization-form.liquid` |
| Settings (schema) | `sections/header-top-bar.liquid` → `{% schema %}` |
| Default content | `sections/header-group.json` → `"top-bar"` |
| Phone number | Theme settings > Contact (`settings.contact_phone`) |
| Currencies | Shopify admin > Settings > Markets (selector appears with 2+ countries) |

**Settings:** menu (left links), rotate announcements + speed, show close button, show phone, show currency selector, show language selector, colors (background, text, non-active menu links).
**Blocks:** `announcement` (text, link label e.g. "Discover Now", link). Up to 5.
**Close button:** remembered in the shopper's browser (`localStorage` key `nn-top-bar-dismissed`). Editing the announcement text shows it again.

### Header

Search bar (left), logo (center), Account / Gifts / Cart (right), main menu row with mega menus underneath.

| Type | Source |
|---|---|
| HTML / Liquid | `sections/header.liquid` |
| Mega menu markup | `snippets/header-mega-menu.liquid` (one per top-level item with sub-links or a promo card) |
| CSS | `assets/header.css` → "3. Main header" (`.site-header*`), "4. Main menu + mega menus" (`.main-menu*`, `.mega-menu*`), mobile layout block |
| JavaScript | `assets/header.js` → "3. Mobile menu drawer". Mega menus are CSS only (`:hover` / `:focus-within`) |
| Icons | `snippets/global-icon.liquid` |
| Settings (schema) | `sections/header.liquid` → `{% schema %}` |
| Default content | `sections/header-group.json` → `"header"` (settings + a "Mega menu promo" block) |
| Menu data | Shopify admin > Content > Menus → `main-menu` (default) |

**Settings:**
- Logo: image, text (falls back to the store name), tagline under the logo, width on desktop and on mobile
- Search: show search bar, placeholder, characters before searching (1–5, default 3), products in popup (2–10), Categories tab, popular searches (on/off + comma-separated list), search history (on/off)
- Menu: menu, highlighted items (comma-separated titles, e.g. "On sale"), highlight color
- Icons: label position (beside / below / hidden), account (on/off, label, label when logged in), gifts (on/off, label, link)
- Cart: show total, button background, button text color
- Mobile menu: secondary menu, show phone, show currency/language selectors
- Sticky header, colors (background, text, divider line)

**Blocks:** `mega_promo` ("Mega menu promo"): menu item title it belongs to, background image (optional), badge, title, text, button label + link, card/text/badge colors. One block per menu item.

**Layout:** desktop at 990px and wider; below that: ☰ / logo / icons on row 1, full-width search on row 2, menu row hidden. The ☰ button is hidden on desktop.

#### Mega menus

Every top-level menu item with sub-links (or with a promo card) opens a full-width panel (up to 1440px) on hover or keyboard focus. The open item turns the highlight color and its chevron points up.

```
┌───────────────────────────────────────────────────────────────────────────┐
│ FEATURED CATEGORIES   TRENDING STYLES    SHOP BY FIT     ┌ LIMITED DROP  ┐ │
│ ───────────────────   ───────────────    ───────────     │ STREETWEAR …  │ │
│ Urban Hoodies         Vintage Wash       Boxy Fit        │ Get up to 30% │ │
│ Flannel Shirts        Techwear           Slim Cut        │ [SHOP COLL.]  │ │
└───────────────────────────────────────────────────────────────────────────┘
```

How the menu in Shopify admin becomes columns:

| Menu structure (Content > Menus) | Result in the panel |
|---|---|
| Child link **with** its own sub-links (3rd level) | Its own column: child = heading (with line underneath), sub-links = list |
| Child links **without** sub-links | Grouped into one column, headed by the top-level item's title (shown first) |
| "Mega menu promo" block whose **Menu item** matches the top-level title | Promo card on the right |

Example for the screenshot design: menu item **All product** → children **Featured categories**, **Trending styles**, **Shop by fit** → each with their own links; plus a "Mega menu promo" block with Menu item = `All product`.

### Search popup

Opens when the shopper focuses the search bar. It touches the bottom of the search bar (no gap; `header-search.js` → `positionPopup()` measures the bar), spans the header width and fills the rest of the screen height (scrolls inside).

| Part | HTML / Liquid | CSS (`assets/header-search.css`) | JS (`assets/header-search.js`) |
|---|---|---|---|
| Search bar (×, input, 🔍) | `snippets/header-search.liquid` | "1. Search bar" | Open on focus, debounce typing, submit saves history |
| Popular Search chips + eye button | `snippets/header-search.liquid` | "2. Popup" | Chip → fills bar and searches; eye → hide/show (remembered) |
| Your Search History chips + trash | `snippets/header-search.liquid` (empty list) | "2. Popup" | Builds chips from `localStorage`; trash clears |
| Products / Categories tabs | `sections/header-search-results.liquid` | "3. Results" | Tab click + arrow keys |
| Product cards | `snippets/global-product-card.liquid` | `assets/global-product-card.css` | `assets/global-product-card.js` (card actions) |
| Show all results button | `sections/header-search-results.liquid` | "3. Results" | Saves term to history |
| Overlay | `snippets/header-search.liquid` | "2. Popup" | Click closes |

**How it works:**
1. Fewer than *N* characters typed (setting, default 3) → only Popular Search, History and a hint are shown.
2. *N* or more → after a 300 ms pause, `header-search.js` calls Shopify's Predictive Search API: `/search/suggest?q=…&resources[type]=product,collection&resources[limit]=8&section_id=header-search-results`.
3. Shopify renders `sections/header-search-results.liquid` with the results; the script inserts it into the popup. Results are cached per term.
4. "Show all results" or Enter → `/search?q=…&type=product&options[prefix]=last` (the full search page, **not built yet**).
5. Closes on ×, overlay click, Escape, or when keyboard focus leaves the search.

**Storage (shopper's browser):** `nn-search-history` (last 10 terms), `nn-popular-search-hidden` (eye button).
**`sections/header-search-results.liquid`** has no settings or presets, so it can't be added to pages. It exists only for the API.

### Mobile menu drawer

Slides in from the left when ☰ is tapped (below 990px).

| Type | Source |
|---|---|
| HTML / Liquid | `snippets/header-drawer.liquid` (rendered at the bottom of `sections/header.liquid`) |
| CSS | `assets/header.css` → "5. Mobile menu drawer" (`.drawer*`) |
| JavaScript | `assets/header.js` → "3. Mobile menu drawer": open/close, overlay, Escape, focus, closes when resized to desktop |
| Settings | `sections/header.liquid` → "Mobile menu" settings |

**Contents:** main menu, secondary menu, account link, phone, currency/language selectors.

**Main menu levels** (styles: `assets/header.css` → "5. Mobile menu drawer"):

| Level | Markup | Look |
|---|---|---|
| 1 with sub-links | `<details class="drawer__details">` + `summary.drawer__link` | Bold uppercase row with chevron; **open** = highlight color + 3px bar on the left, contents on a light tinted background |
| "View all ›" | `a.drawer__view-all` | Highlight-colored link to the level-1 page |
| 2 with its own links (e.g. "Featured categories") | `<details class="drawer__group">` + `summary.drawer__group-title` | Small bold uppercase heading with + / −; open = highlight color |
| 2 without links | `a.drawer__sublink--level2` | Plain row with a divider |
| 3 | `a.drawer__sublink` inside `.drawer__grouplist` | Indented under its heading, slightly muted |
| Current page (any level) | `aria-current="page"` | Highlight color, bold |

Accordions open automatically when the shopper is on one of their pages (`link.child_active`). Every row is at least 44px tall for easy tapping. No JavaScript needed for the accordions (`<details>`).

### Promo bar

Colored bar under the menu: highlight text, normal text and a button.

| Type | Source |
|---|---|
| HTML / Liquid | `sections/header-promo-bar.liquid` |
| CSS | `assets/header.css` → "6. Promo bar" (`.promo-bar*`) |
| JavaScript | — None |
| Settings (schema) | `sections/header-promo-bar.liquid` → `{% schema %}` |
| Default content | `sections/header-group.json` → `"promo-bar"` |

**Settings:** highlight text, text, button label, button link (button hidden until set), background (solid color or gradient), text color, highlight color, button background, button text color.
Renders nothing when all text fields are empty.

---

## Footer area

Shown at the bottom of every page. Rendered by `layout/theme.liquid` via `{% sections 'footer-group' %}`.

| Type | Source |
|---|---|
| Group | `sections/footer-group.json` (Contact us, Navigate, Top brands, Newsletter) |
| HTML / Liquid | `sections/footer.liquid` |
| CSS | `assets/footer.css` (classes `.site-footer*`), loaded on every page by `layout/theme.liquid` |
| JavaScript | — None (the newsletter is a normal Shopify form) |
| Icons | `snippets/global-icon.liquid` (social icons, arrow) |
| Settings (schema) | `sections/footer.liquid` → `{% schema %}` |
| Social links | Theme settings > Social media (`settings.social_facebook`, `_instagram`, `_pinterest`, `_youtube`, `_tiktok`, `_x`) |
| Menu data | Shopify admin > Content > Menus (`footer` → Navigate, `main-menu` → Top brands for now; create e.g. a "Top brands" menu and pick it in the block) |
| Payment icons | Shopify's SVGs for `shop.enabled_payment_types` (Settings > Payments) via `payment_type_svg_tag` |
| Text | `locales` → `footer.*` (social names, newsletter label/placeholder/button/success, payment label) |

```
CONTACT US        NAVIGATE      SHOP          TOP BRANDS    SUBSCRIBE OUR NEWSLETTERS
address           Link          Link          Link          Sign up to be…
+1(800)…          Link          Link          View all      [email address   ][→]
(f)(ig)(p)(yt)
──────────────────────────────────────────────────────────────────────────────
© 2026 Store name. Powered by Shopify                     [VISA][MC][PAYPAL]…
```

**Settings:** copyright text (falls back to the store name), show "Powered by Shopify", show payment icons, background, text, heading and accent colors, top padding.
**Blocks (one column each, up to 6):**

| Block | Fields | Notes |
|---|---|---|
| `contact` (max 1) | heading, address, phone, email, show social icons | Phone falls back to Theme settings > Contact; an icon shows only for social links that are filled in |
| `menu` | heading, menu, extra link label + link | The extra link is accent-colored, e.g. "View all" |
| `text` | heading, rich text | |
| `newsletter` (max 1) | heading, text | Shopify `customer` form: the email is added to Admin > Customers, subscribed to email marketing, tagged `newsletter`; success / error message after submit |

**Responsive:** one column per block on desktop (max 5 per row); tablets 3 per row (newsletter spans 2); phones 2 per row for menus, contact / text / newsletter full width, bottom bar stacked.
**Restricted to:** footer group.
**Edit in:** Theme editor > Footer.

---

## Pages

Each page = **global layout + header area + its template + footer area**. The tables below list only what the page adds on top of [Global](#global-every-page), [Header area](#header-area) and [Footer area](#footer-area).

### Home page

URL: `/`

| Type | Source |
|---|---|
| Template | `templates/index.json` |
| Sections (top → bottom) | 1. `slideshow` → `sections/homepage-slideshow.liquid`<br>2. `features` → `sections/homepage-features.liquid`<br>3. `categories` → `sections/homepage-categories.liquid`<br>4. `collection-tabs` → `sections/homepage-collection-tabs.liquid`<br>5. `promo-banners` → `sections/homepage-promo-banners.liquid`<br>6. `sale-banner` → `sections/homepage-sale-banner.liquid`<br>7. `about` → `sections/homepage-about.liquid`<br>8. `testimonials` → `sections/homepage-testimonials.liquid`<br>9. `blog-posts` → `sections/homepage-blog-posts.liquid`<br>10. `brands` → `sections/homepage-brands.liquid`<br>11. `intro` → `sections/global-rich-text.liquid` |
| CSS | `assets/homepage.css` (slideshow, features, categories)<br>`sections/global-rich-text.liquid` → `{% stylesheet %}` (rich text) |
| JavaScript | `assets/homepage.js` (slideshow) |
| How assets load | `layout/theme.liquid` → only when `template.name == 'index'` (JS is deferred) |
| Snippets | `snippets/global-icon.liquid` (arrows, feature icons) |
| Text | `locales/en.default.json` → `homepage.*` (slider/category labels); slide, feature and category text is typed in the theme editor |

**Edit in:** Theme editor > Home page. Sections can be added, removed and reordered there; changes are saved back into `templates/index.json`. The three `homepage-*` sections can only be added to the home page.

#### Slideshow: `sections/homepage-slideshow.liquid`

Full-width hero slider: two-line heading (second line in the accent color), subheading and button over an image.

| Part | HTML / Liquid | CSS (`assets/homepage.css`) | JS (`assets/homepage.js`) |
|---|---|---|---|
| Slides (image, mobile image, text, button) | `homepage-slideshow.liquid` | "1. Slideshow" | Fade/slide between them; only the current slide is reachable (`inert`) |
| Arrows ‹ › | `homepage-slideshow.liquid` | "1. Slideshow" → Arrows | Previous / next |
| Dots | `homepage-slideshow.liquid` | "1. Slideshow" → Dots | Go to slide; current dot gets `aria-current` |
| Autoplay | — | — | Interval; pauses on hover/focus/hidden tab; off for reduced motion |
| Swipe + keyboard ← → | — | `touch-action: pan-y` on the track | Pointer events, keydown |
| Theme editor | — | — | Selecting a slide block shows that slide and holds it |

**Settings:** height (small / medium / large / full screen), transition (fade / slide), autoplay + speed (3–10 s), show arrows, show dots, image overlay (0–80%), text color, accent color, button text color.
**Blocks (`slide`, up to 6):** image, mobile image, heading, heading second line (accent), subheading, button label + link, text position (left / center / right).
The image's focal point (Shopify admin > Content > Files) keeps the subject in view when the image is cropped.

#### Features: `sections/homepage-features.liquid`

Strip of store promises: icon, title, text.

| Type | Source |
|---|---|
| HTML / Liquid | `sections/homepage-features.liquid` |
| CSS | `assets/homepage.css` → "2. Features" (`.features*`) |
| Icons | `snippets/global-icon.liquid` (return, shield, box, truck, phone, chat, lock, star, heart, gift) or an uploaded image |
| JavaScript | — None |

**Settings:** show dividers, columns on mobile (1 / 2), top/bottom padding, icon size, icon color, background, text color.
**Blocks (`feature`, up to 6):** icon (built-in or none), custom icon image, title, text, link (optional; e.g. `tel:` for the phone item). Desktop shows one column per item.

#### Collection tabs: `sections/homepage-collection-tabs.liquid`

Heading, a row of tabs (one per collection), the selected collection's products, and a "View all" button that opens the selected collection's page.

| Part | HTML / Liquid | CSS (`assets/homepage.css` → "4. Collection tabs") | JS (`assets/homepage.js` → `CollectionTabs`) |
|---|---|---|---|
| Heading | `homepage-collection-tabs.liquid` | `.collection-tabs__heading` | — |
| Tabs | `homepage-collection-tabs.liquid` (one button per block; hidden with only 1 block) | `.collection-tabs__tab`. "Tab style" setting: **Pills** (`.collection-tabs--pills`, default: rounded bordered buttons, selected = filled) or **Underline** (`.collection-tabs--underline`: text, selected = underlined) | Click / ← → switches tabs; theme editor shows the selected block's tab |
| Products | `homepage-collection-tabs.liquid` + `snippets/global-product-card.liquid` | `.collection-tabs__grid` + `assets/global-product-card.css` | Panels shown/hidden |
| Bottom button | One per panel: the tab's button text/link, or "View all" → the tab's collection | `.collection-tabs__view-all` | — (follows the visible panel) |

**How it works:** every tab's products are rendered on the server; the script only toggles which panel is visible, so switching is instant and works with the theme editor. Without JavaScript the first tab is shown.
**Layout** ("Layout" setting; slider settings only show for "Slider"):

| Layout / slider style | Look | Markup / CSS / JS |
|---|---|---|
| Grid (multiple rows) | Extra products wrap onto new rows | `ul.collection-tabs__grid` |
| Slider → Arrows on the sides | Round ‹ › over the left/right edges; hidden at the ends | `.collection-tabs__slider--sides` |
| Slider → Arrows and dots below | ‹ ● ○ › centered under the cards; one dot per page (built by JS) | `.collection-tabs__slider--dots` |
| Slider → Progress bar | Thin bar showing position + ‹ › at the right | `.collection-tabs__slider--progress` (`--progress-size` / `--progress-left` set by JS) |
| Slider → Peek next card | ~30% of the next card visible; side arrows on desktop, swipe on touch | `.collection-tabs__slider--peek` |

The slider is a native scroll-snap row (`ul.collection-tabs__track`): swipe and trackpad work without JavaScript. `assets/homepage.js` → `ScrollSlider` (shared with the brands strip; markup hook `[data-scroll-slider]`) adds the controls (`.is-ready`), hides them when everything fits (`.is-static`), updates arrows/dots/progress on scroll, and runs the optional autoplay (pauses on hover/focus/touch, hidden tab, reduced motion; loops back to the start). Cards per view follow the column settings (`--slider-cols`). Labels: `locales` → `homepage.collection_tabs.previous / next / go_to_page / slider_label`.

**Settings:** heading, button label (empty → translated "View all"), products per tab (2–10), layout (grid / slider), slider style, slide automatically + speed (3–10 s), columns on desktop (2–5) / mobile (1–2), image ratio, second image on hover, vendor, white boxed cards, tab style (pills / underline), background, text, selected-tab color, selected-tab text color (pills), top/bottom padding.
**Blocks (`tab`, "Collection tab", up to 8):** collection, **Products to show**, tab label (optional; defaults to the collection title), and a **Bottom button** group: button text (optional; empty → the section's "Default button label" → translated "View all") and button link (optional; empty → the tab's collection page).

| Products to show | Products | Default button link |
|---|---|---|
| Featured (default) | The collection's own order (as set in Shopify admin) | The collection page |
| New arrivals | Newest first: `collection.products \| sort: 'published_at' \| reverse`. Liquid only sorts the first 50 products the collection returns | The collection page with `?sort_by=created-descending` |

For collections with more than 50 products, set the collection's sort to "Newest" in Shopify admin and use Featured, which then shows the true newest products.

**Showing products by tag or category:** create an automated collection in Shopify admin (Products > Collections > Create > Automated, condition "Product tag is equal to …" or "Product category is equal to …") and pick it in a tab.
**Responsive:** desktop = "Columns on desktop"; tablets at most 4 per row (`--tabs-columns-tablet`, set in Liquid); phones = "Columns on mobile"; the tab row wraps onto extra centered lines when it doesn't fit, so every tab is always visible.
**Text:** `locales` → `homepage.collection_tabs.*` (View all, empty message, tab-row label, placeholder tab name).

#### Promo banners: `sections/homepage-promo-banners.liquid`

Cards side by side, each a dark text panel + an image. CSS: `assets/homepage.css` → "5. Promo banners" (`.promo-banners*`). No JS.
**Settings:** cards per row (1–3), card height (small / medium / large), section background, top/bottom padding.
**Blocks (`banner`, up to 6):** image, image position (right / left), badge ("Sale on"), heading, subheading, highlight (big accent text, "15% off"), text, button label + link + style (accent / white), panel background, text color, accent color. Empty fields are hidden.
**Phones:** one card per row; below 600px the image sits on top of the text.

#### Sale banner: `sections/homepage-sale-banner.liquid`

Full-width image with a dark overlay and big centered text ("30% - 60%" / "OFF ALL SALE"). CSS: "6. Sale banner" (`.sale-banner*`). No JS.
**Settings:** image, mobile image, overlay (0–80%), heading line 1, heading line 2 (accent color, wide letter spacing), text, button label + link, height, alignment (left / center), background (no image), text and accent colors.

#### About: `sections/homepage-about.liquid`

Image beside "ABOUT US" label, heading, rich text and button. CSS: "7. About" (`.about*`). No JS.
**Settings:** image, image position (left / right), image shape (landscape / square / portrait / original), label, heading, text, button label + link, background, text, accent (label + button), top/bottom padding. Phones: image on top.

#### Testimonials: `sections/homepage-testimonials.liquid`

Customer reviews, one at a time (fade), over a dark background or image. CSS: "8. Testimonials" (`.testimonials*`). JS: `assets/homepage.js` → **`Slideshow`** (the same class as the hero slideshow; the section only uses its `data-slideshow*` hooks): arrows, dots, swipe, ← →, autoplay (pauses on hover/focus, off for reduced motion), theme editor shows the selected review.
**Settings:** heading, autoplay + speed, show arrows, show dots, background image + overlay, background color, text, accent (name, stars, dots), top/bottom padding.
**Blocks (`review`, up to 12):** title, review text, star rating (0 = hidden … 5), name, name detail ("Premium member").
**Text:** `homepage.testimonials.*` (section label, "N out of 5 stars"); arrows/dots reuse `homepage.slideshow.*`.

#### Blog posts: `sections/homepage-blog-posts.liquid`

Newest article large on the left, the next 1–4 as a compact list on the right. CSS: "9. Blog posts" (`.blog-posts*`). Snippet: `snippets/homepage-blog-meta.liquid` (date · author line; date via `time_tag`, in the shop's language). No JS.
**Settings:** heading, blog (picker), articles beside the featured one (1–4), show date / author / excerpt (featured), excerpt for the articles beside (~18 words, max 3 lines), button label (empty → translated "Read more"), background, text, accent, top/bottom padding.
Shows nothing to shoppers when the blog has no articles; in the theme editor it shows a notice (`homepage.blog.empty`). Phones: featured on top, list below.

#### Brands: `sections/homepage-brands.liquid`

Brand logo strip. CSS: "10. Brands" (`.brands*`). JS (slider layout): `assets/homepage.js` → **`ScrollSlider`** (shared with collection tabs; builds the dots, hides them when everything fits, optional autoplay that loops).
**Settings:** heading (optional), layout (slider with dots / grid), logos per row desktop (3–8) and mobile (2–4), autoplay + speed (slider), logo height, grey logos until hover, line above, background, text-logo color, active-dot color, top/bottom padding.
**Blocks (`brand`, up to 20):** logo image, brand name (alt text, or shown as text when there's no image), link.

#### Categories: `sections/homepage-categories.liquid`

Row of image cards linking to collections, title over the bottom of each card.

| Type | Source |
|---|---|
| HTML / Liquid | `sections/homepage-categories.liquid` |
| CSS | `assets/homepage.css` → "3. Categories" (`.categories*`) |
| JavaScript | — None (the mobile swipe row is CSS scroll-snap) |
| Collection data | Title and image from Shopify admin > Products > Collections, unless overridden on the block |

**Settings:** heading (optional) + alignment, cards per row on desktop (3–8), mobile layout (3 columns (default) / 2 columns / swipeable row; the grids show every category, the row hides some until swiped), top/bottom padding, image ratio (portrait 4:5 / square / landscape), corner radius, dark fade behind titles, background, text color.

**Responsive behaviour** (`assets/homepage.css` → "3. Categories"):

| Screen | Swipeable row | 2 / 3 columns |
|---|---|---|
| ≥ 1200px | "Cards per row" setting | same |
| 990–1199px | setting, max 6 (`--categories-columns-small`, set in Liquid) | same |
| 750–989px | one row, cards 140–220px, swipe for more | 3 per row |
| < 750px | one row, ~2.3 cards visible | 2 or 3 per row |
**Blocks (`category`, up to 12):** collection, custom title (optional), custom image (optional). Without a collection, the card links to "All products".

### Collection page

URL: `/collections/<handle>` (for example `/collections/all`)

| Type | Source |
|---|---|
| Template | `templates/collection.json` |
| Sections (top → bottom) | 1. `banner` → `sections/collection-banner.liquid`<br>2. `text-top` → `sections/collection-text.liquid`<br>3. `main` → `sections/collection-main.liquid`<br>4. `text-bottom` → `sections/collection-text.liquid` |
| Snippets | `snippets/collection-filters.liquid` (rendered by `collection-main`)<br>`snippets/global-product-card.liquid` (rendered by `collection-main`) |
| CSS | `assets/collection.css`: banner, text areas, toolbar, filters, drawer, grid, pagination<br>`assets/global-product-card.css`: product cards (loaded globally) |
| JavaScript | `assets/collection.js`: live filtering and sorting, Ajax pagination, URL/history sync, mobile filter drawer |
| How assets load | `layout/theme.liquid` → `collection.css` / `collection.js` only when `template.name == 'collection'` (JS is deferred) |
| Filter data | Shopify storefront filtering (`collection.filters`). Choose which filters appear in the **Shopify Search & Discovery** app |
| Sort options | Shopify (`collection.sort_options`); the default order is set per collection in admin |
| Collection data | Title, image and description from Shopify admin > Products > Collections |

**Edit in:** Theme editor > Collections > Default collection.

#### Banner: `sections/collection-banner.liquid`

| Type | Source |
|---|---|
| HTML / Liquid | `sections/collection-banner.liquid` |
| CSS | `assets/collection.css` → "1. Banner" (`.collection-banner*`) |
| JavaScript | — None |

**Settings:** show banner (on/off), banner image, use the collection image as a fallback, overlay opacity, show title, show description, height (small/medium/large), text alignment, background color (when there's no image), text color.
**Image priority:** custom banner image → collection image → plain background color.

#### Text areas: `sections/collection-text.liquid` (used twice)

| Instance | Position | Default content |
|---|---|---|
| `text-top` | Below the banner | Collection description |
| `text-bottom` | Below the products | Custom text ("About this collection") |

| Type | Source |
|---|---|
| HTML / Liquid | `sections/collection-text.liquid` |
| CSS | `assets/collection.css` → "2. Text areas" (`.collection-text*`) |
| JavaScript | — None |

**Settings:** show text area (on/off), text source (collection description / custom text), heading, custom text, alignment, top and bottom padding.

#### Product grid and filters: `sections/collection-main.liquid`

| Part | HTML / Liquid | CSS (`assets/collection.css`) | JS (`assets/collection.js`) |
|---|---|---|---|
| Toolbar (Filter button, count, sort) | `collection-main.liquid` | "3. Toolbar & layout" | Sort change → live update |
| Categories list (links to other collections) | `snippets/collection-categories.liquid` | "4b. Categories" | Keeps open/closed state; links load the other collection |
| Filter groups: color chips, size pills, star rating, checkboxes, price range | `snippets/collection-filters.liquid` | "4. Filters", "4c. Star rating", "4d. Color chips + size pills" | Input change → live update |
| Mobile filter drawer | `collection-main.liquid` | "5. Mobile filter drawer" | Open/close, overlay, Escape |
| Active filter pills + Clear all | `collection-main.liquid` | "6. Active filters" | Ajax links |
| Product grid / empty state | `collection-main.liquid` + `snippets/global-product-card.liquid` | "7. Product grid" + `global-product-card.css` | Replaced after each update |
| Pagination | `collection-main.liquid` | "8. Pagination" | Ajax links + scroll to top |
| Loading state | — | "9. Loading state" | Adds/removes `.is-loading` |

**Settings:** products per page (8–48), columns on desktop (2–5) and mobile (1–2), show collection title (for when the banner is hidden), enable filtering, enable sorting, **Categories** (show list, category menu, product counts, open by default), image ratio (portrait/square/landscape), show second image on hover, show vendor.
Card badges, swatches and sizes follow Theme settings > Product cards.

**Collection filters — what shows and where it's set up:**

| Filter | Source | How it looks |
|---|---|---|
| Categories | Section setting "Category menu" (a menu, one level of sub-links); empty → every collection with products, A–Z. Links, not form inputs: Shopify filters inside one collection only | Rows with product counts; current collection bold with a red bar |
| Variant options (Size, Color, Material…) | Search & Discovery app > Filters > add the option | Option named in Theme settings > Product cards > **Color option names** → color chips (Shopify swatch color/image, else the name as a CSS color); **Size option names** → pill buttons (crossed out when no products); others → checkboxes |
| Star rating | Search & Discovery > Filters > a **product metafield** filter whose key contains `rating`, e.g. `custom.star_rating` (Integer, 1–5) filled per product (Shopify Flow can copy a review app's `reviews.rating` into it) | ★★★★★ (count), highest first; screen readers hear "4 out of 5 stars" |
| Price, availability, product type, category, vendor, tags, other metafields | Search & Discovery > Filters | Price: From/To inputs; others: checkboxes |

The sidebar shows when filtering is on and there are categories or app filters.

**How live filtering works:**
1. Filters and the sort dropdown sit in one GET `<form>`. Without JavaScript it submits normally.
2. `collection.js` listens for changes, builds the URL (for example `?filter.v.option.size=M&sort_by=price-ascending`) and fetches it with `&section_id=<id>` (Shopify Section Rendering API), which returns only this section's HTML.
3. It swaps the regions marked `data-filters-body`, `data-active-filters`, `data-active-count`, `data-product-count`, `data-sort` and `data-results`, then updates the browser URL. Back/forward re-renders that URL.

### Cart page

URL: `/cart`

| Type | Source |
|---|---|
| Template | `templates/cart.json` |
| Section | `sections/cart-main.liquid` (items, quantity stepper, remove, line/cart discounts, custom properties, subscription name, subtotal, taxes note, checkout, express checkout buttons, empty state) |
| Summary panels | `snippets/cart-tools.liquid`: **Discount code**, **Estimate shipping**, **Add order note** (collapsible; open by themselves when they hold codes / a note) |
| Bulk delete | `sections/cart-main.liquid`: a checkbox on each item (`[data-cart-select]`, row carries `data-cart-key`) and a bar under the list with **Select all** (`[data-cart-select-all]`, shows a dash when only some are checked) and **Delete selected (n)** (`[data-cart-delete-selected]`), disabled while nothing is checked. `cart.js` → "Bulk delete": one `POST /cart/update.js` `{ updates: { <line key>: 0, … } }`; checked items stay checked across re-renders. CSS: `assets/cart.css` → "Bulk delete" (checked rows tinted pink). JS only: hidden without JavaScript. Text: `cart.select_item`, `cart.select_all`, `cart.delete_selected`, `cart.delete_selected_count` |
| CSS | `assets/cart.css` (panels: "Cart tools", `.cart-tool*`) |
| JavaScript | `assets/cart.js`: − / + / typed quantity and remove via `/cart/change.js` with the section's new HTML bundled in the response (`sections` param), header count/total refresh, stock errors shown under Check out; discount codes and order note via `/cart/update.js`; shipping estimate; requests queued; panels keep their state across re-renders |
| Country → state list | Shopify's `shopify_common.js` (`Shopify.CountryProvinceSelector`), loaded by `cart-main.liquid` when the estimate is on |
| Without JS | Normal form: "Update cart" button, remove links, Check out, order note. Discount and shipping panels are hidden (they need JS) |
| Text | `locales` → `cart.*` (incl. `cart.discount.*`, `cart.shipping.*`, `cart.note.*`); field labels reuse `customer.fields.country / province / zip` |

**Settings:** heading; **Cart tools:** show discount code field, show shipping estimate, show "Add order note"; show express checkout buttons, continue-shopping link.

**How the panels work:**

| Panel | Shopify API | Notes |
|---|---|---|
| Discount code | `POST /cart/update.js` `{ discount: "CODE1,CODE2" }` (+ `sections` for the new HTML). ✕ sends the list without that code; `""` removes all | Applied codes show as green pills; a code Shopify can't use for this cart stays as a grey "Not applied" pill with a red message. Savings appear in the summary "Discounts" row and line items (Liquid). Create codes in Admin > Discounts |
| Estimate shipping | `POST /cart/prepare_shipping_rates.json?shipping_address[country\|province\|zip]=…`, then `GET /cart/async_shipping_rates.json?…` until it stops answering 202 | Starts from the signed-in customer's default address, else the Markets country. Rates "Name ..... $4.99" (0 → "Free"); none → "we don't ship here"; Shopify's address errors (e.g. invalid ZIP) shown as given. Rates refresh automatically when the cart changes. Rates come from Settings > Shipping and delivery |
| Add order note | `POST /cart/update.js` `{ note }` 600 ms after typing stops; "Note saved" hint | Title becomes "Order note added ✓" once a note exists. Also sent with the cart form (works without JS) |

### Wishlist page

URL: the page you create, e.g. `/pages/wishlist`.

| Type | Source |
|---|---|
| Template | `templates/page.wishlist.json` — in Shopify admin: Online Store > Pages > Add page "Wishlist" > Theme template **wishlist**; then Theme editor > Header > **Wishlist page** |
| Section | `sections/wishlist-main.liquid` (title, count, Clear wishlist, grid, empty state) |
| CSS / JS | `assets/wishlist.css` / `assets/wishlist.js` |
| Data | `localStorage` `nn-wishlist-<customer id>` (handles; `nn-wishlist` when the wishlist doesn't need an account). Each card is fetched from `/products/<handle>?view=card` (`templates/product.card.json` → `sections/global-product-card-render.liquid`), so it is the normal card with its dock. Deleted products are dropped from the list automatically |
| Signed out | When Theme settings > Customer accounts > **Wishlist for signed-in customers only** is on: the section shows a "Sign in to see your wishlist" screen (lock icon, Sign in / Create account buttons) and the sign-in popup opens on load; afterwards the shopper returns here. CSS: `assets/wishlist.css` → "Signed out" |
| Text | `locales` → `wishlist.*` (incl. `locked_*`) |

**Settings:** heading, products per row desktop/mobile, image ratio, continue-shopping link.

**Wishlist and accounts:** the list is saved in the browser per customer, so it does **not** follow the customer to another device (that would need an app or metafield storage). A list saved before sign-in was required (`nn-wishlist`) is moved into the customer's list at their first sign-in.

### Compare page

URL: the page you create, e.g. `/pages/compare`.

| Type | Source |
|---|---|
| Template | `templates/page.compare.json` — admin: Pages > Add page "Compare" > Theme template **compare**; then Theme editor > Header > **Compare page** |
| Section | `sections/compare-main.liquid` (title, Clear all, table frame, empty state) |
| CSS / JS | `assets/compare.css` / `assets/compare.js` |
| Data | `localStorage` `nn-compare`; header row = product card (`?view=card`) + ✕; other rows from `/products/<handle>.js` |
| Rows | Price, availability, brand, type, one row per option name (Size, Color…), description — each switchable in the editor |
| Text | `locales` → `compare.*` |

Phones: the table scrolls sideways; the row names stay fixed on the left.

**Floating compare button** (every page except the compare page): a dark tab at the vertical middle of the screen edge with the compare icon, a red count badge and "COMPARE" written vertically. Hidden until a product is added; slides in, pops when the count changes, slides out when compare is emptied. Click → `/pages/compare` (the page with handle `compare`) in a **new tab**. A 🗑 button under it (**Clear compare list**) empties the list right there: the tab slides out, every card's ⇄ un-presses and a toast confirms. Phones: icon + count + 🗑 only.

| Type | Source |
|---|---|
| HTML / Liquid | `snippets/global-compare-float.liquid` (rendered by `layout/theme.liquid`) |
| CSS | `assets/global-product-card.css` → "Floating compare button" (`.compare-float*`) |
| JS | `assets/global-product-card.js` → `updateCompareFloat()` |
| Settings | Theme settings > Product cards > Floating compare button (on/off), position (right / left edge) |
| Text | `locales` → `compare.float_text`, `compare.float_label`, `compare.float_clear`, `compare.float_cleared` |
| JS (clear) | `assets/global-product-card.js` → click on `[data-compare-float-clear]` → `writeList('compare', [])` |

### Swatch colors (cards, product page, quick-add, filters)

Browsers only know basic color names (black, navy, olive…). Fashion names like Cream, Sand, Charcoal or Champagne are turned into colors by `snippets/global-swatch-color.liquid`, in this order:

1. Shopify's own swatch (Admin > product > option value > swatch color/image)
2. Theme settings > Product cards > **Custom swatch colors** (`Name: color` per line, e.g. `Sand: #d8c3a0`; overrides the list)
3. The built-in list (~65 colors incl. Cream, Stone, Taupe, Camel, Mocha, Charcoal, Champagne, Emerald, Forest, Burgundy, Blush, Rose, Sky; Tortoise / Leopard / Floral / Multi as patterns)
4. First, then last word of the name ("Black Floral" → black, "Dusty Rose" → rose)
5. The name as a CSS color; unknown → grey swatch (cards, product page, filters) or a text button (quick-add)

The quick-add popup gets the same list as JSON (`swatchColors` in `#ProductCardData`) and uses the same rules (`swatchFor()` in `global-product-card.js`).

### Product page

URL: `/products/<handle>`. Look: the site's own styles — size buttons, color swatches and the red ADD TO CART reuse the quick-add popup classes (`quick-add__value`, `quick-add__swatch`, `quick-add__submit` in `assets/global-product-card.css`), recommendations use the normal product cards.

| Type | Source |
|---|---|
| Template | `templates/product.json` (`main` → `details` → `recommendations`) |
| Sections | `sections/product-main.liquid` (gallery + info), `sections/product-details.liquid` (scrolling name band + tabs + image), `sections/product-recommendations.liquid` ("You may also like") |
| CSS | `assets/product.css` (1. Layout … 9. Recommendations) |
| JavaScript | `assets/product.js` (gallery, zoom, variants, add to cart, size guide, tabs, recommendations; fires `product:tab` / `product:recs-loaded`) + `assets/global-product-card.js` (♡ wishlist, cart, toast) + `assets/global-scroll-animations.js` (GSAP: `initProductMain`, `initProductDetails`, `initProductRecs`) |
| How assets load | `layout/theme.liquid` → `product.css` / `product.js` only when `template.name == 'product'`, plus GSAP + `global-scroll-animations.js` |
| Animations (GSAP) | **Top:** main photo opens from an inset rounded card and zooms out, then eases back (smaller, rounder) while you scroll past it (desktop); thumbnails slide in and drift; title letters flip up in 3D; the price counts up from 0 (keeps the money format; stops if a variant changes it); text / options / buttons rise; size buttons and swatches pop; Add to cart gets a light sweep and, with the ♡, leans towards the mouse; trust row slides in, icons spin. **Name band:** big scrolling product name (solid + outlined, ✦) — rises in, scroll pushes it sideways, letters lean with the scroll speed. **Details:** tab pills drop in; text rises, ✓ items slide in, checks spin; side photo opens as a growing circle and zooms out (scrubbed); a newly chosen tab replays its entrance. **You may also like:** heading words rise, "View all" slides in, cards tip forward in 3D with photos unveiling, then float at different paces (desktop). Sections: `data-scroll-fx="product-main"` / `"product-marquee"` / `"product-details"` / `"product-recs"`; nothing moves with reduced motion (the band stands still) |
| Text | `locales` → `products.product.*` (+ `products.card_actions.*`, `products.regular_price`) |

| Part | How it works |
|---|---|
| Gallery | Main image = scroll-snap slider in a rounded frame (swipe on phones). On the photo: "1 / 3" glass pill (top-left), ‹ › glass arrows (appear on hover, wrap around; hidden on phones), progress bars (one per image, current fills), 🔍 (opens the 2000px image in a `<dialog>`). **Zoom on hover** (desktop): the photo enlarges ×1.9 and follows the mouse; a click opens the full zoom. Thumbnail rail on the left (sticky; rounded; current one ringed, others dimmed and smaller), a row underneath on phones. Starts on / jumps to the chosen variant's image |
| Badge | Metafield `custom.badge`, else "New arrival" for products tagged `new` / `new-arrival` |
| Rating | Metafields `reviews.rating` + `reviews.rating_count` (filled by review apps); hidden when empty |
| Price | Variant price (red on sale), crossed-out compare price, "33% off" badge |
| Short description | Metafield `custom.short_description`, else the first N words of the description |
| Options | Color option names (Theme settings > Product cards) → swatches (Shopify swatch color/image, else the value as a CSS color); others → buttons. Values with no available variant crossed out; "Size: L" label; URL `?variant=` updated without reload. Without JS: a variant `<select>` in `<noscript>` |
| Size guide | Section setting "Size guide page" → "📏 Size guide" link beside the size option, page content in a popup |
| Add to cart | Shopify `product` form; JS sends it with `NNCards.addToCart` (toast + header refresh, stock errors under the button); without JS it posts to the cart. Optional "Buy it now" buttons |
| ♡ | Info column has `data-product-card` + `data-product-handle`, so `global-product-card.js` runs the button like on cards (pressed state, toast, sign-in popup when signed out) |
| Trust row | `trust` blocks (icon, title, text), max 4 |
| Details tabs | Pill buttons like the home page's "Jackets & sweaters" tabs (bordered, rounded; selected = filled black). Blocks: Description tab (product description + ✓ highlights list), Text tab (rich text), Page tab (a page's content; skipped when no page is chosen). ←/→ keys; without JS all panels show. Side image: chosen image, else the product's last image |
| Recommendations | Empty frame → `product.js` fetches `/recommendations/products?section_id=…&product_id=…&intent=related` (Section Rendering API), drops the current product, keeps "Products to show". No recommendations → "Fallback collection" |

**Settings — Product information:** image ratio, zoom, zoom on hover, sticky info column, badge, rating, short description (+ length), size guide page, "Buy it now" buttons; trust blocks. **Product details:** side image, use product's last image, scrolling name band (show, text → empty = product name); tab blocks. **Product recommendations:** heading, products to show (2–8), per row (3–5), image ratio, fallback collection, "View all" link + label.

### Customer accounts

Uses Shopify's **legacy customer accounts** (Shopify admin > Settings > Customer accounts). With **new** customer accounts Shopify hosts sign-in itself (email code) and themes can't restyle it: `/account/login`, `/account/register` and `/account` all redirect to `shopify.com/<shop id>/account`, a theme sign-up form is forwarded there too, and the `customers/*` templates are not used.

**Theme settings > Customer accounts > Sign-in method** must match the store (Liquid can't detect it reliably):
- **Shopify sign-in page** (default; new customer accounts): the popup keeps the design but shows one "Continue to sign in" button.
- **Theme forms** (legacy customer accounts): sign-in, sign-up and password reset happen inside the popup and on the theme's account pages.

Checked on 2026-10-06: the dev store (`fashion-qkmoc6so`) is on **new** customer accounts. Turning off "Shop" under Customer accounts > Authentication only removes the Shop sign-in button; it doesn't switch to legacy.

**Look (all account pages + popup):** white card with a dark side panel (red glow + rings, optional image, heading, member perks), pill tabs "Sign in | Create account" with a sliding indicator, rounded inputs with floating labels and a show/hide password eye, dark button that turns red on hover with a spinner while sending. Dashboard/order/addresses: dark greeting hero with initials, side menu (pills on phones), white rounded boxes, colored status badges.

| Page | URL | Template | Section |
|---|---|---|---|
| Sign-in popup | every page, signed out | — (`layout/theme.liquid`) | `snippets/global-account-popup.liquid` |
| Login (+ Forgot password view, guest checkout) | `/account/login` | `templates/customers/login.json` | `sections/customer-login.liquid` |
| Create account | `/account/register` | `templates/customers/register.json` | `sections/customer-register.liquid` |
| Dashboard (greeting, stats, order history, default address) | `/account` | `templates/customers/account.json` | `sections/customer-account.liquid` |
| Order (items, shipments + tracking, summary, addresses) | `/account/orders/…` | `templates/customers/order.json` | `sections/customer-order.liquid` |
| Addresses (cards, add/edit popups, delete, default) | `/account/addresses` | `templates/customers/addresses.json` | `sections/customer-addresses.liquid` |
| Activate account (invitation email) | link in email | `templates/customers/activate_account.json` | `sections/customer-activate.liquid` |
| Reset password (reset email) | link in email | `templates/customers/reset_password.json` | `sections/customer-reset-password.liquid` |

| Part | Files |
|---|---|
| Sign-in card (login / register / recover views, Shopify forms `customer_login`, `create_customer`, `recover_customer_password`) | `snippets/global-account-forms.liquid` (param `context`: popup/page, `view`) |
| Side panel | `snippets/global-account-panel.liquid` |
| Field with floating label (+ password eye) | `snippets/global-account-field.liquid` |
| Account side menu | `snippets/customer-nav.liquid` |
| Address form fields (country → state lists) | `snippets/customer-address-form.liquid` |
| CSS | `assets/global-account.css` (card, popup, sign-in pages, fields) · `assets/customer.css` (dashboard, order, addresses, dialogs) |
| JS | `assets/global-account.js` (views, tabs, password eye, popup, `window.NNAccount`) · `assets/customer.js` (address dialogs, delete confirm, `Shopify.CountryProvinceSelector` from Shopify's `shopify_common.js`) |
| Loaded | `layout/theme.liquid`: `global-account.*` when signed out or on a `customers/*` template; `customer.*` on `customers/*` templates |
| Settings | Theme settings > **Customer accounts**: wishlist for signed-in customers only, side panel image + dimming, heading, text, member perks. Dashboard section: show stats, orders per page, "Start shopping" link |
| Text | `locales` → `customer.*`, `date_formats.month_day_year` (order dates) |

**Popup triggers:** any element with `data-account-open="login|register"` (optional `data-account-message`, `data-account-return`) — header account icon and drawer account link (signed out), header ♡ link and the wishlist page buttons; the card ♡ via `window.NNAccount.open()`; `data-account-autoopen` on the signed-out wishlist page. The popup sets the forms' `return_to` so the shopper comes back to the same page (or the wishlist). A ♡ tapped while signed out is remembered (`sessionStorage` `nn-wishlist-pending`) and added right after signing in, with a toast.

### Default page (any page without its own template)

URL: `/pages/<handle>` for pages whose theme template is **Default page**. Without `templates/page.json`, Shopify shows its own plain gray "Not Found" box for these pages.

| Type | Source |
|---|---|
| Template | `templates/page.json` |
| Section | `sections/page-main.liquid` (title with red rule + page content from admin) |
| CSS | `assets/page.css` (`.page-main*`, `.page-rte` = styled editor content: headings, lists, links, images, tables, quotes, videos; `.reveal*` scroll animations) |
| JavaScript | `assets/page.js` (scroll animations, see below) |
| How assets load | `layout/theme.liquid` → `template.name == 'page'` and no suffix (wishlist / compare pages have their own) |

**Settings:** show title, content width — **Edge to edge** (default, whole screen) / Site width 1200px / Medium 960px / Narrow 760px (comfortable for long plain text) — title alignment, top/bottom padding. More sections (e.g. Rich text) can be added below. Content pasted as designed HTML (inline styles) keeps its own spacing: the theme doesn't add margins to its images.

**Scroll animations** ("Animate content on scroll", on by default; style inspired by the Athora theme) — `assets/page.js` + `assets/page.css` → "Scroll animations". The content comes from admin with no animation markup, so the script finds its parts (the children of the single wrapper box of a designed page, or of the content itself) and adds:

| Effect | How it's found | What it does | Class |
|---|---|---|---|
| Reveal | Every part; rows (flex/grid, 2+ items) → their items | Fade + rise 24px (0.6–0.7s) when scrolled into view; row items staggered 90ms (max 540ms); cards (items with an image or own background) rise from lower, slightly smaller | `.reveal`, `.reveal--card`, `.reveal--image`, `.is-visible` |
| Word-by-word headings | `h1`–`h3` ≥ 24px with plain text | Each word slides up from behind a mask, 45ms apart | `.split-words`, `.word`, `.word__inner` |
| Image zoom (scroll-linked) | Images ≥ 220px wide (wrapped in a clipping frame that copies their corners/flex/margins) | Scale 1.15 → 1 while crossing the screen | `.zoom-media` (`--zoom`) |
| Grow panel (scroll-linked, desktop) | A part with its own background + rounded corners, > 400px wide (e.g. the dark "what we stand for" box) | Opens from 6% narrower per side and rounder corners to full size by the time its top reaches 35% of the screen | `.grow-panel` (`--grow`) |
| Scroll-filled quote | Text starting with “ / " in ≥ 20px type | Words go from faint (18%) to solid as it moves from 85% to 40% of the screen | `.fill-words`, `.is-lit` |
| Hover lift | Cards, once shown | Lift 6px + soft shadow | `.reveal--card.is-done` |
| Title | Page title | Fades in; red rule draws in | — |

Scroll-linked effects share one passive scroll listener (requestAnimationFrame, only for elements near the screen) and change only transform / opacity / clip-path. Nothing is hidden without JavaScript; with the device's "reduce motion" setting nothing animates. Loaded on the default page template only (`layout/theme.liquid`).

**Designed pages in Edge to edge** (`assets/page.css`): when the content is wrapped in one box with its own `max-width` (e.g. the About us HTML: `<div style="background:#F6F3EC;max-width:1200px;margin:0 auto">`), that box is stretched to the whole screen so its **background reaches both edges**, and gets side padding that leaves a **centered 1200px column** — the parts inside keep their original layout instead of stretching across very wide screens. On screens up to 1200px nothing changes.

### About page (animated, GSAP)

Template **`page.about`** — assign it in admin: Online Store > Pages > About us > Theme template **about**. Preview without assigning: `/pages/about-us?view=about`. All text and images are edited in the theme editor (the page's own admin content isn't shown); default images point to Content > Files (`shopify://shop_images/...`).

| Section (order) | File | Scroll effect (GSAP + ScrollTrigger, `assets/global-scroll-animations.js`) |
|---|---|---|
| 1. Scroll hero | `sections/about-hero.liquid` | Pinned 3-screen stage: headline words rise in on load; floating photos (blocks, max 4) fly outward; the main photo grows from a rounded card to full screen (clip-path) while zooming out; overlay heading/text fades in |
| 2. Image with text | `sections/about-split.liquid` | Photo curtain wipe (clip-path) + zoom-out, then parallax drift; badge pops in; heading words rise |
| 3. Marquee | `sections/about-marquee.liquid` | Endless tilted text band; scrolling speeds it up, scrolling up reverses it; letters lean with scroll speed |
| 4. Stacking cards | `sections/about-stack.liquid` | Cards (blocks: emoji, title, text, colors) stick and stack; covered cards shrink, tip back and darken; heading stays in view |
| 5. Horizontal gallery | `sections/about-horizontal.liquid` | ≥ 750px: pinned, vertical scroll moves the cards sideways, photo parallax, cards lift in, progress bar. Phones: swipe row |
| 6. Quote | `sections/about-quote.liquid` | Words fill from faint to solid with the scroll (scrubbed both ways); quote mark turns and grows |
| 7. Call to action | `sections/about-cta.liquid` | Background photo zooms out on scroll; heading rises; magnetic buttons (mouse only) |

| Type | Source |
|---|---|
| Template | `templates/page.about.json` |
| CSS | `assets/about.css` — default = static, readable layout; `.is-animated` (added by the script) = animated layout (pin stages, start shapes) |
| JavaScript | `assets/global-scroll-animations.js` — shared with the Contact page (effects above + shared word-by-word headings `[data-split]` and fade-ups `[data-fade]`); About sections are found by `[data-about="<type>"]` |
| Library | GSAP 3.13 + ScrollTrigger, local copies `assets/global-gsap.min.js`, `assets/global-gsap-scrolltrigger.min.js` (GreenSock standard license, free for commercial use; license header kept in the files) |
| How assets load | `layout/theme.liquid` → `about.css` when `template.suffix == 'about'`; GSAP + ScrollTrigger + `global-scroll-animations.js` on the `about` and `contact` page templates (deferred, in that order) |
| Text | Typed in the theme editor; `locales` → `about.scroll_hint` |

**Settings (every section):** its texts / images / blocks, **Serif headings**, background, text and accent colors (defaults: cream `#F6F3EC`, dark green `#2F3A2F`, terracotta `#B8734F`).

**Robustness:** each section runs inside `gsap.matchMedia()` — no animation with the device's "reduce motion" setting (the static layout shows), clean undo/redo on resize across 750px and when a section is edited in the theme editor (`shopify:section:load/unload`); `ScrollTrigger.refresh()` after load. Without GSAP the page stays static. Note: `gsap.matchMedia` only runs when at least one condition matches, so the motion condition is `(prefers-reduced-motion: no-preference)`.

### Contact page (animated, GSAP)

Template **`page.contact`** — assign it in admin: Online Store > Pages > Contact > Theme template **contact**. Preview without assigning: `/pages/contact?view=contact`. Layout of the main section follows the Athora theme's contact page; same palette, fonts and animation engine as the About page.

| Section (order) | File | What it shows | Scroll effect (`assets/global-scroll-animations.js`) |
|---|---|---|---|
| 1. Contact hero | `sections/contact-hero.liquid` | Giant "Let's talk." heading, text, email / phone chips (empty → store email / Theme settings > Contact phone), wide photo | Heading words rise on load; photo grows from an inset rounded card to full width + zooms out (scrubbed) |
| 2. Contact form | `sections/contact-main.liquid` | Left: heading, text, info rows (blocks: Address, Email → `mailto:`, Phone → `tel:`, Custom icon + text), social icons (Theme settings > Social media). Right: Shopify `contact` form — Name, Email*, Phone (setting), Subject list (setting, comma separated), Message, Send; errors list; thank-you panel after sending | Info rows slide in, icons pop and spin; form card rises, fields slide in one by one; send button fill circle grows from the mouse position + magnetic pull; "Sending…" on submit; check mark draws itself on the thank-you panel. CSS: floating labels + accent underline on focus |
| 3. Map | `sections/contact-map.liquid` | Google Maps embed of the address (no API key; image when no address), store card: heading, address, opening hours, "Get directions" (Google Maps route) | Map wipe reveal (left → right); card slides up, then parallax (desktop) |
| 4. FAQ | `sections/contact-faq.liquid` | Questions (blocks) as `<details>`; heading on the left stays in view | Questions stagger in; answers open / close with a smooth height animation (native `<details>` when animations are off); + turns into − |

| Type | Source |
|---|---|
| Template | `templates/page.contact.json` |
| CSS | `assets/contact.css` (complete static layout; the effects only move things) |
| JavaScript | `assets/global-scroll-animations.js` → `initContactHero`, `initContactMain`, `initContactMap`, `initContactFaq`; Contact sections are found by `[data-scroll-fx="contact-…"]` |
| Library | GSAP 3.13 + ScrollTrigger (`assets/global-gsap*.min.js`), loaded on the `contact` template |
| Form | Messages go to the store email (Shopify admin > Settings > Notifications / Store details). Extra fields are sent as `contact[Phone number]`, `contact[Subject]` (names from the locale labels) |
| Text | Labels, button, messages: `locales` → `contact.*`; headings, info rows, FAQ: theme editor |

**Settings (every section):** its texts / blocks, **Serif heading**, background, text and accent colors (defaults match the About page).

#### Page fields (edit the content in Online Store > Pages > Contact)

All Contact page **content** can be edited in the page editor (Online Store > Pages > Contact, at the bottom under "Metafields"). The sections read these page fields first; any **empty** field falls back to the theme editor value, so the page never breaks. Layout, colors, fonts and the animation stay in the theme editor.

**One-time setup:** Shopify admin > **Settings > Custom data > Pages > Add definition**, once per row below. Type the name, then in **Namespace and key** type exactly the key shown, and pick the type. (The fields show on every page's editor; only the page using the `contact` template uses them.)

| # | Name (suggested) | Namespace and key | Type | Used in |
|---|---|---|---|---|
| 1 | Hero small heading | `contact.hero_eyebrow` | Single line text | Hero |
| 2 | Hero heading | `contact.hero_heading` | Single line text | Hero ("Let's talk.") |
| 3 | Hero text | `contact.hero_text` | Multi-line text | Hero |
| 4 | Hero image | `contact.hero_image` | File (accept: Images) | Hero (growing photo) |
| 5 | Email | `contact.email` | Single line text | Hero chip + form "Email" row (empty → store email) |
| 6 | Phone | `contact.phone` | Single line text | Hero chip + form "Phone" row (empty → Theme settings > Contact) |
| 7 | Address | `contact.address` | Multi-line text | Form "Address" row + map + directions |
| 8 | Form small heading | `contact.form_eyebrow` | Single line text | Form section |
| 9 | Form heading | `contact.form_heading` | Single line text | Form section ("Drop us a line.") |
| 10 | Form text | `contact.form_text` | Multi-line text | Form section |
| 11 | Extra info title | `contact.info_title` | Single line text | First "Custom info" row (e.g. Support hours) |
| 12 | Extra info text | `contact.info_text` | Multi-line text | First "Custom info" row |
| 13 | Form subjects | `contact.subjects` | Single line text | Subject list (comma separated) |
| 14 | Map small heading | `contact.map_eyebrow` | Single line text | Map card |
| 15 | Map heading | `contact.map_heading` | Single line text | Map card |
| 16 | Store hours | `contact.store_hours` | Multi-line text | Map card |
| 17 | FAQ small heading | `contact.faq_eyebrow` | Single line text | FAQ |
| 18 | FAQ heading | `contact.faq_heading` | Single line text | FAQ |
| 19 | FAQ text | `contact.faq_text` | Multi-line text | FAQ |
| 20 | FAQ questions | `contact.faq_questions` | Single line text — **List of values** | FAQ questions |
| 21 | FAQ answers | `contact.faq_answers` | Multi-line text — **List of values** | FAQ answers, paired by position with the questions |

Notes: multi-line fields keep their line breaks. When `contact.faq_questions` has values it replaces the FAQ question blocks (theme editor); keep the answers list in the same order. Code: each `sections/contact-*.liquid` reads `page.metafields.contact.<key>.value | default: <section setting>`; each section's settings start with a note about the page fields.

### Blog page and blog posts (GSAP)

URLs: `/blogs/news` (blog), `/blogs/news/<post>` (post). Layout from the Athora theme's blog; same palette, fonts and GSAP engine as the About / Contact pages. Posts are written in Shopify admin > Online Store > Blog posts — ready-to-paste sample posts: `blog-sample-posts.md` (project root, not part of the theme).

| Type | Source |
|---|---|
| Templates | `templates/blog.json` (`main` → `blog-main`), `templates/article.json` (`main` → `article-main`, `related` → `article-related`) |
| Blog page | `sections/blog-main.liquid` — cream hero ("Journal", blog title, intro, topic pills from the posts' tags → `/blogs/news/tagged/<tag>`), newest post large ("Featured", first page, no topic filter), grid of cards, pagination; **sample cards** (6, photos from Content > Files) while the blog has no posts ("Show sample posts…" setting — turn off before launch) |
| Card | `snippets/blog-card.liquid` — rounded photo with the first tag as a pill, date + reading time (words ÷ 200), title (underline grows on hover), excerpt (post excerpt, else the first 24 words), Read more →; `featured` = large two-column layout; `sample` = example data |
| Post page | `sections/article-main.liquid` — big rounded photo header with the blog pill, title, date · reading time · author over it (plain cream band without a photo), sticky share bar (Facebook, X, Pinterest, Copy link), text in a reading column (headings, images, quotes, lists styled), tags, comments + comment form when comments are on for the blog |
| Related | `sections/article-related.liquid` — "More from the journal": posts sharing a tag first, then the newest others (2–6) |
| CSS | `assets/blog.css` |
| JavaScript | `assets/global-scroll-animations.js` → `initBlogMain` (title words rise, topic pills pop, featured photo opens from an inset card — scrubbed, cards rise in groups with photos unveiling + zooming out), `initArticleMain` (photo header opens + zooms out on load then parallax, title words rise, share buttons slide in, text blocks fade up, reading progress bar), `initArticleRelated`, and the Copy-link button (works without animations) |
| How assets load | `layout/theme.liquid` → `blog.css` + GSAP + `global-scroll-animations.js` on the `blog` and `article` templates |
| Text | `locales` → `blog.*` (Journal, All, Featured, Read more, reading time, sample, share, tags, related, comments…) |

**Settings — Blog posts:** small heading, heading (empty → blog title), intro, topics, featured post, posts per page, 2/3 per row, image ratio, excerpt / date / reading time, sample posts, serif, colors. **Blog post:** reading time, author, share, tags, serif, colors. **Related posts:** heading, number, serif, colors.

### Policy pages (Privacy policy, Refund policy, Terms…)

Template **`page.policy`** — assign it in admin: Online Store > Pages > Privacy policy > Theme template **policy** (preview: `/pages/privacy-policy?view=policy`). One template for every policy page. Shopify's own pages `/policies/privacy-policy` etc. get the same styling automatically.

| Type | Source |
|---|---|
| Template | `templates/page.policy.json` |
| Section | `sections/policy-main.liquid` — cream hero ("Legal", page title, intro), "On this page" contents list + policy text, "Questions about this policy?" box (Contact page link + email), Back to top |
| Text source ("Content" setting) | **Automatic** (default): the page's own content (Online Store > Pages); when empty, the Shopify policy from **Settings > Policies** matching the page address (`privacy-policy`, `refund-policy`/`returns`, `shipping-policy`, `terms-of-service`/`terms`, `contact-information`; others → privacy policy), so the page stays in sync with Settings > Policies. Or always the page content / a chosen policy |
| CSS | `assets/policy.css` (also styles Shopify's `.shopify-policy__container` markup on `/policies/…`) |
| JavaScript | `assets/policy.js` — contents list from the text's `h2` headings (ids added; shown with 2+ headings), active section highlight (last heading above the top third; last one at the end of the page), smooth scroll + focus, dropdown on ≤ 989px (starts folded, closes after a tap), reading progress bar, Back to top after one screen. On `/policies/…` it inserts the list and progress bar itself (list title from `#PolicyTexts`, rendered by `layout/theme.liquid`) |
| How assets load | `layout/theme.liquid` → page template suffix `policy` or `request.page_type == 'policy'` |
| Text | `locales` → `policy.*` (Legal, On this page, Back to top, questions box, empty message); intro / questions box texts in the theme editor |

**Settings:** content source, small heading, intro, questions box (show, title, text, button link → empty = Contact page, email → empty = store email), serif headings, colors (same palette as About / Contact).

### FAQ page (animated, GSAP)

Template **`page.faq`** — in admin: Online Store > Pages > Add page "FAQ" > Theme template **faq** (preview on any page: `/pages/<handle>?view=faq`). To show it in the top menu: Content > Menus > Main menu > Add menu item > Pages > FAQ (menus are store data, not theme files).

| Section (order) | File | What it shows | Scroll effect (`assets/global-scroll-animations.js`) |
|---|---|---|---|
| 1. Hero | `sections/faq-hero.liquid` | "Help center", page title, text, search box | Title words rise, text and search box fade up |
| 2. Questions | `sections/faq-main.liquid` + `snippets/faq-item.liquid` | Sticky "Topics" menu (with counts; sideways pills on ≤ 989px) + topics (icon + title) with questions as `<details>` | Menu slides in, topic icons pop, questions rise in groups; answers open / close with a smooth height animation; + turns into − |
| 3. Still have questions? | `sections/faq-cta.liquid` | Dark card: icon, title, text, "Contact us" button (magnetic), store email | Card rises and scales in |

| Type | Source |
|---|---|
| Template | `templates/page.faq.json` (starter topics: Orders & shipping, Returns & exchanges, Sizing & fit, Payments, Account & wishlist) |
| Where questions come from ("Content" setting of the Questions section) | **Automatic** (default): the FAQ page's own text in Online Store > Pages, written as **Heading 2 = topic, Heading 3 = question, normal text = answer**; when the page has no text, the Topic / Question blocks in the theme editor. Or always one of the two |
| CSS | `assets/faq.css` (complete static layout; the effects only move things) |
| JavaScript | `assets/faq.js` — page text → topics + questions, Topics menu (active topic highlight), search (filters questions + topics, "N answers found", no-results message, opens the first 3 matches), deep links `#faq-…` open a question. `assets/global-scroll-animations.js` → `initFaqHero`, `initFaqMain`, `initFaqCta` (+ shared `smoothAccordion`, also used by the Contact FAQ) |
| How assets load | `layout/theme.liquid` → `faq.css` + `faq.js` on page suffix `faq`, then GSAP + `global-scroll-animations.js` (`faq.js` first, since the effects animate its markup) |
| Text | `locales` → `faq.*` (Help center, search label / placeholder / results / no results, Topics, "Still have questions?" texts, Contact us); the rest in the theme editor or the page text |

**Settings — Hero:** small heading, heading (empty → page title), text, search box, serif, colors. **Questions:** content source, serif, colors; blocks Topic (title, icon) and Question (question, answer). **Still have questions?:** title, text, button link (empty → Contact page), email (empty → store email), serif, colors.

### Search results page (GSAP)

`/search?q=…` — opened by the header search's **Show all results** button or Enter (the header sends `type=product`).

| Part | Source | Notes |
|---|---|---|
| Template | `templates/search.json` | One section: `main` |
| Section | `sections/search-main.liquid` | Dark top band ("Search", "Results for “bag”", result count, big search box with red Search button, tabs All / Products / Journal / Pages), then the results; without a search or with no results: message, **Popular searches** chips and a **Trending now** product grid |
| Results area | same markup as `sections/collection-main.liquid` | Toolbar (Filter button, count, Sort by), filters sidebar / mobile drawer (`snippets/collection-filters.liquid` with `search.filters`), active filter pills, product cards (`snippets/global-product-card.liquid`), pagination. Blog posts and pages show as cards under "From the journal & pages" |
| CSS | `assets/search.css` (top band, tabs, journal / page cards, empty states) + `assets/collection.css` (toolbar, filters, grid, pagination) | Both load when `template.name == 'search'` |
| JavaScript | `assets/collection.js` — filters, sort and pagination without reloading (the form's hidden `q`, `type`, `options[prefix]` keep the search); fires `collection:updated`. `assets/global-scroll-animations.js` → `initSearchMain` | Animations: title words rise; eyebrow, count, search box, tabs and chips pop in; a huge outlined copy of the search word slides sideways with the scroll; result cards rise in groups (again after filtering) |
| Text | `locales` → `search.page.*` (titles, result count, tabs, empty / no-results texts, Trending now, journal / page labels, Read more), `collections.*` (filters, sort, pagination) |

**Settings:** results per page, columns (desktop / mobile), type tabs, filtering, sorting, card image ratio, second image on hover, vendor, popular searches (comma-separated), trending products (show, collection → empty = all products, number), colors (top band background / text, accent).

### All collections page (GSAP)

`/collections` — every collection as a photo card (linked from menus like "Shop" / "View all").

| Part | Source | Notes |
|---|---|---|
| Template | `templates/list-collections.json` | One section: `main` |
| Section | `sections/list-collections-main.liquid` | Dark top band ("Shop by category", "All collections", text, huge outlined word), tools row (count, **Find a collection**, **Sort**), grid of cards, pagination |
| Card | `snippets/list-collections-card.liquid` | Collection photo (admin image, else first product's), product count pill, title, "Shop now →" on hover, red line grows along the bottom; mosaic: first card 2 × 2 |
| Which collections | "Collections" setting (picked, in that order) or every collection (paginated); empty ones hidden (setting) | Card photos: set them in Products > Collections > a collection > Image |
| CSS | `assets/list-collections.css` | Loaded when `template.name == 'list-collections'` (includes its own pagination look) |
| JavaScript | `assets/list-collections.js` — Find (filters cards as you type, no-match message) and Sort (Featured / Name A–Z / Z–A / Most products); fires `lc:filtered`. `assets/global-scroll-animations.js` → `initListCollections` | Animations: title words rise; eyebrow / text / tools pop in; outlined word slides with the scroll; cards rise in groups while photos unveil and zoom out |
| Text | `locales` → `list_collections.*`, `collections.product_count`, `collections.*` (pagination labels) |

**Settings:** heading (empty → translated "All collections"), text, collections, hide empty collections, collections per page, columns on desktop (3–5), large first card, card shape, colors (top band background / text, accent).

### 404 page

Any address that doesn't exist. Without `templates/404.json`, Shopify shows its plain gray "Not Found" box.

| Type | Source |
|---|---|
| Template | `templates/404.json` |
| Section | `sections/404-main.liquid` (outlined "404" with red shadow, title, text, search box → `/search`, "Back to home" + "Shop all products" buttons) |
| CSS | `assets/404.css` (`.not-found*`), loaded when `template.name == '404'` |
| Text | `locales` → `not_found.*` (+ `search.placeholder`, `search.submit`); heading/text overridable in the editor |

**Settings:** heading, text, show search box, "Shop all products" link.

### Pages not built yet

Each of these will get a JSON template plus its own main section. Until then, visiting them shows an error on the storefront.

| Page | Planned template | Planned main section |
|---|---|---|
| Password | `templates/password.json` | `sections/password-main.liquid` |
| Gift card | `templates/gift_card.liquid` (must be `.liquid`; a Shopify exception) | — |

---

## Reusable sections

Sections that can be added from the theme editor ("Add section").

| Section | File | Available on | Used on |
|---|---|---|---|
| Top bar | `sections/header-top-bar.liquid` | Header group only | Header (`top-bar`) |
| Header | `sections/header.liquid` | Header group only | Header (`header`) |
| Promo bar | `sections/header-promo-bar.liquid` | Header group only | Header (`promo-bar`) |
| Slideshow | `sections/homepage-slideshow.liquid` | Home page only | Home (`slideshow`) |
| Features | `sections/homepage-features.liquid` | Home page only | Home (`features`) |
| Categories | `sections/homepage-categories.liquid` | Home page only | Home (`categories`) |
| Collection tabs | `sections/homepage-collection-tabs.liquid` | Home page only | Home (`collection-tabs`) |
| Promo banners | `sections/homepage-promo-banners.liquid` | Home page only | Home (`promo-banners`) |
| Sale banner | `sections/homepage-sale-banner.liquid` | Home page only | Home (`sale-banner`) |
| About | `sections/homepage-about.liquid` | Home page only | Home (`about`) |
| Testimonials | `sections/homepage-testimonials.liquid` | Home page only | Home (`testimonials`) |
| Blog posts | `sections/homepage-blog-posts.liquid` | Home page only | Home (`blog-posts`) |
| Brands | `sections/homepage-brands.liquid` | Home page only | Home (`brands`) |
| Rich text | `sections/global-rich-text.liquid` | Any page | Home (`intro`) |
| Collection banner | `sections/collection-banner.liquid` | Collection pages only | Collection (`banner`) |
| Collection text | `sections/collection-text.liquid` | Collection pages only | Collection (`text-top`, `text-bottom`) |
| Product grid | `sections/collection-main.liquid` | Collection pages only | Collection (`main`) |
| Product information / Product details / Product recommendations | `sections/product-main.liquid`, `product-details.liquid`, `product-recommendations.liquid` | Product pages only | Product (`main`, `details`, `recommendations`) |
| Page content | `sections/page-main.liquid` | Page templates | Default page (`main`) |
| About: scroll hero / image with text / marquee / stacking cards / horizontal gallery / quote / call to action | `sections/about-hero.liquid`, `about-split`, `about-marquee`, `about-stack`, `about-horizontal`, `about-quote`, `about-cta` | Page templates | About page (`page.about`) |
| Contact: hero / form / map / FAQ | `sections/contact-hero.liquid`, `contact-main`, `contact-map`, `contact-faq` | Page templates | Contact page (`page.contact`) |
| Policy | `sections/policy-main.liquid` | Page templates | Policy pages (`page.policy`) |
| FAQ: hero / questions / still have questions | `sections/faq-hero.liquid`, `faq-main`, `faq-cta` | Page templates | FAQ page (`page.faq`) |
| Blog posts / Blog post / Related posts | `sections/blog-main.liquid`, `article-main`, `article-related` | Blog / article templates | Blog (`blog.json`), post (`article.json`) |
| Page not found | `sections/404-main.liquid` | 404 only | 404 (`main`) |
| Search results | `sections/search-main.liquid` | Search only | Search (`main`) |
| All collections | `sections/list-collections-main.liquid` | All collections only | `/collections` (`main`) |
| Cart | `sections/cart-main.liquid` | Cart only | Cart (`main`) |
| Wishlist | `sections/wishlist-main.liquid` | Page templates | `page.wishlist` (`main`) |
| Compare | `sections/compare-main.liquid` | Page templates | `page.compare` (`main`) |
| Customer login / register / account / order / addresses / activate / reset password | `sections/customer-*.liquid` | Their own `customers/*` template only | `templates/customers/*.json` (`main`) |

`sections/header-search-results.liquid` is not addable; it is rendered only by the search API.

---

## Product card actions (Design C)

Every product card (home page, collection pages; not in the header search popup) has a floating **action dock** on its image: shown on hover on computers, always visible on touch screens.

| Button | What happens | Code |
|---|---|---|
| ♡ Wishlist | Toggles the product (handle) in `localStorage` `nn-wishlist-<customer id>`; heart fills; toast. Signed out (and the wishlist needs an account): opens the [sign-in popup](#customer-accounts) instead and adds the product after sign-in | `global-product-card.js` → `toggleInList`, `askToSignIn` |
| ⇄ Compare | Toggles in `localStorage` `nn-compare` (max = "Products to compare at most"); toast; the [floating compare button](#compare-page) shows the count | same, `updateCompareFloat` |
| 🛍 Add to cart, no options | Adds the one variant via `/cart/add.js`; spinner on the button; toast; header `[data-cart-count]` / `[data-cart-total]` refresh from `/cart.js` | `addToCart`, `refreshCart` |
| 🛍 Add to cart, with options | Opens the **quick-add popup** (centered on desktop, bottom sheet on phones) built from `/products/<handle>.js`: color swatches (option names from Theme settings > Product cards > Color option names), value buttons, crossed-out values with no available variant, quantity, live price/compare price, variant image | `quickAdd` object |
| 🛍 Sold out | Disabled | Liquid in the card |

- **Saved state:** buttons of products already in the wishlist / compare list show as pressed on every page; cards added later (filtering, tabs) are synced by a `MutationObserver`.
- **Events for later features:** `cart:updated` (with the cart), `wishlist:updated`, `compare:updated` are dispatched on `document`, for a future cart drawer / wishlist page / compare page.
- **Settings:** Theme settings > Product cards > Quick actions (on/off, each button, compare limit).
- **Text:** `products.card_actions.*`, passed to the script as JSON by `snippets/global-quick-add.liquid` (with `[placeholders]` the script fills in).
- **Pages:** [Wishlist page](#wishlist-page), [Compare page](#compare-page), [Cart page](#cart-page). Header icons ♡ / ⇄ with live counts (`[data-wishlist-count]`, `[data-compare-count]`, red badge, hidden at 0): wishlist on, compare **off** by default — compare is reached with the floating compare button on the right edge (Theme editor > Header > "Show wishlist icon" / "Show compare icon"); they link to the chosen Wishlist / Compare page, else to the page with the handle `wishlist` / `compare`. On phones the ♡ stays, the compare icon hides. Signed out (wishlist needs an account) the ♡ opens the sign-in popup and the count is hidden.
- **Shared helpers:** `window.NNCards` (readList, writeList, storageKey, wishlistLocked, addToCart, refreshCart, showToast, formatMoney, fill, text, data) is used by `wishlist.js`, `compare.js` and `cart.js`; they wait for the `nncards:ready` event.
- **Translations:** Shopify's `t` filter HTML-escapes its output, so translated texts are never piped through `| escape` again; texts passed to JS as JSON are decoded once in `global-product-card.js`.
- **Product page:** its ♡ uses the same code (the info column is marked `data-product-card`; the title is found via `[data-product-title]`).
- **Not built yet:** cart drawer.

## Snippets

| Snippet | Parameters | Rendered by | CSS |
|---|---|---|---|
| `snippets/header-search.liquid` | `placeholder`, `min_chars`, `product_limit`, `show_collections`, `show_popular`, `popular_searches`, `show_history` | `sections/header.liquid` | `assets/header-search.css` |
| `snippets/header-mega-menu.liquid` | `link` (required), `promo` (block) | `sections/header.liquid` | `assets/header.css` → "4" |
| `snippets/homepage-blog-meta.liquid` | `article` (required), `show_date`, `show_author` | `sections/homepage-blog-posts.liquid` | `assets/homepage.css` → "9" |
| `snippets/header-drawer.liquid` | `menu`, `secondary_menu`, `highlighted`, `show_account`, `show_phone`, `show_localization` | `sections/header.liquid` | `assets/header.css` → "5" |
| `snippets/header-localization-form.liquid` | `form_id`, `show_country`, `show_language` | `header-top-bar`, `header-drawer` | `assets/header.css` → "2" |
| `snippets/global-icon.liquid` | `name` (UI: search, account, gift, cart, phone, chevron-down/left/right, close, menu, eye, eye-off, trash; features: return, shield, box, truck, chat, lock, star, heart; cards: compare, check; accounts: logout, edit, plus, bolt, arrow-left), `size` | Header files, home sections, cards, account files, filters | — (inherits text color) |
| `snippets/global-product-card.liquid` | `product` (required), `image_sizes`, `show_secondary_image`, `show_vendor`, `show_options`, `centered`, `show_actions` (false hides the action dock) | `collection-main`, `search-main`, `homepage-collection-tabs`, `header-search-results` (dock off) | `assets/global-product-card.css` |
| `snippets/global-quick-add.liquid` | — | `layout/theme.liquid` (once per page, when quick actions are on) | `assets/global-product-card.css` |
| `snippets/collection-filters.liquid` | `filters`, `section_id` | `sections/collection-main.liquid`, `sections/search-main.liquid` | `assets/collection.css` → "4. Filters" (4c, 4d) |
| `snippets/collection-categories.liquid` | `menu`, `show_count`, `open` | `sections/collection-main.liquid` | `assets/collection.css` → "4b. Categories" |
| `snippets/list-collections-card.liquid` | `collection` (required), `index`, `image_sizes`, `hide_empty` | `sections/list-collections-main.liquid` | `assets/list-collections.css` |
| `snippets/cart-tools.liquid` | `show_discount`, `show_shipping`, `show_note` | `sections/cart-main.liquid` | `assets/cart.css` → "Cart tools" |
| `snippets/global-swatch-color.liquid` | `value` (color name → outputs a CSS color/gradient; capture it) or `json: true` (whole list as JSON) | `global-product-card`, `product-main`, `collection-filters`, `global-quick-add` (JSON → `global-product-card.js` `swatchFor()`) | — |
| `snippets/global-compare-float.liquid` | — | `layout/theme.liquid` | `assets/global-product-card.css` |
| `snippets/global-account-popup.liquid` | — | `layout/theme.liquid` (signed out, not on account pages) | `assets/global-account.css` |
| `snippets/global-account-forms.liquid` | `context` (popup/page), `view` (login/register/recover) | `global-account-popup`, `customer-login`, `customer-register` | `assets/global-account.css` |
| `snippets/global-account-panel.liquid` | — | `global-account-forms`, `customer-activate`, `customer-reset-password` | `assets/global-account.css` |
| `snippets/global-account-field.liquid` | `id`, `name`, `label` (required), `type`, `value`, `autocomplete`, `required`, `autofocus` | Account forms, `customer-address-form` | `assets/global-account.css` |
| `snippets/customer-nav.liquid` | `current` (dashboard/addresses) | `customer-account`, `customer-order`, `customer-addresses` | `assets/customer.css` |
| `snippets/customer-address-form.liquid` | `form` | `customer-addresses` | `assets/global-account.css`, `assets/customer.css` |

---

## Theme settings and translations

| File | Purpose | Current contents |
|---|---|---|
| `config/settings_schema.json` | Global settings shown in Theme editor > Theme settings | **Theme info** (name, version; documentation/support URLs are placeholders to replace)<br>**Contact:** store phone (used by the top bar, mobile drawer and footer)<br>**Social media:** Facebook, Instagram, Pinterest, YouTube, TikTok, X links (footer icons)<br>**Product cards:** sale badge (-% / "Sale" / hidden), color swatches + option names, **custom swatch colors** ("Name: color" lines), sizes + option names, values before "+N"; **Quick actions:** on/off, wishlist / compare / add-to-cart buttons, compare limit (2–6), floating compare button (on/off, right/left edge)<br>**Customer accounts:** wishlist for signed-in customers only; sign-in side panel image, dimming, heading, text, member perks |
| `locales/en.default.json` | **All storefront text** (English, the default language), read with the `t` filter | See key groups below |

Plain JSON files: comments are not allowed in them.

### Translations (multi-language)

**Rule: no storefront text is hard-coded.** Every word a shopper can see or hear (screen-reader labels too) comes from `locales/<language>.json` through the `t` filter:

```liquid
{{ 'collections.sort_by' | t }}                                  → "Sort by"
{{ 'collections.product_count' | t: count: 24 }}                 → "24 products" (plural forms per language)
{{ 'search.no_results' | t: terms: predictive_search.terms }}    → values are escaped by t; don't pre-escape
```

**Key groups in `locales/en.default.json`:**

| Group | Used by |
|---|---|
| `general.*` | `layout/theme.liquid` (skip link, "tagged …", "Page …" in the page title); `general.slider.go_to_page` (brand slider dots) |
| `header.*` | `header-top-bar`, `header`, `header-drawer` (menu labels, account, gifts, cart label) |
| `localization.*` | `header-localization-form` |
| `search.*` | `header-search`, `header-search-results`, `assets/header-search.js`; `search.page.*` → `search-main` (search results page) |
| `list_collections.*` | `list-collections-main`, `list-collections-card` (titles, count, find / sort texts, no-match message via data attribute, Shop now) |
| `products.*` | `products.product.*` → product page (`product-main`, `product-details`, `product-recommendations`); `global-product-card` (Sold out, Sale, -%, From …, Regular price); `products.card_actions.*` → dock labels, quick-add popup, toast messages (passed to `global-product-card.js` through `global-quick-add.liquid`) |
| `footer.*` | `footer` (social network names, newsletter label / placeholder / button / success, payment methods label) |
| `not_found.*` | `404-main` (404, title, text, search label, buttons) |
| `about.*` | `about-hero` ("Scroll" hint) |
| `blog.*` | `blog-main`, `blog-card`, `article-main`, `article-related` |
| `policy.*` | `policy-main` + `policy.js` (Legal, On this page, Back to top, questions box, empty message) |
| `faq.*` | `faq-hero` (Help center, search texts; results / no-results via data attributes for `faq.js`), `faq-main` (Topics), `faq-cta` (title, text, Contact us) |
| `contact.*` | `contact-main` (form labels, button, sending / success / error texts, info row titles, "Follow us"), `contact-map` (map title, "Get directions"), `contact-faq` (list label) |
| `homepage.*` | `homepage-slideshow` (slider labels), `homepage-categories` (section label, placeholder title), `homepage-collection-tabs` (View all, empty message, slider labels), `homepage-testimonials` (label, star rating; arrows/dots reuse `homepage.slideshow.*`), `homepage-blog-posts` (Read more, empty notice), `homepage-brands` (label) |
| `collections.*` | `collection-main`, `collection-filters` |
| `cart.*` | `cart-main`, `cart-tools` (`discount.*`, `shipping.*`, `note.*`) (+ `cart.js` texts via data attributes; "Continue shopping" also used by wishlist/compare) |
| `wishlist.*` | `wishlist-main` (incl. signed-out screen `locked_*`), header ♡ label |
| `compare.*` | `compare-main`, header ⇄ label, floating compare button (`float_*`) |
| `customer.*` | Sign-in popup + pages (`panel`, `popup`, `fields`, `login`, `register`, `recover`, `activate`, `reset`), `customer-account` (`account`), `customer-order` (`order`), `customer-addresses` (`addresses`) |
| `date_formats.*` | Dates on the account pages (`date: format: 'month_day_year'`) |

**JavaScript text:** scripts contain no text. The Liquid markup passes translated strings as `data-text-*` attributes (e.g. `snippets/header-search.liquid` → `data-text-unavailable`), and the script reads them.

**Text typed in the theme editor** (announcements, promo bar, mega menu promo cards, rich text, footer headings): this is store content, not theme text. Translate it per language in Shopify's free **Translate & Adapt** app. A few header labels (search placeholder, Account, My account, Gifts) are **empty by default** so they fall back to the translated text; filling them in overrides it.

**Adding a language** (e.g. French):
1. Shopify admin > Settings > Languages > add French.
2. Copy `locales/en.default.json` to `locales/fr.json` and translate the values (keep the keys and `{{ placeholders }}`), or let Translate & Adapt translate the theme text.
3. Translate the theme editor content in Translate & Adapt.

**Not translated yet:** the labels inside the theme editor itself ("Logo width", "Show search bar"). Only the store owner sees them; they can be moved to `locales/en.default.schema.json` later if the theme needs an editor in other languages.

---

## Where CSS and JavaScript live

| Code | Location | Loaded |
|---|---|---|
| Global CSS | `layout/theme.liquid` → `<style>` | Every page |
| Header + shared component files | `assets/` (see table below) | Every page |
| Section CSS (rich text) | The section's `{% stylesheet %}` block | Every page. Shopify bundles them via `content_for_header` |
| Page CSS/JS files | `assets/` | Only on their template |

**Asset files:**

| File | Type | Loaded on | Used by |
|---|---|---|---|
| `assets/global-buttons.css` | CSS (first) | Every page | Every `.button` (see [Buttons](#buttons-one-system-for-the-whole-site)) |
| `assets/global-buttons.js` | JS (deferred) | Every page | GSAP hover / press / magnetic for every `.button` |
| `assets/header.css` | CSS | Every page | `header-top-bar`, `header`, `header-mega-menu`, `header-promo-bar`, `header-drawer`, `header-localization-form` |
| `assets/header.js` | JS (deferred) | Every page | `header-top-bar`, `header`, `header-drawer`, `header-localization-form` |
| `assets/footer.css` | CSS | Every page | `footer` |
| `assets/header-search.css` | CSS | Every page | `header-search`, `header-search-results` |
| `assets/header-search.js` | JS (deferred) | Every page | `header-search`, `header-search-results` |
| `assets/global-product-card.css` | CSS | Every page | `global-product-card` (cards + action dock), `global-quick-add` (popup, toast) |
| `assets/global-product-card.js` | JS (deferred) | Every page | `global-product-card` + `global-quick-add`: wishlist, compare, add to cart, quick-add popup, header cart refresh |
| `assets/homepage.css` | CSS | Home | All `homepage-*` sections (parts 1–10) |
| `assets/homepage.js` | JS (deferred) | Home | `Slideshow`: `homepage-slideshow`, `homepage-testimonials` · `CollectionTabs` + `ScrollSlider`: `homepage-collection-tabs` · `ScrollSlider`: `homepage-brands` |
| `assets/collection.css` | CSS | Collection + search results | `collection-banner`, `collection-text`, `collection-main`, `collection-filters`, `search-main` (results area) |
| `assets/collection.js` | JS (deferred) | Collection + search results | `collection-main`, `search-main`, `collection-filters`, `collection-categories` |
| `assets/search.css` | CSS | Search results | `search-main` (top band, tabs, journal / page cards, empty states) |
| `assets/list-collections.css` / `list-collections.js` | CSS / JS (deferred) | All collections | `list-collections-main`, `list-collections-card` (find + sort) |
| `assets/cart.css` / `cart.js` | CSS / JS | Cart | `cart-main`, `cart-tools` |
| `assets/product.css` / `product.js` | CSS / JS (deferred) | Product | `product-main`, `product-details`, `product-recommendations` |
| `assets/about.css` | CSS | About page (`page.about`) | `about-*` sections |
| `assets/contact.css` | CSS | Contact page (`page.contact`) | `contact-*` sections |
| `assets/blog.css` | CSS | Blog + blog posts | `blog-main`, `blog-card`, `article-main`, `article-related` |
| `assets/policy.css` / `policy.js` | CSS / JS (deferred) | Policy pages (`page.policy`) + Shopify `/policies/…` | `policy-main`, Shopify's policy markup |
| `assets/faq.css` / `faq.js` | CSS / JS (deferred) | FAQ page (`page.faq`) | `faq-*` sections, `faq-item` (page text → questions, topics menu, search) |
| `assets/global-scroll-animations.js` | JS (deferred) | About, Contact, FAQ pages, blog + posts | GSAP scroll effects for `about-*` (`[data-about]`) and `contact-*` / `faq-*` / `blog-*` / `article-*` (`[data-scroll-fx]`) sections |
| `assets/global-gsap.min.js` | JS library (deferred) | Every page | GSAP 3.13 core: `global-buttons.js`, `global-scroll-animations.js` |
| `assets/global-gsap-scrolltrigger.min.js` | JS library (deferred) | About, Contact, FAQ, blog + posts, search, all collections, product | `global-scroll-animations.js` (ScrollTrigger) |
| `assets/page.css` / `page.js` | CSS / JS (deferred) | Default page | `page-main` (layout, content styles, scroll animations) |
| `assets/404.css` | CSS | 404 | `404-main` |
| `assets/wishlist.css` / `wishlist.js` | CSS / JS | Wishlist page | `wishlist-main` |
| `assets/compare.css` / `compare.js` | CSS / JS | Compare page | `compare-main` |
| `assets/global-account.css` / `global-account.js` | CSS / JS (deferred) | Signed out, and `customers/*` templates | Sign-in popup, `customer-login`, `customer-register`, `customer-activate`, `customer-reset-password`, address form fields |
| `assets/customer.css` / `customer.js` | CSS / JS (deferred) | `customers/*` templates | `customer-account`, `customer-order`, `customer-addresses`, `customer-nav` |

**Per section / snippet:**

| Section / snippet | CSS | JS |
|---|---|---|
| `header-top-bar.liquid` | `assets/header.css` | `assets/header.js` |
| `header.liquid` | `assets/header.css` | `assets/header.js` |
| `header-promo-bar.liquid` | `assets/header.css` | — |
| `header-search-results.liquid` | `assets/header-search.css` | `assets/header-search.js` |
| `snippets/header-search.liquid` | `assets/header-search.css` | `assets/header-search.js` |
| `snippets/header-mega-menu.liquid` | `assets/header.css` | — (CSS only) |
| `snippets/header-drawer.liquid` | `assets/header.css` | `assets/header.js` |
| `snippets/header-localization-form.liquid` | `assets/header.css` | `assets/header.js` |
| `footer.liquid` | `assets/footer.css` | — |
| `global-rich-text.liquid` | `{% stylesheet %}` | — |
| `homepage-slideshow.liquid` | `assets/homepage.css` | `assets/homepage.js` |
| `homepage-features.liquid` | `assets/homepage.css` | — |
| `homepage-categories.liquid` | `assets/homepage.css` | — |
| `homepage-collection-tabs.liquid` | `assets/homepage.css`, `assets/global-product-card.css` | `assets/homepage.js` |
| `homepage-promo-banners.liquid` | `assets/homepage.css` | — |
| `homepage-sale-banner.liquid` | `assets/homepage.css` | — |
| `homepage-about.liquid` | `assets/homepage.css` | — |
| `homepage-testimonials.liquid` | `assets/homepage.css` | `assets/homepage.js` (`Slideshow`) |
| `homepage-blog-posts.liquid` + `snippets/homepage-blog-meta.liquid` | `assets/homepage.css` | — |
| `homepage-brands.liquid` | `assets/homepage.css` | `assets/homepage.js` (`ScrollSlider`, slider layout) |
| `collection-banner.liquid` | `assets/collection.css` | — |
| `collection-text.liquid` | `assets/collection.css` | — |
| `collection-main.liquid` | `assets/collection.css` | `assets/collection.js` |
| `search-main.liquid` | `assets/search.css` + `assets/collection.css` | `assets/collection.js`, `assets/global-scroll-animations.js` |
| `list-collections-main.liquid` + `snippets/list-collections-card.liquid` | `assets/list-collections.css` | `assets/list-collections.js`, `assets/global-scroll-animations.js` |
| `snippets/collection-filters.liquid` | `assets/collection.css` | `assets/collection.js` |
| `snippets/global-product-card.liquid` | `assets/global-product-card.css` | `assets/global-product-card.js` |
| `snippets/global-quick-add.liquid` | `assets/global-product-card.css` | `assets/global-product-card.js` |
| `snippets/global-compare-float.liquid` | `assets/global-product-card.css` | `assets/global-product-card.js` |
| `snippets/collection-categories.liquid` | `assets/collection.css` | `assets/collection.js` (open state) |
| `snippets/global-account-popup.liquid`, `global-account-forms`, `global-account-panel`, `global-account-field` | `assets/global-account.css` | `assets/global-account.js` |
| `customer-login.liquid`, `customer-register.liquid`, `customer-activate.liquid`, `customer-reset-password.liquid` | `assets/global-account.css` | `assets/global-account.js` |
| `customer-account.liquid`, `customer-order.liquid` + `snippets/customer-nav.liquid` | `assets/customer.css` | — (`global-product-card.js` fills the wishlist count) |
| `customer-addresses.liquid` + `snippets/customer-address-form.liquid` | `assets/customer.css`, `assets/global-account.css` | `assets/customer.js` (+ Shopify `shopify_common.js`) |

**Browser storage used by the theme (`localStorage`):** `nn-top-bar-dismissed`, `nn-search-history`, `nn-popular-search-hidden`, `nn-wishlist-<customer id>` (or `nn-wishlist`), `nn-compare`. **`sessionStorage`:** `nn-wishlist-pending` (♡ tapped before signing in).

---

## Conventions

- **JSON templates only.** Every page uses `templates/<page>.json` (exception: `gift_card.liquid`).
- **Build page by page.** Only add files for the page currently being built.
- **CSS/JS in separate files.** Each page's or area's styles and scripts live in `assets/<page>.css` / `assets/<page>.js` (e.g. `header.css`, `collection.js`). Page files load in `layout/theme.liquid` only for that template; header files load everywhere. Code shared by several areas uses the `global-` prefix (e.g. `global-product-card.css`).
- **Every file is commented:**
  - Liquid files: a header comment (purpose, where it's used, CSS/JS files, where to edit), comments on each logical part.
  - CSS files: a header listing which files they style, and numbered sections.
  - JS files: a header explaining what the script does, plus JSDoc on functions.
  - `{% schema %}` JSON can't hold comments, so a summary of its settings goes in a Liquid comment just above it.
  - JSON templates/groups: one `/* */` comment at the top (Shopify replaces it when saving from the theme editor).
- **File naming:** folders must stay flat, so every file starts with the area or page its code belongs to:
  - `header-*`: header area (top bar, header, search, mega menu, drawer, promo bar). `header.css`, `header.js`, `header.liquid` count too.
  - `footer-*`: footer area
  - `homepage-*`: home page only
  - `<page>-*`: one page only, e.g. `collection-banner.liquid`, `collection.css`, later `product-main.liquid`
  - `global-*`: shared by several areas or pages, e.g. `global-product-card.liquid`, `global-icon.liquid`, `global-rich-text.liquid`
  - Fixed by Shopify, cannot be renamed: `templates/<page>.json`, `layout/theme.liquid`, `config/settings_schema.json`, `locales/*.json`
- **CSS naming:** BEM-style: `.block`, `.block__element`, `.block--modifier` (e.g. `.site-header__logo`, `.site-header--sticky`).
- **Per-section colors and sizes** are passed from settings into CSS custom properties on the section's wrapper (e.g. `--header-bg`, `--cols-desktop`).
- **Buttons:** always the shared `.button` + a variant / size class (see [Buttons](#buttons-one-system-for-the-whole-site)); give it a section class only for spacing or `--btn-*` colours. Don't restyle radius, font or padding per section.
- **No hard-coded storefront text.** Every visible or screen-reader string goes in `locales/en.default.json` and is output with `{{ 'group.key' | t }}`; JS gets its text through `data-text-*` attributes. See [Translations](#translations-multi-language).
- **JS hooks** use `data-*` attributes (e.g. `data-filters-form`), not CSS classes, so styling changes can't break scripts.
- **Breakpoints:** 990px (header desktop/mobile), 750px (smaller layout tweaks).

---

## Local development

Requires [Shopify CLI](https://shopify.dev/docs/api/shopify-cli).

```bash
# Live preview with hot reload
shopify theme dev --store your-store.myshopify.com

# Lint the theme
shopify theme check

# Upload to the store
shopify theme push
```

---

## Keeping this README up to date

When you add, rename or delete a file:

1. Update the [Folder structure](#folder-structure) tree.
2. Update the page or area table it belongs to (HTML, CSS, JS, settings, snippets, assets).
3. If it's a new page, move it from [Pages not built yet](#pages-not-built-yet) to its own section under [Pages](#pages).
4. If it's a reusable section or snippet, add it to [Reusable sections](#reusable-sections) or [Snippets](#snippets).
5. Update [Where CSS and JavaScript live](#where-css-and-javascript-live) if it adds CSS or JS.
6. Update [Status](#status).
