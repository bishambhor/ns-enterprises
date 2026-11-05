(function(){
  "use strict";

  /* ---- Catalogue: load products.json, render the cards, start filters ---- */
  var mainGrid = document.getElementById("minimalistGrid");
  var newGrid = document.querySelector("#newArrivals .new-grid");
  var catGrid = document.getElementById("categoryGrid");
  var resultCount = document.getElementById("resultCount");

  /* Shown if products.json fails to load. */
  function showLoadError(){
    var msg = "Products could not be loaded. Please check your connection and refresh the page.";
    [mainGrid, newGrid].forEach(function(grid){
      if (!grid) return;
      grid.innerHTML = '<p class="loading-note">' + msg + "</p>";
    });
    if (resultCount) resultCount.textContent = "Products could not be loaded right now.";
  }

  function renderCatalogue(products){
    var available = products.filter(function(p){ return p.available !== false; });
    if (mainGrid) {
      /* #concernEmpty and #noResults live INSIDE the grid (they are grid
       * children by design) — keep them, they follow the cards. */
      var concernEmpty = document.getElementById("concernEmpty");
      var noResults = document.getElementById("noResults");
      mainGrid.innerHTML = "";
      available.forEach(function(p){ mainGrid.appendChild(NSProducts.buildCard(p)); });
      if (concernEmpty) mainGrid.appendChild(concernEmpty);
      if (noResults) mainGrid.appendChild(noResults);
    }
    if (catGrid) {
      /* Same cards as the main grid, in the same order — the old code
       * cloned the main cards; now both grids render from the data. */
      var catEmpty = document.getElementById("categoryEmpty");
      catGrid.innerHTML = "";
      available.forEach(function(p){ catGrid.appendChild(NSProducts.buildCard(p)); });
      if (catEmpty) catGrid.appendChild(catEmpty);
    }
    if (newGrid) {
      newGrid.innerHTML = "";
      available.filter(function(p){ return p.isNew; }).forEach(function(p){
        newGrid.appendChild(NSProducts.buildCard(p));
      });
    }
    NSFilters.init(available);
  }

  if (window.NSProducts && window.NSFilters) {
    NSProducts.ready.then(renderCatalogue).catch(showLoadError);
  } else {
    showLoadError();
  }

  /* ---- Routine Builder ---- */
  var chosen = { skin:null, concern:null, react:null, level:null };
  var skinLabels = { dry:"dry skin", oily:"oily skin", combination:"combination skin", sensitive:"sensitive skin" };
  var concernLabels = { acne:"acne & breakouts", oiliness:"oiliness & pores", dryness:"dryness & tightness", dullness:"dullness & marks", sensitivity:"redness & sensitivity" };
  function wireRow(rowId, key){
    var row = document.getElementById(rowId);
    if(!row) return;
    row.querySelectorAll(".opt").forEach(function(btn){
      btn.addEventListener("click", function(){
        row.querySelectorAll(".opt").forEach(function(b){ b.classList.remove("sel"); });
        btn.classList.add("sel");
        chosen[key] = btn.getAttribute("data-val");
        renderResult();
      });
    });
  }
  wireRow("skinRow","skin"); wireRow("concernRow","concern"); wireRow("reactRow","react"); wireRow("levelRow","level");
  function buildRoutine(){
    var skin = chosen.skin, concern = chosen.concern, react = chosen.react;
    var level = chosen.level;
    var isOily = (skin==="oily" || skin==="combination");
    var isDry = (skin==="dry");
    var isSensitive = (skin==="sensitive" || react==="reactive");
    var cleanserAM, cleanserPM;
    if((concern==="acne" || concern==="oiliness") && !isSensitive){
      cleanserAM = ["Minimalist Salicylic Acid + LHA 2% Cleanser","Deep pore cleanse to start the day - massage 60 seconds"];
      cleanserPM = ["Minimalist Salicylic Acid + LHA 2% Cleanser","Second cleanse of the day to clear oil and SPF"];
    } else if(isDry || isSensitive){
      cleanserAM = ["Lukewarm water only - no cleanser","Dry / reactive skin often needs no cleanser in the morning"];
      cleanserPM = ["Minimalist Salicylic Acid + LHA 2% Cleanser - short, gentle cleanse","Use briefly and rinse well; on nights skin feels tight, rinse with water only and go straight to moisturizer"];
    } else {
      cleanserAM = ["Minimalist Salicylic Acid + LHA 2% Cleanser","A calm, thorough morning cleanse"];
      cleanserPM = ["Minimalist Salicylic Acid + LHA 2% Cleanser","Work in for 60 seconds to lift the day and SPF"];
    }
    var treatAM;
    if(concern==="dryness" || isDry) treatAM = ["Minimalist Hyaluronic + PGA 2% Serum","On damp skin - pulls water in before you seal it"];
    else if(concern==="dullness") treatAM = ["Minimalist Vitamin C 10% Serum","Morning glow and more even tone - always under SPF"];
    else if(concern==="sensitivity") treatAM = ["Minimalist Niacinamide 10% Serum","Calms the look of redness and supports the barrier"];
    else treatAM = ["Minimalist Niacinamide 10% Serum","Balances oil, helps marks fade, keeps pores calmer"];
    var treatPM, pmNote = "";
    if(concern==="acne" || concern==="oiliness"){
      if(isSensitive){ treatPM = ["Minimalist Salicylic Acid 2% Serum - start 2 nights/week","Targeted BHA for pores. Increase slowly only if no stinging"]; pmNote="Reactive skin + acne: introduce Salicylic Acid slowly and skip it on nights your skin stings."; }
      else { treatPM = ["Minimalist Salicylic Acid 2% Serum - alternate nights","BHA inside pores for breakouts and blackheads. Niacinamide on the other nights"]; }
    } else if(concern==="dryness" || isDry){
      treatPM = ["Minimalist Hyaluronic + PGA 2% Serum","Rehydrate at night on damp skin, then seal well"];
    } else if(concern==="dullness"){
      treatPM = ["Minimalist Niacinamide 10% Serum","Night work on marks and uneven tone"];
    } else {
      treatPM = ["Minimalist Sepicalm 3% + Oat - as a soothing layer","Or skip treatment and go straight to moisturizer on reactive nights"];
    }
    var moist;
    if(isDry) moist = ["Minimalist Ceramides 0.3% + Madecassoside Moisturizer","Barrier repair - generous layer, especially at night"];
    else if(isSensitive || concern==="sensitivity") moist = ["Minimalist Sepicalm 3% + Oat Moisturizer","Soothes redness without a heavy, greasy finish"];
    else if(isOily) moist = ["Minimalist Vitamin B5 10% Moisturizer","Oil-free hydration - no shine, no clogged feeling"];
    else moist = ["Minimalist Vitamin B5 10% Moisturizer","Light daily hydration for combination skin"];
    var spf = ["Minimalist Light Fluid SPF 50 Sunscreen","Last AM step, two-finger length for face and neck"];
    var am = [cleanserAM, treatAM, moist, spf];
    var pm = [cleanserPM, treatPM, moist];
    if(level==="simple"){
      am = [cleanserAM, moist, spf];
      pm = [cleanserPM, moist];
      if(concern==="acne" || concern==="oiliness"){ pm = [cleanserPM, treatPM, moist]; am = [cleanserAM, treatAM, moist, spf]; }
    }
    return {am:am, pm:pm, pmNote:pmNote};
  }
  function listHtml(steps){
    var h = "<ol>";
    steps.forEach(function(s){ h += "<li><div><b>" + s[0] + "</b><span>" + s[1] + "</span></div></li>"; });
    return h + "</ol>";
  }
  function stepAvailable(step){
    var name = step[0];
    if (!window.NSProducts || !NSProducts.looksLikeProduct(name)) return true;
    var p = NSProducts.findByDisplayName(name);
    return !!(p && p.available);
  }
  function renderResult(){
    var box = document.getElementById("finderResult");
    document.querySelectorAll("#builderSteps span").forEach(function(s){
      var k = s.getAttribute("data-step");
      s.classList.toggle("done", !!chosen[k]);
    });
    var missing = [];
    if(!chosen.skin) missing.push("1 - skin type");
    if(!chosen.concern) missing.push("2 - main concern");
    if(!chosen.react) missing.push("3 - reactivity");
    if(!chosen.level) missing.push("4 - routine style");
    if(missing.length){
      box.innerHTML = '<p class="placeholder">Almost there - still to answer: <b>' + missing.join(", ") + '</b>. Your routine builds itself as soon as all four are picked.</p>';
      return;
    }
    var r = buildRoutine();
    var am = r.am.filter(stepAvailable);
    var pm = r.pm.filter(stepAvailable);
    var intro = "For <b>" + skinLabels[chosen.skin] + "</b> focused on <b>" + concernLabels[chosen.concern] + "</b>" + (chosen.react==="reactive" ? " - built extra-gently because your skin is reactive." : chosen.react==="sometimes" ? " - with actives introduced steadily." : ".");
    var caution = r.pmNote || (chosen.concern==="acne" ? "Give it 6-8 weeks of consistency. Do not add another strong active in the first two weeks." : "Give it 4-6 weeks of consistency before judging results. One new product at a time.");
    if(chosen.level==="simple") caution += " You chose the simple version - once it feels easy for 2 weeks, add the treatment step from the complete routine.";
    box.innerHTML = "<h3>Your personal routine</h3><p class='r-sub'>" + intro + "</p>"
      + '<div class="am-pm"><div><h4>Morning</h4>' + listHtml(am) + '</div><div><h4>Evening</h4>' + listHtml(pm) + "</div></div>"
      + '<div class="builder-note"><b>How to start:</b> ' + caution + ' Patch-test new actives first. All products listed are available in store at NS Enterprises - bring this list in and we will help you find them on the shelf.</div>'
      + '<div class="builder-actions"><button class="mini-btn" id="restartBuilder" type="button">Start again</button><a class="mini-btn ghost" href="#concern" style="text-decoration:none;display:inline-block">See these products</a><a class="mini-btn" href="https://wa.me/918837074944?text=Hi%20NS%20Enterprises%2C%20I%20just%20built%20my%20routine%20on%20your%20site.%20Are%20the%20products%20in%20my%20routine%20available%20in%20store%3F" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;background:#128c7e;border-color:#128c7e">Ask availability on WhatsApp</a></div>';
    var rb = document.getElementById("restartBuilder");
    if(rb) rb.addEventListener("click", function(){
      chosen = {skin:null, concern:null, react:null, level:null};
      document.querySelectorAll("#finder .opt").forEach(function(b){ b.classList.remove("sel"); });
      document.querySelectorAll("#builderSteps span").forEach(function(s){ s.classList.remove("done"); });
      box.innerHTML = '<p class="placeholder">Cleared - answer the four questions again to build a new routine.</p>';
    });
  }

  /* ---- Ritual AM / PM ---- */
  var ritualData = {
    am: [
      ["Cleanse","Minimalist Salicylic Acid + LHA 2% Cleanser — or simply lukewarm water if your skin runs dry.","1 min"],
      ["Hydrate","Hyaluronic + PGA 2% Serum on damp skin if you're dry, or Niacinamide 10% if you're oily or acne-prone.","1 min"],
      ["Treat","Vitamin C 10% Serum — three to four drops for face and neck, on glow mornings.","1 min"],
      ["Protect","Vitamin B5 10% or Ceramides 0.3% Moisturizer, then Light Fluid SPF 50 — always last.","2 min"]
    ],
    pm: [
      ["Cleanse","Minimalist Salicylic Acid + LHA 2% Cleanser, worked in for a full sixty seconds to lift the day.","1 min"],
      ["Hydrate","Hyaluronic + PGA 2% Serum, pressed in while skin is still damp.","30 sec"],
      ["Treat","Salicylic Acid 2% Serum on alternate nights for acne and pores; Niacinamide 10% on the other nights.","1 min"],
      ["Repair","Ceramides 0.3% + Madecassoside Moisturizer — or Sepicalm 3% + Oat if skin feels reactive — pressed in to seal.","1 min"]
    ]
  };
  var stepsEl = document.getElementById("ritualSteps");
  var amBtn = document.getElementById("amBtn"), pmBtn = document.getElementById("pmBtn");
  function renderRitual(which){
    amBtn.classList.toggle("on", which === "am");
    pmBtn.classList.toggle("on", which === "pm");
    stepsEl.innerHTML = ritualData[which].map(function(s, i){
      return '<li><span class="step-num">0' + (i+1) + '</span><div><b>' + s[0] + '</b><p>' + s[1] + '</p></div><span class="mins">' + s[2] + '</span></li>';
    }).join("");
  }
  amBtn.addEventListener("click", function(){ renderRitual("am"); });
  pmBtn.addEventListener("click", function(){ renderRitual("pm"); });
  renderRitual("am");

})();

(function(){
  "use strict";
  var mq = window.matchMedia("(max-width: 768px)");
  function flag(){ document.documentElement.setAttribute("data-version", mq.matches ? "mobile" : "pc"); document.body.classList.toggle("is-mobile", mq.matches); document.body.classList.toggle("is-pc", !mq.matches); }
  flag();
  if (mq.addEventListener) mq.addEventListener("change", flag); else if (mq.addListener) mq.addListener(flag);
  // Mobile quick cards drive the real filters
  document.querySelectorAll("[data-mq-concern]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var chip = document.querySelector('#concern .chip[data-concern="' + btn.getAttribute("data-mq-concern") + '"]');
      if (chip) chip.click();
      var target = document.getElementById("concern");
      if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
    });
  });
  document.querySelectorAll("[data-mq-cat]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var sel = document.getElementById("categoryFilter");
      if (sel){ sel.value = btn.getAttribute("data-mq-cat"); sel.dispatchEvent(new Event("change", {bubbles:true})); }
      var target = document.getElementById("concern");
      if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
    });
  });
  // Bottom tab bar: highlight the tapped tab
  var tabs = document.querySelectorAll(".mobile-tabbar a[data-tab]");
  tabs.forEach(function(a){ a.addEventListener("click", function(){ tabs.forEach(function(x){ x.classList.remove("active"); }); a.classList.add("active"); }); });
})();
