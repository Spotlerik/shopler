# Shopler — demo storefront for Spotler Activate

Static fashion webshop (EN/NL) used to demo Spotler Activate live to prospects.
Open `index.html` directly in a browser — no server needed.

## Build
- Plain HTML/CSS/JS, hash-routed. Runs from `file://`.
- `tokens.css` — brand design tokens (single source of truth; swap to rebrand).
- `app.css` — storefront styles (only references `var(--…)` tokens).
- `app.js` — routing, cart, i18n, rendering.
- `products.json` — catalogue (40 SKUs, from `shopler-catalogue-40-skus.xlsx`).
- `products.js` — same data as `window.PRODUCTS` (loaded via `<script>` so
  the app reads data without `fetch()`, which browsers block on `file://`).
- `images/` — 80 web JPGs (`SKU.jpg` packshot, `SKU-2.jpg` lifestyle).
- `assets/` — logos + monogram (favicon).

## No personalisation in this build
Every Activate surface is an EMPTY container marked `data-activate="<slot>"`:
`hero`, `recognition-banner`, `rec-picked`, `rec-related`, `card-badge`,
`email-capture`, `checkout-crosssell`. Spotler Activate fills them at runtime.
This build never invents recommended/popular/welcome-back content. Only
data-derived facts (price, sale, real stock counts) are shown.

A `shopler:view` CustomEvent fires on every route change to ease later wiring.

## Fonts
Bricolage Grotesque / Hanken Grotesk / JetBrains Mono via Google Fonts; degrade
gracefully to system fonts offline.
