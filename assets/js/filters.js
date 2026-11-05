/* NS Enterprises — catalogue search and filtering.
 * Search by name/brand/ingredient, brand filter, category filter and
 * skin-concern filter, all combinable, with a live result counter,
 * an empty-results state and clear-filters. Operates on the rendered
 * product cards, exactly like the original hardcoded version did.
 * Vanilla JS, no frameworks, no modules.
 */
(function(){
  "use strict";

  var state = { query: "", brand: "all", category: "all", concern: "all" };
  var total = 0;
  var els = {};

  function brandKey(card){
    var el = card.querySelector(".m-brand");
    var t = el ? el.textContent.toLowerCase() : "";
    return window.NSProducts ? NSProducts.brandKey(t) : t.trim();
  }

  function cardMatches(card){
    if (state.concern !== "all") {
      var concerns = (card.getAttribute("data-concerns") || "").split(" ");
      if (concerns.indexOf(state.concern) === -1) return false;
    }
    if (state.category !== "all") {
      var cats = (card.getAttribute("data-category") || "").split(" ");
      if (cats.indexOf(state.category) === -1) return false;
    }
    if (state.brand !== "all" && brandKey(card) !== state.brand) return false;
    if (state.query) {
      var text = card.textContent.toLowerCase();
      var tokens = state.query.split(/\s+/);
      for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] && text.indexOf(tokens[i]) === -1) return false;
      }
    }
    return true;
  }

  function applyFilters(){
    var visible = 0;
    document.querySelectorAll("#minimalistGrid .m-card").forEach(function(card){
      var show = cardMatches(card);
      card.classList.toggle("hide", !show);
      if (show) visible++;
    });
    var catVisible = 0;
    if (els.catGrid) {
      els.catGrid.querySelectorAll(".m-card").forEach(function(card){
        var show = cardMatches(card);
        card.classList.toggle("hide", !show);
        if (show) catVisible++;
      });
    }
    if (els.concernEmpty) els.concernEmpty.style.display = "none";
    if (els.noResults) els.noResults.classList.toggle("show", visible === 0);
    if (els.catEmpty) {
      els.catEmpty.style.display = catVisible ? "none" : "block";
      if (!catVisible) els.catEmpty.textContent = "No products match your current search and filters.";
    }
    if (els.resultCount) {
      els.resultCount.innerHTML = "Showing <b>" + visible + "</b> of " + total + " products";
    }
    var anyActive = !!state.query || state.brand !== "all" || state.category !== "all" || state.concern !== "all";
    if (els.clearBtn) els.clearBtn.classList.toggle("show", anyActive);
    if (els.searchClear) els.searchClear.classList.toggle("show", !!state.query);
  }

  function syncCategoryUI(){
    if (els.categorySelect) els.categorySelect.value = state.category;
    els.catChips.forEach(function(c){
      c.classList.toggle("active", c.getAttribute("data-cat") === state.category);
    });
  }

  function clearAllFilters(){
    state = { query: "", brand: "all", category: "all", concern: "all" };
    if (els.searchInput) els.searchInput.value = "";
    if (els.brandSelect) els.brandSelect.value = "all";
    els.concernChips.forEach(function(c){
      c.classList.toggle("active", c.getAttribute("data-concern") === "all");
    });
    syncCategoryUI();
    applyFilters();
  }

  /* Wire up the toolbar and chips. Call once, after the product cards
   * have been rendered. `products` is the rendered catalogue (its
   * length drives the "of N products" counter). */
  function init(products){
    total = products ? products.length : 0;
    els = {
      searchInput: document.getElementById("productSearch"),
      searchClear: document.getElementById("searchClear"),
      brandSelect: document.getElementById("brandFilter"),
      categorySelect: document.getElementById("categoryFilter"),
      concernChips: document.querySelectorAll("#concern .chip[data-concern]"),
      catChips: document.querySelectorAll(".chip[data-cat]"),
      resultCount: document.getElementById("resultCount"),
      clearBtn: document.getElementById("clearFilters"),
      clearBtn2: document.getElementById("clearFilters2"),
      noResults: document.getElementById("noResults"),
      concernEmpty: document.getElementById("concernEmpty"),
      catGrid: document.getElementById("categoryGrid"),
      catEmpty: document.getElementById("categoryEmpty")
    };
    if (els.searchInput) els.searchInput.addEventListener("input", function(){
      state.query = els.searchInput.value.trim().toLowerCase();
      applyFilters();
    });
    if (els.searchClear) els.searchClear.addEventListener("click", function(){
      state.query = "";
      els.searchInput.value = "";
      applyFilters();
      els.searchInput.focus();
    });
    if (els.brandSelect) els.brandSelect.addEventListener("change", function(){
      state.brand = els.brandSelect.value;
      applyFilters();
    });
    if (els.categorySelect) els.categorySelect.addEventListener("change", function(){
      state.category = els.categorySelect.value;
      syncCategoryUI();
      applyFilters();
    });
    els.concernChips.forEach(function(chip){
      chip.addEventListener("click", function(){
        els.concernChips.forEach(function(c){ c.classList.remove("active"); });
        chip.classList.add("active");
        state.concern = chip.getAttribute("data-concern");
        applyFilters();
      });
    });
    els.catChips.forEach(function(chip){
      chip.addEventListener("click", function(){
        state.category = chip.getAttribute("data-cat");
        syncCategoryUI();
        applyFilters();
      });
    });
    if (els.clearBtn) els.clearBtn.addEventListener("click", clearAllFilters);
    if (els.clearBtn2) els.clearBtn2.addEventListener("click", clearAllFilters);
    applyFilters();
  }

  window.NSFilters = {
    init: init,
    apply: applyFilters,
    clear: clearAllFilters,
    getState: function(){ return state; }
  };

})();
