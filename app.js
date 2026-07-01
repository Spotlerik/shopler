/* ============================================================================
   Shopler storefront — vanilla JS, hash-routed, runs from file://
   ----------------------------------------------------------------------------
   IMPORTANT: This build contains NO personalisation. Every "Activate" surface
   (hero, recommendation rails, recognition banner, persuasion badges, email
   moment, checkout cross-sell) is a clean EMPTY container marked with
   data-activate="<slot>". Spotler Activate injects content there at runtime.
   This file never invents recommended/popular/welcome-back content.
   The only data-derived dynamics are factual (price, sale, real stock counts).
   ========================================================================== */
(function () {
  "use strict";
  // Working catalogue. The shop reads the admin-edited version from localStorage
  // ("shopler_catalogue") when present; otherwise the baked products.json mirror
  // (window.PRODUCTS). window.PRODUCTS_DEFAULT is the immutable factory default
  // (products.default.json) used by the admin's "Reset to factory settings".
  var FIELDS = ["sku", "image", "image_lifestyle", "name_en", "name_nl", "brand",
    "category", "subcategory", "gender", "price_eur", "sale_price_eur", "stock",
    "color", "material", "season", "popularity", "pairs_with"];
  function cloneList(a) { return JSON.parse(JSON.stringify(a || [])); }
  var PRODUCTS, BY_SKU = {};
  function rebuildIndex() { BY_SKU = {}; PRODUCTS.forEach(function (p) { BY_SKU[p.sku] = p; }); }
  function loadCatalogue() {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem("shopler_catalogue") || "null"); } catch (e) { stored = null; }
    PRODUCTS = (stored && stored.length) ? stored : cloneList(window.PRODUCTS || []);
    rebuildIndex();
  }
  // Promote a catalogue to "live" (what the shop renders) + persist it.
  function setCatalogue(list) {
    PRODUCTS = cloneList(list); rebuildIndex();
    localStorage.setItem("shopler_catalogue", JSON.stringify(PRODUCTS));
  }
  loadCatalogue();
  // Image registry: baked product images live here in the single-file bundle; the
  // admin also registers uploaded images (data URIs) so they show instantly in the
  // shop and admin before they are committed to the repo.
  window.SHOPLER_IMAGES = window.SHOPLER_IMAGES || {};
  var adminUploads = {}; // filename -> data URL, pending commit
  try { adminUploads = JSON.parse(localStorage.getItem("shopler_admin_uploads") || "{}") || {}; } catch (e) { adminUploads = {}; }
  Object.keys(adminUploads).forEach(function (k) { window.SHOPLER_IMAGES[k] = adminUploads[k]; });
  function persistUploads() { try { localStorage.setItem("shopler_admin_uploads", JSON.stringify(adminUploads)); } catch (e) {} }

  /* ---------------- State ---------------- */
  var state = {
    lang: localStorage.getItem("shopler_lang") || "en",
    cart: JSON.parse(localStorage.getItem("shopler_cart") || "[]") // [{sku, qty}]
  };
  function persist() {
    localStorage.setItem("shopler_lang", state.lang);
    localStorage.setItem("shopler_cart", JSON.stringify(state.cart));
  }
  var sqzlBooted = false; // becomes true after the first render() (see PageReload note below)

  /* ---------------- i18n (UI chrome only; product copy comes from data) ---------------- */
  var I18N = {
    en: {
      nav_women: "Women", nav_men: "Men", nav_accessories: "Accessories", nav_sale: "Sale",
      cart: "Cart", search: "Search", close: "Close",
      hero_eyebrow: "Autumn / Winter", hero_title: "Stylish sustainable clothing.",
      hero_sub: "Modern essentials from five independent labels. Made to be worn, not just seen.",
      hero_cta: "Shop new in",
      shop_women: "Shop women", shop_men: "Shop men", shop_accessories: "Shop accessories",
      new_in: "New in", view_all: "View all", on_sale: "On sale",
      add_to_cart: "Add to bag", added: "Added", sold_out: "Sold out",
      size: "Size", one_size: "One size", choose_size: "Select a size",
      only_left: "Only {n} left", in_stock: "In stock", low_stock: "Low stock",
      details: "Details", brand: "Brand", colour: "Colour", material: "Material",
      category: "Category", season: "Season", sku: "SKU",
      your_bag: "Your bag", bag_empty: "Your bag is empty.", subtotal: "Subtotal",
      checkout: "Checkout", continue_shopping: "Continue shopping", remove: "Remove",
      filters: "Filters", sort: "Sort", clear_all: "Clear all",
      sort_featured: "Featured", sort_price_asc: "Price: low to high",
      sort_price_desc: "Price: high to low", sort_newest: "Newest",
      f_brand: "Brand", f_colour: "Colour", f_price: "Price", f_category: "Category",
      results_one: "{n} item", results_many: "{n} items",
      free_ship: "Free shipping & returns", free_ship_sub: "On every order, always.",
      checkout_title: "Checkout", contact: "Contact", shipping: "Shipping address",
      email: "Email", first_name: "First name", last_name: "Last name",
      address: "Address", postcode: "Postcode", city: "City", country: "Country",
      pay_now: "Pay now", order_summary: "Order summary", total: "Total",
      placed_title: "Thank you for your order", placed_sub: "A confirmation has been sent to your email. This is a demo store — no payment was taken and nothing will ship.",
      back_home: "Back to home", order_no: "Order",
      signup_title: "Be first to know", signup_sub: "New arrivals, restocks and seasonal edits — no noise.",
      signup_cta: "Sign up", signup_ph: "Your email address",
      cc_title: "Your privacy", cc_text: "We use cookies to improve your experience.",
      cc_accept: "Accept all", cc_reject: "Necessary only", cc_prefs: "Preferences",
      cc_save: "Save preferences", cc_prefs_intro: "Choose which cookies we may use.",
      cc_necessary: "Necessary", cc_necessary_note: "Always on",
      cc_analytics: "Analytics", cc_marketing: "Marketing",
      ft_cookies: "Cookie preferences",
      ft_shop: "Shop", ft_help: "Help", ft_about: "About",
      ft_shipping: "Shipping", ft_returns: "Returns", ft_faq: "FAQ", ft_contact: "Contact",
      ft_story: "Our story", ft_brands: "Brands", ft_sustainability: "Sustainability",
      crosssell: "Complete the look", you_may: "You may also like", picked: "Picked for you"
    },
    nl: {
      nav_women: "Dames", nav_men: "Heren", nav_accessories: "Accessoires", nav_sale: "Sale",
      cart: "Winkelmand", search: "Zoeken", close: "Sluiten",
      hero_eyebrow: "Herfst / Winter", hero_title: "Stijlvolle duurzame kleding",
      hero_sub: "Moderne essentials van vijf onafhankelijke labels. Gemaakt om te dragen, niet alleen om te zien.",
      hero_cta: "Bekijk nieuw",
      shop_women: "Shop dames", shop_men: "Shop heren", shop_accessories: "Shop accessoires",
      new_in: "Nieuw binnen", view_all: "Bekijk alles", on_sale: "In de sale",
      add_to_cart: "In winkelmand", added: "Toegevoegd", sold_out: "Uitverkocht",
      size: "Maat", one_size: "Eén maat", choose_size: "Kies een maat",
      only_left: "Nog {n} op voorraad", in_stock: "Op voorraad", low_stock: "Bijna uitverkocht",
      details: "Details", brand: "Merk", colour: "Kleur", material: "Materiaal",
      category: "Categorie", season: "Seizoen", sku: "Artikelnr.",
      your_bag: "Winkelmand", bag_empty: "Je winkelmand is leeg.", subtotal: "Subtotaal",
      checkout: "Afrekenen", continue_shopping: "Verder winkelen", remove: "Verwijderen",
      filters: "Filters", sort: "Sorteren", clear_all: "Wis alles",
      sort_featured: "Aanbevolen", sort_price_asc: "Prijs: laag naar hoog",
      sort_price_desc: "Prijs: hoog naar laag", sort_newest: "Nieuwste",
      f_brand: "Merk", f_colour: "Kleur", f_price: "Prijs", f_category: "Categorie",
      results_one: "{n} artikel", results_many: "{n} artikelen",
      free_ship: "Gratis verzending & retour", free_ship_sub: "Bij elke bestelling, altijd.",
      checkout_title: "Afrekenen", contact: "Contact", shipping: "Verzendadres",
      email: "E-mail", first_name: "Voornaam", last_name: "Achternaam",
      address: "Adres", postcode: "Postcode", city: "Plaats", country: "Land",
      pay_now: "Nu betalen", order_summary: "Besteloverzicht", total: "Totaal",
      placed_title: "Bedankt voor je bestelling", placed_sub: "Een bevestiging is naar je e-mail gestuurd. Dit is een demowinkel — er is niet betaald en er wordt niets verzonden.",
      back_home: "Terug naar home", order_no: "Bestelling",
      signup_title: "Als eerste op de hoogte", signup_sub: "Nieuwe items, restocks en seizoensedits — zonder ruis.",
      signup_cta: "Aanmelden", signup_ph: "Je e-mailadres",
      cc_title: "Je privacy", cc_text: "We gebruiken cookies om je ervaring te verbeteren.",
      cc_accept: "Alles accepteren", cc_reject: "Alleen noodzakelijk", cc_prefs: "Voorkeuren",
      cc_save: "Voorkeuren opslaan", cc_prefs_intro: "Kies welke cookies we mogen gebruiken.",
      cc_necessary: "Noodzakelijk", cc_necessary_note: "Altijd aan",
      cc_analytics: "Analyse", cc_marketing: "Marketing",
      ft_cookies: "Cookievoorkeuren",
      ft_shop: "Shop", ft_help: "Hulp", ft_about: "Over",
      ft_shipping: "Verzending", ft_returns: "Retourneren", ft_faq: "FAQ", ft_contact: "Contact",
      ft_story: "Ons verhaal", ft_brands: "Merken", ft_sustainability: "Duurzaamheid",
      crosssell: "Maak de look compleet", you_may: "Misschien vind je dit ook leuk", picked: "Voor jou geselecteerd"
    }
  };
  function t(key, vars) {
    var s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace("{" + k + "}", vars[k]); });
    return s;
  }

  /* ---------------- Helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function name(p) { return state.lang === "nl" ? p.name_nl : p.name_en; }
  function money(n) {
    // Display only — no decimals (e.g. € 60). Raw values still flow to _sqzl/feed.
    return new Intl.NumberFormat(state.lang === "nl" ? "nl-NL" : "en-IE", {
      style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(n);
  }
  function img(file) { return (window.SHOPLER_IMAGES && window.SHOPLER_IMAGES[file]) || ("images/" + file); }
  function effectivePrice(p) { return p.sale_price_eur != null ? p.sale_price_eur : p.price_eur; }
  function stockState(p) { return p.stock === 0 ? "sold" : (p.stock <= 4 ? "low" : "in"); }
  // Size options are derived from product TYPE (subcategory), never hardcoded per SKU,
  // so all 40 products map automatically. Stock stays at product level — sizes are
  // UI choice-options only. Empty array === one-size (no picker).
  var SIZE_APPAREL = ["Knitwear", "Tops", "Dresses", "Outerwear", "Skirts", "Trousers", "Jeans", "Loungewear"];
  function sizesFor(p) {
    if (SIZE_APPAREL.indexOf(p.subcategory) >= 0) return ["S", "M", "L", "XL"];
    if (p.subcategory === "Shoes") return ["37", "38", "39", "40", "41"];
    if (p.subcategory === "Belts") return ["85", "90", "95", "100"];
    return []; // Bags, Hats, Scarves, Eyewear, Small leather -> one size
  }

  /* ============================================================================
     Spotler Activate (Squeezely) data layer
     ----------------------------------------------------------------------------
     Squeezely reads events from the global array window._sqzl via .push({...}).
     The pixel script (loaded separately by Activate) drains this queue, so
     events pushed before the pixel loads are not lost. This file only PUSHES
     events; it never invents personalised content.

     NOTE ON EXACT FIELD NAMES: the structural convention (window._sqzl array,
     .push, event names ViewContent/AddToCart/Purchase/ViewCategory/EmailOptIn,
     products[] with id/price, EUR currency, language nl-NL/en-GB, orderid,
     userid for identity-merge) follows Squeezely's documented data layer. If a
     field name must match a specific Activate account/feed mapping exactly,
     confirm it against that account's current Squeezely docs before go-live.
     ========================================================================== */
  window._sqzl = window._sqzl || [];
  function sqzlPush(obj) { try { window._sqzl.push(obj); } catch (e) { /* never break the shop on tracking */ } }
  // Squeezely language tag from the active toggle (Activate needs this for multilingual products).
  function sqzlLang() { return state.lang === "nl" ? "nl-NL" : "en-GB"; }
  // Stable anonymous id so an unknown visitor can later be merged onto a known one (merge on User ID).
  function getUserId() {
    var id = localStorage.getItem("shopler_uid");
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : "anon-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
      localStorage.setItem("shopler_uid", id);
    }
    return id;
  }
  // Canonical product payload. id === catalogue SKU, 1:1 with the Activate feed.
  function sqzlProduct(p, qty, size) {
    var o = {
      id: p.sku, name: name(p), brand: p.brand,
      category: p.category, subcategory: p.subcategory,
      price: effectivePrice(p), currency: "EUR",
      language: sqzlLang(), quantity: qty || 1
    };
    if (size) o.size = size; // chosen size; omitted entirely for one-size products
    return o;
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  // Known email = the anonymous→known recognition key. Set the moment a visitor
  // opts in or checks out; from then on it rides along on every event.
  function getKnownEmail() { return localStorage.getItem("shopler_email") || ""; }
  function setKnownEmail(e) { if (e) localStorage.setItem("shopler_email", e); }
  // Base payload carried on every event: userid (extra identifier) + language,
  // plus email once the visitor is known (the merge-on-recognition key).
  function sqzlBase(extra) {
    var o = { userid: getUserId(), language: sqzlLang() };
    var em = getKnownEmail();
    if (em) o.email = em;
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  function cartProducts() {
    return state.cart.map(function (l) { return sqzlProduct(BY_SKU[l.sku], l.qty, l.size); });
  }
  // Seed identity early (userid). Email is added later, once known.
  function trackUserId() { sqzlPush({ userid: getUserId() }); }
  // PageView — required on every route by the Activate docs, even with no other event.
  function trackPageView() { sqzlPush(sqzlBase({ event: "PageView", page: location.hash || "#/" })); }
  function trackViewContent(p) {
    sqzlPush(sqzlBase({ event: "ViewContent", currency: "EUR", products: [sqzlProduct(p, 1)] }));
  }
  function trackViewCategory(catName) {
    sqzlPush(sqzlBase({ event: "ViewCategory", category: catName }));
  }
  function trackAddToCart(p, qty, size) {
    sqzlPush(sqzlBase({ event: "AddToCart", currency: "EUR", products: [sqzlProduct(p, qty || 1, size)] }));
  }
  function trackInitiateCheckout() {
    sqzlPush(sqzlBase({ event: "InitiateCheckout", currency: "EUR",
      totalvalue: round2(cartSubtotal()), products: cartProducts() }));
  }
  function trackPrePurchase(order) {
    sqzlPush(sqzlBase({ event: "PrePurchase", currency: "EUR",
      orderid: order.orderid, totalvalue: round2(order.total), products: order.products }));
  }
  function trackPurchase(order) {
    if (order.email) setKnownEmail(order.email);
    var ex = { event: "Purchase", orderid: order.orderid, currency: "EUR",
      totalvalue: round2(order.total), products: order.products };
    if (order.email) ex.email = order.email; // explicit, beyond the base recognition key
    sqzlPush(sqzlBase(ex));
  }
  function trackEmailOptIn(email, subscribe) {
    setKnownEmail(email); // from now on this visitor is "known"
    sqzlPush(sqzlBase({ event: "EmailOptIn", email: email,
      newsletter: subscribe === false ? "no" : "yes" }));
  }

  /* ============================================================================
     Consent (Activate / Squeezely consent API)
     ----------------------------------------------------------------------------
     Squeezely does NOT persist consent itself, so the consent state must be
     re-pushed on every page/route BEFORE any event fires. We remember the
     visitor's choice in localStorage (demo UX) and replay it via _sqzl.push:
       accept all       -> { consent: "grant" }
       necessary only   -> { consent: "revoke" }
       per category     -> { consent: "grant"|"revoke", permissions: [...] }
     Only the documented syntax is used (grant/revoke, permissions, user_interaction).

     ACCOUNT DEPENDENCY (no code action): for "revoke" to actually hold pixels,
     the "Custom consent management" setting must be enabled in the Activate
     account. The code pushes correctly regardless; enforcement is server-side.
     ========================================================================== */
  function getConsent() {
    try { return JSON.parse(localStorage.getItem("shopler_consent") || "null"); }
    catch (e) { return null; }
  }
  function setConsent(o) { localStorage.setItem("shopler_consent", JSON.stringify(o)); }
  // Replay the remembered choice. interactive=true marks the explicit click.
  function applyConsent(interactive) {
    var c = getConsent();
    if (!c || !c.decided) return; // no decision yet -> nothing to replay
    function push(o) { if (interactive) o.user_interaction = true; sqzlPush(o); }
    if (c.analytics && c.marketing) push({ consent: "grant" });
    else if (!c.analytics && !c.marketing) push({ consent: "revoke" });
    else {
      var grant = [], revoke = [];
      (c.analytics ? grant : revoke).push("analytics");
      (c.marketing ? grant : revoke).push("marketing");
      if (grant.length) push({ consent: "grant", permissions: grant });
      if (revoke.length) push({ consent: "revoke", permissions: revoke });
    }
  }
  function decideConsent(analytics, marketing) {
    setConsent({ decided: true, analytics: !!analytics, marketing: !!marketing });
    applyConsent(true); // push the explicit choice immediately
    renderConsent();    // hide the banner
  }
  // Render the banner. Shows on first visit (no decision); stays hidden after a
  // choice unless opts.open (footer "Cookie preferences" reopens it).
  function renderConsent(opts) {
    opts = opts || {};
    var el = document.getElementById("consent");
    if (!el) return;
    var c = getConsent();
    if (c && c.decided && !opts.open) { el.innerHTML = ""; return; }
    var showPrefs = !!opts.prefs;
    var aOn = c ? c.analytics : false, mOn = c ? c.marketing : false;
    var prefs = showPrefs
      ? '<div class="cc__prefs">' +
          '<p>' + esc(t("cc_prefs_intro")) + '</p>' +
          '<label class="cc__opt"><input type="checkbox" checked disabled> <span>' + esc(t("cc_necessary")) +
            '</span> <em>' + esc(t("cc_necessary_note")) + '</em></label>' +
          '<label class="cc__opt"><input type="checkbox" data-cc-cat="analytics"' + (aOn ? " checked" : "") + '> <span>' + esc(t("cc_analytics")) + '</span></label>' +
          '<label class="cc__opt"><input type="checkbox" data-cc-cat="marketing"' + (mOn ? " checked" : "") + '> <span>' + esc(t("cc_marketing")) + '</span></label>' +
          '<button class="btn" data-cc="save">' + esc(t("cc_save")) + '</button>' +
        '</div>'
      : "";
    el.innerHTML =
      '<div class="cc" role="dialog" aria-label="' + esc(t("cc_title")) + '" aria-live="polite">' +
        '<div class="cc__main">' +
          '<div class="cc__text"><strong>' + esc(t("cc_title")) + '</strong><p>' + esc(t("cc_text")) + '</p></div>' +
          '<div class="cc__actions">' +
            '<button class="btn btn--ghost" data-cc="reject">' + esc(t("cc_reject")) + '</button>' +
            '<button class="btn btn--ghost" data-cc="prefs">' + esc(t("cc_prefs")) + '</button>' +
            '<button class="btn" data-cc="accept">' + esc(t("cc_accept")) + '</button>' +
          '</div>' +
        '</div>' + prefs +
      '</div>';
  }

  // Category routing: Women/Men are `category`; Accessories is `category`; Sale is virtual.
  function productsForView(view) {
    if (view === "sale") return PRODUCTS.filter(function (p) { return p.sale_price_eur != null; });
    if (view === "women") return PRODUCTS.filter(function (p) { return p.category === "Women"; });
    if (view === "men") return PRODUCTS.filter(function (p) { return p.category === "Men"; });
    if (view === "accessories") return PRODUCTS.filter(function (p) { return p.category === "Accessories"; });
    return PRODUCTS.slice();
  }

  /* ---------------- Cart ---------------- */
  function cartCount() { return state.cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function cartSubtotal() {
    return state.cart.reduce(function (s, l) {
      var p = BY_SKU[l.sku]; return p ? s + effectivePrice(p) * l.qty : s;
    }, 0);
  }
  // size is optional; a line is identified by sku + size, so the same product in
  // two different sizes are two separate cart lines.
  function addToCart(sku, size) {
    var p = BY_SKU[sku];
    if (!p || p.stock === 0) return;
    var line = state.cart.filter(function (l) { return l.sku === sku && (l.size || "") === (size || ""); })[0];
    if (line) { line.qty = Math.min(line.qty + 1, p.stock); }
    else { state.cart.push(size ? { sku: sku, qty: 1, size: size } : { sku: sku, qty: 1 }); }
    trackAddToCart(p, 1, size);
    persist(); renderChrome(); openDrawer(); renderDrawer();
  }
  // Cart mutations are by line index (lines can share a sku across sizes).
  function setQtyAt(i, qty) {
    var l = state.cart[i]; if (!l) return;
    var p = BY_SKU[l.sku];
    l.qty = Math.max(1, Math.min(qty, p ? p.stock : qty));
    persist(); renderChrome(); renderDrawer();
  }
  function removeAt(i) {
    if (i < 0 || i >= state.cart.length) return;
    state.cart.splice(i, 1);
    persist(); renderChrome(); renderDrawer();
  }

  /* ---------------- Reusable fragments ---------------- */
  function priceHTML(p, big) {
    if (p.sale_price_eur != null) {
      return '<span class="price ' + (big ? "" : "") + '">' +
        '<span class="price__now price__now--sale money">' + esc(money(p.sale_price_eur)) + '</span>' +
        '<span class="price__was money">' + esc(money(p.price_eur)) + '</span></span>';
    }
    return '<span class="price"><span class="price__now money">' + esc(money(p.price_eur)) + '</span></span>';
  }

  function cardHTML(p) {
    var st = stockState(p);
    // Quiet text-zone labels (NOT overlaid on the photo). Derived from real data:
    // ON SALE from sale_price_eur; ONLY N LEFT / SOLD OUT from the real stock value.
    var labels = "";
    if (p.sale_price_eur != null) labels += '<span class="clabel clabel--sale">' + esc(t("on_sale")) + "</span>";
    if (st === "low") labels += '<span class="clabel clabel--low">' + esc(t("only_left", { n: p.stock })) + "</span>";
    else if (st === "sold") labels += '<span class="clabel clabel--sold">' + esc(t("sold_out")) + "</span>";
    return '' +
      '<article class="card' + (st === "sold" ? " is-sold" : "") + '" data-product-sku="' + esc(p.sku) + '">' +
        '<a class="card__media" href="#/product/' + esc(p.sku) + '">' +
          '<img class="card__img--lifestyle" src="' + esc(img(p.image_lifestyle)) + '" alt="' + esc(name(p)) + '" loading="lazy">' +
          '<img class="card__img--packshot" src="' + esc(img(p.image)) + '" alt="" aria-hidden="true" loading="lazy">' +
          // persuasion-badge slot — empty; Activate fills at runtime
          '<div class="card__perso perso-slot" data-activate="card-badge" data-sku="' + esc(p.sku) + '"></div>' +
        '</a>' +
        '<div class="card__body">' +
          '<a href="#/product/' + esc(p.sku) + '">' +
            '<div class="card__brand">' + esc(p.brand) + '</div>' +
            '<div class="card__name">' + esc(name(p)) + '</div>' +
          '</a>' +
          priceHTML(p) +
          (labels ? '<div class="card__labels">' + labels + '</div>' : "") +
        '</div>' +
      '</article>';
  }

  function gridHTML(list) {
    if (!list.length) return '<div class="empty-state">—</div>';
    return '<div class="grid">' + list.map(cardHTML).join("") + "</div>";
  }

  // Empty Activate rail (recommendation row). Renders nothing visible until filled.
  function persoRail(slot, heading) {
    return '<section class="perso-rail perso-slot" data-activate="' + slot + '" aria-label="' + esc(heading) + '"></section>';
  }

  /* ---------------- Views ---------------- */
  function viewHome() {
    var newin = PRODUCTS.slice().sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, 8);
    var sale = productsForView("sale").slice(0, 4);
    return '' +
      // recognition banner — hidden until Activate recognises a visitor
      '<div class="perso-slot" data-activate="recognition-banner" hidden></div>' +
      // personalised hero slot (empty) sits above the default editorial hero
      '<div class="perso-slot" data-activate="hero"></div>' +
      '<section class="hero">' +
        '<img class="hero__bg" src="' + esc(img("hero.webp")) + '" alt="">' +
        '<div class="hero__overlay"><div class="hero__copy"><div class="inner">' +
          '<p class="eyebrow">' + esc(t("hero_eyebrow")) + '</p>' +
          '<h1>' + esc(t("hero_title")) + '</h1>' +
          '<p>' + esc(t("hero_sub")) + '</p>' +
          '<a class="btn" href="#/c/women">' + esc(t("hero_cta")) + '</a>' +
        '</div></div></div>' +
      '</section>' +
      '<div class="wrap">' +
        // "Picked for you" rail — empty Activate container
        persoRail("rec-picked", t("picked")) +
        '<section class="section">' +
          '<div class="section__head"><h2>' + esc(t("new_in")) + '</h2>' +
            '<a href="#/c/women">' + esc(t("view_all")) + ' →</a></div>' +
          gridHTML(newin) +
        '</section>' +
        '<section class="section">' +
          '<div class="tiles">' +
            tileHTML("women", t("shop_women")) +
            tileHTML("men", t("shop_men")) +
            tileHTML("accessories", t("shop_accessories")) +
          '</div>' +
        '</section>' +
        (sale.length ? '<section class="section">' +
          '<div class="section__head"><h2>' + esc(t("on_sale")) + '</h2>' +
            '<a href="#/c/sale">' + esc(t("view_all")) + ' →</a></div>' +
          gridHTML(sale) + '</section>' : "") +
        signupHTML() +
      '</div>';
  }

  function tileHTML(view, label) {
    var list = productsForView(view);
    var hero = list.slice().sort(function (a, b) { return b.popularity - a.popularity; })[0];
    return '<a class="tile" href="#/c/' + view + '">' +
      (hero ? '<img src="' + esc(img(hero.image_lifestyle)) + '" alt="">' : "") +
      '<span>' + esc(label) + '</span></a>';
  }

  var listingFilters = {}; // { view, brands:Set, colours:Set, price:string, sort }
  var pdpSize = null; // currently selected size on the open product page (null = none)
  function viewListing(view) {
    var base = productsForView(view);
    var f = listingFilters;
    if (f.view !== view) { listingFilters = f = { view: view, brands: [], colours: [], price: "", sort: "featured" }; }
    var list = base.filter(function (p) {
      if (f.brands.length && f.brands.indexOf(p.brand) < 0) return false;
      if (f.colours.length && f.colours.indexOf(p.color) < 0) return false;
      if (f.price === "u50" && effectivePrice(p) >= 50) return false;
      if (f.price === "50-100" && (effectivePrice(p) < 50 || effectivePrice(p) > 100)) return false;
      if (f.price === "o100" && effectivePrice(p) <= 100) return false;
      return true;
    });
    if (f.sort === "price_asc") list.sort(function (a, b) { return effectivePrice(a) - effectivePrice(b); });
    else if (f.sort === "price_desc") list.sort(function (a, b) { return effectivePrice(b) - effectivePrice(a); });
    else if (f.sort === "newest") list.sort(function (a, b) { return b.popularity - a.popularity; });
    else list.sort(function (a, b) { return b.popularity - a.popularity; });

    var brands = uniq(base.map(function (p) { return p.brand; }));
    var colours = uniq(base.map(function (p) { return p.color; }));
    var title = view === "sale" ? t("on_sale")
      : view === "women" ? t("nav_women") : view === "men" ? t("nav_men")
      : view === "accessories" ? t("nav_accessories") : t("view_all");

    var chips = [];
    f.brands.forEach(function (b) { chips.push(chip("brand", b, b)); });
    f.colours.forEach(function (c) { chips.push(chip("colour", c, c)); });
    if (f.price) chips.push(chip("price", f.price, priceLabel(f.price)));

    function fopts(group, values, sel) {
      return values.map(function (v) {
        var checked = sel.indexOf(v) >= 0 ? " checked" : "";
        return '<label><input type="checkbox" data-filter="' + group + '" value="' + esc(v) + '"' + checked + '>' + esc(v) + "</label>";
      }).join("");
    }

    return '<div class="wrap">' +
      '<nav class="breadcrumb"><a href="#/">Shopler</a> / ' + esc(title) + '</nav>' +
      '<h1 class="page-title">' + esc(title) + '</h1>' +
      '<div class="listing">' +
        '<aside class="filters">' +
          '<h3>' + esc(t("f_brand")) + '</h3><div class="fgroup">' + fopts("brand", brands, f.brands) + '</div>' +
          '<h3>' + esc(t("f_colour")) + '</h3><div class="fgroup">' + fopts("colour", colours, f.colours) + '</div>' +
          '<h3>' + esc(t("f_price")) + '</h3><div class="fgroup">' +
            priceRadio("", t("view_all"), f.price) +
            priceRadio("u50", "< " + money(50), f.price) +
            priceRadio("50-100", money(50) + " – " + money(100), f.price) +
            priceRadio("o100", "> " + money(100), f.price) +
          '</div>' +
        '</aside>' +
        '<div>' +
          '<div class="listing__bar">' +
            '<span class="count">' + esc(list.length === 1 ? t("results_one", { n: 1 }) : t("results_many", { n: list.length })) + '</span>' +
            '<label>' + esc(t("sort")) + ': <select data-sort>' +
              sortOpt("featured", t("sort_featured"), f.sort) +
              sortOpt("newest", t("sort_newest"), f.sort) +
              sortOpt("price_asc", t("sort_price_asc"), f.sort) +
              sortOpt("price_desc", t("sort_price_desc"), f.sort) +
            '</select></label>' +
          '</div>' +
          (chips.length ? '<div class="chiprow">' + chips.join("") +
            '<button class="linkbtn" data-clear>' + esc(t("clear_all")) + '</button></div>' : "") +
          (list.length ? gridHTML(list) : '<div class="empty-state">' + esc(t("results_many", { n: 0 })) + '</div>') +
        '</div>' +
      '</div></div>';
  }
  function chip(group, val, label) {
    return '<span class="chip">' + esc(label) + '<button data-remove-filter="' + group + '" data-val="' + esc(val) + '" aria-label="' + esc(t("remove")) + '">×</button></span>';
  }
  function priceLabel(v) { return v === "u50" ? "< " + money(50) : v === "50-100" ? money(50) + "–" + money(100) : v === "o100" ? "> " + money(100) : ""; }
  function priceRadio(val, label, sel) {
    return '<label><input type="radio" name="price" data-price value="' + esc(val) + '"' + (sel === val ? " checked" : "") + '>' + esc(label) + "</label>";
  }
  function sortOpt(val, label, sel) { return '<option value="' + val + '"' + (sel === val ? " selected" : "") + ">" + esc(label) + "</option>"; }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }).sort(); }

  function viewProduct(sku) {
    var p = BY_SKU[sku];
    if (!p) return '<div class="wrap"><div class="empty-state">Not found</div></div>';
    pdpSize = null; // reset size selection on each product view
    var st = stockState(p);
    var stockTxt = st === "sold" ? t("sold_out") : st === "low" ? t("only_left", { n: p.stock }) : t("in_stock");
    var sizes = sizesFor(p);
    var hasSizes = sizes.length > 0;
    var sizeBlock = hasSizes
      ? '<div class="sizes">' +
          '<div class="sizes__label"><span>' + esc(t("size")) + '</span><span class="sizes__sel" data-size-sel></span></div>' +
          '<div class="sizes__opts">' +
            sizes.map(function (s) { return '<button type="button" class="size-opt" data-size="' + esc(s) + '">' + esc(s) + '</button>'; }).join("") +
          '</div></div>'
      : '<div class="one-size">' + esc(t("size")) + ': ' + esc(t("one_size")) + '</div>';
    // With sizes, the button stays disabled until a size is picked (handled on click).
    var addDisabled = st === "sold" || hasSizes;
    var metaRows = [
      [t("brand"), p.brand], [t("colour"), p.color], [t("material"), p.material],
      [t("category"), p.category + " · " + p.subcategory], [t("season"), p.season], [t("sku"), p.sku]
    ];
    return '<div class="wrap">' +
      '<nav class="breadcrumb"><a href="#/">Shopler</a> / <a href="#/c/' + esc(p.category.toLowerCase()) + '">' + esc(p.category) + '</a> / ' + esc(name(p)) + '</nav>' +
      '<div class="pdp" data-product-sku="' + esc(p.sku) + '">' +
        '<div class="pdp__gallery">' +
          '<img src="' + esc(img(p.image_lifestyle)) + '" alt="' + esc(name(p)) + '">' +
          '<img src="' + esc(img(p.image)) + '" alt="' + esc(name(p)) + '">' +
        '</div>' +
        '<div class="pdp__info">' +
          '<div class="pdp__brand">' + esc(p.brand) + '</div>' +
          '<h1>' + esc(name(p)) + '</h1>' +
          '<div class="pdp__price">' + priceHTML(p, true) + '</div>' +
          '<div class="stock stock--' + st + '">' + esc(stockTxt) + '</div>' +
          // social-proof / scarcity slot — empty; Activate fills at runtime (use case 9)
          '<div class="perso-slot" data-activate="pdp-social"></div>' +
          (st === "sold" ? "" : sizeBlock) +
          '<button class="btn btn--block" data-add="' + esc(p.sku) + '"' + (hasSizes ? " data-needs-size" : "") + (addDisabled ? " disabled" : "") + '>' +
            esc(st === "sold" ? t("sold_out") : t("add_to_cart")) + '</button>' +
          '<div class="pdp__meta"><dl>' +
            metaRows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") +
          '</dl></div>' +
        '</div>' +
      '</div>' +
      // "You may also like" rail — empty Activate container (NOT the data pairs_with)
      persoRail("rec-related", t("you_may")) +
    '</div>';
  }

  /* ============================================================================
     Admin / catalogue manager (internal demo tool, EN only) — route #/admin
     ----------------------------------------------------------------------------
     Edits a draft (localStorage work buffer). "Apply locally" promotes the draft
     to the live catalogue the shop renders. "Save to GitHub" also commits
     products.json + products.js + regenerated activate-feed.json to the repo.
     "Reset to factory settings" restores products.default.json (the frozen 40).
     A write token is entered at runtime (Config) and kept in localStorage — it is
     NOT hardcoded in the page or committed to the repo.
     ========================================================================== */
  var ADMIN_DRAFT_KEY = "shopler_admin_draft", ADMIN_CFG_KEY = "shopler_admin_cfg";
  var adminDraft = null, adminStatus = "", adminStatusKind = "", adminShowCfg = false, adminBusy = false;
  function adminCfg() {
    var d = { owner: "spotlerik", repo: "shopler", branch: "main",
      prefix: "", baseUrl: "https://spotlerik.github.io/shopler", token: "" };
    try { var s = JSON.parse(localStorage.getItem(ADMIN_CFG_KEY) || "null"); if (s) Object.keys(s).forEach(function (k) { if (k in d) d[k] = s[k]; }); } catch (e) {}
    return d;
  }
  function setAdminCfg(c) { localStorage.setItem(ADMIN_CFG_KEY, JSON.stringify(c)); }
  function loadDraft() {
    try { var s = JSON.parse(localStorage.getItem(ADMIN_DRAFT_KEY) || "null"); if (s && s.length) return s; } catch (e) {}
    return cloneList(PRODUCTS);
  }
  function saveDraft() { localStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(adminDraft)); }
  function adminSetStatus(kind, msg) { adminStatusKind = kind; adminStatus = msg; }
  function numOrNaN(v) { if (v === "" || v == null) return null; var n = Number(v); return isNaN(n) ? NaN : n; }
  function coerceProduct(p) {
    var pairs = p.pairs_with;
    if (typeof pairs === "string") pairs = pairs.split(/[;,]/).map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      sku: (p.sku || "").trim(), image: (p.image || "").trim(), image_lifestyle: (p.image_lifestyle || "").trim(),
      name_en: (p.name_en || "").trim(), name_nl: (p.name_nl || "").trim(), brand: (p.brand || "").trim(),
      category: (p.category || "").trim(), subcategory: (p.subcategory || "").trim(), gender: (p.gender || "").trim(),
      price_eur: numOrNaN(p.price_eur),
      sale_price_eur: (p.sale_price_eur === "" || p.sale_price_eur == null) ? null : numOrNaN(p.sale_price_eur),
      stock: numOrNaN(p.stock),
      color: (p.color || "").trim(), material: (p.material || "").trim(), season: (p.season || "").trim(),
      popularity: numOrNaN(p.popularity), pairs_with: pairs || []
    };
  }
  // Returns null when valid, else an error string.
  function validateDraft(list) {
    var clean = list.map(coerceProduct), seen = {};
    var required = ["sku", "name_en", "name_nl", "brand", "category", "subcategory", "gender", "image", "image_lifestyle"];
    for (var i = 0; i < clean.length; i++) {
      var p = clean[i], ref = p.sku || ("row " + (i + 1));
      for (var r = 0; r < required.length; r++) {
        if (!p[required[r]]) return "“" + ref + "”: " + required[r] + " is required.";
      }
      if (seen[p.sku]) return "Duplicate SKU “" + p.sku + "”. SKUs must be unique.";
      seen[p.sku] = true;
      if (isNaN(p.price_eur) || p.price_eur == null || p.price_eur <= 0) return "“" + ref + "”: price_eur must be a number > 0.";
      if (p.sale_price_eur != null && (isNaN(p.sale_price_eur) || p.sale_price_eur <= 0)) return "“" + ref + "”: sale_price_eur must be empty or a number > 0.";
      if (p.stock == null || isNaN(p.stock) || p.stock < 0 || p.stock % 1 !== 0) return "“" + ref + "”: stock must be a whole number ≥ 0.";
      if (p.popularity != null && isNaN(p.popularity)) return "“" + ref + "”: popularity must be numeric.";
    }
    return null;
  }
  function buildFeed(list, baseUrl) {
    var base = (baseUrl || "").replace(/\/+$/, ""), rows = [];
    var langs = [["nl", "nl-NL"], ["en", "en-GB"]];
    list.forEach(function (p) {
      langs.forEach(function (L) {
        rows.push({
          id: p.sku, language: L[1], name: L[0] === "nl" ? p.name_nl : p.name_en,
          brand: p.brand, category: p.category, subcategory: p.subcategory,
          price: p.price_eur, sale_price: p.sale_price_eur != null ? p.sale_price_eur : null,
          currency: "EUR", stock: p.stock, in_stock: p.stock > 0,
          image: base ? base + "/images/" + p.image : "images/" + p.image,
          image_lifestyle: base ? base + "/images/" + p.image_lifestyle : "images/" + p.image_lifestyle,
          url: base ? base + "/#/product/" + p.sku : "#/product/" + p.sku,
          gender: p.gender, color: p.color, material: p.material, season: p.season
        });
      });
    });
    return rows;
  }
  // Escape text for XML content/attributes. Order matters: & must be first.
  function xmlEsc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  // lowercase, spaces -> hyphens (matches the site's lowercase category routes, e.g. #/c/women).
  function feedSlug(s) { return String(s || "").toLowerCase().replace(/\s+/g, "-"); }
  // Build a valid RSS 2.0 XML feed for ONE language ("nl-NL" | "en-GB") from the
  // SAME rows buildFeed() produces — Activate's importer needs XML, one language per feed.
  function buildFeedXml(list, baseUrl, lang) {
    var rows = buildFeed(list, baseUrl).filter(function (r) { return r.language === lang; });
    var label = lang === "nl-NL" ? "Dutch" : "English";
    var link = (baseUrl || "").replace(/\/+$/, "") + "/";
    var out = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n' +
      '  <channel>\n' +
      '    <title>' + xmlEsc("Shopler product feed (" + lang + ")") + '</title>\n' +
      '    <link>' + xmlEsc(link) + '</link>\n' +
      '    <description>' + xmlEsc("Shopler demo product feed — " + label) + '</description>\n';
    rows.forEach(function (r) {
      var avail = (r.in_stock && r.stock > 0) ? "in stock" : "out of stock";
      var e = [];
      e.push('    <item>');
      e.push('      <id>' + xmlEsc(r.id) + '</id>');
      e.push('      <title>' + xmlEsc(r.name) + '</title>');
      e.push('      <link>' + xmlEsc(r.url) + '</link>');
      e.push('      <language>' + xmlEsc(r.language) + '</language>');
      e.push('      <price>' + Number(r.price).toFixed(2) + ' ' + xmlEsc(r.currency) + '</price>');
      if (r.sale_price != null) e.push('      <sale_price>' + Number(r.sale_price).toFixed(2) + ' ' + xmlEsc(r.currency) + '</sale_price>');
      e.push('      <availability>' + avail + '</availability>');
      e.push('      <inventory>' + parseInt(r.stock, 10) + '</inventory>');
      e.push('      <brand>' + xmlEsc(r.brand) + '</brand>');
      e.push('      <color>' + xmlEsc(r.color) + '</color>');
      e.push('      <image_link>' + xmlEsc(r.image) + '</image_link>');
      if (r.image_lifestyle) {
        e.push('      <image_links>');
        e.push('        <image_link>' + xmlEsc(r.image) + '</image_link>');
        e.push('        <image_link>' + xmlEsc(r.image_lifestyle) + '</image_link>');
        e.push('      </image_links>');
      }
      e.push('      <category_ids>');
      e.push('        <category_id>' + xmlEsc(feedSlug(r.category)) + '</category_id>');
      e.push('        <category_id>' + xmlEsc(feedSlug(r.category) + '-' + feedSlug(r.subcategory)) + '</category_id>');
      e.push('      </category_ids>');
      e.push('      <gender>' + xmlEsc(r.gender) + '</gender>');
      e.push('      <material>' + xmlEsc(r.material) + '</material>');
      e.push('      <season>' + xmlEsc(r.season) + '</season>');
      e.push('    </item>');
      out += e.join('\n') + '\n';
    });
    out += '  </channel>\n</rss>\n';
    return out;
  }
  function productsJsText(json) {
    return "// Auto-generated from products.json — do not edit by hand.\n" +
      "// Mirror of products.json, loaded as a <script> so the app runs from file://\n" +
      "window.PRODUCTS = " + json + ";\n";
  }
  function b64utf8(s) { return btoa(unescape(encodeURIComponent(s))); }
  function ghHeaders(cfg) { return { "Authorization": "Bearer " + cfg.token, "Accept": "application/vnd.github+json", "Content-Type": "application/json" }; }
  // isB64=true: content is already base64 (binary, e.g. images). Else UTF-8 text.
  function ghPut(cfg, path, content, message, isB64) {
    var api = "https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo + "/contents/" + path;
    return fetch(api + "?ref=" + encodeURIComponent(cfg.branch), { headers: ghHeaders(cfg) }).then(function (g) {
      if (g.status === 200) return g.json().then(function (j) { return j.sha; });
      if (g.status === 404) return null;
      throw new Error("read " + path + ": HTTP " + g.status);
    }).then(function (sha) {
      var body = { message: message, content: isB64 ? content : b64utf8(content), branch: cfg.branch };
      if (sha) body.sha = sha;
      return fetch(api, { method: "PUT", headers: ghHeaders(cfg), body: JSON.stringify(body) });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(path + ": HTTP " + r.status + " " + t.slice(0, 140)); });
    });
  }
  // Commit any pending uploaded images to <prefix>images/ (binary, base64 from the data URL).
  function commitImages(cfg) {
    var names = Object.keys(adminUploads), chain = Promise.resolve();
    names.forEach(function (n) {
      chain = chain.then(function () {
        var b64 = (adminUploads[n].split(",")[1]) || "";
        return ghPut(cfg, cfg.prefix + "images/" + n, b64, "admin: add image " + n, true);
      });
    });
    return chain;
  }
  function adminHandleUpload(row, field, file) {
    if (!adminDraft[row]) return;
    var reader = new FileReader();
    reader.onload = function () {
      var dataURL = reader.result;
      var m = (file.name || "").match(/\.[a-z0-9]+$/i);
      var ext = (m ? m[0] : (file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg")).toLowerCase();
      var sku = (adminDraft[row].sku || "").trim();
      var base = (sku || ("upload-" + (row + 1))).replace(/[^A-Za-z0-9_-]/g, "");
      var fname = (field === "image_lifestyle" ? base + "-2" : base) + ext;
      window.SHOPLER_IMAGES[fname] = dataURL;
      adminUploads[fname] = dataURL; persistUploads();
      adminDraft[row][field] = fname; saveDraft();
      adminSetStatus("info", "Image added: " + fname + " — preview is live; it will be committed to images/ on “Save to GitHub”.");
      renderAdmin();
    };
    reader.onerror = function () { adminSetStatus("err", "Could not read that file."); renderAdmin(); };
    reader.readAsDataURL(file);
  }
  // Write products.json + products.js + activate-feed.json + the two RSS XML feeds to the repo.
  function commitCatalogue(cfg, clean) {
    var json = JSON.stringify(clean, null, 2);
    var feed = JSON.stringify(buildFeed(clean, cfg.baseUrl), null, 2);
    var xmlNl = buildFeedXml(clean, cfg.baseUrl, "nl-NL");
    var xmlEn = buildFeedXml(clean, cfg.baseUrl, "en-GB");
    return ghPut(cfg, cfg.prefix + "products.json", json, "admin: update products.json")
      .then(function () { return ghPut(cfg, cfg.prefix + "products.js", productsJsText(json), "admin: update products.js"); })
      .then(function () { return ghPut(cfg, cfg.prefix + "activate-feed.json", feed, "admin: regenerate activate-feed.json"); })
      .then(function () { return ghPut(cfg, cfg.prefix + "activate-feed-nl.xml", xmlNl, "admin: regenerate activate-feed-nl.xml"); })
      .then(function () { return ghPut(cfg, cfg.prefix + "activate-feed-en.xml", xmlEn, "admin: regenerate activate-feed-en.xml"); });
  }
  function adminApplyLocal() {
    var err = validateDraft(adminDraft);
    if (err) { adminSetStatus("err", err); renderAdmin(); return; }
    var clean = adminDraft.map(coerceProduct);
    setCatalogue(clean);
    adminDraft = cloneList(clean); saveDraft();
    adminSetStatus("ok", "Applied to the shop (local). " + clean.length + " products.");
    renderChrome(); renderAdmin();
  }
  function adminSaveGitHub() {
    if (adminBusy) return;
    var err = validateDraft(adminDraft);
    if (err) { adminSetStatus("err", err); renderAdmin(); return; }
    var cfg = adminCfg();
    if (!cfg.token) { adminShowCfg = true; adminSetStatus("err", "Paste a GitHub write token in Config first."); renderAdmin(); return; }
    var clean = adminDraft.map(coerceProduct);
    var nUploads = Object.keys(adminUploads).length;
    adminBusy = true; adminSetStatus("info", "Saving & committing to GitHub…" + (nUploads ? " (" + nUploads + " image" + (nUploads > 1 ? "s" : "") + ")" : "")); renderAdmin();
    commitImages(cfg).then(function () { return commitCatalogue(cfg, clean); }).then(function () {
      adminUploads = {}; persistUploads(); // images now in the repo
      setCatalogue(clean); adminDraft = cloneList(clean); saveDraft();
      adminBusy = false;
      adminSetStatus("ok", "Saved / committed to " + cfg.owner + "/" + cfg.repo + "@" + cfg.branch + " · products.json, products.js, activate-feed.json, activate-feed-nl.xml & activate-feed-en.xml" + (nUploads ? " + " + nUploads + " image(s)" : "") + " updated.");
      renderChrome(); renderAdmin();
    }).catch(function (e) {
      adminBusy = false; adminSetStatus("err", "GitHub save failed: " + e.message);
      renderAdmin();
    });
  }
  function adminReset() {
    if (!window.confirm("Reset to factory settings?\n\nThis discards ALL edits and restores the original 40 products (products.default.json).")) return;
    var def = cloneList(window.PRODUCTS_DEFAULT || []);
    adminDraft = cloneList(def);
    setCatalogue(def); saveDraft();
    var cfg = adminCfg();
    if (cfg.token) {
      adminBusy = true; adminSetStatus("info", "Reset locally — committing factory defaults to GitHub…"); renderAdmin();
      commitCatalogue(cfg, def).then(function () {
        adminBusy = false; adminSetStatus("ok", "Reset done — factory defaults restored locally and committed.");
        renderChrome(); renderAdmin();
      }).catch(function (e) {
        adminBusy = false; adminSetStatus("err", "Reset applied locally, but GitHub commit failed: " + e.message);
        renderChrome(); renderAdmin();
      });
    } else {
      adminSetStatus("ok", "Reset done — factory defaults restored locally (no token, repo not changed).");
      renderChrome(); renderAdmin();
    }
  }
  function adminAddProduct() {
    adminDraft.unshift({ __new: true, sku: "", image: "", image_lifestyle: "", name_en: "", name_nl: "",
      brand: "", category: "Women", subcategory: "", gender: "f", price_eur: "", sale_price_eur: "",
      stock: "0", color: "", material: "", season: "AW", popularity: "50", pairs_with: "" });
    saveDraft(); adminSetStatus("info", "New product row added at the top — set a unique SKU."); renderAdmin();
  }
  function adminDelete(i) {
    var p = adminDraft[i]; if (!p) return;
    if (!window.confirm("Delete product “" + (p.sku || "(new)") + "”?")) return;
    adminDraft.splice(i, 1); saveDraft(); adminSetStatus("info", "Product deleted (not yet saved)."); renderAdmin();
  }
  function renderAdmin() { if ((location.hash || "").indexOf("#/admin") === 0) document.getElementById("app").innerHTML = viewAdmin(); }

  function viewAdmin() {
    if (!adminDraft) adminDraft = loadDraft();
    var cfg = adminCfg();
    var cols = [
      ["sku", "SKU"], ["name_en", "Name (EN)"], ["name_nl", "Name (NL)"], ["brand", "Brand"],
      ["category", "Category"], ["subcategory", "Subcategory"], ["gender", "Gender"],
      ["price_eur", "Price €"], ["sale_price_eur", "Sale €"], ["stock", "Stock"],
      ["color", "Colour"], ["material", "Material"], ["season", "Season"], ["popularity", "Pop."],
      ["pairs_with", "Pairs with"], ["image", "Image"], ["image_lifestyle", "Lifestyle img"]
    ];
    // Distinct values already on the website, used to populate the dropdowns.
    function adminOptions(key) {
      var seen = {};
      PRODUCTS.forEach(function (x) { var v = x[key]; if (v != null && v !== "") seen[v] = true; });
      return Object.keys(seen).sort();
    }
    function genderLabel(g) { return g === "f" ? "f · women" : g === "m" ? "m · men" : g === "u" ? "u · unisex" : g; }
    var DROPDOWN = { brand: 1, category: 1, subcategory: 1, gender: 1, color: 1, material: 1, season: 1 };
    function cell(p, i, key) {
      if (DROPDOWN[key]) {
        var cur = p[key] == null ? "" : String(p[key]);
        var opts = adminOptions(key);
        if (cur && opts.indexOf(cur) < 0) opts = [cur].concat(opts); // never drop a current value
        var lab = key === "gender" ? genderLabel : function (x) { return x; };
        var o = '<option value=""' + (cur === "" ? " selected" : "") + ">—</option>" +
          opts.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(lab(v)) + "</option>"; }).join("");
        return '<td><select class="adm-in adm-sel" data-row="' + i + '" data-field="' + key + '">' + o + "</select></td>";
      }
      if (key === "pairs_with") {
        var arr = Array.isArray(p.pairs_with) ? p.pairs_with
          : String(p.pairs_with || "").split(/[;,]/).map(function (s) { return s.trim(); }).filter(Boolean);
        var skus = PRODUCTS.map(function (x) { return x.sku; })
          .filter(function (s) { return s && s !== p.sku; }).sort();
        var o2 = skus.map(function (s) { return '<option value="' + esc(s) + '"' + (arr.indexOf(s) >= 0 ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("");
        return '<td><select class="adm-in adm-multi" multiple size="4" title="Ctrl/Cmd-click to select multiple" data-row="' + i + '" data-field="pairs_with">' + o2 + "</select></td>";
      }
      if (key === "image" || key === "image_lifestyle") {
        var v = p[key] || "";
        var thumb = v
          ? '<img class="adm-thumb" src="' + esc(img(v)) + '" alt="" onerror="this.classList.add(\'adm-thumb--broken\')">'
          : '<span class="adm-thumb adm-thumb--empty"></span>';
        return '<td><div class="adm-img">' + thumb +
          '<div class="adm-img__c">' +
            '<input class="adm-in" data-row="' + i + '" data-field="' + key + '" value="' + esc(v) + '">' +
            '<button class="adm-up" type="button" data-admin-upload="' + i + '" data-upload-field="' + key + '">Upload</button>' +
          '</div></div></td>';
      }
      var val = p[key]; if (key === "pairs_with" && Array.isArray(val)) val = val.join("; ");
      var skuLocked = key === "sku" && !p.__new;
      return '<td><input class="adm-in" data-row="' + i + '" data-field="' + key + '" value="' + esc(val == null ? "" : val) + '"' +
        (skuLocked ? " readonly title=\"SKU is the key for events & feed — not editable for existing products\"" : "") +
        (key === "sku" ? " size=\"10\"" : "") + "></td>";
    }
    var rows = adminDraft.map(function (p, i) {
      return "<tr>" + cols.map(function (c) { return cell(p, i, c[0]); }).join("") +
        '<td><button class="linkbtn adm-del" data-admin-del="' + i + '">Delete</button></td></tr>';
    }).join("");
    var head = "<tr>" + cols.map(function (c) { return "<th>" + esc(c[1]) + "</th>"; }).join("") + "<th></th></tr>";

    var status = adminStatus
      ? '<div class="adm-status adm-status--' + adminStatusKind + '">' + esc(adminStatus) + "</div>" : "";

    var config = adminShowCfg
      ? '<div class="adm-cfg">' +
          '<p class="adm-note"><strong>Token route (demo).</strong> Paste a GitHub token with write access to this repo. ' +
          'It is stored only in your browser (localStorage) — never committed. Required only for “Save to GitHub”.</p>' +
          cfgField("token", "GitHub token", cfg.token, "password") +
          '<div class="adm-cfg__grid">' +
            cfgField("owner", "Owner", cfg.owner) + cfgField("repo", "Repo", cfg.repo) +
            cfgField("branch", "Branch", cfg.branch) + cfgField("prefix", "Path prefix", cfg.prefix) +
            cfgField("baseUrl", "Public base URL (for absolute feed URLs)", cfg.baseUrl) +
          '</div>' +
          '<button class="btn btn--ghost" data-admin="cfg-save">Save config</button>' +
        '</div>' : "";

    return '<div class="wrap adm">' +
      '<div class="adm__head">' +
        '<div><h1 class="page-title">Catalogue manager</h1>' +
          '<p class="adm-sub">Internal demo tool. Edits are buffered in your browser; ' +
          '“Apply locally” updates the shop here, “Save to GitHub” commits to the repo. ' +
          'SKU is the key (locked for existing products).</p></div>' +
      '</div>' +
      '<div class="adm__bar">' +
        '<button class="btn" data-admin="add">+ Add product</button>' +
        '<button class="btn btn--ghost" data-admin="apply">Apply locally</button>' +
        '<button class="btn" data-admin="save">Save to GitHub</button>' +
        '<button class="btn btn--ghost" data-admin="cfg-toggle">Config</button>' +
        '<span class="adm__spacer"></span>' +
        '<button class="btn btn--ghost adm-reset" data-admin="reset">Reset to factory settings</button>' +
      '</div>' +
      status + config +
      '<div class="adm-count">' + adminDraft.length + ' products' + (adminBusy ? ' · working…' : '') + '</div>' +
      '<div class="adm-table"><table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
    '</div>';
  }
  function cfgField(key, label, val, type) {
    return '<label class="adm-field"><span>' + esc(label) + '</span>' +
      '<input data-cfg="' + key + '" type="' + (type || "text") + '" value="' + esc(val || "") + '"></label>';
  }

  function viewCheckout() {
    if (!state.cart.length) { location.hash = "#/"; return ""; }
    var lines = state.cart.map(function (l) {
      var p = BY_SKU[l.sku];
      return '<div class="line">' +
        '<img src="' + esc(img(p.image)) + '" alt="">' +
        '<div><div class="line__name">' + esc(name(p)) + '</div>' +
          '<div class="line__brand">' + esc(p.brand) + (l.size ? ' · ' + esc(t("size")) + ' ' + esc(l.size) : "") + '</div>' +
          '<div class="money" style="font-size:var(--text-sm)">' + esc(l.qty) + " × " + esc(money(effectivePrice(p))) + '</div></div>' +
        '<div class="money">' + esc(money(effectivePrice(p) * l.qty)) + '</div></div>';
    }).join("");
    return '<div class="wrap">' +
      '<h1 class="page-title">' + esc(t("checkout_title")) + '</h1>' +
      '<div class="checkout">' +
        '<form data-checkout>' +
          '<h3 style="margin-bottom:var(--space-4)">' + esc(t("contact")) + '</h3>' +
          '<div class="field"><label>' + esc(t("email")) + '</label><input type="email" required></div>' +
          '<h3 style="margin:var(--space-6) 0 var(--space-4)">' + esc(t("shipping")) + '</h3>' +
          '<div class="row2"><div class="field"><label>' + esc(t("first_name")) + '</label><input required></div>' +
            '<div class="field"><label>' + esc(t("last_name")) + '</label><input required></div></div>' +
          '<div class="field"><label>' + esc(t("address")) + '</label><input required></div>' +
          '<div class="row2"><div class="field"><label>' + esc(t("postcode")) + '</label><input required></div>' +
            '<div class="field"><label>' + esc(t("city")) + '</label><input required></div></div>' +
          '<div class="field"><label>' + esc(t("country")) + '</label><input value="Nederland" required></div>' +
          // checkout cross-sell slot — empty Activate container
          '<div class="perso-slot" data-activate="checkout-crosssell" aria-label="' + esc(t("crosssell")) + '"></div>' +
          '<button class="btn btn--block" type="submit" style="margin-top:var(--space-4)">' + esc(t("pay_now")) + ' · ' + esc(money(cartSubtotal())) + '</button>' +
        '</form>' +
        '<aside class="summary">' +
          '<h3 style="margin-bottom:var(--space-4)">' + esc(t("order_summary")) + '</h3>' +
          lines +
          '<div class="totals" style="margin-top:var(--space-4)"><span>' + esc(t("total")) + '</span><span class="money">' + esc(money(cartSubtotal())) + '</span></div>' +
        '</aside>' +
      '</div></div>';
  }

  // Snapshot the cart into an order BEFORE it is cleared, for the Purchase event.
  function buildOrder(email) {
    return {
      orderid: "SHP-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1e4),
      products: cartProducts(),
      total: round2(cartSubtotal()),
      email: email || getKnownEmail() || ""
    };
  }
  function viewConfirmation() {
    var order = state.lastOrder;
    if (!order) { location.hash = "#/"; return ""; } // e.g. direct hit / refresh — nothing to confirm
    trackPurchase(order);
    var n = order.orderid;
    state.cart = []; state.lastOrder = null; persist(); renderChrome();
    return '<div class="wrap"><div class="confirm">' +
      '<div class="tick">✓</div>' +
      '<h1 style="font-size:var(--text-xl)">' + esc(t("placed_title")) + '</h1>' +
      '<p style="color:var(--ink-soft);margin:var(--space-4) 0">' + esc(t("placed_sub")) + '</p>' +
      '<p class="eyebrow">' + esc(t("order_no")) + " " + esc(n) + '</p>' +
      '<p style="margin-top:var(--space-6)"><a class="btn" href="#/">' + esc(t("back_home")) + '</a></p>' +
    '</div></div>';
  }

  function signupHTML() {
    // Structural email sign-up moment. The empty Activate variant sits beside it.
    return '<section class="signup">' +
      '<div class="perso-slot" data-activate="email-capture"></div>' +
      '<h2>' + esc(t("signup_title")) + '</h2>' +
      '<p>' + esc(t("signup_sub")) + '</p>' +
      '<form data-signup><input type="email" placeholder="' + esc(t("signup_ph")) + '" aria-label="' + esc(t("email")) + '">' +
        '<button class="btn" type="submit">' + esc(t("signup_cta")) + '</button></form>' +
    '</section>';
  }

  /* ---------------- Chrome (header + drawer + footer) ---------------- */
  function monogramSVG() {
    return '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">' +
      '<rect x="1.5" y="1.5" width="37" height="37" rx="12" fill="var(--accent)"/>' +
      '<path d="M25.5 14.2c-1.1-1.5-3-2.4-5.4-2.4-3.3 0-5.6 1.7-5.6 4.3 0 2.5 1.9 3.6 5 4.2 2.7.5 3.7 1 3.7 2.2 0 1.2-1.2 2-3.1 2-2 0-3.4-.8-4.4-2.2" ' +
        'fill="none" stroke="var(--paper)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function renderChrome() {
    var hash = location.hash || "#/";
    function active(h) { return hash.indexOf(h) === 0 ? " is-active" : ""; }
    document.getElementById("hdr").innerHTML =
      '<div class="wrap"><div class="hdr__row">' +
        '<a class="brand" href="#/" aria-label="Shopler home">' + monogramSVG() + '<span class="wm">Shopler</span></a>' +
        '<nav class="nav">' +
          '<a href="#/c/women" class="' + active("#/c/women") + '">' + esc(t("nav_women")) + '</a>' +
          '<a href="#/c/men"' + (active("#/c/men") ? ' class="is-active"' : "") + '>' + esc(t("nav_men")) + '</a>' +
          '<a href="#/c/accessories"' + (active("#/c/accessories") ? ' class="is-active"' : "") + '>' + esc(t("nav_accessories")) + '</a>' +
          '<a href="#/c/sale" class="is-sale">' + esc(t("nav_sale")) + '</a>' +
        '</nav>' +
        '<div class="hdr__actions">' +
          '<div class="lang">' +
            '<button data-lang="en" class="' + (state.lang === "en" ? "is-active" : "") + '">EN</button>' +
            '<button data-lang="nl" class="' + (state.lang === "nl" ? "is-active" : "") + '">NL</button>' +
          '</div>' +
          '<button class="icon-btn cart-btn" data-open-cart aria-label="' + esc(t("cart")) + '">' +
            '<svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>' +
            (cartCount() ? '<span class="count">' + cartCount() + "</span>" : "") +
          '</button>' +
        '</div>' +
      '</div></div>';
  }
  function renderFooter() {
    document.getElementById("ftr").innerHTML = '<div class="wrap"><div class="ftr__cols">' +
      '<div class="ftr__brand"><span class="wm">Shopler</span>' +
        '<p style="margin-top:var(--space-3);max-width:32ch">' + esc(t("hero_sub")) + '</p></div>' +
      '<div><h4>' + esc(t("ft_shop")) + '</h4>' +
        '<a href="#/c/women">' + esc(t("nav_women")) + '</a><a href="#/c/men">' + esc(t("nav_men")) + '</a>' +
        '<a href="#/c/accessories">' + esc(t("nav_accessories")) + '</a><a href="#/c/sale">' + esc(t("nav_sale")) + '</a></div>' +
      '<div><h4>' + esc(t("ft_help")) + '</h4>' +
        '<a href="#/">' + esc(t("ft_shipping")) + '</a><a href="#/">' + esc(t("ft_returns")) + '</a>' +
        '<a href="#/">' + esc(t("ft_faq")) + '</a><a href="#/">' + esc(t("ft_contact")) + '</a></div>' +
      '<div><h4>' + esc(t("ft_about")) + '</h4>' +
        '<a href="#/">' + esc(t("ft_story")) + '</a><a href="#/">' + esc(t("ft_brands")) + '</a>' +
        '<a href="#/">' + esc(t("ft_sustainability")) + '</a>' +
        '<a href="#" data-cc="open">' + esc(t("ft_cookies")) + '</a>' +
        '<a href="#/admin">Manage catalogue</a></div>' +
      '</div>' +
      '<div class="devnote">Shopler — demo storefront for Spotler Activate. Static build; no personalisation, payments or email are real. Containers marked <code>data-activate</code> are populated by Activate at runtime.</div>' +
    '</div>';
  }

  function openDrawer() { document.getElementById("scrim").classList.add("is-open"); document.getElementById("drawer").classList.add("is-open"); }
  function closeDrawer() { document.getElementById("scrim").classList.remove("is-open"); document.getElementById("drawer").classList.remove("is-open"); }
  function renderDrawer() {
    var body, foot = "";
    if (!state.cart.length) {
      body = '<p class="empty-msg">' + esc(t("bag_empty")) + "</p>";
    } else {
      body = state.cart.map(function (l, i) {
        var p = BY_SKU[l.sku];
        return '<div class="line">' +
          '<a href="#/product/' + esc(p.sku) + '"><img src="' + esc(img(p.image)) + '" alt=""></a>' +
          '<div><div class="line__brand">' + esc(p.brand) + '</div>' +
            '<div class="line__name">' + esc(name(p)) + (l.size ? ' <span class="line__size">· ' + esc(t("size")) + ' ' + esc(l.size) + '</span>' : "") + '</div>' +
            '<div class="money" style="font-size:var(--text-sm)">' + esc(money(effectivePrice(p))) + '</div>' +
            '<div class="qty"><button data-dec="' + i + '">−</button><span>' + l.qty + '</span><button data-inc="' + i + '">+</button></div>' +
            '<div><button class="linkbtn" data-remove="' + i + '">' + esc(t("remove")) + '</button></div>' +
          '</div>' +
          '<div class="money">' + esc(money(effectivePrice(p) * l.qty)) + '</div></div>';
      }).join("");
      foot = '<div class="totals"><span>' + esc(t("subtotal")) + '</span><span class="money">' + esc(money(cartSubtotal())) + '</span></div>' +
        '<a class="btn btn--block" href="#/checkout" data-go-checkout>' + esc(t("checkout")) + '</a>';
    }
    document.getElementById("drawer").innerHTML =
      '<div class="drawer__head"><h2>' + esc(t("your_bag")) + '</h2>' +
        '<button class="linkbtn" data-close-cart>' + esc(t("close")) + '</button></div>' +
      '<div class="drawer__body">' + body + '</div>' +
      (foot ? '<div class="drawer__foot">' + foot + "</div>" : "");
  }

  /* ---------------- Router ---------------- */
  function parse() {
    var h = (location.hash || "#/").replace(/^#/, "");
    var parts = h.split("/").filter(Boolean); // e.g. ['c','women'] or ['product','AO-W-001']
    return parts;
  }
  function render() {
    var parts = parse();
    var html, app = document.getElementById("app");
    if (parts[0] === "c" && parts[1]) html = viewListing(parts[1]);
    else if (parts[0] === "product" && parts[1]) html = viewProduct(parts[1]);
    else if (parts[0] === "checkout") html = viewCheckout();
    else if (parts[0] === "confirmation") html = viewConfirmation();
    else if (parts[0] === "admin") html = viewAdmin();
    else html = viewHome();
    app.innerHTML = html;
    renderChrome();
    window.scrollTo(0, 0);
    // Re-apply remembered consent on every route BEFORE any event fires
    // (Activate does not persist consent itself).
    applyConsent(false);
    // Squeezely page-level events, fired once the view is in the DOM.
    trackPageView(); // required on every route, even when no other event follows
    if (parts[0] === "product" && BY_SKU[parts[1]]) trackViewContent(BY_SKU[parts[1]]);
    else if (parts[0] === "c" && parts[1]) {
      var v = parts[1];
      var catName = v === "women" ? "Women" : v === "men" ? "Men"
        : v === "accessories" ? "Accessories" : v === "sale" ? "Sale" : v;
      trackViewCategory(catName);
    }
    else if (parts[0] === "checkout" && state.cart.length) trackInitiateCheckout();
    // Let Activate (when later connected) know the view changed and slots are ready.
    document.dispatchEvent(new CustomEvent("shopler:view", { detail: { route: parts, lang: state.lang } }));
    // Re-evaluate Activate personalizations after each soft navigation / re-render.
    // Skip the first render (sqzl.js evaluates once on initial load); every app.innerHTML
    // replacement thereafter wipes injected personalizations, so re-trigger evaluation.
    if (!sqzlBooted) { sqzlBooted = true; }
    else { sqzlPush({ event: "PageReload" }); }
  }

  /* ---------------- Events (delegated) ---------------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-add],[data-size],[data-cc],[data-admin],[data-admin-del],[data-admin-upload],[data-open-cart],[data-close-cart],[data-lang]," +
      "[data-inc],[data-dec],[data-remove],[data-go-checkout],[data-remove-filter],[data-clear]");
    if (!el) return;
    if (el.hasAttribute("data-admin-del")) { e.preventDefault(); adminDelete(+el.getAttribute("data-admin-del")); return; }
    if (el.hasAttribute("data-admin-upload")) {
      e.preventDefault();
      var urow = +el.getAttribute("data-admin-upload"), ufield = el.getAttribute("data-upload-field");
      var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = function () { var f = inp.files && inp.files[0]; if (f) adminHandleUpload(urow, ufield, f); };
      inp.click();
      return;
    }
    if (el.hasAttribute("data-admin")) {
      e.preventDefault();
      var a = el.getAttribute("data-admin");
      if (a === "add") adminAddProduct();
      else if (a === "apply") adminApplyLocal();
      else if (a === "save") adminSaveGitHub();
      else if (a === "reset") adminReset();
      else if (a === "cfg-toggle") { adminShowCfg = !adminShowCfg; renderAdmin(); }
      else if (a === "cfg-save") {
        var box = document.querySelector(".adm-cfg"), cfg = adminCfg();
        if (box) box.querySelectorAll("[data-cfg]").forEach(function (inp) { cfg[inp.getAttribute("data-cfg")] = inp.value.trim(); });
        setAdminCfg(cfg); adminSetStatus("ok", "Config saved (browser only)."); renderAdmin();
      }
      return;
    }
    if (el.hasAttribute("data-cc")) {
      e.preventDefault();
      var act = el.getAttribute("data-cc");
      if (act === "accept") decideConsent(true, true);
      else if (act === "reject") decideConsent(false, false);
      else if (act === "prefs") renderConsent({ open: true, prefs: true });
      else if (act === "open") renderConsent({ open: true, prefs: true });
      else if (act === "save") {
        var box = el.closest(".cc");
        var a = box && box.querySelector('[data-cc-cat="analytics"]');
        var m = box && box.querySelector('[data-cc-cat="marketing"]');
        decideConsent(a ? a.checked : false, m ? m.checked : false);
      }
      return;
    }
    if (el.hasAttribute("data-size")) {
      e.preventDefault();
      pdpSize = el.getAttribute("data-size");
      var picker = el.closest(".sizes");
      if (picker) {
        picker.querySelectorAll(".size-opt").forEach(function (b) { b.classList.toggle("is-active", b === el); });
        var sel = picker.querySelector("[data-size-sel]"); if (sel) sel.textContent = pdpSize;
      }
      // enable the add button now that a size is chosen
      var addBtn = document.querySelector("[data-add][data-needs-size]");
      if (addBtn) addBtn.removeAttribute("disabled");
    }
    else if (el.hasAttribute("data-add")) {
      e.preventDefault();
      if (el.hasAttribute("data-needs-size") && !pdpSize) return; // blocked until a size is picked
      addToCart(el.getAttribute("data-add"), el.hasAttribute("data-needs-size") ? pdpSize : undefined);
    }
    else if (el.hasAttribute("data-open-cart")) { e.preventDefault(); renderDrawer(); openDrawer(); }
    else if (el.hasAttribute("data-close-cart")) { closeDrawer(); }
    else if (el.hasAttribute("data-lang")) { state.lang = el.getAttribute("data-lang"); persist(); render(); renderDrawer(); renderFooter(); renderConsent(); }
    else if (el.hasAttribute("data-inc")) { var i1 = +el.getAttribute("data-inc"); var l1 = state.cart[i1]; if (l1) setQtyAt(i1, l1.qty + 1); }
    else if (el.hasAttribute("data-dec")) { var i2 = +el.getAttribute("data-dec"); var l2 = state.cart[i2]; if (l2) setQtyAt(i2, l2.qty - 1); }
    else if (el.hasAttribute("data-remove")) { removeAt(+el.getAttribute("data-remove")); }
    else if (el.hasAttribute("data-go-checkout")) { closeDrawer(); }
    else if (el.hasAttribute("data-remove-filter")) {
      var g = el.getAttribute("data-remove-filter"), v = el.getAttribute("data-val");
      if (g === "brand") listingFilters.brands = listingFilters.brands.filter(function (x) { return x !== v; });
      if (g === "colour") listingFilters.colours = listingFilters.colours.filter(function (x) { return x !== v; });
      if (g === "price") listingFilters.price = "";
      render();
    }
    else if (el.hasAttribute("data-clear")) { listingFilters.brands = []; listingFilters.colours = []; listingFilters.price = ""; render(); }
  });

  // Admin text-field edits: update the draft buffer continuously, no re-render (keeps focus).
  document.addEventListener("input", function (e) {
    var el = e.target;
    if (el.matches && el.matches("input[data-row][data-field]")) {
      var i = +el.getAttribute("data-row"), f = el.getAttribute("data-field");
      if (adminDraft && adminDraft[i]) { adminDraft[i][f] = el.value; saveDraft(); }
    }
  });

  document.addEventListener("change", function (e) {
    var el = e.target;
    // Admin dropdowns (single + multi-select for pairs_with)
    if (el.matches("select[data-row][data-field]")) {
      var ri = +el.getAttribute("data-row"), rf = el.getAttribute("data-field");
      if (adminDraft && adminDraft[ri]) {
        if (el.multiple) {
          adminDraft[ri][rf] = Array.prototype.filter.call(el.options, function (o) { return o.selected; })
            .map(function (o) { return o.value; });
        } else { adminDraft[ri][rf] = el.value; }
        saveDraft();
      }
      return;
    }
    if (el.matches("[data-filter]")) {
      var g = el.getAttribute("data-filter"), v = el.value;
      var arr = g === "brand" ? listingFilters.brands : listingFilters.colours;
      if (el.checked) { if (arr.indexOf(v) < 0) arr.push(v); }
      else { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); }
      render();
    } else if (el.matches("[data-price]")) { listingFilters.price = el.value; render(); }
    else if (el.matches("[data-sort]")) { listingFilters.sort = el.value; render(); }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.matches("[data-checkout]")) {
      e.preventDefault();
      var coEmail = e.target.querySelector('input[type="email"]');
      var order = buildOrder(coEmail ? coEmail.value.trim() : "");
      if (order.email) setKnownEmail(order.email); // checkout email also makes the visitor known
      state.lastOrder = order;
      trackPrePurchase(order);     // fired just before the confirmation page
      location.hash = "#/confirmation";
    }
    else if (e.target.matches("[data-signup]")) {
      e.preventDefault();
      var emailInput = e.target.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : "";
      if (email) trackEmailOptIn(email, true);
      e.target.reset(); e.target.querySelector("button").textContent = "✓";
    }
  });
  document.getElementById("scrim").addEventListener("click", closeDrawer);
  window.addEventListener("hashchange", render);

  /* ---------------- Boot ---------------- */
  trackUserId(); // seed Squeezely identity before the first page event
  renderChrome(); renderFooter(); renderDrawer(); renderConsent(); render();
})();
