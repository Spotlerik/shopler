# Shopler — Spotler Activate use-case demo pages

Blank base pages for the Demo Studio. Each is a realistic Shopler page of the right type with
**no use-case element built in** — Spotler Activate injects the element at demo time into the
empty `uc-slot-*` anchors listed below. The clean shop at `/shopler/` is unchanged and links
to none of these pages.

- **URL pattern:** `https://spotlerik.github.io/shopler/demo/<lang>/<slug>/` — `<lang>` is `en` or `nl`. The EN slug is English; the NL slug is the Dutch use-case name (see table).
- **Regenerate:** `node demo/build.mjs` (from repo root). Do not hand-edit `demo/<lang>/<slug>/index.html`.
- **Activate tag:** the tracker (`SQ-25654474`) is present on every page (same as the shop).
- **Machine-readable data:** PDPs expose `data-product-*` on `.pdp` + `window.shoplerProduct` + a `ViewContent`/`view_item` push. Cart pages expose `data-line-*` per line + `window.shoplerCart` + a `view_cart` push. Category pages fire `ViewCategory`; confirmation fires `purchase`.
- **Anchors:** empty in the base page; styled to add spacing only once filled (no empty gap when unfilled, room to grow when injected). IDs are stable — treat them as Activate targeting rules.
- All pages carry `<meta name="robots" content="noindex,nofollow">`.

| # | Use case | Type | EN URL | NL URL | Injection anchors (empty in base) |
|---|---|---|---|---|---|
| 1 | Personalise the homepage | homepage | https://spotlerik.github.io/shopler/demo/en/homepage-personalisation/ | https://spotlerik.github.io/shopler/demo/nl/personaliseer-de-homepage/ | `#uc-slot-hero-top`, `#uc-slot-below-hero` |
| 2 | Recognise returning visitors | homepage | https://spotlerik.github.io/shopler/demo/en/recognise-returning-visitors/ | https://spotlerik.github.io/shopler/demo/nl/herken-terugkerende-bezoekers/ | `#uc-slot-hero-top`, `#uc-slot-below-hero` |
| 3 | Remind visitors where they left off | homepage | https://spotlerik.github.io/shopler/demo/en/pick-up-where-you-left-off/ | https://spotlerik.github.io/shopler/demo/nl/toon-eerder-bekeken-producten/ | `#uc-slot-below-hero` |
| 4 | Recommend products on your site | homepage | https://spotlerik.github.io/shopler/demo/en/recommend-products/ | https://spotlerik.github.io/shopler/demo/nl/toon-relevante-producten-op-je-site/ | `#uc-slot-below-hero` |
| 5 | Grow your email list | homepage | https://spotlerik.github.io/shopler/demo/en/grow-email-list/ | https://spotlerik.github.io/shopler/demo/nl/laat-je-e-maillijst-groeien/ | `#uc-slot-overlay` |
| 6 | Recommend similar products | pdp | https://spotlerik.github.io/shopler/demo/en/similar-products/ | https://spotlerik.github.io/shopler/demo/nl/raad-vergelijkbare-producten-aan/ | `#uc-slot-below-description` |
| 7 | Add social proof to product pages | pdp | https://spotlerik.github.io/shopler/demo/en/social-proof/ | https://spotlerik.github.io/shopler/demo/nl/voeg-social-proof-toe-aan-productpaginas/ | `#uc-slot-below-atc` |
| 8 | Persuade with timely pop-ups | pdp | https://spotlerik.github.io/shopler/demo/en/timely-popups/ | https://spotlerik.github.io/shopler/demo/nl/overtuig-met-pop-ups-op-het-juiste-moment/ | `#uc-slot-overlay` |
| 9 | Bring shoppers back when products return | pdp | https://spotlerik.github.io/shopler/demo/en/back-in-stock/ | https://spotlerik.github.io/shopler/demo/nl/stuur-back-in-stock-meldingen/ | `#uc-slot-below-atc` |
| 10 | Bring browsers back | plp | https://spotlerik.github.io/shopler/demo/en/bring-browsers-back/ | https://spotlerik.github.io/shopler/demo/nl/breng-geinteresseerde-bezoekers-terug/ | `#uc-slot-listing-top` |
| 11 | Recover abandoned carts | cart | https://spotlerik.github.io/shopler/demo/en/recover-abandoned-cart/ | https://spotlerik.github.io/shopler/demo/nl/win-verlaten-winkelmandjes-terug/ | — (behavioural / overlay) |
| 12 | Increase basket value | cart | https://spotlerik.github.io/shopler/demo/en/increase-basket-value/ | https://spotlerik.github.io/shopler/demo/nl/verhoog-de-winkelmandwaarde/ | `#uc-slot-cart-crosssell` |
| 13 | Turn buyers into repeat customers | confirmation | https://spotlerik.github.io/shopler/demo/en/turn-buyers-into-repeat/ | https://spotlerik.github.io/shopler/demo/nl/maak-van-kopers-terugkerende-klanten/ | `#uc-slot-below-order` |
| 14 | Build richer customer profiles | account | https://spotlerik.github.io/shopler/demo/en/enrich-profiles/ | https://spotlerik.github.io/shopler/demo/nl/bouw-rijkere-klantprofielen-op/ | `#uc-slot-profile` |

## Notes per page
- **homepage-personalisation** — Hero region <#uc-hero> is the swappable/replaceable block.
- **grow-email-list** — No newsletter form in the base body, so the injected email pop-up has nothing to clash with.
- **timely-popups** — Clean PDP body for an exit-intent / urgency overlay.
- **back-in-stock** — Out of stock, add-to-cart disabled; the 'notify me' form injects into #uc-slot-below-atc.
- **bring-browsers-back** — Behavioural trigger — page fires a ViewCategory event; slot is optional.
- **recover-abandoned-cart** — Behavioural trigger — realistic filled cart (3 items) exposed as machine-readable cart data; no slot required.
- **enrich-profiles** — Deliberately sparse account form, so progressive profiling has something to add.

## Excluded use cases (no on-site manifestation — intentionally not built)

- **Segment visitors in real time** — shown in the Activate UI, no webshop page.
- **Identify future high-value customers** — predictive, shown in Activate.
- **Personalise product emails** — payoff is in the inbox.
- **Retarget shoppers with ads** — payoff is on Google / Meta.
