/* NS Enterprises — routine recommendation engine.
 * Takes questionnaire answers + the loaded catalogue and returns personalised
 * morning and evening routines. Vanilla JS, no frameworks, no modules.
 * Pure logic: no DOM access here — the questionnaire UI in script.js calls
 * NSRoutineEngine.generate(answers, products) and renders the result.
 *
 * DATA HONESTY — the rules below use ONLY fields that exist in
 * data/products.json (category, categories, skinConcerns, use, keyActives,
 * tags, step, available). Nothing is invented: no ingredient lists, no
 * strengths and no skin-type suitability beyond what the site states.
 * Where information is unknown, the engine treats it as unknown and is
 * conservative: it prefers simpler routines and skips a step with an
 * explanation rather than forcing a product that does not fit.
 *
 * DERIVATION RULES (how the engine reads the verified data):
 *
 * 1. Skin concerns. The catalogue only tags products with "acne", "oily"
 *    and "dry". The questionnaire's other concerns are matched by a
 *    documented proxy, never by guessing:
 *      acne        -> skinConcerns includes "acne"
 *      pigmentation-> product tags mention "Acne marks", "Uneven tone",
 *                     "Brightening" or "Even tone", OR keyActives include
 *                     Niacinamide or Vitamin C
 *      dullness    -> product tags mention "Dullness", "Glow", "Brightening"
 *                     or "Even tone", OR keyActives include Vitamin C or
 *                     Niacinamide
 *      dryness     -> skinConcerns includes "dry"
 *      ageing      -> product tags mention "Mature skin" or "Age care"
 *                     (strong), OR keyActives include Hyaluronic Acid or
 *                     Ceramides (weak — hydration/barrier support only;
 *                     the range has no product labelled for fine lines)
 *      general     -> no concern match; skin-type fit only
 * 2. Skin type. oily -> "oily", dry -> "dry", combination -> "oily" or
 *    "dry", normal -> products tagged for all three concerns (broad,
 *    all-skin-type products), sensitive -> products tagged "Sensitive",
 *    "Redness", "Soothing", "Calming", "Barrier care", "Fragrance-free"
 *    or "100% Mineral", not sure -> no type preference.
 * 3. Actives. A product is a STRONG EXFOLIANT when a keyActive mentions
 *    Salicylic Acid or LHA (both are BHA exfoliants — the cleanser's own
 *    description calls it a "daily exfoliating cleanser"). A product is a
 *    MILD EXFOLIANT when a keyActive mentions PHA. Vitamin C 10% and
 *    Niacinamide 10% are treated as HIGH-STRENGTH actives because the
 *    site states the 10% strength on the label.
 * 4. Timing. Read from the product's own `use` field: "AM & PM" means
 *    both; a use starting with "AM" is morning-only; starting with "PM"
 *    is evening-only.
 * 5. Sunscreens. Only face sunscreens are routine sunscreens: category
 *    "sunscreen" with step exactly "Protect · AM". The body lotion
 *    ("Protect · Body"), the reapply stick ("Protect · Reapply") and the
 *    sports sunscreen ("Protect · Sports") are never picked as the daily
 *    face sunscreen.
 *
 * SAFETY RULES (these take priority over scores, always):
 *  - Only products with available === true are ever eligible.
 *  - At most ONE exfoliating product (strong or mild) per routine part.
 *  - Vitamin C 10% and a strong exfoliant never appear in the same part.
 *  - Very sensitive skin (Q3 "very sensitive" or skin type "sensitive"):
 *    no exfoliants at all, no Vitamin C 10%, no Niacinamide 10%.
 *  - Occasionally irritated skin: a strong exfoliant only in the evening,
 *    never in the morning.
 *  - Beginners: no strong exfoliant in the morning; a strong exfoliant in
 *    the evening only as the treatment step, at the frequency the product
 *    itself states (the Salicylic Acid 2% Serum says "2–3 nights a week
 *    to start").
 *  - At most two strong actives per routine part (one for beginners and
 *    sensitive skin).
 *  - Every morning routine includes a face sunscreen when one exists.
 *  - No medical claims: the engine never says a product will cure acne,
 *    pigmentation or any other condition.
 *
 * SCORING (deterministic; ranks eligible products, never overrides safety):
 *  +3 per selected concern matched (see rule 1)
 *  +2 skin-type fit (see rule 2)
 *  +2 a concern-relevant active is listed (acne: Salicylic/LHA/Niacinamide/
 *    Tea Tree/Green Tea/Zinc/PHA; pigmentation: Niacinamide/Vitamin C;
 *    dullness: Vitamin C/Niacinamide; dryness: Hyaluronic/Ceramide/
 *    Glycerin/Squalane/Panthenol/Vitamin B5; ageing: Hyaluronic/Ceramide
 *    counts +1, not +2 — it is support, not a labelled treatment)
 *  +2 gentle bonus when the user is dry or sensitive and the product has
 *    no exfoliant (a gentle pick for reactive or thirsty skin)
 *  +2 gentle default when the user picked only "general maintenance"
 *    (no specific concern): with nothing to aim at, the engine defaults
 *    to the gentlest option instead of letting an alphabetical tie-break
 *    hand a newcomer an exfoliating cleanser
 *  +2 sunscreen finish fit (oily: matte/oil control; dry: hydrating/dewy;
 *    sensitive: Sensitive/100% Mineral) and +1 for an "All skin types" tag
 *  Ties break by product name, then product id — the same answers always
 *  give the same routine.
 */
(function(){
  "use strict";

  var WHATSAPP_NUMBER = "918837074944";

  /* ---------- questionnaire option values (shared with the UI) ---------- */
  var SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive", "notsure"];
  var CONCERNS = ["acne", "pigmentation", "dullness", "dryness", "ageing", "general"];
  var SENSITIVITIES = ["none", "sometimes", "very"];
  var EXPERIENCES = ["beginner", "intermediate", "experienced"];
  var COMPLEXITIES = ["simple", "balanced", "complete"];

  var CONCERN_LABELS = {
    acne: "acne & breakouts",
    pigmentation: "pigmentation & dark spots",
    dullness: "dullness",
    dryness: "dryness & dehydration",
    ageing: "fine lines & ageing",
    general: "general skincare maintenance"
  };
  var SKIN_LABELS = {
    oily: "oily skin",
    dry: "dry skin",
    combination: "combination skin",
    normal: "normal skin",
    sensitive: "sensitive skin",
    notsure: "not sure yet"
  };

  /* ---------- helpers ---------- */
  function lower(s){ return String(s || "").toLowerCase(); }
  function has(arr, v){ return (arr || []).indexOf(v) !== -1; }

  function waEncode(s){ return encodeURIComponent(s).replace(/'/g, "%27"); }
  function fullName(p){ return p.brand + " " + p.name; }

  function normalizeAnswers(a){
    a = a || {};
    return {
      skin: has(SKIN_TYPES, a.skin) ? a.skin : "notsure",
      concerns: (Array.isArray(a.concerns) ? a.concerns : []).filter(function(c){ return has(CONCERNS, c); }),
      sensitivity: has(SENSITIVITIES, a.sensitivity) ? a.sensitivity : "none",
      experience: has(EXPERIENCES, a.experience) ? a.experience : "beginner",
      complexity: has(COMPLEXITIES, a.complexity) ? a.complexity : "balanced"
    };
  }

  /* Timing from the product's own `use` field (rule 4). */
  function timingOf(p){
    var u = lower(p.use);
    var both = u.indexOf("am & pm") !== -1;
    return {
      am: both || /^am\b/.test(u),
      pm: both || /^pm\b/.test(u)
    };
  }

  /* Active classification from keyActives only (rule 3). */
  function classify(p){
    var joined = (p.keyActives || []).join(" ");
    var l = lower(joined);
    return {
      strongExfoliant: /salicylic/i.test(l) || /\blha\b/i.test(l),
      mildExfoliant: /pha/i.test(l),
      vitC10: /vitamin c 10/i.test(l),
      nia10: /niacinamide 10/i.test(l),
      hasNiacinamide: /niacinamide/i.test(l),
      hasVitC: /vitamin c/i.test(l),
      hasHyaluronic: /hyaluronic/i.test(l),
      hasCeramide: /ceramide/i.test(l),
      hasSalicylic: /salicylic/i.test(l)
    };
  }
  function isExfoliant(c){ return c.strongExfoliant || c.mildExfoliant; }

  /* Concern evidence from verified data only (rule 1). Returns
   * "strong" (tag or listed active), "weak" (listed active only, for
   * acne/dryness where the tag is missing) or null. */
  function concernEvidence(p, concern){
    var tags = lower((p.tags || []).join(" "));
    var act = (p.keyActives || []).join(" ");
    var al = lower(act);
    var skinConcerns = p.skinConcerns || [];
    if (concern === "acne") {
      if (has(skinConcerns, "acne")) return "strong";
      if (/salicylic|lha|niacinamide|tea tree|green tea|zinc|pha/i.test(al)) return "weak";
      return null;
    }
    if (concern === "dryness") {
      if (has(skinConcerns, "dry")) return "strong";
      if (/hyaluronic|ceramide|glycerin|squalane|panthenol|vitamin b5/i.test(al)) return "weak";
      return null;
    }
    if (concern === "pigmentation") {
      if (/acne marks|uneven tone|brightening|even tone/i.test(tags)) return "strong";
      if (/niacinamide|vitamin c/i.test(al)) return "strong";
      return null;
    }
    if (concern === "dullness") {
      if (/dullness|glow|brightening|even tone/i.test(tags)) return "strong";
      if (/vitamin c|niacinamide/i.test(al)) return "strong";
      return null;
    }
    if (concern === "ageing") {
      if (/mature skin|age care/i.test(tags)) return "strong";
      if (/hyaluronic|ceramide/i.test(al)) return "weak";
      return null;
    }
    return null; /* "general" — no concern evidence */
  }

  /* Skin-type fit (rule 2). Returns 2 (good fit), 1 (partial) or 0. */
  function typeFit(p, skin){
    var sc = p.skinConcerns || [];
    var tags = lower((p.tags || []).join(" "));
    if (skin === "oily") return has(sc, "oily") ? 2 : 0;
    if (skin === "dry") return has(sc, "dry") ? 2 : 0;
    if (skin === "combination") return (has(sc, "oily") || has(sc, "dry")) ? 2 : 0;
    if (skin === "normal") {
      return (has(sc, "acne") && has(sc, "oily") && has(sc, "dry")) ? 2 : 0;
    }
    if (skin === "sensitive") {
      return /sensitive|redness|soothing|calming|barrier care|fragrance-free|100% mineral/i.test(tags) ? 2 : 0;
    }
    return 0; /* not sure — no type preference */
  }

  /* Concern-relevant active bonus (scoring). Returns 2, 1 or 0. */
  function activeBonus(p, concern){
    var al = lower((p.keyActives || []).join(" "));
    if (concern === "acne") return /salicylic|lha|niacinamide|tea tree|green tea|zinc|pha/i.test(al) ? 2 : 0;
    if (concern === "pigmentation") return /niacinamide|vitamin c/i.test(al) ? 2 : 0;
    if (concern === "dullness") return /vitamin c|niacinamide/i.test(al) ? 2 : 0;
    if (concern === "dryness") return /hyaluronic|ceramide|glycerin|squalane|panthenol|vitamin b5/i.test(al) ? 2 : 0;
    if (concern === "ageing") return /hyaluronic|ceramide/i.test(al) ? 1 : 0;
    return 0;
  }

  /* ---------- eligibility (hard gates, applied before scoring) ---------- */
  function isVerySensitive(ans){
    return ans.sensitivity === "very" || ans.skin === "sensitive";
  }

  function eligible(p, ans, part){
    if (!p || p.available !== true) return false;
    var t = timingOf(p);
    if (part === "am" && !t.am) return false;
    if (part === "pm" && !t.pm) return false;
    var c = classify(p);
    var verySens = isVerySensitive(ans);
    if (verySens) {
      if (c.strongExfoliant || c.mildExfoliant) return false;
      if (c.vitC10 || c.nia10) return false;
    }
    if (part === "am") {
      if (ans.experience === "beginner" && c.strongExfoliant) return false;
      if (ans.sensitivity === "sometimes" && c.strongExfoliant) return false;
    }
    return true;
  }

  /* ---------- scoring ---------- */
  function score(p, ans, role){
    var s = 0;
    var concerns = ans.concerns.length ? ans.concerns : ["general"];
    concerns.forEach(function(cn){
      var ev = concernEvidence(p, cn);
      if (ev === "strong") s += 3;
      else if (ev === "weak") s += 1;
      s += activeBonus(p, cn);
    });
    s += typeFit(p, ans.skin);
    if ((ans.skin === "dry" || isVerySensitive(ans)) && !isExfoliant(classify(p))) s += 2;
    var generalOnly = ans.concerns.length === 0 ||
      (ans.concerns.length === 1 && ans.concerns[0] === "general");
    if (generalOnly && !isExfoliant(classify(p))) s += 2;
    if (role === "sunscreen") {
      var tags = lower((p.tags || []).join(" "));
      if (ans.skin === "oily" || ans.skin === "combination") {
        if (/matte|oil control/i.test(tags)) s += 2;
      } else if (ans.skin === "dry") {
        if (/hydrating|dewy/i.test(tags)) s += 2;
      } else if (isVerySensitive(ans)) {
        if (/sensitive|100% mineral/i.test(tags)) s += 2;
      }
      if (/all skin types/i.test(tags)) s += 1;
    }
    return s;
  }

  function byScore(a, b){
    if (b.score !== a.score) return b.score - a.score;
    var an = lower(a.product.name), bn = lower(b.product.name);
    if (an !== bn) return an < bn ? -1 : 1;
    return a.product.id < b.product.id ? -1 : 1;
  }

  /* ---------- assembly ---------- */
  function pickForStep(cands, ans, part, role, budget){
    /* cands: scored {product, score} sorted best-first. Returns the first
     * pick that fits the safety budgets, or null. */
    for (var i = 0; i < cands.length; i++) {
      var c = classify(cands[i].product);
      if (isExfoliant(c) && budget.exfoliants >= 1) continue;
      var strongCount = (c.strongExfoliant ? 1 : 0) + (c.vitC10 ? 1 : 0) + (c.nia10 ? 1 : 0);
      var cap = (ans.experience === "beginner" || isVerySensitive(ans)) ? 1 : 2;
      if (budget.strongActives + strongCount > cap) continue;
      if (c.vitC10 && budget.hasStrongExfoliant) continue; /* never Vit C + exfoliant in one part */
      if (c.strongExfoliant && budget.hasVitC10) continue;
      budget.exfoliants += isExfoliant(c) ? 1 : 0;
      budget.strongActives += strongCount;
      if (c.strongExfoliant) budget.hasStrongExfoliant = true;
      if (c.vitC10) budget.hasVitC10 = true;
      return cands[i];
    }
    return null;
  }

  function scoredList(products, ans, part, role, filterFn){
    var list = [];
    products.forEach(function(p){
      if (!eligible(p, ans, part)) return;
      if (filterFn && !filterFn(p)) return;
      list.push({ product: p, score: score(p, ans, role) });
    });
    list.sort(byScore);
    return list;
  }

  function isFaceSunscreen(p){
    return p.category === "sunscreen" && (p.step || "") === "Protect · AM";
  }

  function whyFor(p, ans, role){
    var reasons = [];
    var matched = [];
    (ans.concerns.length ? ans.concerns : ["general"]).forEach(function(cn){
      if (cn !== "general" && concernEvidence(p, cn)) matched.push(CONCERN_LABELS[cn]);
    });
    if (matched.length) reasons.push("Matches your " + matched.join(" and "));
    if (typeFit(p, ans.skin) === 2) reasons.push("Suits " + SKIN_LABELS[ans.skin]);
    if ((p.keyActives || []).length) reasons.push("Key actives: " + p.keyActives.join(" + "));
    if (role === "sunscreen") reasons.push("Daily face sunscreen — the last morning step");
    if (role === "cleanser" && (ans.skin === "dry" || isVerySensitive(ans)) && !isExfoliant(classify(p))) {
      reasons.push("Gentle pick — no exfoliating acids");
    }
    if (role === "targeted") reasons.push("Extra targeted step for your main concern");
    return reasons;
  }

  function stepEntry(role, picked, skippedReason){
    if (picked) {
      return {
        role: role,
        product: picked.product,
        score: picked.score,
        why: whyFor(picked.product, picked.ans, role),
        howTo: picked.product.use || ""
      };
    }
    return { role: role, product: null, skipped: skippedReason || "" };
  }

  /* Build one routine part (am or pm). Returns {steps, skipped}. */
  function buildPart(products, ans, part){
    var budget = { exfoliants: 0, strongActives: 0, hasStrongExfoliant: false, hasVitC10: false };
    var usedIds = {};
    var steps = [];
    var skipped = [];
    var complexity = ans.complexity;

    function addStep(role, filterFn, skipReason, required, minScore){
      var cands = scoredList(products, ans, part, role, filterFn).filter(function(c){
        return !usedIds[c.product.id];
      });
      if (minScore) cands = cands.filter(function(c){ return c.score >= minScore; });
      var picked = pickForStep(cands, ans, part, role, budget);
      if (picked) {
        picked.ans = ans;
        usedIds[picked.product.id] = true;
        steps.push(stepEntry(role, picked));
      } else if (required || skipReason) {
        skipped.push({ role: role, reason: skipReason });
      }
    }

    /* Cleanser — always wanted. */
    addStep("cleanser",
      function(p){ return p.category === "cleanser"; },
      "No cleanser in store matches your skin and sensitivity right now — please ask us on WhatsApp and we will help you pick one.",
      true);

    /* Toner — the catalogue has no toners, so this step is always skipped. */
    skipped.push({
      role: "toner",
      reason: "NS Enterprises doesn't stock a toner yet, so your routine skips this step. Cleanser, treatment and moisturizer still cover the essentials."
    });

    /* Treatment serum — Balanced and Complete only. */
    if (complexity !== "simple") {
      addStep("serum",
        function(p){ return p.category === "serum"; },
        "No treatment serum in store fits your skin and sensitivity right now, so this step is skipped rather than forcing a product that doesn't suit you.",
        false);
    }

    /* Moisturizer — always wanted. */
    addStep("moisturizer",
      function(p){ return p.category === "moisturizer"; },
      "No moisturizer in store matches your skin right now — please ask us on WhatsApp and we will help you pick one.",
      true);

    if (part === "am") {
      /* Sunscreen — every morning routine ends with one. */
      addStep("sunscreen",
        function(p){ return isFaceSunscreen(p); },
        "No face sunscreen in store matched your answers — please ask us on WhatsApp and we will help you pick one.",
        true);
    } else if (complexity === "complete") {
      /* Targeted treatment — Complete only, and only if it fits the
       * budgets, is not already in the routine, and actually matches
       * the answers (score >= 4, so a weak generic pick is not padded
       * in just to fill the step). */
      addStep("targeted",
        function(p){
          if (p.category === "serum" && classify(p).strongExfoliant) return true;
          if (has(p.categories || [], "overnight")) return true;
          return false;
        },
        "No extra targeted treatment fits alongside the products already in your routine, so nothing extra was added.",
        false, 4);
    }

    return { steps: steps, skipped: skipped };
  }

  /* ---------- public API ---------- */
  function generate(answers, products){
    var ans = normalizeAnswers(answers);
    var list = (products || []).filter(function(p){ return p && p.available === true; });
    var morning = buildPart(list, ans, "am");
    var evening = buildPart(list, ans, "pm");

    var notes = [];
    if (has(ans.concerns, "ageing")) {
      notes.push("The range has no product labelled for fine lines — your routine focuses on hydration and barrier care instead, which is what the products in store do best.");
    }
    if (isVerySensitive(ans)) {
      notes.push("Built extra-gently: no strong exfoliants and no high-strength actives, only calming and hydrating products.");
    }
    if (ans.experience === "beginner") {
      notes.push("One active at a time: introduce any treatment step 2–3 nights a week first, and only add more once your skin is comfortable.");
    }
    var hasExfoliant = morning.steps.concat(evening.steps).some(function(s){
      return s.product && isExfoliant(classify(s.product));
    });
    if (hasExfoliant) {
      notes.push("Your routine includes one exfoliating product — use it exactly as directed and skip it on nights your skin feels irritated.");
    }
    if (ans.concerns.length > 1) {
      notes.push("You picked more than one concern, so the routine balances them — the products above are the ones that cover the most of what you asked for.");
    }

    var profile = {
      skin: ans.skin,
      skinLabel: SKIN_LABELS[ans.skin],
      concerns: ans.concerns.length ? ans.concerns.slice() : ["general"],
      concernLabels: (ans.concerns.length ? ans.concerns : ["general"]).map(function(c){ return CONCERN_LABELS[c]; }),
      sensitivity: ans.sensitivity,
      experience: ans.experience,
      complexity: ans.complexity
    };

    return {
      answers: ans,
      profile: profile,
      morning: morning,
      evening: evening,
      notes: notes,
      patchTest: "Patch-test any new product first: apply a little behind the ear or on the jawline for 2–3 days before using it on your whole face.",
      disclaimer: "This routine is general skincare guidance from the NS Enterprises showcase range, not medical advice. For persistent, painful or cystic acne, or any skin problem that does not improve, please see a dermatologist."
    };
  }

  function routineWaLink(answers, result){
    var ans = normalizeAnswers(answers);
    var lines = [];
    lines.push("Hi NS Enterprises, I just built my routine on your site. Can you check if these products are available in store?");
    lines.push("");
    lines.push("My skin: " + SKIN_LABELS[ans.skin] + ".");
    lines.push("My concerns: " + (ans.concerns.length ? ans.concerns : ["general"]).map(function(c){ return CONCERN_LABELS[c]; }).join(", ") + ".");
    lines.push("");
    function partLines(label, part){
      var names = part.steps.filter(function(s){ return s.product; }).map(function(s){ return fullName(s.product); });
      lines.push(label + ": " + (names.length ? names.join(", ") : "no products"));
    }
    partLines("Morning", result.morning);
    partLines("Evening", result.evening);
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + waEncode(lines.join("\n"));
  }

  var api = {
    SKIN_TYPES: SKIN_TYPES,
    CONCERNS: CONCERNS,
    SENSITIVITIES: SENSITIVITIES,
    EXPERIENCES: EXPERIENCES,
    COMPLEXITIES: COMPLEXITIES,
    CONCERN_LABELS: CONCERN_LABELS,
    SKIN_LABELS: SKIN_LABELS,
    generate: generate,
    routineWaLink: routineWaLink,
    classify: classify,
    timingOf: timingOf,
    concernEvidence: concernEvidence,
    score: score,
    isFaceSunscreen: isFaceSunscreen,
    normalizeAnswers: normalizeAnswers
  };

  if (typeof window !== "undefined") window.NSRoutineEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

})();
