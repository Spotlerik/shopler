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
    "color", "material", "season", "popularity", "pairs_with", "sizes"];
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
  var SIZE_APPAREL_W = ["Knitwear", "Tops", "Dresses", "Outerwear", "Skirts", "Trousers", "Jeans", "Loungewear"];
  var SIZE_APPAREL_M_LETTER = ["Knitwear", "Outerwear", "Tops"];
  var SIZE_APPAREL_M_NUM   = ["Jeans", "Trousers"];
  function sizesFor(p) {
    // Use product-level sizes when present; skip if it's a single "One size" entry
    // (those are accessories that the PDP renders as a text label, not a picker).
    if (Array.isArray(p.sizes) && p.sizes.length > 0 && !(p.sizes.length === 1 && p.sizes[0] === "One size")) {
      return p.sizes;
    }
    // Derive from category + subcategory (runtime guard for stale localStorage catalogues).
    if (p.category === "Women") {
      if (SIZE_APPAREL_W.indexOf(p.subcategory) >= 0) return ["34","36","38","40","42","44"];
      if (p.subcategory === "Shoes") return ["36","37","38","39","40","41"];
    }
    if (p.category === "Men") {
      if (SIZE_APPAREL_M_NUM.indexOf(p.subcategory) >= 0)    return ["28","30","32","34","36"];
      if (SIZE_APPAREL_M_LETTER.indexOf(p.subcategory) >= 0) return ["S","M","L","XL"];
    }
    return []; // Accessories or unmatched → "one size" text label on PDP
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

    return '<div class="wrap">' +
      '<nav class="breadcrumb"><a href="#/">Shopler</a> / ' + esc(title) + '</nav>' +
      '<h1 class="page-title">' + esc(title) + '</h1>' +
      '<div class="listing">' +
        '<aside class="filters">' +
          listingFacetGroup(t("f_brand"), brands, "brand", f.brands, "data-filter") +
          listingFacetGroup(t("f_colour"), colours, "colour", f.colours, "data-filter") +
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
    // Hidden, unlisted sales-demo routes (not linked from nav/footer/home). Route-scoped
    // noindex keeps them out of search without deindexing the rest of the shop.
    var isDemo = (parts[0] === "usecase" || parts[0] === "usecases");
    (function (no) {
      var m = document.getElementById("demo-noindex");
      if (no && !m) { m = document.createElement("meta"); m.id = "demo-noindex"; m.name = "robots"; m.content = "noindex,nofollow"; document.head.appendChild(m); }
      else if (!no && m) { m.parentNode.removeChild(m); }
    })(isDemo);
    if (parts[0] === "c" && parts[1]) html = viewListing(parts[1]);
    else if (parts[0] === "product" && parts[1]) html = viewProduct(parts[1]);
    else if (parts[0] === "checkout") html = viewCheckout();
    else if (parts[0] === "confirmation") html = viewConfirmation();
    else if (parts[0] === "admin") html = viewAdmin();
    else if (parts[0] === "usecases") html = renderUseCaseIndex();
    else if (parts[0] === "usecase" && parts[1]) html = renderUseCaseDemo(parts[1]);
    else html = viewHome();
    app.innerHTML = html;
    renderChrome();
    document.getElementById("hdr").hidden = isDemo;
    document.getElementById("ftr").hidden = isDemo;
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
    else if (el.matches("[data-uc02-filter]")) {
      if (!demoState.uc02) return;
      var ug = el.getAttribute("data-uc02-filter"), uv = el.value;
      var ua = ug === "brand" ? demoState.uc02.brands : ug === "colour" ? demoState.uc02.colours : ug === "subcat" ? demoState.uc02.subcats : demoState.uc02.sizes;
      if (el.checked) { if (ua.indexOf(uv) < 0) ua.push(uv); }
      else { var uii = ua.indexOf(uv); if (uii >= 0) ua.splice(uii, 1); }
      demoState.uc02.eventCount = (demoState.uc02.eventCount || 0) + 1;
      rerenderDemo();
    } else if (el.matches("[data-uc02-gender]")) {
      if (!demoState.uc02) return;
      demoState.uc02.gender = el.value;
      demoState.uc02.eventCount = (demoState.uc02.eventCount || 0) + 1;
      rerenderDemo();
    } else if (el.matches("[data-uc02-price]")) {
      if (!demoState.uc02) return;
      demoState.uc02.price = el.value;
      rerenderDemo();
    } else if (el.matches("[data-uc02-sort]")) {
      if (!demoState.uc02) return;
      demoState.uc02.sort = el.value;
      rerenderDemo();
    }
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

  /* ============================================================================
     HIDDEN Spotler Activate use-case demo pages (sales tool, unlisted).
     ----------------------------------------------------------------------------
     Routes #/usecase/:id (one per use case) and the #/usecases index. NOT linked
     from nav / footer / homepage — reachable only by direct URL. One data-driven
     template: every page pulls its name / hook / benchmark / example / problem /
     "what to point at" from window.USE_CASES (mirror of use_cases.json). The stage
     map below is presentation only (which realistic shop surface + which artefact);
     no use-case copy, numbers or capabilities are hand-typed here.
     ========================================================================== */
  var UC = (window.USE_CASES || []);
  var UC_BY_ID = {}; UC.forEach(function (u) { UC_BY_ID[u.id] = u; });
  var UC_ORDER = UC.map(function (u) { return u.id; });
  var currentDemoId = null, demoState = {};

  function ucBenchmark(u) { var m = u.metrics && u.metrics.commerce; return m ? (m.value + " " + m.label + (m.context ? " " + m.context : "")) : ""; }
  function ucExample(u) { return (u.examples && u.examples.commerce) || u.blurb || ""; }

  // Real-catalogue pickers, so every surface looks like the actual shop.
  function byPop(n) { return PRODUCTS.slice().sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, n || 8); }
  function bySale(n) { return PRODUCTS.filter(function (p) { return p.sale_price_eur != null; }).slice(0, n || 4); }
  function lowStockOne() { return PRODUCTS.filter(function (p) { return p.stock > 0 && p.stock <= 4; })[0] || PRODUCTS.filter(function (p) { return p.stock > 0; }).slice(-1)[0] || PRODUCTS[0]; }
  function soldOutOne() { return PRODUCTS.filter(function (p) { return p.stock === 0; })[0] || lowStockOne(); }
  function similarTo(p, n) {
    var out = (p.pairs_with || []).map(function (s) { return BY_SKU[s]; }).filter(Boolean);
    PRODUCTS.forEach(function (q) { if (out.length < (n || 4) && q.sku !== p.sku && q.category === p.category && out.indexOf(q) < 0) out.push(q); });
    return out.slice(0, n || 4);
  }
  var DEMO_PERSONA = { first: "Robin", last: "Jansen", full: "Robin Jansen", email: "robin.jansen@example.com" };
  function firstName() { return DEMO_PERSONA.first; } // demo persona for recognised-visitor surfaces

  /* ---------- reusable demo surfaces (Shopler components + styles) ---------- */
  function demoHero(eyebrow, headline, sub, cta) {
    return '<section class="hero demo-hero">' +
      '<img class="hero__bg" src="' + esc(img("hero.webp")) + '" alt="">' +
      '<div class="hero__overlay"><div class="hero__copy"><div class="inner">' +
        (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + '</p>' : "") +
        '<h1>' + esc(headline) + '</h1>' +
        (sub ? '<p>' + esc(sub) + '</p>' : "") +
        (cta ? '<a class="btn" href="#/c/women">' + esc(cta) + '</a>' : "") +
      '</div></div></div>' +
    '</section>';
  }
  function demoRail(heading, products) {
    return '<section class="section demo-injected">' +
      '<div class="section__head"><h2>' + esc(heading) + '</h2>' +
        '<span class="demo-tag">Personalised by Activate</span></div>' +
      gridHTML(products) +
    '</section>';
  }
  function demoPDP(p, injectHTML) {
    var st = stockState(p);
    var stockTxt = st === "sold" ? t("sold_out") : st === "low" ? t("only_left", { n: p.stock }) : "";
    return '<div class="wrap demo-pdp"><div class="pdp">' +
      '<div class="pdp__media"><img src="' + esc(img(p.image_lifestyle)) + '" alt="' + esc(name(p)) + '"></div>' +
      '<div class="pdp__info">' +
        '<div class="pdp__brand">' + esc(p.brand) + '</div>' +
        '<h1 class="pdp__name">' + esc(name(p)) + '</h1>' +
        priceHTML(p, true) +
        (injectHTML || "") +
        (stockTxt ? '<p class="pdp__stock">' + esc(stockTxt) + '</p>' : "") +
        '<button class="btn btn--block" style="margin-top:var(--space-4)">' + esc(t("add_to_cart") || "Add to cart") + '</button>' +
        '<div class="perso-slot" data-activate="pdp-social"></div>' +
      '</div>' +
    '</div></div>';
  }
  function emailPreview(u, bodyHTML) {
    return '<div class="wrap"><div class="demo-frame demo-email">' +
      '<div class="demo-frame__bar"><span class="demo-frame__dot"></span><span class="demo-frame__dot"></span><span class="demo-frame__dot"></span>' +
        '<span class="demo-frame__label">Email preview</span></div>' +
      '<div class="demo-email__head">' +
        '<div class="demo-email__from"><span class="demo-email__avatar">S</span><div><strong>Shopler</strong><span>hello@shopler.example</span></div></div>' +
        '<div class="demo-email__subject">' + esc(u.hook) + '</div>' +
        '<div class="demo-email__pre">' + esc(ucExample(u)) + '</div>' +
      '</div>' +
      '<div class="demo-email__body">' + bodyHTML + '</div>' +
    '</div></div>';
  }
  function emailProductRow(products) {
    return '<div class="demo-email__grid">' + products.map(function (p) {
      return '<a class="demo-eprod" href="#/product/' + esc(p.sku) + '">' +
        '<img src="' + esc(img(p.image)) + '" alt="">' +
        '<div class="demo-eprod__brand">' + esc(p.brand) + '</div>' +
        '<div class="demo-eprod__name">' + esc(name(p)) + '</div>' +
        '<div class="demo-eprod__price">' + priceHTML(p) + '</div></a>';
    }).join("") + '</div>';
  }
  function adPreview(u, products) {
    return '<div class="wrap"><div class="demo-frame demo-ad">' +
      '<div class="demo-frame__bar"><span class="demo-frame__label">Retargeting ad preview · Sponsored</span></div>' +
      '<div class="demo-ad__card">' +
        '<div class="demo-ad__head"><span class="demo-ad__avatar">S</span><div><strong>Shopler</strong><span class="demo-ad__sponsored">Sponsored</span></div></div>' +
        '<div class="demo-ad__copy">' + esc(u.hook) + '</div>' +
        '<div class="demo-ad__row">' + products.slice(0, 3).map(function (p) {
          return '<div class="demo-ad__item"><img src="' + esc(img(p.image_lifestyle)) + '" alt=""><span>' + esc(name(p)) + '</span></div>';
        }).join("") + '</div>' +
        '<div class="demo-ad__cta">Shop now</div>' +
      '</div>' +
    '</div></div>';
  }
  function demoBanner(icon, title, body, extraHTML) {
    return '<div class="demo-banner">' +
      '<span class="demo-banner__icon">' + icon + '</span>' +
      '<div class="demo-banner__text"><strong>' + esc(title) + '</strong>' + (body ? '<span>' + esc(body) + '</span>' : "") + '</div>' +
      (extraHTML || "") +
    '</div>';
  }
  function popupOverlay(title, body, ctaLabel, formHTML) {
    return '<div class="demo-popup" data-demo-popup>' +
      '<div class="demo-popup__card">' +
        '<button class="demo-popup__close" data-demo-popup-close aria-label="Close">×</button>' +
        '<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' +
        (formHTML || (ctaLabel ? '<button class="btn btn--block">' + esc(ctaLabel) + '</button>' : "")) +
      '</div>' +
    '</div>';
  }
  function sidePanel(title, rows) {
    return '<aside class="demo-panel"><h3>' + esc(title) + '</h3>' +
      rows.map(function (r) { return '<div class="demo-panel__row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join("") +
      '</aside>';
  }


  /* --- UC01 helper: Shopler header reproduced inside right panel --- */
  function uc01ShoplerHdr() {
    var hash = location.hash || "#/";
    function active(h) { return hash.indexOf(h) === 0 ? " is-active" : ""; }
    return '<div class="uc01-shopler-hdr">' +
      '<div class="hdr__row">' +
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
      '</div>' +
    '</div>';
  }

  /* --- Shared: Spotler Activate 360° profile panel (ucact-*) ---
   * Extra opts for non-UC01 variants (all optional; UC01 ignores them):
   *   tabAttr      — attribute on tab buttons (default "data-uc01-tab")
   *   systemFields — {fields:[{key,val,date}], prevKeys:[]} → live system fields with dates
   *   contactRows  — [{key,val,dim}] → replaces default name/email/optIn rows
   *   eventCount   — number → event counter in Activity tab instead of EmailOptIn item
   *   previewNote  — string → italic hint at bottom of panel
   */
  function ucactProfile(opts) {
    var done = !!opts.done;
    var typedName = opts.name || "";
    var typedEmail = opts.email || "";
    var activeTab = opts.tab || "profile";
    var animate = !!opts.animate;
    var extraTabs = opts.extraTabs || [];   // [{id, label, content}] — UC03 et al.
    var showSearch = opts.showSearch !== false;
    var tabAttr = opts.tabAttr || "data-uc01-tab";

    var hdrBar = '<div class="ucact-hdrbar">' +
      '<span class="ucact-hdrbar__wordmark">' +
        '<span class="ucact-hdrbar__spotler">spotler</span>' +
        '<span class="ucact-hdrbar__activate">activate</span>' +
      '</span>' +
    '</div>';

    var avatarHTML = done
      ? '<div class="ucact-avatar ucact-avatar--known">' + esc(typedName ? typedName[0].toUpperCase() : "?") + '</div>'
      : '<div class="ucact-avatar ucact-avatar--anon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="currentColor" opacity=".45"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" fill="currentColor" opacity=".45"/></svg></div>';

    var nameEl = done
      ? '<p class="ucact-profile-name' + (animate ? " ucact-seq ucact-seq--name" : "") + '">' + esc(typedName) + '</p>'
      : '<p class="ucact-profile-name">Unknown visitor</p>';
    var emailEl = done
      ? '<p class="ucact-profile-email' + (animate ? " ucact-seq ucact-seq--email" : "") + '">' + esc(typedEmail) + '</p>'
      : '<p class="ucact-profile-email ucact-cookie-id">Session: a3f2c9d1</p>';
    var chipEl = done
      ? '<span class="ucact-tag ucact-tag--known' + (animate ? " ucact-seq ucact-seq--chip" : "") + '">Known</span>'
      : '<span class="ucact-tag ucact-tag--anon">Anonymous</span>';

    // System section — live fields with date column when systemFields opt provided.
    var sysContent;
    if (opts.systemFields) {
      var sf = opts.systemFields, pk = sf.prevKeys || [];
      sysContent = sf.fields.length === 0
        ? '<p class="ucact-empty">No fields found.</p>'
        : '<div class="uc02-system-section">' +
            '<div class="uc02-col-date-hdr"><span>Field</span><span>Date</span></div>' +
            sf.fields.map(function(fi) {
              var isNew = pk.indexOf(fi.key) < 0;
              return '<div class="uc02-sysfield' + (isNew ? ' uc02-sysfield--new' : '') + '">' +
                '<div class="uc02-sysfield__left">' +
                  '<span class="uc02-sysfield__key">' + esc(fi.key) + '</span>' +
                  '<span class="uc02-sysfield__val">' + esc(fi.val) + '</span>' +
                '</div>' +
                '<span class="uc02-sysfield__date">' + esc(fi.date) + '</span>' +
              '</div>';
            }).join('') +
          '</div>';
    } else {
      sysContent = '<p class="ucact-empty">No fields found.</p>';
    }

    // Contact section — caller-supplied rows or default name/email/optIn rows.
    var contactRowsHTML;
    if (opts.contactRows) {
      contactRowsHTML = opts.contactRows.map(function(r) {
        return '<div class="ucact-field">' +
          '<span class="ucact-field__key">' + esc(r.key) + '</span>' +
          '<span class="ucact-field__val' + (r.dim ? ' uc02-unknown' : '') + '">' + esc(r.val || '') + '</span>' +
        '</div>';
      }).join('') || '<p class="ucact-empty">No fields found.</p>';
    } else {
      contactRowsHTML = done
        ? [
            { key: "First name", val: typedName, delay: "0ms" },
            { key: "Email", val: typedEmail, delay: "80ms" },
            { key: "EmailOptIn", val: "Yes", delay: "160ms" }
          ].map(function (f) {
            return '<div class="ucact-field' + (animate ? " ucact-seq ucact-seq--contact" : "") + '"' +
              (animate ? ' style="--ucact-cd:' + f.delay + '"' : "") + '>' +
              '<span class="ucact-field__key">' + esc(f.key) + '</span>' +
              '<span class="ucact-field__val">' + esc(f.val) + '</span></div>';
          }).join("")
        : '<p class="ucact-empty">No fields found.</p>';
    }

    var profileContent =
      '<div class="ucact-section"><div class="ucact-section__hdr"><span class="ucact-section__title">System</span></div>' + sysContent + '</div>' +
      '<div class="ucact-section"><div class="ucact-section__hdr"><span class="ucact-section__title">Custom</span></div><p class="ucact-empty">No fields found.</p></div>' +
      '<div class="ucact-section"><div class="ucact-section__hdr"><span class="ucact-section__title">Contact</span></div>' + contactRowsHTML + '</div>';

    // Activity tab \u2014 event counter (UC02) or EmailOptIn item (UC01 default).
    var actHTML;
    if (opts.eventCount != null) {
      var ec = opts.eventCount;
      actHTML = '<div class="ucact-activity">' +
        (ec > 0
          ? '<div class="ucact-activity__item"><span class="ucact-activity__icon">\u26a1</span>' +
              '<div class="ucact-activity__body">' +
                '<span class="ucact-activity__label">Filter interactions</span>' +
                '<span class="ucact-activity__sub">' + ec + ' event' + (ec !== 1 ? 's' : '') + '</span>' +
              '</div></div>'
          : '<p class="ucact-empty" style="padding:12px 0">No activity yet.</p>') +
      '</div>';
    } else {
      actHTML = done
        ? '<div class="ucact-activity">' +
            '<div class="ucact-activity__item' + (animate ? " ucact-seq ucact-seq--activity" : "") + '">' +
              '<span class="ucact-activity__icon">\u2709</span>' +
              '<div class="ucact-activity__body">' +
                '<span class="ucact-activity__label">EmailOptIn</span>' +
                '<span class="ucact-activity__sub">' + esc(typedEmail) + '</span>' +
              '</div>' +
              '<span class="ucact-activity__time">just now</span>' +
            '</div>' +
          '</div>'
        : '<div class="ucact-activity"><p class="ucact-empty" style="padding:12px 0">No activity yet.</p></div>';
    }

    var extraTabMatch = extraTabs.filter(function (et) { return et.id === activeTab; })[0];
    var tabContent = extraTabMatch ? extraTabMatch.content : (activeTab === "activity" ? actHTML : profileContent);

    return hdrBar +
      '<div class="ucact-main">' +
        '<div class="ucact-topbar">' +
          '<span class="ucact-topbar__title">Customer 360\u00b0</span>' +
          (showSearch ? '<div class="ucact-topbar__search"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>\u00a0Search customers\u2026</div>' : '') +
        '</div>' +
        '<div class="ucact-profile-hdr">' + avatarHTML +
          '<div class="ucact-profile-meta">' + nameEl + emailEl + chipEl + '</div>' +
        '</div>' +
        '<div class="ucact-tabs">' +
          '<button class="ucact-tab' + (activeTab === "profile" ? " is-active" : "") + '" ' + tabAttr + '="profile">Profile</button>' +
          '<button class="ucact-tab' + (activeTab === "activity" ? " is-active" : "") + '" ' + tabAttr + '="activity">Activity</button>' +
          extraTabs.map(function (et) { return '<button class="ucact-tab' + (activeTab === et.id ? " is-active" : "") + '" ' + tabAttr + '="' + esc(et.id) + '">' + esc(et.label) + '</button>'; }).join('') +
        '</div>' +
        '<div class="ucact-tab-content">' + tabContent + '</div>' +
        (opts.previewNote ? '<p class="uc02-preview-note">' + esc(opts.previewNote) + '</p>' : '') +
      '</div>';
  }

  /* --- Shared: split-screen shell (ucsplit-*) --- */
  function ucsplitShell(leftHTML, rightHTML) {
    return '<div class="ucsplit-shell"><div class="ucsplit-left">' + leftHTML + '</div><div class="ucsplit-right">' + rightHTML + '</div></div>';
  }

  /* ============================================================
     UC03 — rt-segmentation helpers
     ============================================================ */
  var uc03Timer = null;

  function uc03InitState() {
    return {
      viewContents:   [],  // [{sku, brand, category, ts}]
      viewCategories: [],  // [{cat, ts}]
      addToCarts:     [],  // [{sku, ts}]
      enteredAt:      {},  // audienceId -> timestamp of first match
      newlyMet:       {},  // audienceId -> bool (true for one render cycle)
      route:          null // {type:'category',cat} | {type:'product',sku} | null
    };
  }

  // Audience definitions with live rule evaluation.
  function uc03AudienceState(s) {
    var vc   = s.viewContents   || [];
    var vcat = s.viewCategories || [];
    var ac   = s.addToCarts     || [];
    var lang = state.lang; // use live state — lang toggle calls render() which re-evaluates

    // Brand with highest ViewContent count
    var brandCounts = {};
    vc.forEach(function (v) { brandCounts[v.brand] = (brandCounts[v.brand] || 0) + 1; });
    var topBrand = null, topBrandCount = 0;
    Object.keys(brandCounts).forEach(function (b) {
      if (brandCounts[b] > topBrandCount) { topBrandCount = brandCounts[b]; topBrand = b; }
    });

    // Customer Phase thresholds (documented): 1 SessionStart = always Orientation.
    // Comparison: ≥3 ViewContent. Decision: ≥5 ViewContent.
    var vcCount = vc.length;
    var phase = vcCount >= 5 ? 'Decision' : vcCount >= 3 ? 'Comparison' : 'Orientation';

    // Retention date (7 days) for event-based audiences
    var retDate = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    var ret7 = retDate.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});

    var audiences = [
      {
        id: 'view-category', kind: 'event',
        label: 'ViewContent or ViewCategory in Category',
        trigger: 'ViewContent / ViewCategory',
        retention: ret7,
        met: vc.length > 0 || vcat.length > 0
      },
      {
        id: '3x-category', kind: 'event',
        label: '3× Category Viewed Last 7 Days',
        trigger: 'ViewCategory ×3',
        retention: ret7,
        met: vcat.length >= 3
      },
      {
        id: '3x-brand', kind: 'event',
        label: '3× Brand Viewed Last 7 Days',
        trigger: 'ViewContent ×3 (same brand)',
        retention: ret7,
        met: topBrandCount >= 3
      },
      {
        id: '3x-viewcontent', kind: 'event',
        label: '3× ViewContent Last 7 Days',
        trigger: 'ViewContent ×3',
        retention: ret7,
        met: vcCount >= 3
      },
      {
        id: '2x-addtocart', kind: 'event',
        label: '2× AddToCart Last 7 Days',
        trigger: 'AddToCart ×2',
        retention: ret7,
        met: ac.length >= 2
      },
      {
        id: 'country-nl', kind: 'profile',
        label: 'Country NL and Language Dutch',
        trigger: 'Profile field: Language',
        retention: '—',
        met: lang === 'nl'
      },
      {
        id: 'profiles-email', kind: 'profile',
        label: 'Profiles with Email',
        trigger: 'EmailOptIn / Purchase',
        retention: '—',
        met: false // browsing alone cannot supply an email
      },
      {
        id: 'customer-phase', kind: 'intelligent',
        label: 'Customer Phase: ' + phase,
        trigger: 'SessionStart / ViewContent',
        retention: '—',
        // Becomes visible after the first browsing action (1 session + first view = Orientation confirmed)
        met: vcCount > 0 || vcat.length > 0,
        phase: phase
      }
    ];

    return {
      audiences:      audiences,
      met:            audiences.filter(function (a) { return a.met; }),
      unmet:          audiences.filter(function (a) { return !a.met; }),
      vcCount:        vcCount,
      vcatCount:      vcat.length,
      acCount:        ac.length,
      topBrand:       topBrand,
      topBrandCount:  topBrandCount,
      phase:          phase
    };
  }

  // Update enteredAt: stamp new entries, remove stale ones (profile-based can exit).
  function uc03CheckAudiences(s) {
    var now = Date.now();
    var audSt = uc03AudienceState(s);
    var metIds = {};
    audSt.met.forEach(function (a) {
      metIds[a.id] = true;
      if (!s.enteredAt[a.id]) {
        s.enteredAt[a.id] = now;
        s.newlyMet[a.id] = true;
      }
    });
    Object.keys(s.enteredAt).forEach(function (id) {
      if (!metIds[id]) delete s.enteredAt[id];
    });
    // Clear newlyMet flags after one render cycle
    Object.keys(s.newlyMet).forEach(function (id) {
      if (!s.enteredAt[id]) delete s.newlyMet[id];
    });
  }

  function uc03RelTime(ts) {
    var sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 5)  return 'just now';
    if (sec < 60) return sec + 's ago';
    return Math.floor(sec / 60) + 'm ago';
  }

  function uc03KindBadge(kind) {
    var map = { event: 'E', profile: 'P', intelligent: 'I' };
    return '<span class="uc03-kind uc03-kind--' + kind + '" title="' +
      (kind === 'event' ? 'Event-based' : kind === 'profile' ? 'Profile-based' : 'Intelligent') +
      '">' + (map[kind] || kind[0].toUpperCase()) + '</span>';
  }

  function uc03AudiencesTabContent(s) {
    var audSt = uc03AudienceState(s);

    // Matched table
    var matchedRows = audSt.met.map(function (a, i) {
      var isNew = !!s.newlyMet[a.id];
      return '<tr class="uc03-aud-row' + (isNew ? ' uc03-aud-row--new' : '') + '" data-aud-id="' + esc(a.id) + '">' +
        '<td class="uc03-aud-id">' + String(i + 1).padStart(2, '0') + '</td>' +
        '<td class="uc03-aud-name">' + uc03KindBadge(a.kind) + esc(a.label) + '</td>' +
        '<td class="uc03-aud-event">' + esc(a.trigger) + '</td>' +
        '<td class="uc03-aud-ret">' + esc(a.retention) + '</td>' +
        '<td class="uc03-aud-time">' + (s.enteredAt[a.id] ? esc(uc03RelTime(s.enteredAt[a.id])) : 'just now') + '</td>' +
      '</tr>';
    }).join('');

    var emptyRow = audSt.met.length === 0
      ? '<tr><td colspan="5" class="uc03-aud-empty">No audiences matched yet — browse the shop →</td></tr>'
      : '';

    var tableHTML =
      '<div class="uc03-table-wrap">' +
        '<table class="uc03-aud-table">' +
          '<thead><tr><th>ID</th><th>Audience</th><th>Event</th><th>Retention expiry</th><th>Entered</th></tr></thead>' +
          '<tbody>' + emptyRow + matchedRows + '</tbody>' +
        '</table>' +
        '<p class="uc03-ret-note">Event-based audiences release the profile when retention lapses — the audience maintains itself in both directions.</p>' +
      '</div>';

    // Progress text per unmet audience
    function progressNote(a) {
      if (a.id === 'view-category')    return 'Open any category or product page';
      if (a.id === '3x-category')      return audSt.vcatCount + ' of 3 categories viewed';
      if (a.id === '3x-brand') {
        return audSt.topBrand
          ? audSt.topBrandCount + ' of 3 ' + audSt.topBrand + ' products viewed'
          : '0 of 3 same-brand products viewed';
      }
      if (a.id === '3x-viewcontent')   return audSt.vcCount + ' of 3 products viewed';
      if (a.id === '2x-addtocart')     return audSt.acCount + ' of 2 items added to cart';
      if (a.id === 'country-nl')       return 'Switch shop to Dutch via the NL toggle';
      if (a.id === 'profiles-email')   return 'Requires an email address — browsing cannot supply one';
      if (a.id === 'customer-phase')   return 'Browse to enter Orientation phase (1 session start tracked)';
      return '';
    }

    var notMetRows = audSt.unmet.map(function (a) {
      return '<div class="uc03-notmet-row">' +
        '<div class="uc03-notmet-name">' + uc03KindBadge(a.kind) + esc(a.label) + '</div>' +
        '<div class="uc03-notmet-progress">' + esc(progressNote(a)) + '</div>' +
      '</div>';
    }).join('');

    var notMetHTML = notMetRows
      ? '<div class="uc03-notmet"><div class="uc03-notmet-hdr">Not yet matched</div>' + notMetRows + '</div>'
      : '';

    var totalEvents = (s.viewContents.length) + (s.viewCategories.length) + (s.addToCarts.length);
    var counterHTML = '<div class="uc03-event-counter">Live events fired: <b>' + totalEvents + '</b></div>';

    return tableHTML + notMetHTML + counterHTML;
  }

  // Right pane: actual shop content with intercepted navigation
  function uc03RightPane(s) {
    var route = s.route;
    var contentHTML;

    if (route && route.type === 'product') {
      var p = BY_SKU[route.sku];
      if (p) {
        var st = stockState(p);
        contentHTML =
          '<div class="uc03-shop-content">' +
            '<button class="uc03-back" data-uc03-nav="#/c/' + esc((p.category || 'women').toLowerCase()) + '">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>' +
              esc(p.category) +
            '</button>' +
            '<div class="uc03-pdp">' +
              '<img class="uc03-pdp-img" src="' + esc(img(p.image_lifestyle)) + '" alt="">' +
              '<div>' +
                '<div class="uc03-pdp-brand">' + esc(p.brand) + '</div>' +
                '<div class="uc03-pdp-name">' + esc(name(p)) + '</div>' +
                priceHTML(p, false) +
                (st !== 'sold'
                  ? '<button class="btn btn--block" style="margin-top:12px" data-add="' + esc(p.sku) + '" data-uc03-atc="' + esc(p.sku) + '">' + esc(t('add_to_cart')) + '</button>'
                  : '<button class="btn btn--block" disabled style="margin-top:12px">' + esc(t('sold_out')) + '</button>') +
              '</div>' +
            '</div>' +
          '</div>';
      } else {
        contentHTML = '<div class="uc03-shop-content"><p style="color:#94a3b8">Product not found.</p></div>';
      }
    } else if (route && route.type === 'category') {
      var cat = route.cat;
      var catLabel = cat === 'women' ? t('nav_women') : cat === 'men' ? t('nav_men')
        : cat === 'accessories' ? t('nav_accessories') : cat === 'sale' ? t('on_sale')
        : cat.charAt(0).toUpperCase() + cat.slice(1);
      var prods = productsForView(cat);
      var cardLinks = '<div class="grid">' + prods.slice(0, 12).map(function (p2) {
        return '<article class="card">' +
          '<a class="card__media" href="#" data-uc03-nav="#/product/' + esc(p2.sku) + '">' +
            '<img class="card__img--lifestyle" src="' + esc(img(p2.image_lifestyle)) + '" alt="' + esc(name(p2)) + '" loading="lazy">' +
            '<img class="card__img--packshot" src="' + esc(img(p2.image)) + '" alt="" aria-hidden="true" loading="lazy">' +
          '</a>' +
          '<div class="card__body">' +
            '<a href="#" data-uc03-nav="#/product/' + esc(p2.sku) + '">' +
              '<div class="card__brand">' + esc(p2.brand) + '</div>' +
              '<div class="card__name">' + esc(name(p2)) + '</div>' +
            '</a>' +
            priceHTML(p2) +
          '</div>' +
        '</article>';
      }).join('') + '</div>';
      contentHTML = '<div class="uc03-shop-content"><h2 class="uc03-cat-title">' + esc(catLabel) + '</h2>' + cardLinks + '</div>';
    } else {
      // Home: tiles + top products
      var cats = ['women', 'men', 'accessories'];
      var tiles = '<div class="uc03-home-tiles">' + cats.map(function (c) {
        var label = c === 'women' ? t('nav_women') : c === 'men' ? t('nav_men') : t('nav_accessories');
        var hero2 = PRODUCTS.filter(function (p3) { return p3.category.toLowerCase() === c; })
          .sort(function (a, b) { return b.popularity - a.popularity; })[0];
        return '<a class="uc03-home-tile" href="#" data-uc03-nav="#/c/' + c + '">' +
          (hero2 ? '<img src="' + esc(img(hero2.image_lifestyle)) + '" alt="">' : '') +
          '<span>' + esc(label) + '</span></a>';
      }).join('') + '</div>';
      var newCards = '<div class="grid">' + byPop(6).map(function (p4) {
        return '<article class="card">' +
          '<a class="card__media" href="#" data-uc03-nav="#/product/' + esc(p4.sku) + '">' +
            '<img class="card__img--lifestyle" src="' + esc(img(p4.image_lifestyle)) + '" alt="' + esc(name(p4)) + '" loading="lazy">' +
          '</a>' +
          '<div class="card__body">' +
            '<a href="#" data-uc03-nav="#/product/' + esc(p4.sku) + '">' +
              '<div class="card__brand">' + esc(p4.brand) + '</div>' +
              '<div class="card__name">' + esc(name(p4)) + '</div>' +
            '</a>' +
            priceHTML(p4) +
          '</div>' +
        '</article>';
      }).join('') + '</div>';
      contentHTML = '<div class="uc03-shop-content">' +
        '<p style="font-size:13px;color:#64748b;margin:0 0 14px">Browse the shop below — the Audiences panel updates as you go.</p>' +
        tiles + '<h2 class="uc03-cat-title" style="margin-top:8px">' + esc(t('new_in')) + '</h2>' + newCards +
      '</div>';
    }

    return '<div class="uc03-shop" data-uc03-shop>' +
      uc01ShoplerHdr() +
      contentHTML +
    '</div>';
  }

  function uc03EnsureTimer() {
    if (uc03Timer) return;
    uc03Timer = setInterval(function () {
      if (currentDemoId !== 'rt-segmentation') { clearInterval(uc03Timer); uc03Timer = null; return; }
      // Tick: update time cells in place without full re-render
      var rows = document.querySelectorAll('.uc03-aud-row[data-aud-id]');
      var s = demoState.uc03;
      if (!s) return;
      rows.forEach(function (tr) {
        var id = tr.getAttribute('data-aud-id');
        var cell = tr.querySelector('.uc03-aud-time');
        if (cell && s.enteredAt[id]) cell.textContent = uc03RelTime(s.enteredAt[id]);
      });
    }, 5000);
  }

  function uc03Navigate(href, s) {
    var catMatch  = href.match(/^#\/c\/(.+)$/);
    var prodMatch = href.match(/^#\/product\/(.+)$/);
    var now = Date.now();
    if (catMatch) {
      var cat = catMatch[1];
      s.route = {type: 'category', cat: cat};
      var catName = cat === 'sale' ? 'Sale'
        : cat.charAt(0).toUpperCase() + cat.slice(1);
      s.viewCategories.push({cat: catName, ts: now});
    } else if (prodMatch) {
      var sku = prodMatch[1];
      var p = BY_SKU[sku];
      s.route = {type: 'product', sku: sku};
      if (p) s.viewContents.push({sku: p.sku, brand: p.brand, category: p.category, ts: now});
    }
    uc03CheckAudiences(s);
    // Clear newlyMet flags after this render
    setTimeout(function () { if (demoState.uc03) demoState.uc03.newlyMet = {}; }, 2100);
    rerenderDemo();
  }

  /* --- UC02: Profile Enrichment helpers --- */
  function uc02DeriveFields(st, today) {
    var fields = [];
    st.brands.forEach(function(b, i) {
      if (i < 3) fields.push({ key: "favorite_brand_" + (i + 1), val: b, date: today });
    });
    if (st.colours.length) fields.push({ key: "favorite_color_1", val: st.colours[0], date: today });
    if (st.sizes.length) fields.push({ key: "favorite_size_1", val: st.sizes[0], date: today });
    if (st.subcats.length) {
      var viewSlug = st.view !== "all" ? st.view : "all";
      var subcatSlugs = st.subcats.map(function(s) {
        return viewSlug + "-" + s.toLowerCase().replace(/\s+/g, "-");
      });
      fields.push({ key: "favorite_categories", val: [viewSlug].concat(subcatSlugs).join(", "), date: today });
      subcatSlugs.forEach(function(slug, si) {
        if (si < 3) fields.push({ key: "favorite_category_" + (si + 1), val: slug, date: today });
      });
    }
    return fields;
  }

  function listingFacetGroup(label, items, group, checked, filterAttr) {
    return '<h3>' + esc(label) + '</h3><div class="fgroup">' +
      items.map(function(v) {
        var c = checked.indexOf(v) >= 0;
        return '<label><input type="checkbox" ' + filterAttr + '="' + group + '" value="' + esc(v) + '"' + (c ? ' checked' : '') + '>' + esc(v) + '</label>';
      }).join('') +
    '</div>';
  }

  var UC02_SIZE_ORDER = ["28","30","32","34","36","37","38","39","40","41","42","44","S","M","L","XL","One size"];

  function uc02Listing(st) {
    var view = st.view || "women";
    var allProds = productsForView(view);
    var prods = allProds.slice();

    if (st.brands.length) prods = prods.filter(function(p) { return st.brands.indexOf(p.brand) >= 0; });
    if (st.colours.length) prods = prods.filter(function(p) { return st.colours.indexOf(p.color) >= 0; });
    if (st.sizes.length) prods = prods.filter(function(p) {
      var pz = sizesFor(p); return st.sizes.some(function(s) { return pz.indexOf(s) >= 0; });
    });
    if (st.subcats.length) prods = prods.filter(function(p) { return st.subcats.indexOf(p.subcategory) >= 0; });
    if (st.price === "0-50") prods = prods.filter(function(p) { return effectivePrice(p) < 50; });
    else if (st.price === "50-100") prods = prods.filter(function(p) { return effectivePrice(p) >= 50 && effectivePrice(p) < 100; });
    else if (st.price === "100+") prods = prods.filter(function(p) { return effectivePrice(p) >= 100; });

    if (st.sort === "price-asc") prods.sort(function(a, b) { return effectivePrice(a) - effectivePrice(b); });
    else if (st.sort === "price-desc") prods.sort(function(a, b) { return effectivePrice(b) - effectivePrice(a); });
    else prods.sort(function(a, b) { return (b.popularity || 0) - (a.popularity || 0); });

    var fBrands = [], fColours = [], fSizes = [], fSubcats = [];
    allProds.forEach(function(p) {
      if (fBrands.indexOf(p.brand) < 0) fBrands.push(p.brand);
      if (p.color && fColours.indexOf(p.color) < 0) fColours.push(p.color);
      if (p.subcategory && fSubcats.indexOf(p.subcategory) < 0) fSubcats.push(p.subcategory);
      sizesFor(p).forEach(function(s) { if (fSizes.indexOf(s) < 0) fSizes.push(s); });
    });
    fBrands.sort(); fColours.sort(); fSubcats.sort();
    fSizes.sort(function(a, b) {
      var ai = UC02_SIZE_ORDER.indexOf(a), bi = UC02_SIZE_ORDER.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1; if (bi >= 0) return 1;
      return a < b ? -1 : a > b ? 1 : 0;
    });

    var tabsHTML = '<nav class="uc02-cat-nav">' +
      ["women","men","accessories","sale"].map(function(v) {
        return '<button class="uc02-cat-tab' + (v === view ? " is-active" : "") + '" data-uc02-view="' + v + '">' +
          v.charAt(0).toUpperCase() + v.slice(1) + '</button>';
      }).join("") +
    '</nav>';

    var chips = [];
    st.brands.forEach(function(b) { chips.push('<span class="chip">' + esc(b) + '<button data-uc02-remove="brand:' + esc(b) + '" aria-label="Remove">×</button></span>'); });
    st.colours.forEach(function(c) { chips.push('<span class="chip">' + esc(c) + '<button data-uc02-remove="colour:' + esc(c) + '" aria-label="Remove">×</button></span>'); });
    st.sizes.forEach(function(s) { chips.push('<span class="chip">' + esc(s) + '<button data-uc02-remove="size:' + esc(s) + '" aria-label="Remove">×</button></span>'); });
    st.subcats.forEach(function(s) { chips.push('<span class="chip">' + esc(s) + '<button data-uc02-remove="subcat:' + esc(s) + '" aria-label="Remove">×</button></span>'); });
    if (st.gender) chips.push('<span class="chip">Gender: ' + esc(st.gender) + '<button data-uc02-remove="gender:" aria-label="Remove">×</button></span>');
    if (st.price) chips.push('<span class="chip">Price: ' + esc(st.price) + '<button data-uc02-remove="price:" aria-label="Remove">×</button></span>');
    var chipsHTML = chips.length
      ? '<div class="chiprow">' + chips.join("") + '<button class="linkbtn" data-uc02-clear>Clear all</button></div>'
      : '';

    var genderSection = '<h3>Gender</h3><div class="fgroup">' +
      ['women','men'].map(function(g) {
        return '<label><input type="radio" name="uc02-gender" data-uc02-gender value="' + g + '"' + (st.gender === g ? ' checked' : '') + '>' + g.charAt(0).toUpperCase() + g.slice(1) + '</label>';
      }).join('') +
    '</div>';

    var priceSection = '<h3>Price</h3><div class="fgroup">' +
      '<select data-uc02-price>' +
        '<option value="">All prices</option>' +
        '<option value="0-50"' + (st.price === "0-50" ? ' selected' : '') + '>Under €50</option>' +
        '<option value="50-100"' + (st.price === "50-100" ? ' selected' : '') + '>€50–€100</option>' +
        '<option value="100+"' + (st.price === "100+" ? ' selected' : '') + '>€100+</option>' +
      '</select>' +
    '</div>';

    var sidebarHTML = '<aside class="filters">' +
      listingFacetGroup("Brand", fBrands, "brand", st.brands, "data-uc02-filter") +
      listingFacetGroup("Colour", fColours, "colour", st.colours, "data-uc02-filter") +
      (fSizes.length ? listingFacetGroup("Size", fSizes, "size", st.sizes, "data-uc02-filter") : '') +
      (fSubcats.length > 1 ? listingFacetGroup("Category", fSubcats, "subcat", st.subcats, "data-uc02-filter") : '') +
      genderSection +
      priceSection +
    '</aside>';

    var sortBarHTML = '<div class="listing__bar">' +
      '<span class="count">' + prods.length + (prods.length === 1 ? ' product' : ' products') + '</span>' +
      '<label>Sort: <select data-uc02-sort>' +
        '<option value="featured"' + (st.sort === "featured" ? ' selected' : '') + '>Featured</option>' +
        '<option value="price-asc"' + (st.sort === "price-asc" ? ' selected' : '') + '>Price: low → high</option>' +
        '<option value="price-desc"' + (st.sort === "price-desc" ? ' selected' : '') + '>Price: high → low</option>' +
      '</select></label>' +
    '</div>';

    var gridContent = prods.length
      ? '<div class="grid">' + prods.map(function(p) { return cardHTML(p); }).join("") + '</div>'
      : '<div class="empty-state">No products match your filters.</div>';

    return '<div class="uc02-shopler">' +
      '<div class="uc02-shopler-body">' +
        '<div class="wrap">' +
          tabsHTML +
          '<div class="listing">' +
            sidebarHTML +
            '<div>' +
              sortBarHTML +
              chipsHTML +
              gridContent +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- per-use-case staging (presentation only) ---------- */
  var STAGE = {
    "email-capture": function (u) {
      var done = !!demoState.uc01Done;
      var submittedName = demoState.uc01Name || "";
      var submittedEmail = demoState.uc01Email || "";
      var animate = !!demoState.uc01Animate;
      if (animate) demoState.uc01Animate = false;
      var activeTab = demoState.ucActTab || "profile";
      var prods = byPop(4);

      var shoplerHdr = uc01ShoplerHdr();
      var heroHTML = demoHero(t("hero_eyebrow"), t("hero_title"), t("hero_sub"), t("hero_cta"));
      var railHTML = '<div class="wrap">' + demoRail(t("new_in") || "New in", prods) + '</div>';

      var overlayCardHTML = done
        ? '<div class="uc01-overlay__card">' +
            '<div class="uc01-success">' +
              '<div class="uc01-success__check">\u2713</div>' +
              '<h3 class="uc01-success__title">You\u2019re on the list!</h3>' +
              '<p class="uc01-success__body">Welcome, ' + esc(submittedName) + '. Your 10% discount is on its way.</p>' +
              '<p class="uc01-success__note">\u2190 EmailOptIn event fired to Spotler Activate</p>' +
            '</div>' +
          '</div>'
        : '<div class="uc01-overlay__card">' +
            '<h3 class="uc01-overlay__title">Get 10% off your first order</h3>' +
            '<p class="uc01-overlay__body">' + esc(ucExample(u)) + '</p>' +
            '<form class="uc01-signup" data-uc01-signup>' +
              '<input class="uc01-signup__field" type="text" name="name" placeholder="First name" autocomplete="given-name" required>' +
              '<input class="uc01-signup__field" type="email" name="email" placeholder="Email address" autocomplete="email" required>' +
              '<label class="uc01-signup__consent"><input type="checkbox">\u00a0I agree to receive the Shopler newsletter</label>' +
              '<button class="btn btn--block uc01-signup__btn" type="submit">Claim your discount</button>' +
            '</form>' +
          '</div>';

      var overlayHTML = '<div class="uc01-overlay">' + overlayCardHTML + '</div>';

      var leftHTML = ucactProfile({done: done, name: submittedName, email: submittedEmail, tab: activeTab, animate: animate}) +
        demoCaption(u, true);

      var shellCls = "ucsplit-shell" + (animate ? " uc01-pulse" : "");
      return '<button class="uc01-replay" data-uc01-replay>\u21ba Replay</button>' +
        '<div class="' + shellCls + '">' +
          '<div class="ucsplit-left">' + leftHTML + '</div>' +
          '<div class="ucsplit-gutter"></div>' +
          '<div class="ucsplit-right">' +
            '<div class="uc01-shopler">' +
              shoplerHdr +
              '<div class="uc01-shopler-body">' +
                heroHTML + railHTML +
              '</div>' +
            '</div>' +
            overlayHTML +
          '</div>' +
        '</div>';
    },
    "profile-enrichment": function(u) {
      if (!demoState.uc02) {
        demoState.uc02 = { view: "women", subcats: [], brands: [], colours: [], sizes: [], gender: null, price: "", sort: "featured", tab: "profile", eventCount: 0, prevFieldKeys: [] };
      }
      var st = demoState.uc02;
      var today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      var fields = uc02DeriveFields(st, today);
      var prevKeys = (st.prevFieldKeys || []).slice();
      st.prevFieldKeys = fields.map(function(f) { return f.key; });
      var genderVal = st.gender ? st.gender.charAt(0).toUpperCase() + st.gender.slice(1) : null;
      var leftHTML = ucactProfile({
        tabAttr: "data-uc02-tab",
        tab: st.tab,
        showSearch: false,
        systemFields: { fields: fields, prevKeys: prevKeys },
        contactRows: [{ key: "Gender", val: genderVal || "Unknown", dim: !genderVal }],
        eventCount: st.eventCount || 0,
        previewNote: "Apply filters on the right → watch the profile update live."
      });
      return ucsplitShell(leftHTML, uc02Listing(st));
    },
    "rt-segmentation": function (u) {
      if (!demoState.uc03) {
        // Reset lang to English for a clean anonymous-visitor start
        if (state.lang !== 'en') { state.lang = 'en'; persist(); }
        demoState.uc03 = uc03InitState();
      }
      var s = demoState.uc03;
      // Re-evaluate memberships (catches lang-toggle exit from country-nl)
      uc03CheckAudiences(s);
      uc03EnsureTimer();
      // Schedule highlight clearance (covers lang-toggle and other non-navigate paths)
      if (Object.keys(s.newlyMet).length > 0) {
        setTimeout(function () { if (demoState.uc03) demoState.uc03.newlyMet = {}; }, 2500);
      }

      var activeTab = demoState.ucActTab || 'audiences';
      var audContent = uc03AudiencesTabContent(s);

      var leftHTML = ucactProfile({
        done: false,
        showSearch: false,
        tab: activeTab,
        extraTabs: [{id: 'audiences', label: 'Audiences', content: audContent}]
      }) + demoCaption(u, true);

      var rightHTML = uc03RightPane(s);

      return '<div class="ucsplit-shell">' +
          '<div class="ucsplit-left">' +
            '<button class="uc03-replay-btn" data-uc03-replay>↺ Replay</button>' +
            leftHTML +
          '</div>' +
          '<div class="ucsplit-gutter"></div>' +
          '<div class="ucsplit-right">' + rightHTML + '</div>' +
        '</div>';
    },
    "email-recognition": function (u) {
      return demoBanner("👋", "Welcome back, " + firstName(), ucExample(u)) +
        demoHero(t("hero_eyebrow"), "Good to see you again, " + firstName(), t("hero_sub"), t("hero_cta")) +
        '<div class="wrap">' + demoRail(t("picked"), byPop(4)) + '</div>';
    },
    "website-reminder": function (u) {
      var p = byPop(1)[0];
      return demoBanner("↩", "Continue where you left off", null,
        '<a class="demo-banner__prod" href="#/product/' + esc(p.sku) + '"><img src="' + esc(img(p.image)) + '" alt=""><span>' + esc(name(p)) + '</span><span class="btn btn--sm">Resume</span></a>') +
        demoHero(t("hero_eyebrow"), t("hero_title"), t("hero_sub"), t("hero_cta")) +
        '<div class="wrap">' + demoRail(t("new_in"), byPop(4)) + '</div>';
    },
    "pers-homepage": function (u) {
      var v = demoState.visitor || "womens";
      var map = {
        womens: { eyebrow: "Womenswear, picked for you", head: "Your edit, " + firstName(), list: PRODUCTS.filter(function (p) { return p.category === "Women"; }).slice(0, 4) },
        mens: { eyebrow: "Menswear, picked for you", head: "New in for you", list: PRODUCTS.filter(function (p) { return p.category === "Men"; }).slice(0, 4) },
        sale: { eyebrow: "Your size, now on sale", head: "Back in your price range", list: bySale(4) }
      };
      var m = map[v] || map.womens;
      return '<div class="demo-toggle">' +
          '<span>Visitor type:</span>' +
          '<button class="demo-chip' + (v === "womens" ? " is-on" : "") + '" data-demo-visitor="womens">Womenswear regular</button>' +
          '<button class="demo-chip' + (v === "mens" ? " is-on" : "") + '" data-demo-visitor="mens">Menswear regular</button>' +
          '<button class="demo-chip' + (v === "sale" ? " is-on" : "") + '" data-demo-visitor="sale">Sale-seeker</button>' +
        '</div>' +
        demoHero(m.eyebrow, m.head, t("hero_sub"), t("hero_cta")) +
        '<div class="wrap">' + demoRail("Picked for " + firstName(), m.list) + '</div>';
    },
    "rec-onsite": function (u) {
      return '<div class="wrap"><h1 class="page-title">' + esc(t("nav_women")) + '</h1>' +
        demoRail("Recommended for you", byPop(4)) +
        gridHTML(byPop(8).slice(4, 8)) + '</div>';
    },
    "rec-matching": function (u) {
      var p = byPop(1)[0];
      return demoPDP(p, "") + '<div class="wrap">' + demoRail("You might also like", similarTo(p, 4)) + '</div>';
    },
    "persuasive-product": function (u) {
      var p = lowStockOne();
      var proof = '<div class="demo-proof">' +
        '<span class="demo-proof__item">👁 18 people viewing now</span>' +
        '<span class="demo-proof__item">🔥 Only ' + p.stock + ' left</span>' +
        '<span class="demo-proof__item">✓ 34 bought this week</span>' +
      '</div>';
      return demoPDP(p, proof);
    },
    "persuasive-popups": function (u) {
      var p = byPop(1)[0];
      return demoPDP(p, "") + popupOverlay("Selling fast", ucExample(u), "Add to cart");
    },
    "rec-crosssell": function (u) {
      var p = byPop(1)[0]; var adds = similarTo(p, 3);
      return '<div class="wrap demo-checkout"><h1 class="page-title">' + esc(t("checkout") || "Checkout") + '</h1>' +
        '<div class="demo-cartline"><img src="' + esc(img(p.image)) + '" alt=""><div><b>' + esc(name(p)) + '</b><span>' + esc(p.brand) + '</span></div><span class="money">' + esc(money(effectivePrice(p))) + '</span></div>' +
        demoRail("Complete your order with…", adds) + '</div>';
    },
    "abandoned-cart": function (u) {
      var items = byPop(2);
      return emailPreview(u, '<p class="demo-email__lead">You left these in your bag — still yours if you want them.</p>' +
        emailProductRow(items) +
        '<p class="demo-email__urgency">Low stock on one of these — don’t miss out.</p>' +
        '<div class="demo-email__cta">Complete your order</div>');
    },
    "browse-abandonment": function (u) {
      return emailPreview(u, '<p class="demo-email__lead">Still thinking it over? Here’s what you were looking at.</p>' +
        emailProductRow(byPop(3)) +
        '<div class="demo-email__cta">Pick up where you left off</div>');
    },
    "back-in-stock": function (u) {
      var p = soldOutOne();
      return emailPreview(u, '<p class="demo-email__lead">Good news — it’s back.</p>' +
        emailProductRow([p]) +
        '<p class="demo-email__urgency">Limited stock this time.</p>' +
        '<div class="demo-email__cta">Get it before it goes</div>');
    },
    "rec-email": function (u) {
      return emailPreview(u, '<p class="demo-email__lead">Hand-picked for you, ' + firstName() + '.</p>' +
        emailProductRow(byPop(4)) +
        '<div class="demo-email__cta">Shop your picks</div>');
    },
    "online-retargeting": function (u) {
      return adPreview(u, byPop(3));
    },
    "followup-loyalty": function (u) {
      return emailPreview(u, '<p class="demo-email__lead">Thanks for your order, ' + firstName() + '.</p>' +
        '<div class="demo-reward">★ You’ve earned <b>150 points</b> · €10 off your next order</div>' +
        emailProductRow(byPop(3)) +
        '<div class="demo-email__cta">Use your reward</div>');
    },
    "predictive-clv": function (u) {
      return demoBanner("★", firstName() + " — VIP customer", "Predicted high lifetime value") +
        demoHero("Because you’re one of our best", "Early access, just for you, " + firstName(), t("hero_sub"), "Shop VIP early access") +
        '<div class="wrap"><div class="demo-vip">' +
          '<div class="demo-vip__perk">🎟 Early access to new drops</div>' +
          '<div class="demo-vip__perk">🚚 Free priority shipping</div>' +
          '<div class="demo-vip__perk">💬 Personal styling concierge</div>' +
        '</div>' + demoRail("Chosen for a VIP", byPop(4)) + '</div>';
    }
  };

  // Use cases that genuinely need signal (known visitor / prior behaviour) — shown honestly.
  var UC_NEEDS_SIGNAL = {
    "email-recognition": "Kicks in only once a visitor is recognised (known profile) — a true first-time anonymous visit can't be greeted by name.",
    "website-reminder": "Needs prior behaviour — this shows a returning visitor who viewed items before.",
    "pers-homepage": "Personalises once there's a segment/profile signal; a brand-new anonymous visitor sees the default homepage.",
    "rec-onsite": "Improves as behaviour accrues; cold-start falls back to popular items.",
    "rec-matching": "Based on the product being viewed plus behavioural signal.",
    "abandoned-cart": "Triggers after a known contact leaves items in the cart.",
    "browse-abandonment": "Triggers after a known contact browses without buying.",
    "back-in-stock": "Triggers for contacts who asked about an out-of-stock item.",
    "rec-email": "Recommendations are per-contact, so it needs a known profile.",
    "online-retargeting": "Builds audiences from first-party behaviour, then syncs to ad platforms.",
    "followup-loyalty": "Triggers after a purchase.",
    "predictive-clv": "Scored in Spotler Activate from purchase history; shown here as the VIP treatment a high-CLV contact receives."
  };

  function demoCaption(u, inPane) {
    var idx = UC_ORDER.indexOf(u.id);
    var prev = UC_ORDER[(idx - 1 + UC_ORDER.length) % UC_ORDER.length];
    var next = UC_ORDER[(idx + 1) % UC_ORDER.length];
    var signal = UC_NEEDS_SIGNAL[u.id];
    var cls = inPane ? "demo-caption demo-caption--inpane" : "demo-caption";
    return '<div class="' + cls + '" data-demo-caption>' +
      '<button class="demo-caption__toggle" data-demo-caption-toggle aria-label="Toggle demo notes">i</button>' +
      (inPane ? '<div class="demo-caption__guide-label">Use case guide</div>' : '') +
      '<div class="demo-caption__body">' +
        '<div class="demo-caption__eyebrow">Spotler Activate · use case ' + String(u.number).padStart(2, "0") + '</div>' +
        '<div class="demo-caption__name">' + esc(u.name) + '</div>' +
        '<div class="demo-caption__hook">' + esc(u.hook) + '</div>' +
        '<div class="demo-caption__bench"><b>' + esc((u.metrics.commerce || {}).value || "") + '</b> ' + esc((u.metrics.commerce || {}).label || "") +
          ' <span class="demo-caption__illus">illustrative</span></div>' +
        '<div class="demo-caption__point"><span>Point at:</span> ' + esc(u.demo_screen) + '</div>' +
        (signal ? '<div class="demo-caption__note">' + esc(signal) + '</div>' : "") +
        '<div class="demo-caption__nav">' +
          '<a href="#/usecase/' + prev + '">' + '\u2190 prev</a>' +
          '<a href="#/usecases">all 18</a>' +
          '<a href="#/usecase/' + next + '">next \u2192</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderUseCaseDemo(id) {
    var u = UC_BY_ID[id];
    if (!u) {
      return '<div class="wrap"><div class="empty-state" style="padding:var(--space-16) 0">' +
        'Unknown demo id: ' + esc(id) + '. <a href="#/usecases">See all 18 demos \u2192</a></div></div>';
    }
    currentDemoId = id;
    var stage = STAGE[id] || function () { return '<div class="wrap"><p>' + esc(ucExample(u)) + '</p></div>'; };
    var stageHTML = stage(u);
    var captionHTML = stageHTML.indexOf("demo-caption--inpane") >= 0 ? "" : demoCaption(u);
    return '<div class="demo-stage">' + stageHTML + captionHTML + '</div>';
  }

  function renderUseCaseIndex() {
    currentDemoId = null;
    var rows = UC.map(function (u) {
      return '<a class="demo-index__row" href="#/usecase/' + u.id + '">' +
        '<span class="demo-index__num">' + String(u.number).padStart(2, "0") + '</span>' +
        '<span class="demo-index__main"><b>' + esc(u.name) + '</b><span>' + esc(u.hook) + '</span></span>' +
        '<span class="demo-index__bench">' + esc((u.metrics.commerce || {}).value || "") + '</span>' +
        '<code class="demo-index__id">#/usecase/' + u.id + '</code>' +
      '</a>';
    }).join("");
    return '<div class="wrap demo-index">' +
      '<p class="eyebrow">Internal · sales demos · unlisted</p>' +
      '<h1 class="page-title">Spotler Activate — 18 use-case demos</h1>' +
      '<p class="demo-index__intro">Each page stages one Activate use case live inside Shopler. Not linked from the shop — share the direct URL. Benchmarks shown are illustrative.</p>' +
      '<div class="demo-index__list">' + rows + '</div>' +
    '</div>';
  }

  // UC03 click handler — intercepts nav, add-to-cart and replay inside the rt-segmentation demo.
  document.addEventListener("click", function (e) {
    if (currentDemoId !== 'rt-segmentation') return;

    var replayEl = e.target.closest("[data-uc03-replay]");
    if (replayEl) {
      e.preventDefault();
      demoState.uc03    = uc03InitState();
      demoState.ucActTab = 'audiences';
      // Reset lang and cart so replay returns to clean anonymous state
      state.lang = 'en';
      state.cart = []; persist(); renderChrome();
      rerenderDemo(); return;
    }

    var navEl = e.target.closest("[data-uc03-nav]");
    if (navEl) {
      e.preventDefault();
      e.stopPropagation(); // prevent hash change on <a href="#">
      if (!demoState.uc03) demoState.uc03 = uc03InitState();
      uc03Navigate(navEl.getAttribute("data-uc03-nav"), demoState.uc03);
      return;
    }

    var atcEl = e.target.closest("[data-uc03-atc]");
    if (atcEl && atcEl.closest("[data-uc03-shop]")) {
      // The existing [data-add] handler fires cart logic; we add demo tracking on top.
      var sku = atcEl.getAttribute("data-uc03-atc");
      if (!demoState.uc03) demoState.uc03 = uc03InitState();
      var s = demoState.uc03;
      s.addToCarts.push({sku: sku, ts: Date.now()});
      uc03CheckAudiences(s);
      setTimeout(function () { if (demoState.uc03) demoState.uc03.newlyMet = {}; }, 2100);
      // #drawer is a separate element; rerenderDemo() only replaces #app so the drawer stays intact
      setTimeout(function () { if (currentDemoId === 'rt-segmentation') rerenderDemo(); }, 50);
    }
  });

  // Delegated interactions for demo pages (data-demo-* and data-uc01-*).
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-demo-caption-toggle],[data-demo-popup-close],[data-demo-visitor],[data-demo-segment],[data-uc01-tab],[data-uc01-replay],[data-uc02-tab],[data-uc02-view],[data-uc02-remove],[data-uc02-clear]");
    if (!el) return;
    if (el.hasAttribute("data-demo-caption-toggle")) { e.preventDefault(); var c = document.querySelector("[data-demo-caption]"); if (c) c.classList.toggle("is-collapsed"); return; }
    if (el.hasAttribute("data-demo-popup-close")) { e.preventDefault(); var pp = el.closest("[data-demo-popup]"); if (pp) pp.remove(); return; }
    if (el.hasAttribute("data-demo-visitor")) { e.preventDefault(); demoState.visitor = el.getAttribute("data-demo-visitor"); rerenderDemo(); return; }
    if (el.hasAttribute("data-demo-segment")) { e.preventDefault(); demoState.seg = (demoState.seg || 0) + 1; rerenderDemo(); return; }
    if (el.hasAttribute("data-uc01-tab")) { e.preventDefault(); demoState.ucActTab = el.getAttribute("data-uc01-tab"); rerenderDemo(); return; }
    if (el.hasAttribute("data-uc01-replay")) {
      e.preventDefault();
      demoState.uc01Done = false; demoState.uc01Name = ""; demoState.uc01Email = "";
      demoState.uc01Animate = false; demoState.ucActTab = undefined;
      rerenderDemo(); return;
    }
    if (el.hasAttribute("data-uc02-tab")) { e.preventDefault(); if (demoState.uc02) demoState.uc02.tab = el.getAttribute("data-uc02-tab"); rerenderDemo(); return; }
    if (el.hasAttribute("data-uc02-view")) {
      e.preventDefault();
      if (!demoState.uc02) return;
      demoState.uc02.view = el.getAttribute("data-uc02-view");
      demoState.uc02.subcats = []; demoState.uc02.brands = []; demoState.uc02.colours = [];
      demoState.uc02.sizes = []; demoState.uc02.price = ""; demoState.uc02.gender = null;
      rerenderDemo(); return;
    }
    if (el.hasAttribute("data-uc02-remove")) {
      e.preventDefault();
      if (!demoState.uc02) return;
      var rm = el.getAttribute("data-uc02-remove");
      var rmColon = rm.indexOf(":");
      var rmGroup = rm.slice(0, rmColon), rmVal = rm.slice(rmColon + 1);
      if (rmGroup === "brand") { var rbi = demoState.uc02.brands.indexOf(rmVal); if (rbi >= 0) demoState.uc02.brands.splice(rbi, 1); }
      else if (rmGroup === "colour") { var rci = demoState.uc02.colours.indexOf(rmVal); if (rci >= 0) demoState.uc02.colours.splice(rci, 1); }
      else if (rmGroup === "size") { var rsi = demoState.uc02.sizes.indexOf(rmVal); if (rsi >= 0) demoState.uc02.sizes.splice(rsi, 1); }
      else if (rmGroup === "subcat") { var rsci = demoState.uc02.subcats.indexOf(rmVal); if (rsci >= 0) demoState.uc02.subcats.splice(rsci, 1); }
      else if (rmGroup === "gender") { demoState.uc02.gender = null; }
      else if (rmGroup === "price") { demoState.uc02.price = ""; }
      rerenderDemo(); return;
    }
    if (el.hasAttribute("data-uc02-clear")) {
      e.preventDefault();
      if (!demoState.uc02) return;
      demoState.uc02.subcats = []; demoState.uc02.brands = []; demoState.uc02.colours = [];
      demoState.uc02.sizes = []; demoState.uc02.gender = null; demoState.uc02.price = "";
      rerenderDemo(); return;
    }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.matches("[data-demo-signup]")) {
      e.preventDefault();
      var emEl = e.target.querySelector("input[type=\"email\"]");
      if (emEl && emEl.value.trim() && typeof trackEmailOptIn === "function") { try { trackEmailOptIn(emEl.value.trim(), true); } catch (x) {} }
      var card = e.target.closest(".demo-popup__card");
      if (card) card.innerHTML = "<h3>You\u2019re on the list \u2713</h3><p>That\u2019s the EmailOptIn event firing to Spotler Activate.</p>";
    }
    if (e.target.matches("[data-uc01-signup]")) {
      e.preventDefault();
      var nameEl3 = e.target.querySelector("input[name=\"name\"]");
      var emailEl3 = e.target.querySelector("input[name=\"email\"]");
      var typedName3 = (nameEl3 && nameEl3.value.trim()) ? nameEl3.value.trim() : "Friend";
      var typedEmail3 = (emailEl3 && emailEl3.value.trim()) ? emailEl3.value.trim() : "";
      if (typedEmail3 && typeof trackEmailOptIn === "function") { try { trackEmailOptIn(typedEmail3, true); } catch (x) {} }
      demoState.uc01Done = true;
      demoState.uc01Name = typedName3;
      demoState.uc01Email = typedEmail3;
      demoState.uc01Animate = true;
      demoState.ucActTab = "profile";
      rerenderDemo();
    }
  });
  function rerenderDemo() {
    if (!currentDemoId) return;
    var app = document.getElementById("app");
    if (app) app.innerHTML = renderUseCaseDemo(currentDemoId);
  }
  /* ---------------- Boot ---------------- */
  trackUserId(); // seed Squeezely identity before the first page event
  renderChrome(); renderFooter(); renderDrawer(); renderConsent(); render();
})();
