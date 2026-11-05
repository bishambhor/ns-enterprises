# NS Enterprises — Skincare Showcase Website

The official showcase website for **NS Enterprises**, a skincare shop. The site presents the products available in-store so customers can browse the range and check availability over WhatsApp.

**Live site:** https://bishambhor.github.io/ns-enterprises/

## About

NS Enterprises is a showcase-only website. It displays products, helps customers find the right product for their skin, and connects them to the shop on WhatsApp. There are no prices, no cart, and no checkout — the shop serves customers in person and over WhatsApp.

## Catalogue

44 products across 7 brands:

- Minimalist
- Plum
- Dot & Key
- The Derma Co
- Cetaphil
- Dr. Sheth's
- Mamaearth

Products are organised by skin concern (acne, oily skin, dry skin) and by category (Cleansers, Serums, Moisturizers, Sunscreens, Masks & Overnight). Every product is shown with its real product photo.

## Features

- **Product search** — search the full catalogue by product or brand name.
- **Filters** — filter by brand, category, and skin concern, with a live product counter.
- **Routine Builder** — a 4-question quiz that generates a personalised AM/PM routine from the products in store.
- **WhatsApp availability** — every product has an "Ask if available on WhatsApp" button that opens a chat with the product name pre-filled. Business number: +91 88370 74944.
- **Sunscreen guide** — a FAQ covering sunscreen use.
- **New arrivals** — the latest additions are highlighted in a "Just Added" section at the top of the shop, with NEW badges in the catalogue.

## Design

The site serves two dedicated layouts, each designed for its own screen:

- **Desktop (769px and up)** — a wide editorial catalogue with top navigation, a sticky search and filter bar, and three-column product cards.
- **Mobile (768px and below)** — a phone-native layout with a compact hero, tap-to-filter skin-concern cards, two-column product cards, and a frosted bottom tab bar (Shop / Routine / Ritual / Guide / WhatsApp).

## Project structure

```text
ns-enterprises/
├── index.html          # Page structure (desktop + mobile layouts)
├── README.md           # This file
├── assets/             # Code resources
│   ├── css/
│   │   └── style.css   # All styling
│   └── js/
│       └── script.js   # Search, filters, Routine Builder, WhatsApp links
└── images/             # Media — real product photos (JPG/WebP, one file per product)
```

## Run locally

No build step and no server required — open `index.html` in any browser. To test exactly as it runs online, serve the folder with any static server, for example:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000.

## Deployment

The site is hosted free with **GitHub Pages**, directly from this repository (`main` branch, root folder). Any commit to `main` updates the live site automatically.

## Updating the site

To add a product:

1. Add its real photo to `images/` (named after the product).
2. Add a product card to `index.html`, following the existing cards, with the correct brand, category, and skin-concern tags.
3. Commit and push — the live site updates on its own.

---

© NS Enterprises. All product names and brands belong to their respective owners.
