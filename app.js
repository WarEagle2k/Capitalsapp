document.addEventListener("DOMContentLoaded", () => {
  const svg = document.getElementById("us-map");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalStateName = document.getElementById("modal-state-name");
  const capitalInput = document.getElementById("capital-input");
  const capitalForm = document.getElementById("capital-form");
  const cancelBtn = document.getElementById("cancel-btn");
  const modalFeedback = document.getElementById("modal-feedback");
  const correctCount = document.getElementById("correct-count");
  const incorrectCount = document.getElementById("incorrect-count");
  const remainingCount = document.getElementById("remaining-count");
  const resetBtn = document.getElementById("reset-btn");
  const completionBanner = document.getElementById("completion-banner");
  const completionMessage = document.getElementById("completion-message");
  const completionResetBtn = document.getElementById("completion-reset-btn");

  const tooltip = document.getElementById("tooltip");

  let currentState = null;
  let results = {}; // { stateAbbr: "correct" | "incorrect" }

  function buildMap() {
    svg.innerHTML = "";

    // Draw state paths
    for (const [abbr, pathData] of Object.entries(STATE_PATHS)) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("id", `state-${abbr}`);
      path.dataset.state = abbr;
      path.addEventListener("click", () => onStateClick(abbr));
      path.addEventListener("mouseenter", () => showTooltip(abbr));
      path.addEventListener("mousemove", (e) => moveTooltip(e));
      path.addEventListener("mouseleave", hideTooltip);
      svg.appendChild(path);
    }

    // Draw state labels centered on each state path
    for (const abbr of Object.keys(STATE_PATHS)) {
      const path = document.getElementById(`state-${abbr}`);
      if (!path) continue;
      const bbox = path.getBBox();
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", bbox.x + bbox.width / 2);
      text.setAttribute("y", bbox.y + bbox.height / 2);
      text.textContent = abbr;
      svg.appendChild(text);
    }

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
  }

  function updateScoreboard() {
    const correctNum = Object.values(results).filter(r => r === "correct").length;
    const incorrectNum = Object.values(results).filter(r => r === "incorrect").length;
    const remainingNum = 50 - correctNum - incorrectNum;

    correctCount.textContent = `Correct: ${correctNum}`;
    incorrectCount.textContent = `Incorrect: ${incorrectNum}`;
    remainingCount.textContent = `Remaining: ${remainingNum}`;

    if (remainingNum === 0) {
      showCompletion(correctNum, incorrectNum);
    }
  }

  function showCompletion(correct, incorrect) {
    completionMessage.textContent = `You got ${correct} out of 50 correct!`;
    completionBanner.classList.remove("hidden");
  }

  function showTooltip(abbr) {
    const stateInfo = STATE_DATA[abbr];
    if (stateInfo) {
      tooltip.textContent = stateInfo.name;
      tooltip.classList.remove("hidden");
    }
  }

  function moveTooltip(e) {
    tooltip.style.left = e.clientX + 14 + "px";
    tooltip.style.top = e.clientY + 14 + "px";
  }

  function hideTooltip() {
    tooltip.classList.add("hidden");
  }

  function onStateClick(abbr) {
    if (results[abbr]) return; // already answered

    currentState = abbr;
    const stateInfo = STATE_DATA[abbr];
    modalStateName.textContent = stateInfo.name;
    capitalInput.value = "";
    modalFeedback.classList.add("hidden");
    modalFeedback.classList.remove("correct", "incorrect");
    modalOverlay.classList.remove("hidden");

    // Re-enable form for new attempt
    capitalInput.disabled = false;
    document.getElementById("submit-btn").style.display = "";
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

    results[currentState] = isCorrect ? "correct" : "incorrect";

    // Show feedback
    modalFeedback.classList.remove("hidden", "correct", "incorrect");
    if (isCorrect) {
      modalFeedback.classList.add("correct");
      modalFeedback.textContent = `Correct! ${stateInfo.capital} is the capital of ${stateInfo.name}.`;
    } else {
      modalFeedback.classList.add("incorrect");
      modalFeedback.textContent = `Incorrect. The capital of ${stateInfo.name} is ${stateInfo.capital}.`;
    }

    // Disable further input
    capitalInput.disabled = true;
    document.getElementById("submit-btn").style.display = "none";
    cancelBtn.textContent = "Close";

    applyResults();
  });

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
    buildMap();
  }

  resetBtn.addEventListener("click", resetQuiz);
  completionResetBtn.addEventListener("click", resetQuiz);

  // Initialize
  buildMap();
});
