(function () {
  const STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  const GROUPS = {
    warm: new Set(["Florida", "Texas", "Arizona", "Nevada", "California", "Hawaii", "Georgia", "South Carolina", "Louisiana", "Alabama", "Mississippi", "New Mexico"]),
    mild: new Set(["North Carolina", "Virginia", "Tennessee", "Arkansas", "Oklahoma", "Kentucky", "Maryland", "Oregon"]),
    cold: new Set(["Alaska", "North Dakota", "South Dakota", "Montana", "Minnesota", "Wisconsin", "Vermont", "Maine", "New Hampshire", "Wyoming", "Michigan"]),
    urban: new Set(["New York", "California", "Illinois", "Massachusetts", "Texas", "Florida", "New Jersey", "Washington", "Georgia", "Pennsylvania"]),
    suburban: new Set(["Virginia", "North Carolina", "Colorado", "Arizona", "Maryland", "Tennessee", "Ohio", "Minnesota"]),
    rural: new Set(["Montana", "Wyoming", "North Dakota", "South Dakota", "Idaho", "West Virginia", "Vermont", "Maine", "Nebraska"]),
    affordable: new Set(["Texas", "Tennessee", "Oklahoma", "Arkansas", "Mississippi", "Alabama", "Kentucky", "West Virginia", "Iowa", "Kansas"]),
    balancedCost: new Set(["North Carolina", "Georgia", "Arizona", "Ohio", "Michigan", "Nevada", "Missouri", "Indiana", "Pennsylvania"]),
    premium: new Set(["California", "New York", "Massachusetts", "Hawaii", "Washington", "New Jersey", "Maryland", "Colorado", "Oregon"]),
    nature: new Set(["Colorado", "Utah", "Montana", "Wyoming", "Idaho", "Alaska", "Maine", "Vermont", "Oregon", "Washington"]),
    entertainment: new Set(["California", "New York", "Nevada", "Florida", "Texas", "Illinois", "Georgia", "Louisiana"]),
    jobs: new Set(["California", "Texas", "New York", "Washington", "Massachusetts", "Virginia", "North Carolina", "Colorado", "Georgia"]),
    quiet: new Set(["Vermont", "Maine", "Wyoming", "Montana", "West Virginia", "South Dakota", "North Dakota", "Idaho", "New Hampshire"])
  };

  const QUESTION_BANK = [
    {
      id: "weather",
      prompt: "What weather do you prefer most of the year?",
      options: [
        { id: "warm", label: "Warm and sunny", apply: [{ group: "warm", score: 3 }, { group: "mild", score: 1 }] },
        { id: "mild", label: "Four seasons", apply: [{ group: "mild", score: 3 }, { group: "cold", score: 1 }, { group: "warm", score: 1 }] },
        { id: "cold", label: "Cool / snowy", apply: [{ group: "cold", score: 3 }, { group: "nature", score: 1 }] }
      ]
    },
    {
      id: "lifestyle",
      prompt: "What kind of lifestyle fits you best?",
      options: [
        { id: "urban", label: "Big city energy", apply: [{ group: "urban", score: 3 }, { group: "jobs", score: 1 }] },
        { id: "suburban", label: "Balanced suburban", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "rural", label: "Small town / rural", apply: [{ group: "rural", score: 3 }, { group: "quiet", score: 1 }] }
      ]
    },
    {
      id: "budget",
      prompt: "How important is affordability?",
      options: [
        { id: "high", label: "Very important", apply: [{ group: "affordable", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "medium", label: "Somewhat important", apply: [{ group: "balancedCost", score: 3 }, { group: "affordable", score: 1 }] },
        { id: "low", label: "Not a major factor", apply: [{ group: "premium", score: 3 }, { group: "urban", score: 1 }] }
      ]
    },
    {
      id: "activities",
      prompt: "Which activities do you want nearby?",
      options: [
        { id: "nature", label: "Outdoors and nature", apply: [{ group: "nature", score: 3 }, { group: "quiet", score: 1 }] },
        { id: "entertainment", label: "Food, arts, nightlife", apply: [{ group: "entertainment", score: 3 }, { group: "urban", score: 1 }] },
        { id: "mix", label: "A mix of both", apply: [{ group: "suburban", score: 2 }, { group: "nature", score: 1 }, { group: "entertainment", score: 1 }] }
      ]
    },
    {
      id: "priority",
      prompt: "What is your top priority in your next place?",
      options: [
        { id: "career", label: "Career opportunities", apply: [{ group: "jobs", score: 3 }, { group: "urban", score: 1 }] },
        { id: "quiet", label: "Peace and slower pace", apply: [{ group: "quiet", score: 3 }, { group: "rural", score: 1 }] },
        { id: "balance", label: "Balanced life", apply: [{ group: "suburban", score: 2 }, { group: "balancedCost", score: 2 }] }
      ]
    },
    {
      id: "weekend",
      prompt: "What does your ideal weekend look like?",
      options: [
        { id: "events", label: "Concerts, events, and city life", apply: [{ group: "entertainment", score: 3 }, { group: "urban", score: 1 }] },
        { id: "hiking", label: "Trails, parks, and mountains", apply: [{ group: "nature", score: 3 }, { group: "quiet", score: 1 }] },
        { id: "mix", label: "Some activity, some rest", apply: [{ group: "suburban", score: 2 }, { group: "nature", score: 1 }, { group: "entertainment", score: 1 }] }
      ]
    },
    {
      id: "homeType",
      prompt: "Where would you rather live?",
      options: [
        { id: "downtown", label: "Downtown apartment", apply: [{ group: "urban", score: 3 }, { group: "premium", score: 1 }] },
        { id: "suburb", label: "Suburban neighborhood", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "smalltown", label: "Small town", apply: [{ group: "rural", score: 3 }, { group: "quiet", score: 1 }] }
      ]
    },
    {
      id: "transport",
      prompt: "How do you prefer getting around?",
      options: [
        { id: "transit", label: "Public transit / walking", apply: [{ group: "urban", score: 3 }, { group: "premium", score: 1 }] },
        { id: "car", label: "Mostly by car", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "minimal", label: "Short drives, less traffic", apply: [{ group: "quiet", score: 3 }, { group: "rural", score: 1 }] }
      ]
    },
    {
      id: "pace",
      prompt: "What daily pace do you enjoy?",
      options: [
        { id: "fast", label: "Fast-paced and busy", apply: [{ group: "urban", score: 3 }, { group: "jobs", score: 1 }] },
        { id: "moderate", label: "Balanced and steady", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "slow", label: "Slow and relaxed", apply: [{ group: "quiet", score: 3 }, { group: "rural", score: 1 }] }
      ]
    },
    {
      id: "careerField",
      prompt: "Which job environment sounds best?",
      options: [
        { id: "techbiz", label: "Tech/business hub", apply: [{ group: "jobs", score: 3 }, { group: "urban", score: 1 }] },
        { id: "service", label: "Tourism/service economy", apply: [{ group: "entertainment", score: 2 }, { group: "warm", score: 2 }] },
        { id: "local", label: "Local community-oriented work", apply: [{ group: "affordable", score: 2 }, { group: "rural", score: 2 }] }
      ]
    },
    {
      id: "food",
      prompt: "Food scene preference?",
      options: [
        { id: "diverse", label: "Very diverse global food", apply: [{ group: "urban", score: 3 }, { group: "entertainment", score: 1 }] },
        { id: "regional", label: "Strong regional specialties", apply: [{ group: "warm", score: 2 }, { group: "balancedCost", score: 2 }] },
        { id: "simple", label: "Simple and local spots", apply: [{ group: "quiet", score: 2 }, { group: "affordable", score: 2 }] }
      ]
    },
    {
      id: "crowds",
      prompt: "How do you feel about crowds?",
      options: [
        { id: "love", label: "I like busy places", apply: [{ group: "urban", score: 3 }, { group: "entertainment", score: 1 }] },
        { id: "okay", label: "Fine in moderation", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "avoid", label: "I avoid crowds", apply: [{ group: "quiet", score: 3 }, { group: "rural", score: 1 }] }
      ]
    },
    {
      id: "landscape",
      prompt: "Which landscape do you prefer most?",
      options: [
        { id: "coast", label: "Coast and beaches", apply: [{ group: "warm", score: 2 }, { group: "premium", score: 1 }, { group: "entertainment", score: 1 }] },
        { id: "mountain", label: "Mountains and forests", apply: [{ group: "nature", score: 3 }, { group: "quiet", score: 1 }] },
        { id: "plains", label: "Open plains and space", apply: [{ group: "rural", score: 2 }, { group: "affordable", score: 2 }] }
      ]
    },
    {
      id: "housing",
      prompt: "What housing tradeoff works for you?",
      options: [
        { id: "paymore", label: "Pay more for top location", apply: [{ group: "premium", score: 3 }, { group: "urban", score: 1 }] },
        { id: "balanced", label: "Balanced price and location", apply: [{ group: "balancedCost", score: 3 }, { group: "suburban", score: 1 }] },
        { id: "save", label: "Lower cost is key", apply: [{ group: "affordable", score: 3 }, { group: "rural", score: 1 }] }
      ]
    },
    {
      id: "familyLife",
      prompt: "Which environment sounds best for family life?",
      options: [
        { id: "family-suburb", label: "Quiet suburban neighborhoods", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "family-city", label: "City with lots of activities", apply: [{ group: "urban", score: 3 }, { group: "entertainment", score: 1 }] },
        { id: "family-rural", label: "Open space and small communities", apply: [{ group: "rural", score: 3 }, { group: "quiet", score: 1 }] }
      ]
    },
    {
      id: "commuteTolerance",
      prompt: "How much commute/travel time is okay for you?",
      options: [
        { id: "short", label: "I want very short commutes", apply: [{ group: "quiet", score: 2 }, { group: "suburban", score: 2 }] },
        { id: "moderate", label: "Moderate commute is fine", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "long", label: "Long commute is okay for opportunities", apply: [{ group: "urban", score: 2 }, { group: "jobs", score: 2 }] }
      ]
    },
    {
      id: "socialEnergy",
      prompt: "How social do you want your city/state to feel?",
      options: [
        { id: "high-social", label: "Always active and social", apply: [{ group: "entertainment", score: 3 }, { group: "urban", score: 1 }] },
        { id: "medium-social", label: "Some events, not too crowded", apply: [{ group: "suburban", score: 2 }, { group: "balancedCost", score: 2 }] },
        { id: "low-social", label: "Calm and private", apply: [{ group: "quiet", score: 3 }, { group: "rural", score: 1 }] }
      ]
    },
    {
      id: "seasonPreference",
      prompt: "What seasonal pattern do you prefer?",
      options: [
        { id: "minimal-winter", label: "Minimal winter", apply: [{ group: "warm", score: 3 }, { group: "entertainment", score: 1 }] },
        { id: "balanced-seasons", label: "Balanced four seasons", apply: [{ group: "mild", score: 3 }, { group: "suburban", score: 1 }] },
        { id: "winter-heavy", label: "Real winter and snow", apply: [{ group: "cold", score: 3 }, { group: "nature", score: 1 }] }
      ]
    },
    {
      id: "airportAccess",
      prompt: "How important is airport/international access?",
      options: [
        { id: "very-important", label: "Very important", apply: [{ group: "urban", score: 3 }, { group: "jobs", score: 1 }] },
        { id: "somewhat-important", label: "Somewhat important", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "not-important", label: "Not that important", apply: [{ group: "quiet", score: 2 }, { group: "rural", score: 2 }] }
      ]
    },
    {
      id: "activityBudget",
      prompt: "How much do you want to spend on fun each month?",
      options: [
        { id: "high-spend", label: "I can spend more for experiences", apply: [{ group: "premium", score: 2 }, { group: "entertainment", score: 2 }] },
        { id: "mid-spend", label: "Moderate budget", apply: [{ group: "balancedCost", score: 3 }, { group: "suburban", score: 1 }] },
        { id: "low-spend", label: "Keep it low-cost", apply: [{ group: "affordable", score: 3 }, { group: "quiet", score: 1 }] }
      ]
    },
    {
      id: "weeknightStyle",
      prompt: "How do you usually spend weeknights?",
      options: [
        { id: "go-out", label: "Go out often", apply: [{ group: "urban", score: 2 }, { group: "entertainment", score: 2 }] },
        { id: "mixed-nights", label: "Mix of out and home", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "home-first", label: "Mostly stay home", apply: [{ group: "quiet", score: 3 }, { group: "rural", score: 1 }] }
      ]
    },
    {
      id: "natureType",
      prompt: "What kind of nature access matters most?",
      options: [
        { id: "beach", label: "Beaches and coastline", apply: [{ group: "warm", score: 2 }, { group: "nature", score: 2 }] },
        { id: "mountains", label: "Mountains/trails", apply: [{ group: "nature", score: 3 }, { group: "cold", score: 1 }] },
        { id: "parks", label: "Local parks and green areas", apply: [{ group: "suburban", score: 2 }, { group: "quiet", score: 2 }] }
      ]
    },
    {
      id: "lifeStage",
      prompt: "Which life stage are you prioritizing now?",
      options: [
        { id: "career-growth", label: "Career growth", apply: [{ group: "jobs", score: 3 }, { group: "urban", score: 1 }] },
        { id: "settling-down", label: "Settling down", apply: [{ group: "suburban", score: 3 }, { group: "balancedCost", score: 1 }] },
        { id: "slower-phase", label: "Slower pace", apply: [{ group: "quiet", score: 3 }, { group: "rural", score: 1 }] }
      ]
    }
  ];

  function shuffled(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function getRandomQuestions(count) {
    return shuffled(QUESTION_BANK).slice(0, count);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function renderIntro(container, playerName, selectedGender, onChange) {
    const safeName = escapeHtml(playerName || "");
    const gender = selectedGender === "female" ? "female" : "male";
    container.innerHTML = `
      <div class="quiz-progress">Start</div>
      <h3 class="quiz-question">Enter your name to begin</h3>
      <div class="quiz-name-wrap">
        <label class="quiz-helper" for="quiz-name-input">Name</label>
        <input id="quiz-name-input" class="quiz-name-input" type="text" maxlength="40" placeholder="Type your name" value="${safeName}" />
      </div>
      <div class="quiz-gender-group">
        <div class="quiz-helper">Gender</div>
        <div class="quiz-gender-options">
          <label class="quiz-check-row" for="quiz-gender-male">
            <input id="quiz-gender-male" type="checkbox" ${gender === "male" ? "checked" : ""} />
            <span>Male</span>
          </label>
          <label class="quiz-check-row" for="quiz-gender-female">
            <input id="quiz-gender-female" type="checkbox" ${gender === "female" ? "checked" : ""} />
            <span>Female</span>
          </label>
        </div>
      </div>
      <p class="quiz-helper">You will answer 5 random questions.</p>
    `;

    const input = container.querySelector("#quiz-name-input");
    const maleCheck = container.querySelector("#quiz-gender-male");
    const femaleCheck = container.querySelector("#quiz-gender-female");
    if (!input || !maleCheck || !femaleCheck) return;

    function getGender() {
      if (femaleCheck.checked) return "female";
      return "male";
    }

    function syncExclusive(changed) {
      if (changed === "male") {
        maleCheck.checked = true;
        femaleCheck.checked = false;
      } else {
        femaleCheck.checked = true;
        maleCheck.checked = false;
      }
    }

    input.focus();
    const emit = () => onChange({ name: input.value, gender: getGender() });
    input.addEventListener("input", emit);
    maleCheck.addEventListener("change", () => {
      syncExclusive("male");
      emit();
    });
    femaleCheck.addEventListener("change", () => {
      syncExclusive("female");
      emit();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        emit();
      }
    });
  }

  function getBaseScore(state) {
    const data = window.STATE_VISIT_DATA || {};
    const visit = data[state] && typeof data[state].visitation2024k === "number" ? data[state].visitation2024k : 0;
    return Math.min(8, visit / 1200);
  }

  function computeRecommendations(answers, questions) {
    const scores = new Map(STATES.map((s) => [s, getBaseScore(s)]));

    answers.forEach((answerId, idx) => {
      const question = questions[idx];
      if (!question) return;
      const selected = question.options.find((option) => option.id === answerId);
      if (!selected) return;

      selected.apply.forEach(({ group, score }) => {
        const states = GROUPS[group];
        if (!states) return;
        states.forEach((state) => scores.set(state, (scores.get(state) || 0) + score));
      });
    });

    const ranked = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([state, score]) => ({ state, score: Number(score.toFixed(2)) }));

    return ranked;
  }

  function renderQuestion(container, idx, answers, questions, onSelect) {
    const question = questions[idx];
    container.innerHTML = `
      <div class="quiz-progress">Question ${idx + 1} of ${questions.length}</div>
      <h3 class="quiz-question">${question.prompt}</h3>
      <div class="quiz-options">
        ${question.options.map((option) => `
          <button type="button" class="quiz-option${answers[idx] === option.id ? " active" : ""}" data-answer="${option.id}">
            ${option.label}
          </button>
        `).join("")}
      </div>
    `;

    container.querySelectorAll(".quiz-option").forEach((btn) => {
      btn.addEventListener("click", () => onSelect(btn.dataset.answer || ""));
    });
  }

  function renderResult(container, answers, questions, playerName, selectedGender) {
    const ranked = computeRecommendations(answers, questions);
    const top = ranked[0];
    const stateData = (window.STATE_VISIT_DATA || {})[top.state];
    const safeName = escapeHtml(playerName || "Traveler");

    container.innerHTML = `
      <div class="quiz-progress">Result</div>
      <h3 class="quiz-question">${safeName}: your recommended state is ${top.state}</h3>
      <p class="quiz-result-line">This matched your 5 answers best.</p>
      <p class="quiz-result-line">${stateData ? `2024 visitation: ${stateData.visitation2024k.toLocaleString()}k | Rank: ${stateData.rank}` : "No workbook stats available for this state."}</p>
      <div class="quiz-top3">
        <strong>Top 3 matches</strong>
        <ol>
          ${ranked.map((item) => `<li>${item.state} <span>(score ${item.score})</span></li>`).join("")}
        </ol>
      </div>
      <button type="button" class="quiz-restart" id="quiz-restart">Play again</button>
    `;

    if (typeof window.renderStateAvatar === "function") {
      window.renderStateAvatar(playerName, top.state, {
        avatarKey: selectedGender === "female" ? "wahine" : "default"
      });
    }
  }

  function initQuiz() {
    const openBtn = document.getElementById("quiz-open-btn");
    const panel = document.getElementById("quiz-panel");
    const closeBtn = document.getElementById("quiz-close-btn");
    const body = document.getElementById("quiz-body");
    const backBtn = document.getElementById("quiz-back-btn");
    const nextBtn = document.getElementById("quiz-next-btn");

    if (!openBtn || !panel || !closeBtn || !body || !backBtn || !nextBtn) return;

    let questions = getRandomQuestions(5);
    let playerName = "";
    let selectedGender = "male";
    const answers = [];
    let step = -1;

    function showStep() {
      if (step < 0) {
        renderIntro(body, playerName, selectedGender, ({ name, gender }) => {
          playerName = name.trim();
          selectedGender = gender === "female" ? "female" : "male";
          nextBtn.disabled = !playerName;
        });
        backBtn.disabled = true;
        nextBtn.textContent = "Start Quiz";
        nextBtn.disabled = !playerName;
      } else if (step < questions.length) {
        renderQuestion(body, step, answers, questions, (answerId) => {
          answers[step] = answerId;
          nextBtn.disabled = false;
          showStep();
        });
        backBtn.disabled = step === 0;
        nextBtn.textContent = step === questions.length - 1 ? "See result" : "Next";
        nextBtn.disabled = !answers[step];
      } else {
        renderResult(body, answers, questions, playerName, selectedGender);
        backBtn.disabled = true;
        nextBtn.disabled = true;
        nextBtn.textContent = "Done";
        const restartBtn = document.getElementById("quiz-restart");
        if (restartBtn) {
          restartBtn.addEventListener("click", () => {
            questions = getRandomQuestions(5);
            playerName = "";
            selectedGender = "male";
            answers.length = 0;
            step = -1;
            showStep();
          });
        }
      }
    }

    openBtn.addEventListener("click", () => {
      panel.classList.add("open");
      openBtn.setAttribute("aria-expanded", "true");
    });

    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
      openBtn.setAttribute("aria-expanded", "false");
    });

    backBtn.addEventListener("click", () => {
      if (step > 0) {
        step -= 1;
        showStep();
      } else if (step === 0) {
        step = -1;
        showStep();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (step < 0) {
        if (!playerName) return;
        step = 0;
        showStep();
        return;
      }
      if (step < questions.length && !answers[step]) return;
      if (step < questions.length) {
        step += 1;
        showStep();
      }
    });

    showStep();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuiz);
  } else {
    initQuiz();
  }
})();
