
    /* -------------------------------------------------------------------------
       EMBEDDED GOOGLE APPS SCRIPT PRODUCTION WEBHOOK ENDPOINT (/exec)
       Pre-configured production Google Apps Script /exec URL for seamless
       Google Sheets synchronization across all student devices.
       ------------------------------------------------------------------------- */
    const DEFAULT_GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzJOWidl7ZgmECFrLtB5LylrLav6vM3i530QDWHGphkAWRTAv2Oh4k_4WYj39v7fvs/exec";

    function getActiveGasWebAppUrl() {
      const storedUrl = localStorage.getItem("dlp6_gas_webapp_url");
      if (!storedUrl || storedUrl.trim() === "" || storedUrl.includes("/dev")) {
        return DEFAULT_GAS_WEBAPP_URL;
      }
      return storedUrl.trim();
    }

    /* -------------------------------------------------------------------------
       1. CLASSROOM COUNTDOWN TIMER LOGIC
       ------------------------------------------------------------------------- */
    let totalSeconds = 60 * 60; // Default 60 minutes for 1-hour session
    let timerInterval = null;

    function updateTimerDisplay() {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const formattedMins = String(mins).padStart(2, "0");
      const formattedSecs = String(secs).padStart(2, "0");
      document.getElementById("timerDisplay").textContent = `${formattedMins}:${formattedSecs}`;
    }

    function startTimer() {
      if (timerInterval !== null) return;
      timerInterval = setInterval(() => {
        if (totalSeconds > 0) {
          totalSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          timerInterval = null;
          alert("Time is up for this lesson segment!");
        }
      }, 1000);
    }

    function pauseTimer() {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    function resetTimer(minutes) {
      pauseTimer();
      totalSeconds = minutes * 60;
      updateTimerDisplay();
    }

    /* -------------------------------------------------------------------------
       2. STICKY SECTION NAVIGATION FILTER TABS & LESSON PROGRESS TRACKER
       ------------------------------------------------------------------------- */
    const visitedSections = new Set(["sec-objectives"]);

    function updateLessonProgress(percentOverride, customStatus) {
      const fill = document.getElementById("lessonProgressFill");
      const label = document.getElementById("progressPercentLabel");
      if (percentOverride !== undefined) {
        fill.style.width = `${percentOverride}%`;
        label.textContent = `${percentOverride}% — ${customStatus}`;
        return;
      }
      const computedPct = Math.min(85, 15 + visitedSections.size * 14);
      fill.style.width = `${computedPct}%`;
      label.textContent = `${computedPct}% — Exploring Lesson Sections`;
    }

    function filterSection(sectionId, btnElement) {
      const allTabs = document.querySelectorAll(".nav-tab-btn");
      allTabs.forEach(tab => tab.classList.remove("active"));
      if (btnElement) btnElement.classList.add("active");

      const allSections = document.querySelectorAll(".lesson-section");
      allSections.forEach(sec => {
        if (sectionId === "all" || sec.id === sectionId) {
          sec.style.display = "block";
        } else {
          sec.style.display = "none";
        }
      });

      if (sectionId !== "all") {
        visitedSections.add(sectionId);
        updateLessonProgress();
      }
    }

    function jumpToDevSection() {
      const allSections = document.querySelectorAll(".lesson-section");
      allSections.forEach(sec => (sec.style.display = "block"));
      document.getElementById("sec-dev-guide").scrollIntoView({ behavior: "smooth" });
    }

    /* -------------------------------------------------------------------------
       3. INSTANT CONCEPT HIGHLIGHTER (QUICK SEARCH UTILITY)
       ------------------------------------------------------------------------- */
    function highlightConcepts(query) {
      const term = query.trim().toLowerCase();
      const targetCards = document.querySelectorAll(".m-card, .p-card, .ksav-card, .audit-step");
      let firstMatch = null;

      targetCards.forEach(card => {
        card.classList.remove("highlight-match");
        if (term.length >= 2 && card.textContent.toLowerCase().includes(term)) {
          card.classList.add("highlight-match");
          if (!firstMatch) firstMatch = card;
        }
      });

      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    /* -------------------------------------------------------------------------
       4. INTERACTIVE DIGITAL T-CHART SORTER (ACTIVITY)
       ------------------------------------------------------------------------- */
    function sortChip(chipBtn) {
      const targetCol = chipBtn.getAttribute("data-col");
      const labelText = chipBtn.getAttribute("data-label");

      chipBtn.classList.add("sorted");

      const itemDiv = document.createElement("div");
      itemDiv.className = "sorted-item";
      itemDiv.textContent = "✓ " + labelText;

      if (targetCol === "A") {
        document.getElementById("colAList").appendChild(itemDiv);
      } else {
        document.getElementById("colBList").appendChild(itemDiv);
      }

      visitedSections.add("tchart-activity");
      updateLessonProgress();
    }

    function resetTChart() {
      document.getElementById("colAList").innerHTML = "";
      document.getElementById("colBList").innerHTML = "";
      const chips = document.querySelectorAll(".tchart-chip");
      chips.forEach(chip => chip.classList.remove("sorted"));
    }

    /* -------------------------------------------------------------------------
       5. HOTS REFLECTIVE QUESTIONS ACCORDION (ANALYSIS)
       ------------------------------------------------------------------------- */
    function toggleHots(buttonEl) {
      const answerDiv = buttonEl.nextElementSibling;
      const arrowSpan = buttonEl.querySelector("span:last-child");
      if (answerDiv.style.display === "block") {
        answerDiv.style.display = "none";
        arrowSpan.textContent = "▼";
      } else {
        answerDiv.style.display = "block";
        arrowSpan.textContent = "▲";
      }
    }

    /* -------------------------------------------------------------------------
       6. SHA-256 CRYPTOGRAPHIC ACCESS CODE VERIFICATION (NO PLAINTEXT CODES)
       Uses Web Crypto API (crypto.subtle.digest) to hash user input in SHA-256
       and compare against pre-computed hexadecimal SHA-256 digests.
       ------------------------------------------------------------------------- */
    const STUDENT_ACCESS_SHA256 = "51d661e8997ed17128eb6531a0a4e24a54decbae441c4ec60c16b7a0306745bc";
    const DEVELOPER_ACCESS_SHA256 = "fd74bdd901857b89f5737e5352a2a8a2d1f000aa4bed4aee47c95afaa37d0f99";

    async function computeSHA256Hex(plainText) {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    async function verifyStudentAccess() {
      const rawInput = document.getElementById("studentCodeInput").value.trim();
      const errorEl = document.getElementById("studentGateError");
      const hashedInput = await computeSHA256Hex(rawInput);

      if (hashedInput === STUDENT_ACCESS_SHA256) {
        errorEl.style.display = "none";
        document.getElementById("studentAccessGate").style.display = "none";
        document.getElementById("unlockedAssessmentArea").style.display = "block";

        // Check if this learner/device already completed and synced the single-attempt assessment to DataBase
        const lockedRecordRaw = localStorage.getItem("dlp6_single_attempt_synced_record");
        if (lockedRecordRaw) {
          restoreSingleAttemptLockedState(JSON.parse(lockedRecordRaw));
        } else {
          // Ensure freshly randomized session is rendered if not yet locked
          if (!activeQuizSession || activeQuizSession.length === 0) {
            renderQuiz20();
          }
          updateLessonProgress(90, "Assessment Unlocked");
        }
      } else {
        errorEl.style.display = "block";
      }
    }

    async function verifyDevAccess() {
      const rawInput = document.getElementById("devCodeInput").value.trim();
      const errorEl = document.getElementById("devGateError");
      const hashedInput = await computeSHA256Hex(rawInput);

      if (hashedInput === DEVELOPER_ACCESS_SHA256) {
        errorEl.style.display = "none";
        document.getElementById("devAccessGate").style.display = "none";
        document.getElementById("unlockedDevArea").style.display = "block";
        document.getElementById("gasWebAppUrlInput").value = getActiveGasWebAppUrl();
      } else {
        errorEl.style.display = "block";
      }
    }

    function saveGasUrl() {
      const urlVal = document.getElementById("gasWebAppUrlInput").value.trim();
      localStorage.setItem("dlp6_gas_webapp_url", urlVal || DEFAULT_GAS_WEBAPP_URL);
      const msg = document.getElementById("gasUrlSavedMsg");
      msg.style.display = "block";
      setTimeout(() => { msg.style.display = "none"; }, 4000);
    }

    /* -------------------------------------------------------------------------
       7. RANDOMIZED 20-ITEM MASTERY ASSESSMENT ENGINE & ALIGNED ANSWER KEYS
       - Randomizes question order within each part AND shuffles Multiple Choice /
         Matching options on every page reload while keeping answer keys aligned.
       - Does NOT reveal answers or rationales on the questionnaire after submit.
       - Enforces single-attempt lock once successfully submitted to Google Sheets.
       ------------------------------------------------------------------------- */
    const baseQuiz20Bank = [
      // Part I: Multiple Choice (10 Items)
      {
        uid: "mc1", type: "mc",
        prompt: "A local shoe brand promises 'waterproof all-weather durability' in its ads, but procurement buys low-grade synthetic glue to cut costs, causing soles to detach. Which 4Ms–7 Ps misalignment occurred?",
        choices: [
          { text: "Manpower – People", isCorrect: false },
          { text: "Machine – Place", isCorrect: false },
          { text: "Material – Product", isCorrect: true },
          { text: "Method – Price", isCorrect: false }
        ]
      },
      {
        uid: "mc2", type: "mc",
        prompt: "Which element of the 7 Ps is the ONLY component that directly generates revenue rather than incurring operational costs?",
        choices: [
          { text: "Price", isCorrect: true },
          { text: "Promotion", isCorrect: false },
          { text: "Physical Evidence", isCorrect: false },
          { text: "Process", isCorrect: false }
        ]
      },
      {
        uid: "mc3", type: "mc",
        prompt: "A software startup advertises 'instant 3-minute account verification,' but customers wait 48 hours because staff manually review IDs on outdated computers. Which pair of 4Ms must be upgraded to fix the 'Process' P?",
        choices: [
          { text: "Material & Manpower", isCorrect: false },
          { text: "Material & Machine", isCorrect: false },
          { text: "Manpower & Material", isCorrect: false },
          { text: "Method & Machine", isCorrect: true }
        ]
      },
      {
        uid: "mc4", type: "mc",
        prompt: "During an Inside-Out Audit, a bakery calculates raw material scrap rates, supplier lead times, and storage carrying costs. Which 'M' of production is being evaluated?",
        choices: [
          { text: "Machine", isCorrect: false },
          { text: "Material", isCorrect: true },
          { text: "Method", isCorrect: false },
          { text: "Manpower", isCorrect: false }
        ]
      },
      {
        uid: "mc5", type: "mc",
        prompt: "Why did the traditional 4 Ps Marketing Mix expand into the 7 Ps?",
        choices: [
          { text: "To eliminate the need for production management", isCorrect: false },
          { text: "To focus solely on factory machinery", isCorrect: false },
          { text: "To account for service economies, human touchpoints, customer experience, and tangible quality cues", isCorrect: true },
          { text: "To replace financial accounting", isCorrect: false }
        ]
      },
      {
        uid: "mc6", type: "mc",
        prompt: "Which production methodology under 'Method' focuses systematically on eliminating waste in workflows?",
        choices: [
          { text: "Price Skimming", isCorrect: false },
          { text: "Lean Manufacturing", isCorrect: true },
          { text: "Penetration Pricing", isCorrect: false },
          { text: "Omnichannel Retail", isCorrect: false }
        ]
      },
      {
        uid: "mc7", type: "mc",
        prompt: "Overall Equipment Effectiveness (OEE), machine downtime, and capacity utilization are primary analytical metrics for which pillar of the 4Ms?",
        choices: [
          { text: "Manpower", isCorrect: false },
          { text: "Material", isCorrect: false },
          { text: "Machine", isCorrect: true },
          { text: "Method", isCorrect: false }
        ]
      },
      {
        uid: "mc8", type: "mc",
        prompt: "Which pricing strategy involves setting a low initial price to quickly capture market share?",
        choices: [
          { text: "Price Skimming", isCorrect: false },
          { text: "Value-Based Pricing", isCorrect: false },
          { text: "Penetration Pricing", isCorrect: true },
          { text: "Cost-Plus Pricing", isCorrect: false }
        ]
      },
      {
        uid: "mc9", type: "mc",
        prompt: "In the 'Cebu Cravings Bakehouse' case, customers waited 3 hours for their online orders to arrive. Which element of the 7 Ps failed?",
        choices: [
          { text: "Process", isCorrect: true },
          { text: "Promotion", isCorrect: false },
          { text: "Price", isCorrect: false },
          { text: "Product", isCorrect: false }
        ]
      },
      {
        uid: "mc10", type: "mc",
        prompt: "Clean retail store architecture, intuitive mobile app UI/UX, professional packaging, and verified customer reviews belong to which 'P'?",
        choices: [
          { text: "Place", isCorrect: false },
          { text: "People", isCorrect: false },
          { text: "Promotion", isCorrect: false },
          { text: "Physical Evidence", isCorrect: true }
        ]
      },

      // Part II: Matching Type (5 Items)
      {
        uid: "m1", type: "match",
        prompt: "Match Operational Dependency: Manpower (4Ms) ↔ Marketing Mix (7 Ps)",
        matchKey: "DEP_PEOPLE"
      },
      {
        uid: "m2", type: "match",
        prompt: "Match Operational Dependency: Material & Machine (4Ms) ↔ Marketing Mix (7 Ps)",
        matchKey: "DEP_PROD_PHYS"
      },
      {
        uid: "m3", type: "match",
        prompt: "Match Operational Dependency: Method & Material (4Ms) ↔ Fulfillment & Distribution",
        matchKey: "DEP_PLACE"
      },
      {
        uid: "m4", type: "match",
        prompt: "Match Inventory Strategy: Just-in-Time (JIT) Inventory System",
        matchKey: "DEP_JIT"
      },
      {
        uid: "m5", type: "match",
        prompt: "Match Audit Sequence: Step 1 Inside-Out Audit vs. Step 2 Outside-In Audit",
        matchKey: "DEP_AUDIT"
      },

      // Part III: True or False (5 Items)
      {
        uid: "tf1", type: "tf",
        prompt: "In service-based businesses, the frontline employee (People) effectively functions as part of the product experience.",
        answer: "TRUE"
      },
      {
        uid: "tf2", type: "tf",
        prompt: "Overstocking raw materials reduces risk with zero financial downside because working capital is unaffected.",
        answer: "FALSE"
      },
      {
        uid: "tf3", type: "tf",
        prompt: "A viral Promotion that spikes demand by 300% can ruin brand trust if Machine capacity and Manpower cannot fulfill orders on time.",
        answer: "TRUE"
      },
      {
        uid: "tf4", type: "tf",
        prompt: "'Method' in the 4Ms looks at external customer checkout friction, while 'Process' in the 7 Ps looks strictly at internal factory floor efficiency.",
        answer: "FALSE"
      },
      {
        uid: "tf5", type: "tf",
        prompt: "Expanded lean manufacturing models sometimes add Measurement and Mother Nature/Environment to the 4Ms to form the '6Ms'.",
        answer: "TRUE"
      }
    ];

    const baseMatchingOptionsBank = [
      { key: "DEP_PLACE", text: "Enables multi-warehouse Place distribution and prevents stockouts" },
      { key: "DEP_PEOPLE", text: "Directly powers frontline People and customer service touchpoints" },
      { key: "DEP_JIT", text: "Minimizes warehouse storage costs using hyper-reliable suppliers" },
      { key: "DEP_PROD_PHYS", text: "Determines Product durability and Physical Evidence packaging quality" },
      { key: "DEP_AUDIT", text: "Evaluates internal 4Ms bottlenecks first, then external 7 Ps customer acquisition/retention" }
    ];

    // Cryptographically-seeded / Fisher-Yates Unbiased Array Shuffle on every page load
    function shuffleArray(sourceArr) {
      const arr = sourceArr.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        let randomFloat = Math.random();
        if (window.crypto && window.crypto.getRandomValues) {
          const randBuf = new Uint32Array(1);
          window.crypto.getRandomValues(randBuf);
          randomFloat = randBuf[0] / (0xffffffff + 1);
        }
        const j = Math.floor(randomFloat * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // Active randomized session state (regenerated automatically on every page reload / reset unless locked)
    let activeQuizSession = [];
    let activeMatchingLetters = {};
    let lastQuizResult = null;
    let isAssessmentLockedOnce = false;

    function buildRandomizedQuizSession() {
      const letters = ["A", "B", "C", "D"];
      const matchLetters = ["A", "B", "C", "D", "E"];

      // 1. Shuffle questions within each part
      const mcItems = shuffleArray(baseQuiz20Bank.filter(q => q.type === "mc"));
      const matchItems = shuffleArray(baseQuiz20Bank.filter(q => q.type === "match"));
      const tfItems = shuffleArray(baseQuiz20Bank.filter(q => q.type === "tf"));

      // 2. Shuffle matching reference options and assign letters A–E dynamically
      const shuffledMatchPool = shuffleArray(baseMatchingOptionsBank);
      activeMatchingLetters = {};
      const renderedMatchPool = shuffledMatchPool.map((opt, idx) => {
        const assignedLetter = matchLetters[idx];
        activeMatchingLetters[opt.key] = {
          letter: assignedLetter,
          text: opt.text
        };
        return {
          letter: assignedLetter,
          key: opt.key,
          text: opt.text
        };
      });

      // 3. Combine into 20 sequentially numbered items with aligned internal answer keys
      const combined = [...mcItems, ...matchItems, ...tfItems];
      activeQuizSession = combined.map((item, index) => {
        const displayNum = index + 1;

        if (item.type === "mc") {
          const shuffledChoices = shuffleArray(item.choices);
          const mappedOptions = {};
          let alignedCorrectLetter = "A";

          shuffledChoices.forEach((choiceObj, cIdx) => {
            const letter = letters[cIdx];
            mappedOptions[letter] = choiceObj.text;
            if (choiceObj.isCorrect) {
              alignedCorrectLetter = letter;
            }
          });

          return {
            displayNum,
            uid: item.uid,
            type: "mc",
            q: `${displayNum}. ${item.prompt}`,
            options: mappedOptions,
            answer: alignedCorrectLetter
          };
        } else if (item.type === "match") {
          const alignedMatch = activeMatchingLetters[item.matchKey];
          return {
            displayNum,
            uid: item.uid,
            type: "match",
            q: `${displayNum}. ${item.prompt}`,
            answer: alignedMatch.letter
          };
        } else {
          return {
            displayNum,
            uid: item.uid,
            type: "tf",
            q: `${displayNum}. ${item.prompt}`,
            answer: item.answer
          };
        }
      });

      return renderedMatchPool;
    }

    function renderQuiz20() {
      if (isAssessmentLockedOnce || localStorage.getItem("dlp6_single_attempt_synced_record")) return;

      const renderedMatchPool = buildRandomizedQuizSession();
      const container = document.getElementById("quiz20Container");
      let html = `<div class="quiz-part-header">Part I: Multiple Choice (Items 1–10)</div>`;

      activeQuizSession.forEach(item => {
        if (item.displayNum === 11) {
          html += `
            <div class="quiz-part-header">Part II: Matching Type — 4Ms &amp; 7 Ps Operational Synergy (Items 11–15)</div>
            <div class="standards-block" style="margin-bottom: 14px; font-size: 0.88rem;">
              <strong>Shuffled Matching Choices Reference (A–E):</strong>
              <ul style="margin-left: 18px; margin-top: 6px;">
                ${renderedMatchPool.map(m => `<li><strong>Option ${m.letter}:</strong> ${m.text}</li>`).join("")}
              </ul>
            </div>
          `;
        }
        if (item.displayNum === 16) {
          html += `<div class="quiz-part-header">Part III: True or False (Items 16–20)</div>`;
        }

        if (item.type === "mc") {
          html += `
            <div class="quiz-card" id="q20Card${item.displayNum}">
              <div class="quiz-question-text">${item.q}</div>
              <div class="quiz-options">
                ${Object.entries(item.options).map(([k, v]) => `
                  <label class="quiz-option-label"><input type="radio" name="q20_${item.displayNum}" value="${k}" /> <span><strong>${k}.</strong> ${v}</span></label>
                `).join("")}
              </div>
            </div>
          `;
        } else if (item.type === "match") {
          html += `
            <div class="quiz-card" id="q20Card${item.displayNum}">
              <div class="quiz-question-text">${item.q}</div>
              <select id="match20_${item.displayNum}" class="matching-select">
                <option value="">-- Select Matching Option (A–E) --</option>
                ${renderedMatchPool.map(m => `<option value="${m.letter}">Option ${m.letter} — ${m.text}</option>`).join("")}
              </select>
            </div>
          `;
        } else if (item.type === "tf") {
          html += `
            <div class="quiz-card" id="q20Card${item.displayNum}">
              <div class="quiz-question-text">${item.q}</div>
              <div class="quiz-options" style="flex-direction: row; flex-wrap: wrap;">
                <label class="quiz-option-label"><input type="radio" name="q20_${item.displayNum}" value="TRUE" /> <strong>TRUE</strong></label>
                <label class="quiz-option-label"><input type="radio" name="q20_${item.displayNum}" value="FALSE" /> <strong>FALSE</strong></label>
              </div>
            </div>
          `;
        }
      });

      container.innerHTML = html;
    }

    function lockAssessmentInputsPermanently() {
      isAssessmentLockedOnce = true;

      // Disable student identification fields & all questionnaire inputs so answers cannot be altered or retaken
      document.getElementById("stuFullName").readOnly = true;
      document.getElementById("stuGradeLevel").readOnly = true;
      document.getElementById("stuSection").readOnly = true;

      document.querySelectorAll("#quizForm20 input[type='radio'], #quizForm20 select").forEach(el => {
        el.disabled = true;
      });

      const submitBtn = document.getElementById("submitQuiz20Btn");
      const resetBtn = document.getElementById("resetQuiz20Btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "🔒 Submitted & Synced (Single Attempt Completed)";
      resetBtn.disabled = true;
      resetBtn.style.display = "none";
    }

    function restoreSingleAttemptLockedState(savedPayload) {
      lastQuizResult = savedPayload;
      isAssessmentLockedOnce = true;

      document.getElementById("stuFullName").value = savedPayload.studentName || "";
      document.getElementById("stuGradeLevel").value = savedPayload.gradeLevel || "Grade 12";
      document.getElementById("stuSection").value = savedPayload.section || "";

      document.getElementById("stuFullName").readOnly = true;
      document.getElementById("stuGradeLevel").readOnly = true;
      document.getElementById("stuSection").readOnly = true;

      const lockBanner = document.getElementById("singleAttemptLockBanner");
      lockBanner.style.display = "block";
      document.getElementById("singleAttemptSummaryText").innerHTML = `
        <strong>Student:</strong> ${savedPayload.studentName} (${savedPayload.gradeLevel} - ${savedPayload.section}) |
        <strong>Recorded Score:</strong> ${savedPayload.score}/${savedPayload.totalItems} (${savedPayload.percentage}) |
        <strong>Date:</strong> ${savedPayload.completedDate}.<br />
        This assessment has already been officially submitted and synchronized to Database. Multiple attempts are locked, and answer keys are hidden for test security.
      `;

      document.getElementById("quiz20Container").innerHTML = `
        <div class="standards-block" style="border-left-color: var(--navy-primary); margin-top: 10px;">
          <h3>🔒 Questionnaire Closed After Official Database Submission</h3>
          <p style="font-size: 0.92rem;">
            Your 20-item assessment has been completed in a single official session. For academic integrity, the questionnaire items and answer keys are no longer accessible.
          </p>
        </div>
      `;

      const submitBtn = document.getElementById("submitQuiz20Btn");
      const resetBtn = document.getElementById("resetQuiz20Btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "🔒 Submitted & Synced (Single Attempt Completed)";
      resetBtn.disabled = true;
      resetBtn.style.display = "none";

      const banner = document.getElementById("scoreBanner");
      banner.style.display = "inline-block";
      banner.textContent = `Official Recorded Score: ${savedPayload.score}/${savedPayload.totalItems} (${savedPayload.percentage}) — ${savedPayload.passed ? "🌟 Passed!" : "📘 Recorded (75% required for Badge & Certificate)"}`;

      const syncBox = document.getElementById("syncStatusBox");
      syncBox.style.display = "block";
      syncBox.className = "sync-status sync-success";
      syncBox.innerHTML = `✅ <strong>Officially Synced to Database:</strong> Single-attempt submission verified for <strong>${savedPayload.studentName}</strong>.`;

      if (savedPayload.passed) {
        const checklistBox = document.getElementById("claimChecklistBox");
        checklistBox.style.display = "block";
        evaluateClaimChecklist();
      }

      updateLessonProgress(100, "Official Assessment Completed & Locked");
    }

    async function gradeAndSyncQuiz20() {
      if (isAssessmentLockedOnce || localStorage.getItem("dlp6_single_attempt_synced_record")) {
        alert("You have already completed and submitted this assessment to Database. Only one official attempt is allowed.");
        return;
      }

      const studentName = document.getElementById("stuFullName").value.trim();
      const gradeLevel = document.getElementById("stuGradeLevel").value.trim();
      const section = document.getElementById("stuSection").value.trim();

      if (!studentName || !gradeLevel || !section) {
        alert("Please enter your Full Name, Grade Level, and Section before submitting the assessment.");
        document.getElementById("stuFullName").focus();
        return;
      }

      let score = 0;
      const totalItems = activeQuizSession.length;

      // Grade silently WITHOUT revealing correct answers or rationales on the questionnaire
      activeQuizSession.forEach(item => {
        if (item.type === "mc" || item.type === "tf") {
          const radios = document.querySelectorAll(`input[name="q20_${item.displayNum}"]`);
          radios.forEach(radio => {
            const lbl = radio.parentElement;
            lbl.classList.remove("submitted-choice");
            if (radio.checked) {
              lbl.classList.add("submitted-choice");
              if (radio.value === item.answer) {
                score++;
              }
            }
          });
        } else if (item.type === "match") {
          const sel = document.getElementById(`match20_${item.displayNum}`);
          if (sel.value === item.answer) {
            score++;
          }
        }
      });

      const percentage = Math.round((score / totalItems) * 100);
      const passed = percentage >= 75;
      const statusText = passed ? "Passed (Mastery Achieved)" : "Needs Remediation";
      const completedDate = new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      lastQuizResult = {
        studentName,
        gradeLevel,
        section,
        score,
        totalItems,
        percentage: `${percentage}%`,
        numericPercentage: percentage,
        passed,
        status: statusText,
        completedDate
      };

      const banner = document.getElementById("scoreBanner");
      banner.style.display = "inline-block";
      banner.textContent = `Result: ${score}/${totalItems} (${percentage}%) — ${passed ? "🌟 Passed! Complete the checklist below to claim your Badge & Certificate!" : "📘 Submitted (75% passing score required to claim Badge & Certificate)"}`;

      updateLessonProgress(100, "Lesson & Assessment Completed!");

      // Show Pre-Claim Checklist ONLY if learner passed (>= 75%)
      const checklistBox = document.getElementById("claimChecklistBox");
      if (passed) {
        checklistBox.style.display = "block";
        document.querySelectorAll(".claim-chk").forEach(cb => (cb.checked = false));
        evaluateClaimChecklist();
      } else {
        checklistBox.style.display = "none";
      }

      // Synchronize with Embedded Google Apps Script Web App (/exec) & enforce single-attempt lock upon successful submission
      await syncToGoogleSheets(lastQuizResult);
    }

    function evaluateClaimChecklist() {
      const checkboxes = Array.from(document.querySelectorAll(".claim-chk"));
      const allChecked = checkboxes.length > 0 && checkboxes.every(cb => cb.checked);
      const claimBtn = document.getElementById("claimCertBtn");
      const hintText = document.getElementById("checklistHintText");

      if (allChecked && lastQuizResult && lastQuizResult.passed) {
        claimBtn.disabled = false;
        hintText.style.color = "#1e7e34";
        hintText.textContent = "✓ All 4 checklist items verified! Your Badge & Certificate are ready.";
      } else {
        claimBtn.disabled = true;
        hintText.style.color = "#8a5a00";
        hintText.textContent = "Check all 4 items above to unlock your Badge & Certificate.";
      }
    }

    async function syncToGoogleSheets(payload) {
      const syncBox = document.getElementById("syncStatusBox");
      const webAppUrl = getActiveGasWebAppUrl();

      syncBox.style.display = "block";
      syncBox.className = "sync-status sync-warn";

      if (!webAppUrl) {
        syncBox.innerHTML = `ℹ️ <strong>Local Record Saved (Google Sheets URL Not Configured):</strong> Assessment result for <strong>${payload.studentName}</strong> (${payload.gradeLevel} - ${payload.section}: ${payload.score}/${payload.totalItems}) is recorded locally. <em>(Single-attempt lock activates automatically once a Google Sheets Web App URL is configured and synced.)</em>`;
        return;
      }

      // Temporarily disable submit button during network transmission to prevent duplicate clicks
      const submitBtn = document.getElementById("submitQuiz20Btn");
      submitBtn.disabled = true;
      syncBox.innerHTML = `⏳ Synchronizing assessment result for <strong>${payload.studentName}</strong> to Google Sheets...`;

      try {
        await fetch(webAppUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });

        // Successfully submitted to Google Sheets -> Persist single-attempt lock & disable retakes permanently
        localStorage.setItem("dlp6_single_attempt_synced_record", JSON.stringify(payload));
        lockAssessmentInputsPermanently();

        const lockBanner = document.getElementById("singleAttemptLockBanner");
        lockBanner.style.display = "block";
        document.getElementById("singleAttemptSummaryText").innerHTML = `
          <strong>Student:</strong> ${payload.studentName} (${payload.gradeLevel} - ${payload.section}) |
          <strong>Official Score:</strong> ${payload.score}/${payload.totalItems} (${payload.percentage}) |
          <strong>Date:</strong> ${payload.completedDate}.<br />
          Your response has been successfully submitted to Google Sheets. This assessment can only be taken once and is now locked.
        `;

        syncBox.className = "sync-status sync-success";
        syncBox.innerHTML = `✅ <strong>Successfully Synced to Google Sheets!</strong> Student: <strong>${payload.studentName}</strong> | Grade &amp; Section: <strong>${payload.gradeLevel} - ${payload.section}</strong> | Score: <strong>${payload.score}/${payload.totalItems} (${payload.percentage})</strong>. Assessment is now locked (single attempt completed).`;
      } catch (err) {
        submitBtn.disabled = false;
        syncBox.className = "sync-status sync-warn";
        syncBox.innerHTML = `⚠️ <strong>Sync Interrupted:</strong> Could not reach Google Sheets endpoint right now (${err.message}). Please check your internet connection and click Submit again to complete your official Google Sheets sync.`;
      }
    }

    function resetQuiz20() {
      if (isAssessmentLockedOnce || localStorage.getItem("dlp6_single_attempt_synced_record")) {
        alert("This assessment has already been submitted to Google Sheets and cannot be reset or retaken.");
        return;
      }
      document.getElementById("scoreBanner").style.display = "none";
      document.getElementById("syncStatusBox").style.display = "none";
      document.getElementById("claimChecklistBox").style.display = "none";
      document.getElementById("claimCertBtn").disabled = true;
      lastQuizResult = null;
      renderQuiz20();
    }

    /* -------------------------------------------------------------------------
       8. ENCLOSURE A: STUDENT ASSIGNMENT WORKSHEET LOCALSTORAGE AUTO-SAVE
       Automatically saves and restores student draft responses across reloads.
       ------------------------------------------------------------------------- */
    const WORKSHEET_STORAGE_KEY = "dlp6_enclosure_a_worksheet_draft";

    function saveWorksheetDraft() {
      const draftData = {
        studentInfo: document.getElementById("ws_student_info").value,
        businessObserved: document.getElementById("ws_business_observed").value,
        fourMs: document.getElementById("ws_four_ms").value,
        sevenPs: document.getElementById("ws_seven_ps").value,
        recommendation: document.getElementById("ws_recommendation").value,
        updatedAt: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      };
      localStorage.setItem(WORKSHEET_STORAGE_KEY, JSON.stringify(draftData));
      const statusEl = document.getElementById("wsSaveStatusText");
      if (statusEl) {
        statusEl.textContent = `💾 Draft auto-saved at ${draftData.updatedAt}`;
      }
    }

    function loadWorksheetDraft() {
      const rawDraft = localStorage.getItem(WORKSHEET_STORAGE_KEY);
      if (!rawDraft) return;
      try {
        const draftData = JSON.parse(rawDraft);
        document.getElementById("ws_student_info").value = draftData.studentInfo || "";
        document.getElementById("ws_business_observed").value = draftData.businessObserved || "";
        document.getElementById("ws_four_ms").value = draftData.fourMs || "";
        document.getElementById("ws_seven_ps").value = draftData.sevenPs || "";
        document.getElementById("ws_recommendation").value = draftData.recommendation || "";
        const statusEl = document.getElementById("wsSaveStatusText");
        if (statusEl && draftData.updatedAt) {
          statusEl.textContent = `💾 Restored saved draft (last saved ${draftData.updatedAt})`;
        }
      } catch (e) {
        // Ignore malformed local draft data
      }
    }

    function clearWorksheetDraft() {
      if (!confirm("Clear your saved Enclosure A assignment worksheet draft?")) return;
      localStorage.removeItem(WORKSHEET_STORAGE_KEY);
      document.getElementById("ws_student_info").value = "";
      document.getElementById("ws_business_observed").value = "";
      document.getElementById("ws_four_ms").value = "";
      document.getElementById("ws_seven_ps").value = "";
      document.getElementById("ws_recommendation").value = "";
      const statusEl = document.getElementById("wsSaveStatusText");
      if (statusEl) {
        statusEl.textContent = "💾 Worksheet draft cleared";
      }
    }

    /* -------------------------------------------------------------------------
       9. GCASH DONATION MODAL, DIGITAL BADGE + PDF CERTIFICATE & COOKIE BANNER
       ------------------------------------------------------------------------- */
    function openGcashModal() {
      document.getElementById("gcashModal").style.display = "flex";
    }

    function closeGcashModal() {
      document.getElementById("gcashModal").style.display = "none";
    }

    function copyGcashNumber() {
      const numText = "0968-7042-059";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(numText);
      }
      const fb = document.getElementById("gcashCopyFeedback");
      fb.style.display = "block";
      setTimeout(() => { fb.style.display = "none"; }, 3000);
    }

    function openCertificateModal() {
      if (!lastQuizResult || !lastQuizResult.passed) return;

      // Refresh student details from inputs in case corrected prior to checklist
      const currentName = document.getElementById("stuFullName").value.trim() || lastQuizResult.studentName;
      const currentGrade = document.getElementById("stuGradeLevel").value.trim() || lastQuizResult.gradeLevel;
      const currentSection = document.getElementById("stuSection").value.trim() || lastQuizResult.section;

      // Determine Badge Distinction Tier based on score percentage
      let badgeTierLabel = "🏅 Official Mastery Badge Unlocked";
      let badgeTitle = "4Ms & 7 Ps Operations Strategist Badge";
      if (lastQuizResult.numericPercentage === 100) {
        badgeTierLabel = "🌟 Platinum Distinction Badge (100% Perfect Score)";
        badgeTitle = "Grand Master Operations & Marketing Architect";
      } else if (lastQuizResult.numericPercentage >= 90) {
        badgeTierLabel = "🥇 Gold Honors Badge (90%–99%)";
        badgeTitle = "Senior Operations & Marketing Mix Strategist";
      }

      document.getElementById("earnedBadgeTier").textContent = badgeTierLabel;
      document.getElementById("earnedBadgeTitle").textContent = badgeTitle;

      document.getElementById("certStudentName").textContent = currentName;
      document.getElementById("certGradeLevel").textContent = currentGrade;
      document.getElementById("certSection").textContent = currentSection;
      document.getElementById("certScoreText").textContent = `${lastQuizResult.score} / ${lastQuizResult.totalItems} (${lastQuizResult.percentage})`;
      document.getElementById("certDateText").textContent = lastQuizResult.completedDate;
      document.getElementById("certDateSig").textContent = lastQuizResult.completedDate;

      const credHash = `DLP6-${currentGrade.replace(/\s+/g, "").toUpperCase()}-${lastQuizResult.score}OF20-${Date.now().toString(36).toUpperCase()}`;
      document.getElementById("certVerificationCode").textContent = `Credential ID: ${credHash} | Badge: ${badgeTitle}`;

      document.getElementById("certModal").style.display = "flex";
    }

    function closeCertificateModal() {
      document.getElementById("certModal").style.display = "none";
    }

    function printCertificate() {
      const originalTitle = document.title;
      const stuName = document.getElementById("certStudentName").textContent.replace(/\s+/g, "_");
      document.title = `Certificate_DLP6_${stuName}`;
      document.body.classList.add("printing-certificate");
      window.print();
      setTimeout(() => {
        document.body.classList.remove("printing-certificate");
        document.title = originalTitle;
      }, 500);
    }

    // Initialization on Webpage Load / Reload:
    // 1. Ensure production /exec Google Apps Script URL is set
    // 2. Restore saved Enclosure A student worksheet draft from localStorage
    // 3. Pre-randomize the 20-item assessment questionnaire immediately upon page reload (or lock if already submitted)
    // 4. Show delayed first-time Cookie Consent Notification
    window.addEventListener("DOMContentLoaded", () => {
      const currentStoredGasUrl = localStorage.getItem("dlp6_gas_webapp_url");
      if (!currentStoredGasUrl || currentStoredGasUrl.includes("/dev")) {
        localStorage.setItem("dlp6_gas_webapp_url", DEFAULT_GAS_WEBAPP_URL);
      }

      // Restore Enclosure A student worksheet draft
      loadWorksheetDraft();

      // Immediately randomize the assessment questionnaire on every webpage reload (unless already locked after Google Sheets submission)
      const lockedRecordRaw = localStorage.getItem("dlp6_single_attempt_synced_record");
      if (lockedRecordRaw) {
        restoreSingleAttemptLockedState(JSON.parse(lockedRecordRaw));
      } else {
        renderQuiz20();
      }

      const consentPref = localStorage.getItem("dlp6_cookie_consent");
      if (!consentPref) {
        setTimeout(() => {
          document.getElementById("cookieConsentBanner").style.display = "flex";
        }, 3000);
      }
    });

    function handleCookieChoice(choice) {
      localStorage.setItem("dlp6_cookie_consent", choice);
      if (choice === "accepted") {
        document.cookie = "dlp6_portal_cache=enabled; max-age=2592000; path=/; SameSite=Lax";
      }
      document.getElementById("cookieConsentBanner").style.display = "none";
    }