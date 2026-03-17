  (function() {
    const STATES = [
      "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
      "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
      "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
      "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
      "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
    ];

    const GROUPS = {
      warm:         new Set(["Florida","Texas","Arizona","Nevada","California","Hawaii","Georgia","South Carolina","Louisiana","Alabama","Mississippi","New Mexico"]),
      coastal:      new Set(["California","Florida","Texas","New York","New Jersey","Delaware","Maryland","Virginia","North Carolina","South Carolina","Georgia","Alabama","Louisiana","Mississippi","Alaska","Hawaii","Oregon","Washington","Maine","Massachusetts","Rhode Island"]),
      mild:         new Set(["North Carolina","Virginia","Tennessee","Arkansas","Oklahoma","Kentucky","Maryland","Oregon"]),
      cold:         new Set(["Alaska","North Dakota","South Dakota","Montana","Minnesota","Wisconsin","Vermont","Maine","New Hampshire","Wyoming","Michigan"]),
      urban:        new Set(["New York","California","Illinois","Massachusetts","Texas","Florida","New Jersey","Washington","Georgia","Pennsylvania"]),
      suburban:     new Set(["Virginia","North Carolina","Colorado","Arizona","Maryland","Tennessee","Ohio","Minnesota"]),
      rural:        new Set(["Montana","Wyoming","North Dakota","South Dakota","Idaho","West Virginia","Vermont","Maine","Nebraska"]),
      affordable:   new Set(["Texas","Tennessee","Oklahoma","Arkansas","Mississippi","Alabama","Kentucky","West Virginia","Iowa","Kansas"]),
      balancedCost: new Set(["North Carolina","Georgia","Arizona","Ohio","Michigan","Nevada","Missouri","Indiana","Pennsylvania"]),
      premium:      new Set(["California","New York","Massachusetts","Hawaii","Washington","New Jersey","Maryland","Colorado","Oregon"]),
      nature:       new Set(["Colorado","Utah","Montana","Wyoming","Idaho","Alaska","Maine","Vermont","Oregon","Washington"]),
      entertainment:new Set(["California","New York","Nevada","Florida","Texas","Illinois","Georgia","Louisiana"]),
      jobs:         new Set(["California","Texas","New York","Washington","Massachusetts","Virginia","North Carolina","Colorado","Georgia"]),
      quiet:        new Set(["Vermont","Maine","Wyoming","Montana","West Virginia","South Dakota","North Dakota","Idaho","New Hampshire"])
    };

    const QUESTION_BANK = [
      { id:"weather", prompt:"What weather do you prefer most of the year?", options:[
        {id:"warm",  label:"Warm and sunny",  apply:[{group:"warm",score:3},{group:"mild",score:1}]},
        {id:"mild",  label:"Four seasons",    apply:[{group:"mild",score:3},{group:"cold",score:1},{group:"warm",score:1}]},
        {id:"cold",  label:"Cool / snowy",    apply:[{group:"cold",score:3},{group:"nature",score:1}]}
      ]},
      { id:"lifestyle", prompt:"What kind of lifestyle fits you best?", options:[
        {id:"urban",    label:"Big city energy",      apply:[{group:"urban",score:3},{group:"jobs",score:1}]},
        {id:"suburban", label:"Balanced suburban",    apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"rural",    label:"Small town / rural",   apply:[{group:"rural",score:3},{group:"quiet",score:1}]}
      ]},
      { id:"budget", prompt:"How important is affordability?", options:[
        {id:"high",   label:"Very important",      apply:[{group:"affordable",score:3},{group:"balancedCost",score:1}]},
        {id:"medium", label:"Somewhat important",  apply:[{group:"balancedCost",score:3},{group:"affordable",score:1}]},
        {id:"low",    label:"Not a major factor",  apply:[{group:"premium",score:3},{group:"urban",score:1}]}
      ]},
      { id:"activities", prompt:"Which activities do you want nearby?", options:[
        {id:"nature",        label:"Outdoors and nature",      apply:[{group:"nature",score:3},{group:"quiet",score:1}]},
        {id:"entertainment", label:"Food, arts, nightlife",   apply:[{group:"entertainment",score:3},{group:"urban",score:1}]},
        {id:"mix",           label:"A mix of both",            apply:[{group:"suburban",score:2},{group:"nature",score:1},{group:"entertainment",score:1}]}
      ]},
      { id:"priority", prompt:"What is your top priority in your next place?", options:[
        {id:"career",  label:"Career opportunities",  apply:[{group:"jobs",score:3},{group:"urban",score:1}]},
        {id:"quiet",   label:"Peace and slower pace", apply:[{group:"quiet",score:3},{group:"rural",score:1}]},
        {id:"balance", label:"Balanced life",         apply:[{group:"suburban",score:2},{group:"balancedCost",score:2}]}
      ]},
      { id:"weekend", prompt:"What does your ideal weekend look like?", options:[
        {id:"events", label:"Concerts, events, city life", apply:[{group:"entertainment",score:3},{group:"urban",score:1}]},
        {id:"hiking", label:"Trails, parks, mountains",   apply:[{group:"nature",score:3},{group:"quiet",score:1}]},
        {id:"mix",    label:"Some activity, some rest",   apply:[{group:"suburban",score:2},{group:"nature",score:1},{group:"entertainment",score:1}]}
      ]},
      { id:"homeType", prompt:"Where would you rather live?", options:[
        {id:"downtown",   label:"Downtown apartment",     apply:[{group:"urban",score:3},{group:"premium",score:1}]},
        {id:"suburb",     label:"Suburban neighborhood",  apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"smalltown",  label:"Small town",             apply:[{group:"rural",score:3},{group:"quiet",score:1}]}
      ]},
      { id:"transport", prompt:"How do you prefer getting around?", options:[
        {id:"transit",  label:"Public transit / walking", apply:[{group:"urban",score:3},{group:"premium",score:1}]},
        {id:"car",      label:"Mostly by car",            apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"minimal",  label:"Short drives, less traffic", apply:[{group:"quiet",score:3},{group:"rural",score:1}]}
      ]},
      { id:"pace", prompt:"What daily pace do you enjoy?", options:[
        {id:"fast",     label:"Fast-paced and busy",    apply:[{group:"urban",score:3},{group:"jobs",score:1}]},
        {id:"moderate", label:"Balanced and steady",    apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"slow",     label:"Slow and relaxed",       apply:[{group:"quiet",score:3},{group:"rural",score:1}]}
      ]},
      { id:"landscape", prompt:"Which landscape do you prefer most?", options:[
        {id:"coast",    label:"Coast and beaches",       apply:[{group:"coastal",score:4},{group:"warm",score:1},{group:"entertainment",score:1}]},
        {id:"mountain", label:"Mountains and forests",   apply:[{group:"nature",score:3},{group:"quiet",score:1}]},
        {id:"plains",   label:"Open plains and space",   apply:[{group:"rural",score:2},{group:"affordable",score:2}]}
      ]}
    ];

    function shuffle(arr) {
      const out = arr.slice();
      for (let i=out.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
      return out;
    }

    function getBaseScore(state) {
      const d = visitData()[state];
      const base = d && typeof d.visitation2024k==="number" ? Math.min(8, d.visitation2024k/1200) : 0;
      if (state === "Alaska" || state === "Hawaii") return base + 1.2;
      return base;
    }

    function ensureRemoteCandidates(entries, allEntries, limit) {
      const out = entries.slice(0, limit).map(([state, score]) => ({ state, score: +score.toFixed(2) }));
      const remoteStates = ["Alaska", "Hawaii"];

      const present = new Set(out.map(r => r.state));
      for (const state of remoteStates) {
        if (present.has(state)) continue;
        const match = allEntries.find(([s]) => s === state);
        if (!match) continue;
        if (allEntries.findIndex(([s]) => s === state) > 7) continue;
        if (!out.length) break;
        const score = +match[1].toFixed(2);
        out[out.length - 1] = { state, score };
        out.sort((a,b) => b.score - a.score);
        present.add(state);
      }
      return out;
    }

    function computeRecs(answers, questions) {
      const scores = new Map(STATES.map(s=>[s, getBaseScore(s)]));
      answers.forEach((aid, idx) => {
        const q = questions[idx]; if (!q) return;
        const sel = q.options.find(o=>o.id===aid); if (!sel) return;
        sel.apply.forEach(({group,score}) => {
          (GROUPS[group]||new Set()).forEach(s => scores.set(s,(scores.get(s)||0)+score));
        });
      });
      const allSorted = [...scores.entries()].sort((a,b)=>b[1]-a[1]);
      return ensureRemoteCandidates(allSorted.slice(0,3), allSorted, 3);
    }

    // ── Quiz rendering ──
    const body    = document.getElementById("quiz-body");
    const backBtn = document.getElementById("quiz-back-btn");
    const nextBtn = document.getElementById("quiz-next-btn");

    let questions = shuffle(QUESTION_BANK).slice(0,5);
    let playerName = "";
    let playerGender = "male";
    const answers = [];
    let step = -1;

    function showStep() {
      if (step < 0) {
        // Intro
        body.innerHTML = `
          <div class="qz-step-label">Welcome</div>
          <h2 class="qz-heading">Find your perfect state match</h2>
          <p class="qz-sub">Answer 5 quick questions and we'll match you to a U.S. state — then explore it on the map.</p>
          <div class="qz-field qz-gap-field">
            <label class="qz-label" for="quiz-name-input">Your name</label>
            <input id="quiz-name-input" class="qz-input" type="text" maxlength="40" placeholder="Enter your name" value="${escHtml(playerName)}" autocomplete="off" />
          </div>`;
        body.innerHTML += `
          <div class="qz-field">
            <div class="qz-label">Select your gender</div>
            <div class="qz-checkbox-row">
              <label class="qz-checkbox-option">
                <input type="checkbox" id="quiz-gender-male" value="male" ${playerGender === "male" ? "checked" : ""} />
                Male
              </label>
              <label class="qz-checkbox-option">
                <input type="checkbox" id="quiz-gender-female" value="female" ${playerGender === "female" ? "checked" : ""} />
                Female
              </label>
            </div>
          </div>`;
        const inp = body.querySelector("#quiz-name-input");
        inp?.focus();
        inp?.addEventListener("input", e => { playerName = e.target.value.trim(); nextBtn.disabled = !playerName; });
        const maleChk = body.querySelector("#quiz-gender-male");
        const femaleChk = body.querySelector("#quiz-gender-female");
        const maleLabel = maleChk ? maleChk.closest(".qz-checkbox-option") : null;
        const femaleLabel = femaleChk ? femaleChk.closest(".qz-checkbox-option") : null;
        const syncGender = (g) => {
          playerGender = g;
          if (maleChk) maleChk.checked = g === "male";
          if (femaleChk) femaleChk.checked = g === "female";
          if (maleLabel) maleLabel.classList.toggle("is-selected", g === "male");
          if (femaleLabel) femaleLabel.classList.toggle("is-selected", g === "female");
        };
        maleChk?.addEventListener("change", () => {
          if (maleChk.checked) syncGender("male");
          else syncGender("male");
        });
        femaleChk?.addEventListener("change", () => {
          if (femaleChk.checked) syncGender("female");
          else if (!maleChk?.checked) syncGender("male");
        });
        backBtn.style.display = "none";
        nextBtn.textContent = "Begin";
        nextBtn.disabled = !playerName;
        clearHighlight();
      } else if (step < questions.length) {
        const q = questions[step];
        body.innerHTML = `
          <div class="qz-step-label">Question ${step+1} of ${questions.length}</div>
          <h2 class="qz-heading">${escHtml(q.prompt)}</h2>
          <div class="qz-options">
            ${q.options.map(o=>`
              <button type="button" class="qz-opt${answers[step]===o.id?" selected":""}" data-ans="${o.id}">
                ${escHtml(o.label)}
              </button>`).join("")}
          </div>`;
        body.querySelectorAll(".qz-opt").forEach(b => b.addEventListener("click", () => {
          answers[step] = b.dataset.ans;
          body.querySelectorAll(".qz-opt").forEach(x=>x.classList.toggle("selected",x===b));
          nextBtn.disabled = false;
        }));
        backBtn.style.display = "";
        backBtn.disabled = step === 0;
        nextBtn.textContent = step===questions.length-1 ? "See my match" : "Next";
        nextBtn.disabled = !answers[step];
      } else {
        // Result
        const recs = computeRecs(answers, questions);
        const top = recs[0];
        const vd = visitData()[top.state];
        const demog = demogData()[top.state]?.["2022"];
        const econ  = econData()[top.state];

        // Build extra stats
        const statFmt = v => v != null ? v.toLocaleString() : "—";
        const pctFmt  = v => typeof v==="number" ? (v*100).toFixed(1)+"%" : "—";
        const popFmt  = v => v >= 1e6 ? (v/1e6).toFixed(1)+"M" : v >= 1e3 ? (v/1e3).toFixed(0)+"K" : v?.toString() || "—";

        body.innerHTML = `
          <div class="qz-step-label">Your match</div>
          <h2 class="qz-result-name">${escHtml(playerName)}, your state is</h2>
          <div class="qz-result-state">${escHtml(top.state)}</div>
          <div class="qz-stats-grid">
            ${vd ? `<div class="qz-stat"><span class="qz-stat-val">#${vd.rank}</span><span class="qz-stat-lbl">Visitor rank</span></div>
                    <div class="qz-stat"><span class="qz-stat-val">${statFmt(vd.visitation2024k)}k</span><span class="qz-stat-lbl">Overseas visitors '24</span></div>
                    <div class="qz-stat"><span class="qz-stat-val">${pctFmt(vd.pctChange)}</span><span class="qz-stat-lbl">YoY visitor growth</span></div>` : ""}
            ${demog ? `<div class="qz-stat"><span class="qz-stat-val">${popFmt(demog.population)}</span><span class="qz-stat-lbl">Population (2022)</span></div>` : ""}
            ${econ  ? `<div class="qz-stat"><span class="qz-stat-val">${econ.dominantSector||"—"}</span><span class="qz-stat-lbl">Top industry</span></div>` : ""}
          </div>
          <div class="qz-top3-label">Also consider</div>
          <div class="qz-top3">
            ${recs.slice(1).map(r=>`<span class="qz-runner">${escHtml(r.state)}</span>`).join("")}
          </div>`;

        backBtn.style.display = "";
        backBtn.disabled = true;
        nextBtn.textContent = "Play again";
        nextBtn.disabled = false;

        // Highlight on map
        highlightState(top.state);
        // Place avatar on matched state
        if (playerName) {
          renderStateAvatar(playerName, top.state, {
            avatarKey: playerGender === "female" ? "wahine" : "default",
            source: "state_match"
          });
        }
      }
    }

    backBtn.addEventListener("click", () => {
      if (step > 0) { step--; showStep(); }
      else if (step === 0) { step = -1; showStep(); }
    });

    nextBtn.addEventListener("click", () => {
      if (step < 0) {
        if (!playerName) return;
        step = 0; showStep(); return;
      }
      if (step < questions.length) {
        if (!answers[step]) return;
        step++; showStep(); return;
      }
      // Play again
      questions = shuffle(QUESTION_BANK).slice(0,5);
      playerName = ""; playerGender = "male"; answers.length = 0; step = -1;
      showStep();
    });

    showStep();
  })();
