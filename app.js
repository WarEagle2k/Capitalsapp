document.addEventListener("DOMContentLoaded", () => {
  const svg = document.getElementById("us-map");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalStateName = document.getElementById("modal-state-name");
  const capitalInput = document.getElementById("capital-input");
  const capitalForm = document.getElementById("capital-form");
  const submitBtn = document.getElementById("submit-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const modalFeedback = document.getElementById("modal-feedback");
  const correctCount = document.getElementById("correct-count");
  const incorrectCount = document.getElementById("incorrect-count");
  const remainingCount = document.getElementById("remaining-count");
  const resetBtn = document.getElementById("reset-btn");
  const completionBanner = document.getElementById("completion-banner");
  const completionMessage = document.getElementById("completion-message");
  const completionResetBtn = document.getElementById("completion-reset-btn");
  const summaryList = document.getElementById("summary-list");
  const summaryEmpty = document.getElementById("summary-empty");
  const masterResetBtn = document.getElementById("master-reset-btn");

  const STORAGE_KEY = "molly-quiz-results";
  const HISTORY_KEY = "molly-quiz-history";

  const totalStates = Object.keys(STATE_PATHS).length;
  let currentState = null;
  let attempts = 0;
  let results = {};
  let history = {};
  let tooltipGroup, tooltipRect, tooltipText;

  function loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) results = JSON.parse(saved);
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) history = JSON.parse(savedHistory);
    } catch (e) {
      results = {};
      history = {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }

  function buildMap() {
    svg.innerHTML = "";

    for (const [abbr, pathData] of Object.entries(STATE_PATHS)) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("id", `state-${abbr}`);
      path.dataset.state = abbr;
      path.addEventListener("click", () => onStateClick(abbr));
      path.addEventListener("mouseenter", () => showTooltip(abbr));
      path.addEventListener("mouseleave", hideTooltip);
      path.addEventListener("touchstart", () => showTooltip(abbr), { passive: true });
      svg.appendChild(path);
    }

    for (const abbr of Object.keys(STATE_PATHS)) {
      const label = STATE_LABELS[abbr];
      if (!label) continue;
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", label.x);
      text.setAttribute("y", label.y);
      text.textContent = abbr;
      svg.appendChild(text);
    }

    tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tooltipGroup.setAttribute("id", "svg-tooltip");
    tooltipGroup.setAttribute("pointer-events", "none");
    tooltipGroup.style.display = "none";

    tooltipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tooltipRect.setAttribute("rx", "3");
    tooltipRect.setAttribute("fill", "rgba(30, 30, 60, 0.95)");
    tooltipRect.setAttribute("stroke", "#5555aa");
    tooltipRect.setAttribute("stroke-width", "1");

    tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tooltipText.setAttribute("fill", "#e0e0ff");
    tooltipText.setAttribute("font-size", "11");
    tooltipText.setAttribute("font-weight", "600");
    tooltipText.setAttribute("text-anchor", "middle");
    tooltipText.setAttribute("dominant-baseline", "central");
    tooltipText.setAttribute("font-family", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

    tooltipGroup.appendChild(tooltipRect);
    tooltipGroup.appendChild(tooltipText);
    svg.appendChild(tooltipGroup);

    applyResults();
  }

  function applyResults() {
    for (const [abbr, result] of Object.entries(results)) {
      const path = document.getElementById(`state-${abbr}`);
      if (path) {
        path.classList.remove("correct", "incorrect");
        path.classList.add(result, "answered");
      }
    }
    updateScoreboard();
    renderSummary();
  }

  function updateScoreboard() {
    let correctNum = 0, incorrectNum = 0;
    for (const r of Object.values(results)) {
      if (r === "correct") correctNum++;
      else incorrectNum++;
    }
    const remainingNum = totalStates - correctNum - incorrectNum;

    correctCount.textContent = `Correct: ${correctNum}`;
    incorrectCount.textContent = `Incorrect: ${incorrectNum}`;
    remainingCount.textContent = `Remaining: ${remainingNum}`;

    if (remainingNum === 0) {
      showCompletion(correctNum);
    }
  }

  function showCompletion(correct) {
    completionMessage.textContent = `You got ${correct} out of ${totalStates} correct!`;
    completionBanner.classList.remove("hidden");
  }

  function showTooltip(abbr) {
    const stateInfo = STATE_DATA[abbr];
    const label = STATE_LABELS[abbr];
    if (!stateInfo || !label) return;

    tooltipText.textContent = stateInfo.name;
    tooltipGroup.style.display = "";

    const tx = label.x;
    const ty = label.y - 16;
    tooltipText.setAttribute("x", tx);
    tooltipText.setAttribute("y", ty);

    const bbox = tooltipText.getBBox();
    const pad = 5;
    tooltipRect.setAttribute("x", bbox.x - pad);
    tooltipRect.setAttribute("y", bbox.y - pad);
    tooltipRect.setAttribute("width", bbox.width + pad * 2);
    tooltipRect.setAttribute("height", bbox.height + pad * 2);
  }

  function hideTooltip() {
    tooltipGroup.style.display = "none";
  }

  function onStateClick(abbr) {
    if (results[abbr]) return;
    hideTooltip();

    currentState = abbr;
    const stateInfo = STATE_DATA[abbr];
    modalStateName.textContent = stateInfo.name;
    attempts = 0;
    capitalInput.value = "";
    modalFeedback.classList.add("hidden");
    modalFeedback.classList.remove("correct", "incorrect");
    modalOverlay.classList.remove("hidden");

    capitalInput.disabled = false;
    submitBtn.style.display = "";
    cancelBtn.textContent = "Cancel";

    setTimeout(() => capitalInput.focus(), 50);
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
    currentState = null;
  }

  function normalizeAnswer(str) {
    return str.trim().toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ");
  }

  capitalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentState) return;

    const stateInfo = STATE_DATA[currentState];
    const userAnswer = normalizeAnswer(capitalInput.value);
    const correctAnswer = normalizeAnswer(stateInfo.capital);
    const isCorrect = userAnswer === correctAnswer;

    attempts++;
    modalFeedback.classList.remove("hidden", "correct", "incorrect");

    if (isCorrect) {
      results[currentState] = "correct";
      modalFeedback.classList.add("correct");
      modalFeedback.textContent = `You're Awesome, Molly! ${stateInfo.capital} is the capital of ${stateInfo.name}.`;
      capitalInput.disabled = true;
      submitBtn.style.display = "none";
      cancelBtn.textContent = "Close";
      saveProgress();
      applyResults();
    } else if (attempts < 2) {
      modalFeedback.classList.add("incorrect");
      modalFeedback.textContent = "Not quite — try again!";
      capitalInput.value = "";
      capitalInput.focus();
    } else {
      results[currentState] = "incorrect";
      history[currentState] = (history[currentState] || 0) + 1;
      modalFeedback.classList.add("incorrect");
      modalFeedback.textContent = `Incorrect. The capital of ${stateInfo.name} is ${stateInfo.capital}.`;
      capitalInput.disabled = true;
      submitBtn.style.display = "none";
      cancelBtn.textContent = "Close";
      saveProgress();
      applyResults();
    }
  });

  function renderSummary() {
    summaryList.innerHTML = "";

    const missed = Object.entries(history)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (missed.length === 0) {
      summaryEmpty.classList.remove("hidden");
      return;
    }

    summaryEmpty.classList.add("hidden");

    for (const [abbr, count] of missed) {
      const stateInfo = STATE_DATA[abbr];
      if (!stateInfo) continue;
      const li = document.createElement("li");
      li.innerHTML = `${stateInfo.name} (${stateInfo.capital})<span class="miss-count">×${count}</span>`;
      summaryList.appendChild(li);
    }
  }

  cancelBtn.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  function resetQuiz() {
    results = {};
    completionBanner.classList.add("hidden");
    svg.querySelectorAll("path").forEach(p => {
      p.classList.remove("correct", "incorrect", "answered");
    });
    saveProgress();
    updateScoreboard();
    renderSummary();
  }

  function masterReset() {
    if (!confirm("This will erase all progress and history. Are you sure?")) return;
    results = {};
    history = {};
    completionBanner.classList.add("hidden");
    svg.querySelectorAll("path").forEach(p => {
      p.classList.remove("correct", "incorrect", "answered");
    });
    saveProgress();
    updateScoreboard();
    renderSummary();
  }

  resetBtn.addEventListener("click", resetQuiz);
  completionResetBtn.addEventListener("click", resetQuiz);
  masterResetBtn.addEventListener("click", masterReset);

  const lastUpdated = document.getElementById("last-updated");
  const modified = new Date(document.lastModified);
  lastUpdated.textContent = "Last updated: " + modified.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"
  });

  loadProgress();
  buildMap();
});
