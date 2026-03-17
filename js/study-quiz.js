(function() {
  const STUDY_QUESTIONS = {
    visitors: {
      context: "Use the Visitors tab. Toggle between 'By Volume' and 'YoY Growth' on the map.",
      question: "Which three states had the highest overseas visitor volume in 2024?",
      options: [
        "California, New York, Florida",
        "Texas, Florida, California",
        "New York, Nevada, Hawaii",
        "California, New York, Texas"
      ],
      correct: "California, New York, Florida"
    },
    population: {
      context: "Use the Population tab on the map.",
      question: "Which state had the largest population in 2022?",
      options: ["California", "Texas", "Florida", "New York"],
      correct: "California"
    },
    gender: {
      context: "Use the Gender tab. Blue = higher male %, pink = higher female %.",
      question: "Which pattern best describes gender distribution across U.S. states?",
      options: [
        "Female percentage is higher in most states",
        "Gender distribution is roughly equal across most states",
        "Male percentage is notably higher in most states",
        "Coastal states are predominantly female"
      ],
      correct: "Female percentage is higher in most states"
    },
    race: {
      context: "Use the Race tab. Darker green = higher diversity index.",
      question: "Which region generally shows the highest racial diversity?",
      options: [
        "The Northeast (Maine, Vermont, New Hampshire)",
        "The Mountain West (Montana, Wyoming, Idaho)",
        "Coastal and Southern states (California, Texas, New York)",
        "The Midwest (Iowa, Nebraska, South Dakota)"
      ],
      correct: "Coastal and Southern states (California, Texas, New York)"
    },
    economy: {
      context: "Use the Economy tab. Each state is colored by its dominant industry by employment. Hover states to see the full sector breakdown.",
      question: "Which industry is the dominant employer across the most U.S. states?",
      options: [
        "Health Care",
        "Professional Services",
        "Accommodation & Food",
        "Admin & Waste Management"
      ],
      correct: "Accommodation & Food"
    }
  };

  const STUDY_DIFFICULTY_REASONS = [
    "State labels were hard to read",
    "Colors / legend were hard to interpret",
    "Questions were confusing",
    "I was unsure about map navigation"
  ];

  const DATASET_ORDER = ["visitors", "population", "gender", "race", "economy"];
  const studyResponses = {};
  const STUDY_ATTEMPTS_KEY = "state-study-attempts-v1";
  let studyDataset = "visitors";
  let questionStart = Date.now();
  let studyName = "";
  let studyGender = "male";
  let studyFastestMap = "";
  let studyHardestReasons = [];
  let studyStarted = false;
  let remoteSubmitState = "idle";
  let remoteSubmitMessage = "";

  const bodyEl = document.getElementById("study-body");
  const footerEl = document.getElementById("study-footer");
  const studyProfileMount = document.createElement("div");
  const studyContentMount = document.createElement("div");

  bodyEl.innerHTML = "";
  bodyEl.appendChild(studyProfileMount);
  bodyEl.appendChild(studyContentMount);
  studyProfileMount.appendChild(renderStudyProfile());

  function renderStudyProfile() {
    const wrap = document.createElement("div");
    wrap.className = "study-profile";
    wrap.innerHTML = `
      <div class="qz-field qz-gap-field">
        <label class="qz-label" for="study-name-input">Your name</label>
        <input id="study-name-input" class="qz-input" type="text" maxlength="40" placeholder="Enter your name" value="${escHtml(studyName)}" autocomplete="off" />
      </div>
      <div class="qz-field">
        <div class="qz-label">Select your gender</div>
        <div class="qz-checkbox-row">
          <label class="qz-checkbox-option">
            <input type="checkbox" id="study-gender-male" value="male" ${studyGender === "male" ? "checked" : ""} />
            Male
          </label>
          <label class="qz-checkbox-option">
            <input type="checkbox" id="study-gender-female" value="female" ${studyGender === "female" ? "checked" : ""} />
            Female
          </label>
        </div>
      </div>`;

    const input = wrap.querySelector("#study-name-input");
    const maleChk = wrap.querySelector("#study-gender-male");
    const femaleChk = wrap.querySelector("#study-gender-female");
    const maleLbl = maleChk ? maleChk.closest(".qz-checkbox-option") : null;
    const femaleLbl = femaleChk ? femaleChk.closest(".qz-checkbox-option") : null;

    const syncGender = (g) => {
      studyGender = g;
      if (maleChk) maleChk.checked = g === "male";
      if (femaleChk) femaleChk.checked = g === "female";
      if (maleLbl) maleLbl.classList.toggle("is-selected", g === "male");
      if (femaleLbl) femaleLbl.classList.toggle("is-selected", g === "female");
    };

    maleChk?.addEventListener("change", () => {
      syncGender(maleChk.checked ? "male" : "male");
    });
    femaleChk?.addEventListener("change", () => {
      syncGender(femaleChk.checked ? "female" : (maleChk?.checked ? "male" : "male"));
    });

    input?.addEventListener("input", (e) => { studyName = e.target.value; });
    if (maleLbl) maleLbl.classList.toggle("is-selected", studyGender === "male");
    if (femaleLbl) femaleLbl.classList.toggle("is-selected", studyGender === "female");

    if (studyName) input?.setSelectionRange(studyName.length, studyName.length);
    return wrap;
  }

  function readStudyAttempts() {
    try {
      const raw = localStorage.getItem(STUDY_ATTEMPTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function getRemoteSubmitMeta() {
    if (remoteSubmitState === "success") {
      return { cls: "is-success", text: remoteSubmitMessage || "Response submitted to your remote collector." };
    }
    if (remoteSubmitState === "error") {
      return { cls: "is-error", text: remoteSubmitMessage || "Remote submission failed. This browser still saved the response locally." };
    }
    if (remoteSubmitState === "pending") {
      return { cls: "is-pending", text: remoteSubmitMessage || "Submitting response..." };
    }

    const cfg = getAppConfig();
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      return {
        cls: "is-muted",
        text: "Remote response collection is off. Responses are only saved in this browser until you set APP_CONFIG.supabaseUrl and APP_CONFIG.supabaseAnonKey in index.html."
      };
    }
    return {
      cls: "is-muted",
      text: remoteSubmitMessage || "Supabase response collection is ready."
    };
  }

  function renderRemoteSubmitStatus() {
    const meta = getRemoteSubmitMeta();
    return `<div class="sq-remote-status ${meta.cls}">${escHtml(meta.text)}</div>`;
  }

  async function submitStudyAttemptRemotely(row) {
    remoteSubmitState = "pending";
    remoteSubmitMessage = "Submitting response...";
    try {
      await submitAppResponse("study_attempt", row);
      remoteSubmitState = "success";
      remoteSubmitMessage = "Response saved to Supabase.";
    } catch (err) {
      remoteSubmitState = "error";
      remoteSubmitMessage = err && err.message
        ? "Remote submission failed: " + err.message
        : "Remote submission failed. This browser still saved the response locally.";
    }
    renderStudyPanel();
  }

  function saveStudyAttempt() {
    const total = DATASET_ORDER.length;
    const entries = DATASET_ORDER.map((k) => {
      const r = studyResponses[k] || {};
      return {
        dataset: k,
        datasetLabel: DATASETS[k].label,
        answer: r.answer || "",
        confidence: r.confidence || 0,
        timeMs: r.timeMs || 0,
        correct: r.answer === STUDY_QUESTIONS[k].correct
      };
    });

    const correct = entries.filter((entry) => entry.correct).length;
    const avgConf = entries.reduce((sum, e) => sum + (e.confidence || 0), 0) / total;
    const avgTime = entries.reduce((sum, e) => sum + (e.timeMs || 0), 0) / total / 1000;
    const totalTimeMs = entries.reduce((sum, e) => sum + (e.timeMs || 0), 0);

    const row = {
      id: Date.now(),
      at: new Date().toISOString(),
      name: (studyName || "Traveler").trim(),
      gender: studyGender,
      correct,
      total,
      avgConf: Math.round(avgConf * 10) / 10,
      avgTime: Math.round(avgTime * 10) / 10,
      totalTimeMs,
      fastestMap: studyFastestMap || "Not answered",
      hardestReasons: studyHardestReasons.length ? studyHardestReasons.slice() : [],
      entries
    };

    try {
      const list = readStudyAttempts();
      list.unshift(row);
      if (list.length > 25) list.length = 25;
      localStorage.setItem(STUDY_ATTEMPTS_KEY, JSON.stringify(list));
    } catch (_) {}

    void submitStudyAttemptRemotely(row);
    return row;
  }

  function renderStudyResponseHistory() {
    const attempts = readStudyAttempts();
    studyContentMount.innerHTML = `
      <div class="sq-summary">
        <div class="sq-sum-title">Saved Map Study Responses</div>
        ${renderRemoteSubmitStatus()}
        <table class="sq-sum-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Gender</th>
              <th>Score</th>
              <th>Fastest Map</th>
              <th>Hardest</th>
              <th>Avg Conf.</th>
              <th>Avg Time</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            ${attempts.map((a, idx) => `
              <tr class="study-attempt-row" data-attempt-id="${escAttr(String(a.id || idx))}">
                <td>${escHtml(a.name || "Traveler")}</td>
                <td>${escHtml(a.gender || "male")}</td>
                <td>${a.correct}/${a.total}</td>
                <td>${escHtml(a.fastestMap || "—")}</td>
                <td>${(a.hardestReasons && a.hardestReasons.length) ? escHtml(a.hardestReasons.join(", ")) : "—"}</td>
                <td>${(a.avgConf ?? 0).toFixed(1)}/5</td>
                <td>${(a.avgTime ?? 0).toFixed(1)}s</td>
                <td>${new Date(a.at).toLocaleString()}</td>
              </tr>
            `).join("")}
            ${attempts.length ? "" : `<tr><td colspan="8">No responses stored yet.</td></tr>`}
          </tbody>
        </table>
      </div>`;

    if (!attempts.length) {
      footerEl.innerHTML = `<div class="study-footer-actions"><button type="button" class="sq-summary-btn" id="study-back-to-study">Back to Study</button></div>`;
      document.getElementById("study-back-to-study")?.addEventListener("click", renderStudyPanel);
      return;
    }

    const detail = document.createElement("div");
    detail.id = "study-attempt-detail";
    detail.className = "sq-summary";
    detail.innerHTML = `<div class="sq-sum-meta">Click a row above to review answers.</div>`;
    studyContentMount.appendChild(detail);

    attempts.forEach((a, idx) => {
      const row = studyContentMount.querySelector(`.study-attempt-row[data-attempt-id="${escAttr(String(a.id || idx))}"]`);
      row?.addEventListener("click", () => {
        studyContentMount.querySelectorAll(".study-attempt-row.is-active").forEach((r) => r.classList.remove("is-active"));
        row.classList.add("is-active");
        renderStudyAttemptDetail(a);
      });
    });

    const first = studyContentMount.querySelector(`.study-attempt-row[data-attempt-id="${escAttr(String(attempts[0].id || 0))}"]`);
    first?.classList.add("is-active");
    if (attempts[0]) renderStudyAttemptDetail(attempts[0]);

    footerEl.innerHTML = `<div class="study-footer-actions"><button type="button" class="sq-summary-btn" id="study-back-to-study">Back to Study</button></div>`;
    document.getElementById("study-back-to-study")?.addEventListener("click", renderStudyPanel);
  }

  function renderStudyAttemptDetail(attempt) {
    const detail = document.getElementById("study-attempt-detail");
    if (!detail || !attempt) return;
    const rows = attempt.entries || [];
    detail.innerHTML = `
      <div class="sq-sum-title" style="font-size: 14px;">${escHtml(attempt.name || "Traveler")} (${escHtml(attempt.gender || "male")})</div>
      <div class="sq-sum-meta">${new Date(attempt.at).toLocaleString()} · Score: ${attempt.correct || 0}/${attempt.total || 0}</div>
      <div class="sq-sum-meta">Fastest map: ${escHtml(attempt.fastestMap || "Not answered")}</div>
      <div class="sq-sum-meta">What was hardest: ${(attempt.hardestReasons && attempt.hardestReasons.length) ? escHtml(attempt.hardestReasons.join(", ")) : "Not provided"}</div>
      <table class="sq-sum-table">
        <thead>
          <tr><th>Dataset</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th><th>Conf.</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${rows.map((r) => {
            const dataset = STUDY_QUESTIONS[r.dataset] || {};
            const isCorrect = r.correct === true;
            return `<tr>
              <td>${escHtml(r.datasetLabel || r.dataset || "")}</td>
              <td>${escHtml(r.answer || "—")}</td>
              <td>${escHtml(dataset.correct || "—")}</td>
              <td class="${isCorrect ? "sum-ok" : "sum-bad"}">${isCorrect ? "✓" : "✗"}</td>
              <td>${(r.confidence ?? 0)}/5</td>
              <td>${((r.timeMs || 0) / 1000).toFixed(1)}s</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;
  }

  function renderStudyFooterWithResponses(mainButtonHtml) {
    footerEl.innerHTML = `<div class="study-footer-actions">
      ${mainButtonHtml || `<span class=\"spacer\"></span>`}
      <button type="button" class="sq-summary-btn" id="study-view-history">View Responses</button>
    </div>`;
    document.getElementById("study-view-history")?.addEventListener("click", renderStudyResponseHistory);
  }

  function renderStudyIntro() {
    const intro = document.createElement("div");
    intro.className = "sq-wrap";
    intro.innerHTML = `
      <div class="sq-question">Map study setup</div>
      <div class="sq-context">Tell us your name and select your gender, then click Begin to continue.</div>
      ${renderRemoteSubmitStatus()}
    `;
    footerEl.innerHTML = `
      <div class="study-footer-actions">
        <button type="button" class="sq-submit" id="study-start-btn">Begin</button>
        <button type="button" class="sq-summary-btn" id="study-view-history">View Responses</button>
      </div>`;
    document.getElementById("study-view-history")?.addEventListener("click", renderStudyResponseHistory);
    document.getElementById("study-start-btn")?.addEventListener("click", () => {
      if (!studyName.trim()) {
        const nameInput = document.getElementById("study-name-input");
        nameInput?.focus();
        return;
      }
      studyStarted = true;
      switchDataset(studyDataset);
      renderStudyPanel();
    });
    return intro;
  }

  function renderStudySwitcher() {
    const sw = document.createElement("div");
    sw.className = "study-switcher";
    sw.innerHTML = DATASET_ORDER.map((k) => {
      const tabTitle = escAttr(STUDY_QUESTIONS[k] ? STUDY_QUESTIONS[k].context : DATASETS[k].label);
      return `<button type="button" class="study-tab${k === studyDataset ? " active" : ""}" data-key="${k}" title="${tabTitle}">${DATASETS[k].label}</button>`;
    }).join("");

    sw.querySelectorAll(".study-tab").forEach((b) => {
      b.addEventListener("click", () => {
        studyDataset = b.dataset.key;
        switchDataset(studyDataset);
        renderStudyPanel();
      });
    });

    return sw;
  }

  function renderStudyPanel() {
    studyContentMount.innerHTML = "";
    if (!studyStarted) {
      studyContentMount.appendChild(renderStudyIntro());
      return;
    }

    studyContentMount.appendChild(renderStudySwitcher());

    const q = STUDY_QUESTIONS[studyDataset];
    const done = studyResponses[studyDataset];
    questionStart = Date.now();
    const wrap = document.createElement("div");
    wrap.className = "sq-wrap";

    if (done) {
      const ok = done.answer === q.correct;
      wrap.innerHTML = `
        <div class="sq-context">${q.context}</div>
        <div class="sq-question">${q.question}</div>
        <div class="sq-opts-answered">
          ${q.options.map((o) => {
            let cls = "sq-opt-result";
            if (o === q.correct) cls += " correct";
            else if (o === done.answer && !ok) cls += " wrong";
            return `<div class="${cls}">${o}</div>`;
          }).join("")}
        </div>
        <div class="sq-feedback ${ok ? "sq-ok" : "sq-wrong"}">
          ${ok ? "✓ Correct" : "✗ Incorrect — " + q.correct}
          <span class="sq-meta">Confidence: ${done.confidence}/5 · ${(done.timeMs / 1000).toFixed(1)}s</span>
        </div>
        ${allDone() ? `<button type="button" class="sq-summary-btn" id="sq-summary-btn">View Summary</button>` : ""}
      `;

      if (allDone()) {
        renderStudyFooterWithResponses(`<button type="button" class="sq-submit" id="sq-summary-btn">View Summary</button>`);
        document.getElementById("sq-summary-btn")?.addEventListener("click", renderSummary);
      } else {
        renderStudyFooterWithResponses("");
      }
    } else {
      let selected = null;
      let confidence = null;

      wrap.innerHTML = `
        <div class="sq-context">${q.context}</div>
        <div class="sq-question">${q.question}</div>
        <div class="sq-opts" id="sq-opts">
          ${q.options.map((o) => `<button type="button" class="sq-opt-btn" data-val="${escAttr(o)}">${o}</button>`).join("")}
        </div>
        <div class="sq-conf-wrap" id="sq-conf-wrap" style="display:none">
          <div class="sq-conf-label">Confidence</div>
          <div class="sq-conf-row">
            <span class="sq-conf-note">Low</span>
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="sq-conf-btn" data-n="${n}">${n}</button>`).join("")}
            <span class="sq-conf-note">High</span>
          </div>
        </div>
      `;

      renderStudyFooterWithResponses(`<button type="button" class="sq-submit" id="sq-submit" disabled>Submit</button>`);

      const checkReady = () => {
        const submitBtn = document.getElementById("sq-submit");
        if (submitBtn) submitBtn.disabled = !(selected && confidence);
      };

      wrap.querySelectorAll(".sq-opt-btn").forEach((b) => {
        b.addEventListener("click", () => {
          wrap.querySelectorAll(".sq-opt-btn").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          selected = b.dataset.val;
          const confWrap = document.getElementById("sq-conf-wrap");
          if (confWrap) confWrap.style.display = "";
          checkReady();
        });
      });

      wrap.querySelectorAll(".sq-conf-btn").forEach((b) => {
        b.addEventListener("click", () => {
          wrap.querySelectorAll(".sq-conf-btn").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          confidence = +b.dataset.n;
          checkReady();
        });
      });

      document.getElementById("sq-submit")?.addEventListener("click", () => {
        if (!selected || !confidence) return;
        studyResponses[studyDataset] = {
          answer: selected,
          confidence,
          timeMs: Date.now() - questionStart
        };
        if (allDone()) {
          renderSummary();
          return;
        }
        const next = DATASET_ORDER.find((k) => !studyResponses[k]);
        if (next) {
          studyDataset = next;
          switchDataset(next);
        }
        renderStudyPanel();
      });
    }

    studyContentMount.appendChild(wrap);
  }

  function allDone() {
    return DATASET_ORDER.every((k) => studyResponses[k]);
  }

  function renderSummary() {
    if (!studyFastestMap) {
      const mapOptions = DATASET_ORDER.map((k) => DATASETS[k].label);
      const fastWrap = document.createElement("div");
      const reasonRows = STUDY_DIFFICULTY_REASONS.map((reason) =>
        `<label class="qz-checkbox-option"><input type="checkbox" value="${escAttr(reason)}" />${escHtml(reason)}</label>`
      ).join("");

      fastWrap.className = "sq-wrap";
      fastWrap.innerHTML = `
        <div class="sq-summary">
          <div class="sq-sum-title">Quick feedback</div>
          <div class="sq-sum-meta">Which map helped you answer the questions fastest?</div>
          ${renderRemoteSubmitStatus()}
        </div>
        <div class="sq-opts" id="sq-fastest-opts">
          ${mapOptions.map((m) => `<button type="button" class="sq-opt-btn" data-val="${m}">${m}</button>`).join("")}
        </div>
        <div class="qz-field">
          <div class="sq-sum-meta">What made it hardest for you to answer the questions?</div>
          <div class="qz-checkbox-row" id="sq-hard-row">
            ${reasonRows}
          </div>
          <textarea id="sq-hard-other" class="qz-input qz-textarea" rows="2" placeholder="Other (optional)"></textarea>
        </div>
      `;
      studyContentMount.innerHTML = "";
      studyContentMount.appendChild(fastWrap);
      renderStudyFooterWithResponses(`<button type="button" class="sq-submit" id="sq-fastest-submit" disabled>Continue</button>`);

      let selectedMap = "";
      const reasonEls = Array.from(fastWrap.querySelectorAll("#sq-hard-row input[type=\"checkbox\"]"));
      fastWrap.querySelectorAll(".sq-opt-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          fastWrap.querySelectorAll(".sq-opt-btn").forEach((x) => x.classList.remove("selected"));
          btn.classList.add("selected");
          selectedMap = btn.dataset.val || "";
          const submitBtn = document.getElementById("sq-fastest-submit");
          if (submitBtn) submitBtn.disabled = !selectedMap;
        });
      });

      document.getElementById("sq-fastest-submit")?.addEventListener("click", () => {
        if (!selectedMap) return;
        const hardList = reasonEls.filter((ch) => ch.checked).map((ch) => ch.value);
        const other = (fastWrap.querySelector("#sq-hard-other")?.value || "").trim();
        studyHardestReasons = hardList;
        if (other) studyHardestReasons = studyHardestReasons.concat([`Other: ${other}`]);
        studyFastestMap = selectedMap;
        saveStudyAttempt();
        renderSummary();
      });
      return;
    }

    const total = DATASET_ORDER.length;
    const correct = DATASET_ORDER.filter((k) => studyResponses[k]?.answer === STUDY_QUESTIONS[k].correct).length;
    const avgConf = (DATASET_ORDER.reduce((sum, k) => sum + (studyResponses[k]?.confidence || 0), 0) / total).toFixed(1);
    const avgTime = (DATASET_ORDER.reduce((sum, k) => sum + (studyResponses[k]?.timeMs || 0), 0) / total / 1000).toFixed(1);
    const attempts = readStudyAttempts();

    studyContentMount.innerHTML = `
      <div class="sq-summary">
        <div class="sq-sum-title">Study Complete</div>
        ${renderRemoteSubmitStatus()}
        <div class="sq-sum-score">${correct}<span>/${total}</span></div>
        <div class="sq-sum-meta">Avg confidence: ${avgConf}/5 · Avg time: ${avgTime}s</div>
        <div class="sq-sum-meta">Fastest map: ${escHtml(studyFastestMap)}</div>
        <div class="sq-sum-meta">What was hardest: ${(studyHardestReasons.length ? escHtml(studyHardestReasons.join(", ")) : "Not provided")}</div>
        <table class="sq-sum-table">
          <thead><tr><th>Dataset</th><th>Result</th><th>Conf.</th><th>Time</th></tr></thead>
          <tbody>
            ${DATASET_ORDER.map((k) => {
              const r = studyResponses[k];
              const ok = r.answer === STUDY_QUESTIONS[k].correct;
              return `<tr>
                <td>${DATASETS[k].label}</td>
                <td class="${ok ? "sum-ok" : "sum-bad"}">${ok ? "✓" : "✗"}</td>
                <td>${r.confidence}/5</td>
                <td>${(r.timeMs / 1000).toFixed(1)}s</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
        <p class="sq-sum-note">Thank you. This study examines whether interactive maps aid geographic data comprehension.</p>
      </div>`;

    if (attempts.length) {
      const hist = document.createElement("div");
      hist.className = "sq-summary";
      hist.innerHTML = `
        <div class="sq-sum-title" style="font-size: 14px;">Previous responses</div>
        <table class="sq-sum-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Gender</th>
              <th>Score</th>
              <th>Fastest Map</th>
              <th>Hardest</th>
              <th>Avg Conf.</th>
              <th>Avg Time</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            ${attempts.map((a) => `
              <tr>
                <td>${escHtml(a.name || "Traveler")}</td>
                <td>${escHtml(a.gender || "male")}</td>
                <td>${a.correct}/${a.total}</td>
                <td>${escHtml(a.fastestMap || "—")}</td>
                <td>${(a.hardestReasons && a.hardestReasons.length) ? escHtml(a.hardestReasons.join(", ")) : "—"}</td>
                <td>${(a.avgConf ?? 0).toFixed(1)}/5</td>
                <td>${(a.avgTime ?? 0).toFixed(1)}s</td>
                <td>${new Date(a.at).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>`;
      studyContentMount.appendChild(hist);
    }

    footerEl.innerHTML = `
      <div class="study-footer-actions">
        <button type="button" class="sq-submit" id="sq-retake">Retake Study</button>
        <button type="button" class="sq-summary-btn" id="sq-view-responses">View Responses</button>
      </div>`;

    document.getElementById("sq-retake")?.addEventListener("click", () => {
      DATASET_ORDER.forEach((k) => delete studyResponses[k]);
      studyDataset = "visitors";
      switchDataset("visitors");
      studyFastestMap = "";
      studyHardestReasons = [];
      studyStarted = false;
      renderStudyPanel();
    });
    document.getElementById("sq-view-responses")?.addEventListener("click", renderStudyResponseHistory);
  }

  // Init — switch map to match first study tab
  switchDataset(studyDataset);
  renderStudyPanel();
})();
