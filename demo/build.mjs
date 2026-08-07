#!/usr/bin/env node
/* ============================================================================
   Generator for the Spotler Activate use-case DEMO PAGES.
   14 use cases x 2 languages = 28 static pages at /shopler/demo/<lang>/<slug>/.
   ----------------------------------------------------------------------------
   These are BLANK BASE PAGES: a realistic Shopler page of the right type, with
   NO use-case element built in. Each exposes stable, EMPTY injection anchors
   (<div class="uc-slot" id="uc-slot-...">) for Spotler Activate to inject into,
   the Activate tracking tag, and machine-readable product/cart data.
   The clean shop at /shopler/ is untouched and links to none of these.
   Run: node demo/build.mjs   (from repo root). Emits pages + demo/README.md.
   ============================================================================ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");                 // repo root (/shopler)
const REL = "../../../";                            // from /demo/<lang>/<slug>/ back to shop root
const TRACKER = "SQ-25654474";                      // same Activate merchant as the shop

// --- catalogue (real Shopler products) ---
const win = {};
new Function("window", readFileSync(join(ROOT, "products.default.js"), "utf8") + "\nreturn window;")(win);
const PRODUCTS = win.PRODUCTS_DEFAULT;
const BY = {}; PRODUCTS.forEach(p => BY[p.sku] = p);

// --- i18n (copied verbatim from app.js so chrome/labels match the shop exactly) ---
const I18N = {
  en: { nav_women:"Women", nav_men:"Men", nav_accessories:"Accessories", nav_sale:"Sale", cart:"Cart",
    hero_eyebrow:"Autumn / Winter", hero_title:"Stylish sustainable clothing.",
    hero_sub:"Modern essentials from five independent labels. Made to be worn, not just seen.",
    hero_cta:"Shop new in", shop_women:"Shop women", shop_men:"Shop men", shop_accessories:"Shop accessories",
    new_in:"New in", view_all:"View all", add_to_cart:"Add to bag", sold_out:"Sold out",
    size:"Size", one_size:"One size", in_stock:"In stock", low_stock:"Low stock", only_left:"Only {n} left",
    brand:"Brand", colour:"Colour", material:"Material", category:"Category", season:"Season", sku:"SKU",
    details:"Details", your_bag:"Your bag", subtotal:"Subtotal", shipping_row:"Shipping", free:"Free",
    total:"Total", checkout:"Checkout", continue_shopping:"Continue shopping", remove:"Remove", qty:"Qty",
    filters:"Filters", sort:"Sort", sort_featured:"Featured", results_many:"{n} items",
    free_ship:"Free shipping & returns", free_ship_sub:"On every order, always.",
    signup_title:"Be first to know", signup_sub:"New arrivals, restocks and seasonal edits — no noise.",
    signup_cta:"Sign up", signup_ph:"Your email address",
    ft_shop:"Shop", ft_help:"Help", ft_about:"About", ft_shipping:"Shipping", ft_returns:"Returns",
    ft_faq:"FAQ", ft_contact:"Contact", ft_story:"Our story", ft_brands:"Brands", ft_sustainability:"Sustainability",
    ft_cookies:"Cookie preferences", you_may:"You may also like",
    placed_title:"Thank you for your order",
    placed_sub:"A confirmation has been sent to your email. This is a demo store — no payment was taken and nothing will ship.",
    order_no:"Order", back_home:"Back to home", order_summary:"Order summary", delivery:"Delivery",
    delivery_est:"Estimated delivery 2–4 working days", order_date:"Order date",
    description:"Description", care:"Care & materials",
    acct_title:"My account", acct_intro:"Manage your details and preferences.", acct_details:"Your details",
    acct_prefs:"Preferences", acct_consent:"Communication", acct_save:"Save changes",
    pref_newsletter:"Email newsletter", pref_sms:"SMS updates", name_label:"Name", phone:"Phone",
    notify_soon:"Back in stock soon", oos_line:"This item is currently sold out.",
    browse_women:"Women", pagination:"Page", of:"of" },
  nl: { nav_women:"Dames", nav_men:"Heren", nav_accessories:"Accessoires", nav_sale:"Sale", cart:"Winkelmand",
    hero_eyebrow:"Herfst / Winter", hero_title:"Stijlvolle duurzame kleding",
    hero_sub:"Moderne essentials van vijf onafhankelijke labels. Gemaakt om te dragen, niet alleen om te zien.",
    hero_cta:"Bekijk nieuw", shop_women:"Shop dames", shop_men:"Shop heren", shop_accessories:"Shop accessoires",
    new_in:"Nieuw binnen", view_all:"Bekijk alles", add_to_cart:"In winkelmand", sold_out:"Uitverkocht",
    size:"Maat", one_size:"Eén maat", in_stock:"Op voorraad", low_stock:"Bijna uitverkocht", only_left:"Nog {n} op voorraad",
    brand:"Merk", colour:"Kleur", material:"Materiaal", category:"Categorie", season:"Seizoen", sku:"Artikelnr.",
    details:"Details", your_bag:"Winkelmand", subtotal:"Subtotaal", shipping_row:"Verzending", free:"Gratis",
    total:"Totaal", checkout:"Afrekenen", continue_shopping:"Verder winkelen", remove:"Verwijderen", qty:"Aantal",
    filters:"Filters", sort:"Sorteren", sort_featured:"Aanbevolen", results_many:"{n} artikelen",
    free_ship:"Gratis verzending & retour", free_ship_sub:"Bij elke bestelling, altijd.",
    signup_title:"Als eerste op de hoogte", signup_sub:"Nieuwe items, restocks en seizoensedits — zonder ruis.",
    signup_cta:"Aanmelden", signup_ph:"Je e-mailadres",
    ft_shop:"Shop", ft_help:"Hulp", ft_about:"Over", ft_shipping:"Verzending", ft_returns:"Retourneren",
    ft_faq:"FAQ", ft_contact:"Contact", ft_story:"Ons verhaal", ft_brands:"Merken", ft_sustainability:"Duurzaamheid",
    ft_cookies:"Cookievoorkeuren", you_may:"Misschien vind je dit ook leuk",
    placed_title:"Bedankt voor je bestelling",
    placed_sub:"Een bevestiging is naar je e-mail gestuurd. Dit is een demowinkel — er is niet betaald en er wordt niets verzonden.",
    order_no:"Bestelling", back_home:"Terug naar home", order_summary:"Besteloverzicht", delivery:"Bezorging",
    delivery_est:"Verwachte levering 2–4 werkdagen", order_date:"Besteldatum",
    description:"Omschrijving", care:"Verzorging & materialen",
    acct_title:"Mijn account", acct_intro:"Beheer je gegevens en voorkeuren.", acct_details:"Je gegevens",
    acct_prefs:"Voorkeuren", acct_consent:"Communicatie", acct_save:"Wijzigingen opslaan",
    pref_newsletter:"E-mailnieuwsbrief", pref_sms:"SMS-updates", name_label:"Naam", phone:"Telefoon",
    notify_soon:"Binnenkort weer op voorraad", oos_line:"Dit artikel is momenteel uitverkocht.",
    browse_women:"Dames", pagination:"Pagina", of:"van" }
};

// per-product descriptions for PDP pages (natural shop copy; catalogue facts stay from data)
const DESC = {
  "AO-W-001": {
    en: "A quietly luxurious ribbed knit in a soft cotton blend. Relaxed through the body with a ribbed funnel neck — the kind of everyday jumper you reach for all winter.",
    nl: "Een subtiel luxueuze geribde trui van een zachte katoenmix. Ruim vallend met een geribde col — precies de trui die je de hele winter blijft pakken." },
  "KE-M-007": {
    en: "A brushed-cotton flannel overshirt with a soft handfeel and a boxy, layer-ready cut. Wear it open over a tee or buttoned as a light jacket.",
    nl: "Een geborsteld flanellen overshirt met een zachte hand en een ruime, laagbare pasvorm. Draag het open over een tee of dicht als licht jasje." }
};

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const money = n => "€" + Number(n).toFixed(2).replace(".", ",");   // EU format, both langs
const imgUrl = f => REL + "images/" + f;
const nm = (p, lang) => lang === "nl" ? p.name_nl : p.name_en;
const effective = p => p.sale_price_eur != null ? p.sale_price_eur : p.price_eur;
const sizesFor = p => {
  if (p.category === "Women" && ["Knitwear","Tops","Dresses","Outerwear","Skirts","Trousers","Jeans","Loungewear"].includes(p.subcategory)) return ["34","36","38","40","42","44"];
  if (p.category === "Men" && ["Knitwear","Outerwear","Tops"].includes(p.subcategory)) return ["S","M","L","XL"];
  if (p.category === "Men" && ["Jeans","Trousers"].includes(p.subcategory)) return ["30","31","32","33","34","36"];
  return [];
};

/* ---------------- shared chrome ---------------- */
const MONOGRAM = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">' +
  '<rect x="1.5" y="1.5" width="37" height="37" rx="12" fill="var(--accent)"/>' +
  '<path d="M25.5 14.2c-1.1-1.5-3-2.4-5.4-2.4-3.3 0-5.6 1.7-5.6 4.3 0 2.5 1.9 3.6 5 4.2 2.7.5 3.7 1 3.7 2.2 0 1.2-1.2 2-3.1 2-2 0-3.4-.8-4.4-2.2" fill="none" stroke="var(--paper)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function header(lang, enSlug, nlSlug) {
  const t = I18N[lang];
  const nav = [["women","nav_women"],["men","nav_men"],["accessories","nav_accessories"]]
    .map(([c,k]) => `<a href="${REL}#/c/${c}">${esc(t[k])}</a>`).join("") +
    `<a href="${REL}#/c/sale" class="is-sale">${esc(t.nav_sale)}</a>`;
  return `<header class="hdr"><div class="wrap"><div class="hdr__row">
      <a class="brand" href="${REL}#/" aria-label="Shopler home">${MONOGRAM}<span class="wm">Shopler</span></a>
      <nav class="nav">${nav}</nav>
      <div class="hdr__actions">
        <div class="lang">
          <a data-lang="en" class="${lang==="en"?"is-active":""}" href="../../en/${enSlug}/">EN</a>
          <a data-lang="nl" class="${lang==="nl"?"is-active":""}" href="../../nl/${nlSlug}/">NL</a>
        </div>
        <a class="icon-btn cart-btn" href="${REL}#/" aria-label="${esc(t.cart)}">
          <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg></a>
      </div>
    </div></div></header>`;
}
function footer(lang) {
  const t = I18N[lang];
  return `<footer class="ftr"><div class="wrap"><div class="ftr__cols">
      <div class="ftr__brand"><span class="wm">Shopler</span>
        <p style="margin-top:var(--space-3);max-width:32ch">${esc(t.hero_sub)}</p></div>
      <div><h4>${esc(t.ft_shop)}</h4>
        <a href="${REL}#/c/women">${esc(t.nav_women)}</a><a href="${REL}#/c/men">${esc(t.nav_men)}</a>
        <a href="${REL}#/c/accessories">${esc(t.nav_accessories)}</a><a href="${REL}#/c/sale">${esc(t.nav_sale)}</a></div>
      <div><h4>${esc(t.ft_help)}</h4>
        <a href="${REL}#/">${esc(t.ft_shipping)}</a><a href="${REL}#/">${esc(t.ft_returns)}</a>
        <a href="${REL}#/">${esc(t.ft_faq)}</a><a href="${REL}#/">${esc(t.ft_contact)}</a></div>
      <div><h4>${esc(t.ft_about)}</h4>
        <a href="${REL}#/">${esc(t.ft_story)}</a><a href="${REL}#/">${esc(t.ft_brands)}</a>
        <a href="${REL}#/">${esc(t.ft_sustainability)}</a></div>
    </div>
    <div class="devnote">Shopler — demo storefront for Spotler Activate. Demo landing page; the Activate use-case element is injected at demo time into the empty <code>uc-slot-*</code> anchors.</div>
  </div></footer>`;
}
const slot = id => `<div class="uc-slot" id="${id}"></div>`;

/* ---------------- fragments ---------------- */
function card(p, lang) {
  const t = I18N[lang], sale = p.sale_price_eur != null;
  const price = sale
    ? `<span class="price"><span class="price__now price__now--sale money">${money(p.sale_price_eur)}</span><span class="price__was money">${money(p.price_eur)}</span></span>`
    : `<span class="price"><span class="price__now money">${money(p.price_eur)}</span></span>`;
  return `<article class="card" data-product-sku="${esc(p.sku)}">
      <a class="card__media" href="${REL}#/product/${esc(p.sku)}">
        <img class="card__img--lifestyle" src="${esc(imgUrl(p.image_lifestyle))}" alt="${esc(nm(p,lang))}" loading="lazy">
        <img class="card__img--packshot" src="${esc(imgUrl(p.image))}" alt="" aria-hidden="true" loading="lazy"></a>
      <div class="card__body"><a href="${REL}#/product/${esc(p.sku)}">
        <div class="card__brand">${esc(p.brand)}</div><div class="card__name">${esc(nm(p,lang))}</div></a>${price}</div>
    </article>`;
}
const grid = (list, lang) => `<div class="grid">${list.map(p => card(p, lang)).join("")}</div>`;
const heroBlock = (lang, id) => {
  const t = I18N[lang];
  return `<section class="hero"${id?` id="${id}"`:""}>
      <img class="hero__bg" src="${esc(imgUrl("hero.webp"))}" alt="">
      <div class="hero__overlay"><div class="hero__copy"><div class="inner">
        <p class="eyebrow">${esc(t.hero_eyebrow)}</p><h1>${esc(t.hero_title)}</h1><p>${esc(t.hero_sub)}</p>
        <a class="btn" href="${REL}#/c/women">${esc(t.hero_cta)}</a>
      </div></div></div></section>`;
};
const tile = (view, label) => {
  const hero = PRODUCTS.filter(p => p.category.toLowerCase() === view).sort((a,b)=>b.popularity-a.popularity)[0];
  return `<a class="tile" href="${REL}#/c/${view}">${hero?`<img src="${esc(imgUrl(hero.image_lifestyle))}" alt="">`:""}<span>${esc(label)}</span></a>`;
};
function signup(lang) {
  const t = I18N[lang];
  return `<section class="signup"><h2>${esc(t.signup_title)}</h2><p>${esc(t.signup_sub)}</p>
      <form onsubmit="return false"><input type="email" placeholder="${esc(t.signup_ph)}" aria-label="${esc(t.signup_ph)}">
        <button class="btn" type="submit">${esc(t.signup_cta)}</button></form></section>`;
}

/* ---------------- page-type bodies ---------------- */
function homepageBody(lang, opts) {
  const t = I18N[lang];
  const newin = PRODUCTS.slice().sort((a,b)=>b.popularity-a.popularity).slice(0,8);
  return (opts.heroTopSlot ? slot("uc-slot-hero-top") : "") +
    heroBlock(lang, opts.heroId) +
    `<div class="wrap">` +
      (opts.belowHeroSlot ? slot("uc-slot-below-hero") : "") +
      `<section class="section"><div class="section__head"><h2>${esc(t.new_in)}</h2>
        <a href="${REL}#/c/women">${esc(t.view_all)} →</a></div>${grid(newin, lang)}</section>
      <section class="section"><div class="tiles">
        ${tile("women", t.shop_women)}${tile("men", t.shop_men)}${tile("accessories", t.shop_accessories)}
      </div></section>` +
      (opts.newsletter ? signup(lang) : "") +
    `</div>`;
}
function pdpBody(lang, p, opts) {
  const t = I18N[lang];
  const oos = !!opts.outOfStock;
  const stockTxt = oos ? t.sold_out : (p.stock <= 4 ? t.only_left.replace("{n}", p.stock) : t.in_stock);
  const stockCls = oos ? "sold" : (p.stock <= 4 ? "low" : "in");
  const sizes = sizesFor(p);
  const sizeBlock = sizes.length
    ? `<div class="sizes"><div class="sizes__label"><span>${esc(t.size)}</span></div>
        <div class="sizes__opts">${sizes.map(s=>`<button type="button" class="size-opt"${oos?" disabled":""}>${esc(s)}</button>`).join("")}</div></div>`
    : `<div class="one-size">${esc(t.size)}: ${esc(t.one_size)}</div>`;
  const meta = [[t.brand,p.brand],[t.colour,p.color],[t.material,p.material],[t.category,p.category+" · "+p.subcategory],[t.season,p.season],[t.sku,p.sku]];
  const desc = (DESC[p.sku] && DESC[p.sku][lang]) || "";
  return `<div class="wrap">
    <nav class="breadcrumb"><a href="${REL}#/">Shopler</a> / <a href="${REL}#/c/${esc(p.category.toLowerCase())}">${esc(p.category)}</a> / ${esc(nm(p,lang))}</nav>
    <div class="pdp" data-product-sku="${esc(p.sku)}"
         data-product-id="${esc(p.sku)}" data-product-name="${esc(nm(p,lang))}"
         data-product-price="${effective(p)}" data-product-currency="EUR"
         data-product-category="${esc(p.category)}" data-product-image="${esc(imgUrl(p.image))}"
         data-product-stock="${oos?"out_of_stock":"in_stock"}">
      <div class="pdp__gallery">
        <img src="${esc(imgUrl(p.image_lifestyle))}" alt="${esc(nm(p,lang))}">
        <img src="${esc(imgUrl(p.image))}" alt="${esc(nm(p,lang))}"></div>
      <div class="pdp__info">
        <div class="pdp__brand">${esc(p.brand)}</div><h1>${esc(nm(p,lang))}</h1>
        <div class="pdp__price"><span class="price"><span class="price__now money">${money(effective(p))}</span></span></div>
        <div class="stock stock--${stockCls}">${esc(stockTxt)}</div>
        ${oos ? `<p class="pdp__oos">${esc(t.oos_line)}</p>` : ""}
        ${sizeBlock}
        <button class="btn btn--block" ${oos?"disabled":""}>${esc(oos ? t.sold_out : t.add_to_cart)}</button>
        ${opts.belowAtcSlot ? slot("uc-slot-below-atc") : ""}
        <div class="pdp__meta"><dl>${meta.map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl></div>
      </div>
    </div>
    <section class="pdp__section"><h2>${esc(t.description)}</h2><p class="pdp__desc">${esc(desc)}</p></section>
    ${opts.belowDescSlot ? slot("uc-slot-below-description") : ""}
  </div>`;
}
function plpBody(lang, category, opts) {
  const t = I18N[lang];
  const list = PRODUCTS.filter(p => p.category === category);
  const brands = [...new Set(list.map(p=>p.brand))];
  return `<div class="wrap">
    <nav class="breadcrumb"><a href="${REL}#/">Shopler</a> / ${esc(t.nav_women)}</nav>
    <h1 class="page-title">${esc(t.nav_women)}</h1>
    ${opts.listingTopSlot ? slot("uc-slot-listing-top") : ""}
    <div class="listing">
      <aside class="filters">
        <h3>${esc(t.f_brand||t.brand)}</h3>
        <div class="fgroup">${brands.map(b=>`<label><input type="checkbox">${esc(b)}</label>`).join("")}</div>
      </aside>
      <div>
        <div class="listing__bar"><span class="count">${esc(t.results_many.replace("{n}", list.length))}</span>
          <label>${esc(t.sort)}: <select><option>${esc(t.sort_featured)}</option></select></label></div>
        ${grid(list, lang)}
      </div>
    </div>
  </div>`;
}
function cartBody(lang, items, opts) {
  const t = I18N[lang];
  const sub = items.reduce((s,it)=>s+effective(BY[it.sku])*it.qty,0);
  const lines = items.map(it => {
    const p = BY[it.sku];
    return `<div class="dcart-line" data-line-sku="${esc(p.sku)}" data-line-id="${esc(p.sku)}"
        data-line-name="${esc(nm(p,lang))}" data-line-price="${effective(p)}" data-line-qty="${it.qty}"
        data-line-currency="EUR">
      <a href="${REL}#/product/${esc(p.sku)}"><img src="${esc(imgUrl(p.image))}" alt="${esc(nm(p,lang))}"></a>
      <div class="dcart-line__info"><div class="card__brand">${esc(p.brand)}</div>
        <div class="dcart-line__name">${esc(nm(p,lang))}</div>
        ${it.size?`<div class="dcart-line__size">${esc(t.size)} ${esc(it.size)}</div>`:""}
        <button class="linkbtn">${esc(t.remove)}</button></div>
      <div class="dcart-line__qty"><span>${esc(t.qty)}</span><div class="dqty"><button>−</button><span>${it.qty}</span><button>+</button></div></div>
      <div class="money dcart-line__price">${money(effective(p)*it.qty)}</div>
    </div>`;
  }).join("");
  return `<div class="wrap dcart">
    <h1 class="page-title">${esc(t.your_bag)}</h1>
    <div class="dcart__grid">
      <div class="dcart__lines">
        ${lines}
        ${opts.crosssellSlot ? slot("uc-slot-cart-crosssell") : ""}
      </div>
      <aside class="dcart__summary">
        <h2>${esc(t.order_summary||t.subtotal)}</h2>
        <div class="drow"><span>${esc(t.subtotal)}</span><span class="money">${money(sub)}</span></div>
        <div class="drow"><span>${esc(t.shipping_row)}</span><span class="money">${esc(t.free)}</span></div>
        <div class="drow drow--total"><span>${esc(t.total)}</span><span class="money">${money(sub)}</span></div>
        <a class="btn btn--block" href="${REL}#/">${esc(t.checkout)}</a>
        <a class="dcart__cont" href="${REL}#/c/women">${esc(t.continue_shopping)}</a>
      </aside>
    </div>
  </div>`;
}
function confirmationBody(lang, items, opts) {
  const t = I18N[lang];
  const sub = items.reduce((s,it)=>s+effective(BY[it.sku])*it.qty,0);
  const orderNo = "SHP-2451";
  const lines = items.map(it => { const p=BY[it.sku];
    return `<div class="dsum-line"><img src="${esc(imgUrl(p.image))}" alt="">
      <div><div class="card__brand">${esc(p.brand)}</div><div>${esc(nm(p,lang))}</div>
      <div class="dsum-line__meta">${esc(t.qty)} ${it.qty}${it.size?` · ${esc(t.size)} ${esc(it.size)}`:""}</div></div>
      <div class="money">${money(effective(p)*it.qty)}</div></div>`; }).join("");
  return `<div class="wrap dconf">
    <div class="dconf__head"><div class="tick">✓</div>
      <h1>${esc(t.placed_title)}</h1>
      <p class="eyebrow">${esc(t.order_no)} ${orderNo}</p>
      <p class="dconf__sub">${esc(t.placed_sub)}</p></div>
    <div class="dconf__grid">
      <section class="dconf__summary"><h2>${esc(t.order_summary)}</h2>
        ${lines}
        <div class="drow drow--total"><span>${esc(t.total)}</span><span class="money">${money(sub)}</span></div></section>
      <aside class="dconf__delivery"><h2>${esc(t.delivery)}</h2>
        <p>${esc(t.delivery_est)}</p><p class="eyebrow">${esc(t.order_date)}: 12 / 11 / 2026</p></aside>
    </div>
    ${opts.belowOrderSlot ? slot("uc-slot-below-order") : ""}
    <p style="margin-top:var(--space-8)"><a class="btn" href="${REL}#/">${esc(t.back_home)}</a></p>
  </div>`;
}
function accountBody(lang, opts) {
  const t = I18N[lang];
  const field = (label, val, type="text") => `<label class="dfield"><span>${esc(label)}</span><input type="${type}" value="${esc(val)}"></label>`;
  return `<div class="wrap dacct">
    <h1 class="page-title">${esc(t.acct_title)}</h1><p class="eyebrow">${esc(t.acct_intro)}</p>
    <div class="dacct__grid">
      <section class="dacct__card"><h2>${esc(t.acct_details)}</h2>
        ${field(t.name_label, lang==="nl"?"Sanne de Vries":"Sarah Jones")}
        ${field("Email", "sarah@example.com", "email")}
      </section>
      <section class="dacct__card"><h2>${esc(t.acct_consent)}</h2>
        <label class="dtoggle"><input type="checkbox" checked> <span>${esc(t.pref_newsletter)}</span></label>
        <label class="dtoggle"><input type="checkbox"> <span>${esc(t.pref_sms)}</span></label>
        ${opts.profileSlot ? slot("uc-slot-profile") : ""}
      </section>
    </div>
    <p style="margin-top:var(--space-6)"><button class="btn">${esc(t.acct_save)}</button></p>
  </div>`;
}

/* ---------------- tracking / data layer (per page) ---------------- */
function trackingScript(kind, payload) {
  let events = `window._sqzl=window._sqzl||[];window.dataLayer=window.dataLayer||[];` +
    `window._sqzl.push({consent:'grant'});window._sqzl.push({event:'PageView',page:location.pathname});`;
  if (kind === "pdp") {
    events += `window.shoplerProduct=${JSON.stringify(payload)};` +
      `window.dataLayer.push({event:'view_item',ecommerce:{items:[{item_id:'${payload.id}',item_name:${JSON.stringify(payload.name)},price:${payload.price},item_category:'${payload.category}',stock_status:'${payload.stock}'}]}});` +
      `window._sqzl.push({event:'ViewContent',currency:'EUR',products:[{id:'${payload.id}',name:${JSON.stringify(payload.name)},price:${payload.price},category_ids:['${payload.category.toLowerCase()}'],language:'${payload.language}'}]});`;
  } else if (kind === "cart") {
    events += `window.shoplerCart=${JSON.stringify(payload)};` +
      `window.dataLayer.push({event:'view_cart',ecommerce:{currency:'EUR',value:${payload.value},items:${JSON.stringify(payload.items)}}});`;
  } else if (kind === "category") {
    events += `window._sqzl.push({event:'ViewCategory',category_id:'${payload.category}',objectname:${JSON.stringify(payload.name)}});`;
  } else if (kind === "purchase") {
    events += `window.dataLayer.push({event:'purchase',ecommerce:{transaction_id:'${payload.orderid}',currency:'EUR',value:${payload.value},items:${JSON.stringify(payload.items)}}});`;
  }
  return `<script>${events}</script>`;
}

/* ---------------- page shell ---------------- */
function page(lang, enSlug, nlSlug, title, bodyHTML, tracking, overlaySlot) {
  const t = I18N[lang];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<!-- Spotler Activate tracker (merchant ${TRACKER}) — same tag as the main shop -->
<script type="text/javascript">
(function(s,q,z,l,y){s._sqzl=s._sqzl||[];l=q.createElement('script'),
y=q.getElementsByTagName('script')[0];l.async=1;l.type='text/javascript';
l.defer=true;l.src=z;y.parentNode.insertBefore(l,y)})
(window,document,'https://squeezely.tech/tracker/${TRACKER}/sqzl.js');
</script>
<title>${esc(title)} · Shopler</title>
<link rel="icon" type="image/svg+xml" href="${REL}assets/shopler-monogram.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${REL}tokens.css">
<link rel="stylesheet" href="${REL}app.css">
<link rel="stylesheet" href="${REL}demo/demo.css">
</head>
<body>
${header(lang, enSlug, nlSlug)}
<main id="app">
${bodyHTML}
</main>
${footer(lang)}
${overlaySlot ? slot("uc-slot-overlay") : ""}
${tracking}
</body>
</html>
`;
}

/* ---------------- page specs (14) ---------------- */
const STORY = [{ sku:"AO-W-001", qty:1, size:"38" }, { sku:"VO-A-003", qty:1 }, { sku:"NO-W-002", qty:1, size:"38" }];
const PDP_PROD = "AO-W-001", OOS_PROD = "KE-M-007";

const SPECS = [
  { slug:"homepage-personalisation", type:"homepage", uc:"Personalise the homepage",
    title:{en:"New in",nl:"Nieuw binnen"}, opts:{heroId:"uc-hero",heroTopSlot:true,belowHeroSlot:true,newsletter:true},
    anchors:["uc-slot-hero-top","uc-slot-below-hero"], note:"Hero region <#uc-hero> is the swappable/replaceable block." },
  { slug:"recognise-returning-visitors", type:"homepage", uc:"Recognise returning visitors",
    title:{en:"Welcome",nl:"Welkom"}, opts:{heroTopSlot:true,belowHeroSlot:true,newsletter:true},
    anchors:["uc-slot-hero-top","uc-slot-below-hero"] },
  { slug:"pick-up-where-you-left-off", type:"homepage", uc:"Remind visitors where they left off",
    title:{en:"New in",nl:"Nieuw binnen"}, opts:{belowHeroSlot:true,newsletter:true},
    anchors:["uc-slot-below-hero"] },
  { slug:"recommend-products", type:"homepage", uc:"Recommend products on your site",
    title:{en:"New in",nl:"Nieuw binnen"}, opts:{belowHeroSlot:true,newsletter:true},
    anchors:["uc-slot-below-hero"] },
  { slug:"grow-email-list", type:"homepage", uc:"Grow your email list",
    title:{en:"New in",nl:"Nieuw binnen"}, opts:{belowHeroSlot:false,newsletter:false}, overlay:true,
    anchors:["uc-slot-overlay"], note:"No newsletter form in the base body, so the injected email pop-up has nothing to clash with." },
  { slug:"similar-products", type:"pdp", uc:"Recommend similar products", product:PDP_PROD,
    title:{en:"Ribbed knit jumper",nl:"Geribde gebreide trui"}, opts:{belowDescSlot:true},
    anchors:["uc-slot-below-description"] },
  { slug:"social-proof", type:"pdp", uc:"Add social proof to product pages", product:PDP_PROD,
    title:{en:"Ribbed knit jumper",nl:"Geribde gebreide trui"}, opts:{belowAtcSlot:true},
    anchors:["uc-slot-below-atc"] },
  { slug:"timely-popups", type:"pdp", uc:"Persuade with timely pop-ups", product:PDP_PROD,
    title:{en:"Ribbed knit jumper",nl:"Geribde gebreide trui"}, opts:{}, overlay:true,
    anchors:["uc-slot-overlay"], note:"Clean PDP body for an exit-intent / urgency overlay." },
  { slug:"back-in-stock", type:"pdp", uc:"Bring shoppers back when products return", product:OOS_PROD,
    title:{en:"Flannel overshirt",nl:"Flanellen overshirt"}, opts:{outOfStock:true,belowAtcSlot:true},
    anchors:["uc-slot-below-atc"], note:"Out of stock, add-to-cart disabled; the 'notify me' form injects into #uc-slot-below-atc." },
  { slug:"bring-browsers-back", type:"plp", uc:"Bring browsers back", category:"Women",
    title:{en:"Women",nl:"Dames"}, opts:{listingTopSlot:true},
    anchors:["uc-slot-listing-top"], note:"Behavioural trigger — page fires a ViewCategory event; slot is optional." },
  { slug:"recover-abandoned-cart", type:"cart", uc:"Recover abandoned carts",
    title:{en:"Your bag",nl:"Winkelmand"}, opts:{crosssellSlot:false},
    anchors:[], note:"Behavioural trigger — realistic filled cart (3 items) exposed as machine-readable cart data; no slot required." },
  { slug:"increase-basket-value", type:"cart", uc:"Increase basket value",
    title:{en:"Your bag",nl:"Winkelmand"}, opts:{crosssellSlot:true},
    anchors:["uc-slot-cart-crosssell"] },
  { slug:"turn-buyers-into-repeat", type:"confirmation", uc:"Turn buyers into repeat customers",
    title:{en:"Thank you",nl:"Bedankt"}, opts:{belowOrderSlot:true},
    anchors:["uc-slot-below-order"] },
  { slug:"enrich-profiles", type:"account", uc:"Build richer customer profiles",
    title:{en:"My account",nl:"Mijn account"}, opts:{profileSlot:true},
    anchors:["uc-slot-profile"], note:"Deliberately sparse account form, so progressive profiling has something to add." }
];

/* ---------------- NL slugs (Dutch use-case names, slugified; numbers dropped) ----------------
   EN pages keep the English slug; NL pages use the Dutch name so the URL reads in Dutch.
   Activate targets by URL, so the NL targeting rules use these Dutch slugs. */
const NL_SLUG = {
  "homepage-personalisation": "personaliseer-de-homepage",
  "recognise-returning-visitors": "herken-terugkerende-bezoekers",
  "pick-up-where-you-left-off": "toon-eerder-bekeken-producten",
  "recommend-products": "toon-relevante-producten-op-je-site",
  "grow-email-list": "laat-je-e-maillijst-groeien",
  "similar-products": "raad-vergelijkbare-producten-aan",
  "social-proof": "voeg-social-proof-toe-aan-productpaginas",
  "timely-popups": "overtuig-met-pop-ups-op-het-juiste-moment",
  "back-in-stock": "stuur-back-in-stock-meldingen",
  "bring-browsers-back": "breng-geinteresseerde-bezoekers-terug",
  "recover-abandoned-cart": "win-verlaten-winkelmandjes-terug",
  "increase-basket-value": "verhoog-de-winkelmandwaarde",
  "turn-buyers-into-repeat": "maak-van-kopers-terugkerende-klanten",
  "enrich-profiles": "bouw-rijkere-klantprofielen-op"
};

/* ---------------- emit ---------------- */
const LANGS = ["en","nl"];
let count = 0;
for (const spec of SPECS) {
  for (const lang of LANGS) {
    let body = "", tracking = "";
    if (spec.type === "homepage") { body = homepageBody(lang, spec.opts); tracking = trackingScript("page"); }
    else if (spec.type === "pdp") {
      const p = BY[spec.product]; body = pdpBody(lang, p, spec.opts);
      tracking = trackingScript("pdp", { id:p.sku, name:nm(p,lang), price:effective(p), category:p.category, image:imgUrl(p.image), stock: spec.opts.outOfStock?"out_of_stock":"in_stock", language: lang==="nl"?"nl-NL":"en-GB" });
    }
    else if (spec.type === "plp") { body = plpBody(lang, spec.category, spec.opts); tracking = trackingScript("category", { category: spec.category.toLowerCase(), name: spec.category }); }
    else if (spec.type === "cart") {
      body = cartBody(lang, STORY, spec.opts);
      const items = STORY.map(it=>({ item_id:it.sku, item_name:nm(BY[it.sku],lang), price:effective(BY[it.sku]), quantity:it.qty }));
      tracking = trackingScript("cart", { value: STORY.reduce((s,it)=>s+effective(BY[it.sku])*it.qty,0), items });
    }
    else if (spec.type === "confirmation") {
      body = confirmationBody(lang, STORY, spec.opts);
      const items = STORY.map(it=>({ item_id:it.sku, item_name:nm(BY[it.sku],lang), price:effective(BY[it.sku]), quantity:it.qty }));
      tracking = trackingScript("purchase", { orderid:"SHP-2451", value: STORY.reduce((s,it)=>s+effective(BY[it.sku])*it.qty,0), items });
    }
    else if (spec.type === "account") { body = accountBody(lang, spec.opts); tracking = trackingScript("page"); }

    const html = page(lang, spec.slug, NL_SLUG[spec.slug], spec.title[lang], body, tracking, spec.overlay);
    const outSlug = lang === "en" ? spec.slug : NL_SLUG[spec.slug];
    const dir = join(ROOT, "demo", lang, outSlug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
    count++;
  }
}

/* ---------------- README ---------------- */
const BASE = "https://spotlerik.github.io/shopler/demo";
let readme = `# Shopler — Spotler Activate use-case demo pages

Blank base pages for the Demo Studio. Each is a realistic Shopler page of the right type with
**no use-case element built in** — Spotler Activate injects the element at demo time into the
empty \`uc-slot-*\` anchors listed below. The clean shop at \`/shopler/\` is unchanged and links
to none of these pages.

- **URL pattern:** \`${BASE}/<lang>/<slug>/\` — \`<lang>\` is \`en\` or \`nl\`. The EN slug is English; the NL slug is the Dutch use-case name (see table).
- **Regenerate:** \`node demo/build.mjs\` (from repo root). Do not hand-edit \`demo/<lang>/<slug>/index.html\`.
- **Activate tag:** the tracker (\`${TRACKER}\`) is present on every page (same as the shop).
- **Machine-readable data:** PDPs expose \`data-product-*\` on \`.pdp\` + \`window.shoplerProduct\` + a \`ViewContent\`/\`view_item\` push. Cart pages expose \`data-line-*\` per line + \`window.shoplerCart\` + a \`view_cart\` push. Category pages fire \`ViewCategory\`; confirmation fires \`purchase\`.
- **Anchors:** empty in the base page; styled to add spacing only once filled (no empty gap when unfilled, room to grow when injected). IDs are stable — treat them as Activate targeting rules.
- All pages carry \`<meta name="robots" content="noindex,nofollow">\`.

| # | Use case | Type | EN URL | NL URL | Injection anchors (empty in base) |
|---|---|---|---|---|---|
`;
SPECS.forEach((s,i) => {
  readme += `| ${i+1} | ${s.uc} | ${s.type} | ${BASE}/en/${s.slug}/ | ${BASE}/nl/${NL_SLUG[s.slug]}/ | ${s.anchors.length?s.anchors.map(a=>`\`#${a}\``).join(", "):"— (behavioural / overlay)"}${s.overlay&&!s.anchors.includes("uc-slot-overlay")?", `#uc-slot-overlay`":""} |\n`;
});
readme += `\n## Notes per page\n`;
SPECS.forEach((s,i) => { if (s.note) readme += `- **${s.slug}** — ${s.note}\n`; });
readme += `\n## Excluded use cases (no on-site manifestation — intentionally not built)\n
- **Segment visitors in real time** — shown in the Activate UI, no webshop page.
- **Identify future high-value customers** — predictive, shown in Activate.
- **Personalise product emails** — payoff is in the inbox.
- **Retarget shoppers with ads** — payoff is on Google / Meta.
`;
writeFileSync(join(ROOT, "demo", "README.md"), readme);

console.log("Wrote " + count + " pages + demo/README.md across " + SPECS.length + " use cases × " + LANGS.length + " languages.");
