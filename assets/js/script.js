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

  /* ---- Routine Builder: 5-question questionnaire + engine results ---- */
  /* Questions are defined here (UI text); the recommendation logic lives
   * in assets/js/routine-engine.js and only ever sees the answer values. */
  var QUIZ = [
    { key:"skin", title:"How does your skin usually feel?", hint:"",
      multi:false, options:[
        ["dry","Dry — tight, sometimes flaky"],
        ["oily","Oily — shiny by midday"],
        ["combination","Combination — oily T-zone, normal cheeks"],
        ["normal","Normal — comfortable most days"],
        ["sensitive","Sensitive — flushes or stings easily"],
        ["notsure","Not sure — it changes"]
      ]},
    { key:"concerns", title:"What do you want to work on most?", hint:"Pick all that apply — you can choose more than one.",
      multi:true, options:[
        ["acne","Acne & breakouts"],
        ["pigmentation","Pigmentation & dark spots"],
        ["dullness","Dullness"],
        ["dryness","Dryness & dehydration"],
        ["ageing","Fine lines & ageing"],
        ["general","General skincare maintenance"]
      ]},
    { key:"sensitivity", title:"How sensitive is your skin?", hint:"",
      multi:false, options:[
        ["none","Not sensitive — new products rarely bother me"],
        ["sometimes","Occasionally irritated — sometimes tingles or flushes"],
        ["very","Very sensitive — I have to be careful"]
      ]},
    { key:"experience", title:"How much experience do you have with active ingredients?", hint:"Actives are ingredients like Salicylic Acid, Vitamin C and Niacinamide.",
      multi:false, options:[
        ["beginner","Beginner — new to actives"],
        ["intermediate","Intermediate — I use an active or two already"],
        ["experienced","Experienced — I use strong actives regularly"]
      ]},
    { key:"complexity", title:"How do you want your routine to feel?", hint:"",
      multi:false, options:[
        ["simple","Simple — 2–3 steps"],
        ["balanced","Balanced — 4–5 steps"],
        ["complete","Complete — every step that fits"]
      ]}
  ];
  var SENSITIVITY_LABELS = { none:"Not sensitive", sometimes:"Occasionally irritated", very:"Very sensitive" };
  var STEP_LABELS = { cleanser:"Cleanser", toner:"Toner", serum:"Treatment serum", moisturizer:"Moisturizer", sunscreen:"Sunscreen", targeted:"Targeted treatment" };

  var answers = { skin:null, concerns:[], sensitivity:null, experience:null, complexity:null };
  var quizStep = 0;
  var quizPanel = document.getElementById("quizPanel");
  var quizProgress = document.getElementById("quizProgress");
  var quizTitle = document.getElementById("quizTitle");
  var quizHint = document.getElementById("quizHint");
  var quizOptions = document.getElementById("quizOptions");
  var quizError = document.getElementById("quizError");
  var quizBack = document.getElementById("quizBack");
  var quizNext = document.getElementById("quizNext");
  var finderResult = document.getElementById("finderResult");

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function currentAnswered(){
    var q = QUIZ[quizStep];
    return q.multi ? answers.concerns.length > 0 : !!answers[q.key];
  }

  function syncSteps(){
    document.querySelectorAll("#builderSteps span").forEach(function(s){
      var k = s.getAttribute("data-step");
      var done = k === "concerns" ? answers.concerns.length > 0 : !!answers[k];
      s.classList.toggle("done", done);
    });
  }

  function renderQuiz(){
    if (!quizPanel) return;
    var q = QUIZ[quizStep];
    quizProgress.textContent = "Question " + (quizStep + 1) + " of " + QUIZ.length;
    quizTitle.textContent = q.title;
    quizHint.textContent = q.hint || "";
    quizHint.style.display = q.hint ? "" : "none";
    quizError.hidden = true;
    quizOptions.innerHTML = "";
    q.options.forEach(function(opt){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.setAttribute("data-val", opt[0]);
      b.textContent = opt[1];
      var sel = q.multi ? answers.concerns.indexOf(opt[0]) !== -1 : answers[q.key] === opt[0];
      if (sel) b.classList.add("sel");
      b.addEventListener("click", function(){ onPick(opt[0]); });
      quizOptions.appendChild(b);
    });
    quizBack.disabled = quizStep === 0;
    quizNext.textContent = quizStep === QUIZ.length - 1 ? "See my routine" : "Next";
    syncSteps();
  }

  function onPick(val){
    var q = QUIZ[quizStep];
    if (q.multi) {
      var i = answers.concerns.indexOf(val);
      if (i === -1) answers.concerns.push(val);
      else answers.concerns.splice(i, 1);
      renderQuiz();
    } else {
      answers[q.key] = val;
      renderQuiz();
    }
  }

  function goNext(){
    if (!currentAnswered()) { quizError.hidden = false; return; }
    quizError.hidden = true;
    if (quizStep < QUIZ.length - 1) { quizStep++; renderQuiz(); return; }
    showResults();
  }

  function goBack(){
    if (quizStep > 0) { quizStep--; renderQuiz(); }
  }

  function partHtml(part){
    var h = "";
    part.steps.forEach(function(s, i){
      var prod = s.product;
      h += '<div class="r-card"><figure class="r-fig"><img src="' + esc(prod.image) + '" alt="' + esc(prod.imageAlt || NSProducts.fullName(prod)) + '" loading="lazy" /></figure><div class="r-body">'
        + '<span class="r-step">Step ' + (i + 1) + " · " + esc(STEP_LABELS[s.role] || s.role) + "</span>"
        + "<b>" + esc(NSProducts.fullName(prod)) + "</b>"
        + '<span class="r-cat">' + esc(prod.brand) + " · " + esc(prod.step || prod.category) + "</span>"
        + '<p class="r-why">' + esc(s.why.join(" — ")) + "</p>"
        + '<p class="r-how"><b>How to use:</b> ' + esc(s.howTo) + "</p>"
        + '<a class="mini-btn r-wa" href="' + NSProducts.waLink(prod) + '" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;background:#128c7e;border-color:#128c7e">Ask if available on WhatsApp</a>'
        + "</div></div>";
    });
    part.skipped.forEach(function(sk){
      h += '<div class="skip-note"><b>' + esc(STEP_LABELS[sk.role] || sk.role) + " — skipped:</b> " + esc(sk.reason) + "</div>";
    });
    if (!part.steps.length) {
      h += '<p class="placeholder">No products fit this part of the day — please ask us on WhatsApp and we will help.</p>';
    }
    return h;
  }

  function resultHtml(result){
    var p = result.profile;
    var h = "<h3>Your personal routine</h3>";
    h += '<div class="profile-summary">'
      + "<span><b>Skin:</b> " + esc(p.skinLabel) + "</span>"
      + "<span><b>Concerns:</b> " + esc(p.concernLabels.join(", ")) + "</span>"
      + "<span><b>Sensitivity:</b> " + esc(SENSITIVITY_LABELS[p.sensitivity] || p.sensitivity) + "</span>"
      + "<span><b>Experience:</b> " + esc(p.experience) + "</span>"
      + "<span><b>Routine:</b> " + esc(p.complexity) + "</span>"
      + "</div>";
    h += '<div class="am-pm"><div><h4>Morning</h4>' + partHtml(result.morning) + '</div><div><h4>Evening</h4>' + partHtml(result.evening) + "</div></div>";
    if (result.notes.length) {
      h += '<div class="builder-note"><b>Good to know:</b> ' + esc(result.notes.join(" ")) + "</div>";
    }
    h += '<div class="builder-note"><b>Patch test:</b> ' + esc(result.patchTest) + "</div>";
    h += '<div class="builder-note">' + esc(result.disclaimer) + "</div>";
    h += '<div class="builder-actions">'
      + '<button class="mini-btn ghost" id="editAnswers" type="button">Edit answers</button>'
      + '<button class="mini-btn ghost" id="regenerateRoutine" type="button">Regenerate</button>'
      + '<button class="mini-btn ghost" id="restartBuilder" type="button">Start again</button>'
      + '<a class="mini-btn" id="routineWa" href="' + NSRoutineEngine.routineWaLink(answers, result) + '" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;background:#128c7e;border-color:#128c7e">Ask about my whole routine on WhatsApp</a>'
      + "</div>";
    return h;
  }

  function wireResultActions(result){
    var editBtn = document.getElementById("editAnswers");
    if (editBtn) editBtn.addEventListener("click", function(){
      quizStep = 0;
      renderQuiz();
      if (quizPanel) quizPanel.scrollIntoView({behavior:"smooth", block:"start"});
    });
    var regenBtn = document.getElementById("regenerateRoutine");
    if (regenBtn) regenBtn.addEventListener("click", function(){ showResults(); });
    var restartBtn = document.getElementById("restartBuilder");
    if (restartBtn) restartBtn.addEventListener("click", function(){
      answers = { skin:null, concerns:[], sensitivity:null, experience:null, complexity:null };
      quizStep = 0;
      renderQuiz();
      finderResult.innerHTML = '<p class="placeholder">Cleared — answer the five questions again to build a new routine.</p>';
    });
  }

  function showResults(){
    if (!window.NSRoutineEngine || !window.NSProducts) {
      finderResult.innerHTML = '<p class="placeholder">The routine builder could not load. Please refresh the page and try again.</p>';
      return;
    }
    /* The catalogue may still be loading if the user answers very fast. */
    if (NSProducts.all().length === 0) {
      finderResult.innerHTML = '<p class="placeholder">Loading products…</p>';
      NSProducts.ready.then(function(){ showResults(); }).catch(function(){
        finderResult.innerHTML = '<p class="placeholder">Products could not be loaded. Please refresh the page and try again.</p>';
      });
      return;
    }
    var result = NSRoutineEngine.generate(answers, NSProducts.available());
    finderResult.innerHTML = resultHtml(result);
    wireResultActions(result);
    syncSteps();
    /* On phones the result sits below the quiz — bring it into view. */
    if (window.matchMedia && window.matchMedia("(max-width: 820px)").matches) {
      finderResult.scrollIntoView({behavior:"smooth", block:"start"});
    }
  }

  if (quizPanel) {
    quizBack.addEventListener("click", goBack);
    quizNext.addEventListener("click", goNext);
    renderQuiz();
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
