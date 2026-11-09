# NN Fashion

A custom Shopify Online Store 2.0 theme (design "Soft Studio") for a fashion store, built by NN Developers.

## Features

- Bento hero, shop-by-edit tiles, tabbed product rail, sale banner, brand marquee, testimonials, journal posts (all editable sections)
- Multiple menu styles driven by the main menu: columns, tiles, tabs and simple dropdown (matched by menu item title)
- Wishlist and compare (saved in the shopper's browser) with a compare sidebar, wishlist page and compare page
- Collection page: banner, category chips, popover filters, sort, grid density, editor's-pick tile, load more
- Product page: editorial stack with sticky buy card, variant-aware gallery, marquee, material / fit / care cards, docked add-to-cart bar
- Quick view, cart drawer, predictive search, blog, article, about, lookbook, size guide, FAQ and contact pages
- GSAP animations (scroll reveals, hero entrance, counters, marquee) with a theme setting to turn them off
- Seven colour schemes, dark scheme and optional shopper colour switcher

## Structure

| Folder | Contents |
| --- | --- |
| `assets/` | `base.css`, `fashion.css`, `theme.js`, `motion.js` |
| `config/` | Theme settings schema and data |
| `layout/` | `theme.liquid`, `password.liquid` |
| `locales/` | Translations |
| `sections/` | Page sections and section groups (header, footer) |
| `snippets/` | Product card, art, icons, mega menu, price, etc. |
| `templates/` | JSON templates incl. page.about, page.lookbook, page.size-guide, page.wishlist, page.compare |

## Content conventions

- Product metafields: `custom.material`, `custom.care`, `custom.fit_note`, `custom.rating`, `custom.rating_count`, `custom.art`, `custom.badge`
- Menus: `main-menu` (Shop = columns, Women = tiles, Men = tabs), `footer`, `footer-help`, `footer-company`, `categories`
- Wishlist and compare pages use the `page.wishlist` and `page.compare` templates

## Development

```bash
shopify theme dev --store <your-store>.myshopify.com
shopify theme push
```
