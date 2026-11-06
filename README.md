# NS Enterprises — Skincare Showcase Website

The official showcase website for **NS Enterprises**, a skincare shop. The site presents the products available in-store so customers can browse the range and check availability over WhatsApp.

**Live site:** https://bishambhor.github.io/ns-enterprises/

## About

NS Enterprises is a showcase-only website. It displays products, helps customers find the right product for their skin, and connects them to the shop on WhatsApp. There are no prices, no cart, and no checkout — the shop serves customers in person and over WhatsApp.

## Catalogue

The product catalogue lives in a single data file, **`data/products.json`** — it is the only place product information is written. The page loads it and renders every product card from it (main catalogue, shop-by-category grid, and the "Just Added" spotlight, which shows the products marked `isNew`). Each product has an `available` flag: `true` means it is displayed and can be recommended by the Routine Builder; `false` means it is hidden everywhere and never recommended. There are no prices anywhere on the site — it is showcase-only.

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
- **Routine Builder** — a 5-question questionnaire (skin type; concerns, multi-select; sensitivity; experience with active ingredients; routine length) that generates a personalised AM/PM routine from the products in store, with safety rules, skipped-step explanations, and WhatsApp enquiry for individual products or the whole routine. See "How the recommendation engine works" below.
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
├── data/
│   └── products.json   # The catalogue — all 44 products, the single source of truth
├── assets/             # Code resources
│   ├── css/
│   │   └── style.css   # All styling
│   └── js/
│       ├── products.js       # Loads products.json, validates it, builds product cards
│       ├── filters.js        # Search, brand/category/concern filters, live counter
│       ├── routine-engine.js # Recommendation engine: eligibility, scoring, safety rules, AM/PM routines
│       └── script.js         # Renders the catalogue, questionnaire UI, Ritual, WhatsApp links
└── images/             # Media — real product photos (JPG/WebP, one file per product)
```

## How the recommendation engine works

The Routine Builder asks five questions (skin type, concerns, sensitivity, experience with active ingredients, routine length) and `assets/js/routine-engine.js` turns the answers into a morning and an evening routine, using only the products in `data/products.json`.

**What data it uses — and what it treats as unknown.** The engine only reads fields that exist in `products.json`: `category`, `categories`, `skinConcerns`, `use`, `keyActives`, `tags`, `step` and `available`. It never invents ingredient lists, strengths, or skin-type suitability. Two honest gaps shape its behaviour:

- The catalogue only tags products with the concerns "acne", "oily" and "dry". Pigmentation, dullness and fine lines have no catalogue tag, so the engine matches them with a documented proxy: product tags ("Acne marks", "Uneven tone", "Brightening", "Glow", "Mature skin", "Age care") and listed key actives (Niacinamide and Vitamin C for pigmentation/dullness; Hyaluronic Acid and Ceramides as weak support for fine lines). The range has no product labelled for fine lines, so an ageing-focused routine says so plainly and focuses on hydration and barrier care instead.
- The catalogue has no toners, so the toner step is always skipped with an explanation. It is also sunscreen-heavy (23 of 44 products), so the engine often has to skip steps rather than force a product — that is correct behaviour, not a bug.

**Eligibility (hard rules, applied before any scoring).** Only products with `available: true` are ever recommended. Timing comes from the product's own `use` field ("AM & PM", "AM" or "PM"). Only face sunscreens (category `sunscreen` with step "Protect · AM") are picked as the daily sunscreen — the body lotion, reapply stick and sports sunscreen are never used as the face sunscreen.

**Safety rules (priority over scores).** A product counts as a strong exfoliant when a listed key active mentions Salicylic Acid or LHA; PHA counts as a mild exfoliant; Vitamin C 10% and Niacinamide 10% count as high-strength actives because the site states the 10% strength. The engine allows at most one exfoliating product per routine part, never puts Vitamin C 10% and a strong exfoliant in the same part, and caps strong actives at one per part for beginners and sensitive skin (two otherwise). Very sensitive skin gets no exfoliants and no 10% actives at all; beginners and occasionally irritated skin get no strong exfoliant in the morning. Every morning routine ends with a face sunscreen when one exists. The engine makes no medical claims and never says a product will cure acne, pigmentation or any other condition. Results always include patch-test guidance and a note to see a dermatologist for persistent or severe skin problems.

**Scoring (deterministic).** Eligible products are ranked per routine step: +3 per matched concern, +2 for skin-type fit, +2 for a concern-relevant listed active, +2 for a gentle pick when the user is dry or sensitive, +2 for sunscreen finish fit (matte for oily skin, hydrating for dry skin, sensitive/mineral for sensitive skin), and +2 for a gentle default when the user picked only "General skincare maintenance" (so a newcomer gets the gentlest cleanser, not an exfoliating one by alphabetical accident). Ties break by product name, then product id — the same answers always give the same routine.

**Routine shape.** Steps are cleanser, toner (always skipped — see above), treatment serum, moisturizer, sunscreen (morning) and an optional targeted treatment (evening, Complete routines only). Simple means 2–3 steps, Balanced 4–5, Complete adds the targeted step only when it fits and matches — never padded. If no suitable product exists for a step, the step is skipped with an explanation instead of forcing a poor fit. Each recommended product shows its photo, name, brand, category, why it was picked (from the matched data), how to use it (from the product's own `use` field), and a WhatsApp enquiry button; a whole-routine WhatsApp button includes the skin type, concerns and both routines.

## Run locally

The catalogue is loaded with `fetch`, so the site must be served over HTTP — opening `index.html` directly with `file://` will not load the products. Serve the folder with any static server, for example:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000.

## Deployment

The site is hosted free with **GitHub Pages**, directly from this repository (`main` branch, root folder). Any commit to `main` updates the live site automatically.

## Updating the site

To add a product:

1. Add its real photo to `images/` (named after the product).
2. Add one entry to `data/products.json` — copy an existing entry and change the `id`, `name`, `brand`, `category`, `categories`, `description`, `image`, `skinConcerns`, `step`, `tags`, `use`, `useExtras` and `keyActives`. Use only information the product actually states (never invent ingredients or strengths); set `isNew` to `true` only while it is a new arrival. Keep `available` as `true` unless the product should be hidden from the site.
3. Commit and push — the live site updates on its own.

To hide a product without deleting it, set its `available` to `false` in `data/products.json` — it disappears from the catalogue, the category grid, the "Just Added" spotlight, and the Routine Builder. To remove it entirely, delete its entry from `data/products.json` (and its photo from `images/` if it is no longer needed).

---

© NS Enterprises. All product names and brands belong to their respective owners.
