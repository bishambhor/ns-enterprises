/* NS Enterprises — product catalogue.
 * Loads data/products.json (the single source of truth for every product
 * on the site), validates it, and exposes the catalogue plus the product
 * card builder used by the main grid, the category grid and the
 * Just Added spotlight. Vanilla JS, no frameworks, no modules.
 */
(function(){
  "use strict";

  var WHATSAPP_NUMBER = "918837074944";
  var WA_SVG_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

  var catalogue = null;
  var brands = [];

  /* Fetch products.json once; the same promise is shared by every caller. */
  var ready = fetch("data/products.json").then(function(res){
    if (!res.ok) throw new Error("Could not load products.json (HTTP " + res.status + ")");
    return res.json();
  }).then(function(data){
    var list = data && data.products;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("products.json contains no products");
    }
    var seen = {};
    list.forEach(function(p, i){
      ["id", "name", "brand", "category", "description", "image"].forEach(function(k){
        if (typeof p[k] !== "string" || !p[k]) {
          throw new Error("Product #" + (i + 1) + " is missing a valid '" + k + "'");
        }
      });
      if (!Array.isArray(p.categories) || !p.categories.length) {
        throw new Error("Product " + p.id + " has no categories");
      }
      if (!Array.isArray(p.skinConcerns)) {
        throw new Error("Product " + p.id + " has no skinConcerns");
      }
      if (seen[p.id]) throw new Error("Duplicate product id: " + p.id);
      seen[p.id] = true;
      if (brands.indexOf(p.brand) === -1) brands.push(p.brand);
    });
    catalogue = list;
    return catalogue;
  });

  function escapeHtml(s){
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Same encoding the original WhatsApp links used: encodeURIComponent,
   * plus %27 for apostrophes (encodeURIComponent leaves ' unencoded). */
  function waEncode(s){
    return encodeURIComponent(s).replace(/'/g, "%27");
  }

  function fullName(p){ return p.brand + " " + p.name; }

  function waLink(p){
    var name = p.waName || fullName(p);
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" +
      waEncode("Hi NS Enterprises, is the " + name + " available in store?");
  }

  function all(){
    return catalogue ? catalogue.slice() : [];
  }

  function available(){
    return all().filter(function(p){ return p.available !== false; });
  }

  function byId(id){
    var found = null;
    all().forEach(function(p){ if (p.id === id) found = p; });
    return found;
  }

  /* Brand key used by the brand filter ("minimalist", "dermaco", ...). */
  function brandKey(brand){
    var t = String(brand).toLowerCase();
    if (t.indexOf("minimalist") !== -1) return "minimalist";
    if (t.indexOf("derma") !== -1) return "dermaco";
    if (t.indexOf("cetaphil") !== -1) return "cetaphil";
    if (t.indexOf("sheth") !== -1) return "drsheth";
    if (t.indexOf("mamaearth") !== -1) return "mamaearth";
    if (t.indexOf("dot") !== -1) return "dotkey";
    if (t.indexOf("plum") !== -1) return "plum";
    return t.trim();
  }

  /* Find a catalogue product from a display name, as used by the Routine
   * Builder ("Minimalist Salicylic Acid 2% Serum - alternate nights").
   * Tries, in order: the exact name, the name without a trailing
   * " - ..." note, the name with " Face " removed, and a unique
   * prefix match. Returns the product or null. */
  function findByDisplayName(name){
    if (!catalogue || !name) return null;
    var norm = function(s){ return String(s).toLowerCase().replace(/\s+/g, " ").trim(); };
    var n = norm(name);
    var stripped = n.split(" - ")[0].trim();
    var tries = [n, stripped];
    var i, j, p, full;
    for (i = 0; i < tries.length; i++) {
      for (j = 0; j < catalogue.length; j++) {
        p = catalogue[j];
        full = norm(fullName(p));
        if (full === tries[i]) return p;
        if (full.replace(" face ", " ") === tries[i]) return p;
      }
    }
    var prefix = [];
    for (j = 0; j < catalogue.length; j++) {
      p = catalogue[j];
      if (norm(fullName(p)).indexOf(stripped) === 0) prefix.push(p);
    }
    if (prefix.length === 1) return prefix[0];
    return null;
  }

  /* A Routine Builder step names a product when it starts with a brand
   * from the catalogue. Anything else ("Lukewarm water only...") is a
   * free-text step, not a product. */
  function looksLikeProduct(name){
    var s = String(name).toLowerCase();
    for (var i = 0; i < brands.length; i++) {
      if (s.indexOf(brands[i].toLowerCase() + " ") === 0) return true;
    }
    return false;
  }

  /* Build one product card. Markup and classes are exactly the ones the
   * original hardcoded cards used, so the styling is unchanged. */
  function buildCard(p){
    var el = document.createElement("article");
    el.className = "m-card";
    el.setAttribute("data-concerns", p.skinConcerns.join(" "));
    el.setAttribute("data-category", p.categories.join(" "));
    var useHtml = "<b>Use:</b> " + escapeHtml(p.use || "");
    (p.useExtras || []).forEach(function(e){
      useHtml += " · <b>" + escapeHtml(e.label) + ":</b> " + escapeHtml(e.value);
    });
    var pills = "";
    (p.tags || []).forEach(function(t){ pills += "<span>" + escapeHtml(t) + "</span>"; });
    var ariaName = p.ariaName || fullName(p);
    el.innerHTML =
      '<figure class="m-fig"><img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.imageAlt || fullName(p)) + '" loading="lazy" /></figure>' +
      '<div class="m-top"><span class="m-brand">' + escapeHtml(p.brand) + '</span><span class="m-step">' + escapeHtml(p.step || "") + '</span>' +
      (p.isNew ? '<span class="new-pill">New</span>' : "") + '</div>' +
      "<h3>" + escapeHtml(p.name) + "</h3>" +
      "<p>" + escapeHtml(p.description) + "</p>" +
      '<div class="m-pills">' + pills + "</div>" +
      '<div class="m-use">' + useHtml + "</div>" +
      '<a class="wa-card-btn" href="' + waLink(p) + '" target="_blank" rel="noopener" aria-label="Ask on WhatsApp if ' + escapeHtml(ariaName) + ' is available">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + WA_SVG_PATH + '"/></svg>Ask if available on WhatsApp</a>';
    return el;
  }

  window.NSProducts = {
    ready: ready,
    all: all,
    available: available,
    byId: byId,
    fullName: fullName,
    brandKey: brandKey,
    findByDisplayName: findByDisplayName,
    looksLikeProduct: looksLikeProduct,
    waLink: waLink,
    buildCard: buildCard
  };

})();
