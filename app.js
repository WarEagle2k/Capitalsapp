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
  const tooltip = document.getElementById("tooltip");

  const totalStates = Object.keys(STATE_PATHS).length;
  let currentState = null;
  let results = {};

  function buildMap() {
    svg.innerHTML = "";

    for (const [abbr, pathData] of Object.entries(STATE_PATHS)) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("id", `state-${abbr}`);
      path.dataset.state = abbr;
      path.addEventListener("click", () => onStateClick(abbr));
      path.addEventListener("mouseenter", () => showTooltip(abbr));
      path.addEventListener("mousemove", moveTooltip);
      path.addEventListener("mouseleave", hideTooltip);
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
    if (results[abbr]) return;

    currentState = abbr;
    const stateInfo = STATE_DATA[abbr];
    modalStateName.textContent = stateInfo.name;
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

    results[currentState] = isCorrect ? "correct" : "incorrect";

    modalFeedback.classList.remove("hidden", "correct", "incorrect");
    if (isCorrect) {
      modalFeedback.classList.add("correct");
      modalFeedback.textContent = `You're Awesome, Molly! ${stateInfo.capital} is the capital of ${stateInfo.name}.`;
    } else {
      modalFeedback.classList.add("incorrect");
      modalFeedback.textContent = `Incorrect. The capital of ${stateInfo.name} is ${stateInfo.capital}.`;
    }

    capitalInput.disabled = true;
    submitBtn.style.display = "none";
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
    svg.querySelectorAll("path").forEach(p => {
      p.classList.remove("correct", "incorrect", "answered");
    });
    updateScoreboard();
  }

  resetBtn.addEventListener("click", resetQuiz);
  completionResetBtn.addEventListener("click", resetQuiz);

  buildMap();
});
