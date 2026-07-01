# Spotler Activate — personalisation slots

Shopler ships empty **personalisation slots** that Spotler Activate fills at
runtime. Every slot follows the same convention:

```html
<... class="perso-slot" data-activate="<name>"> ... </...>
```

Each slot renders **nothing** until Activate injects content, so an empty slot
collapses to zero height and does not affect layout. Slots are declared in
`app.js` (the views listed below) and re-evaluated on every soft navigation via
a `{ event: "PageReload" }` push in `render()` (skipped on the first render,
which `sqzl.js` evaluates itself on load).

## Slot reference

| `data-activate` | CSS selector | Appears on | Serves |
|---|---|---|---|
| `recognition-banner` | `.perso-slot[data-activate="recognition-banner"]` | Home (top, `hidden` until filled) | Visitor recognition / welcome-back messaging |
| `hero` | `.perso-slot[data-activate="hero"]` | Home (above the editorial hero) | Personalised hero / banner |
| `rec-picked` | `.perso-slot[data-activate="rec-picked"]` | Home | Product recommendations — "picked for you" |
| `email-capture` | `.perso-slot[data-activate="email-capture"]` | Home (sign-up section) | Email / lead capture |
| `card-badge` | `.perso-slot[data-activate="card-badge"]` | Every product card (carries `data-sku`) | Persuasion / badge on product tiles |
| `rec-related` | `.perso-slot[data-activate="rec-related"]` | PDP (product page) | Product recommendations — "you may also like" / related |
| `pdp-social` | `.perso-slot[data-activate="pdp-social"]` | PDP (below the stock line) | Social proof / scarcity (**use case 9**) |
| `checkout-crosssell` | `.perso-slot[data-activate="checkout-crosssell"]` | Checkout | Cross-sell at checkout |

## Product identification

Product elements carry a **`data-product-sku`** attribute so Activate can locate
products for product-lister / card-badge personalisations (its documented
attribute):

- Product cards: `article.card[data-product-sku="<sku>"]` (each card also keeps
  its inner `card-badge` slot with `data-sku`).
- PDP container: `div.pdp[data-product-sku="<sku>"]`.

## Pop-ups / overlays (use case 10)

Pop-ups and overlays need **no slot**. Activate injects the overlay itself,
triggered by exit-intent / scroll / timer — there is nothing to place in the
markup for it.
