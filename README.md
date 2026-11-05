# NS Enterprises — Skincare Showcase Website

The official showcase website for **NS Enterprises**, a skincare shop. The site presents the products available in-store so customers can browse the range and check availability over WhatsApp.

**Live site:** https://muse.ai/s/ns-enterprises-qxf64xvxh7jp3q/YdyqgBOIYl7eBqctJO8RlBijnP8zTlWj-qblku9EmyE

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

## Tech

The site is a single self-contained HTML file (`index.html`) — all product photos and assets are embedded, so it runs anywhere a browser can open a file, with no build step and no server required.

## Repository

| File | Description |
| --- | --- |
| `index.html` | The complete website (desktop + mobile versions). |
| `README.md` | This file. |

## Updating the site

To update the catalogue or the site, edit `index.html` and commit the change. New products should be added with their real product photo, the correct brand and category tags, and a WhatsApp availability button, following the existing product cards.

---

© NS Enterprises. All product names and brands belong to their respective owners.
