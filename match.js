document.addEventListener("DOMContentLoaded", () => {
  const statesList = document.getElementById("states-list");
  const capitalsList = document.getElementById("capitals-list");
  const checkBtn = document.getElementById("check-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const matchScore = document.getElementById("match-score");

  const STORAGE_KEY = "molly-match-progress";

  const states = Object.entries(STATE_DATA)
    .map(([abbr, info]) => ({ abbr, name: info.name, capital: info.capital }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let shuffledCapitals = [];

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function saveProgress() {
    try {
      const inputs = statesList.querySelectorAll(".match-input");
      const answers = [];
      inputs.forEach(input => answers.push(input.value));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        shuffledCapitals,
        answers
      }));
    } catch (e) {}
  }

  function loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }

  function buildQuiz(savedData) {
    if (savedData) {
      shuffledCapitals = savedData.shuffledCapitals;
    } else {
      shuffledCapitals = shuffle(states.map(s => s.capital));
    }

    statesList.innerHTML = "";
    capitalsList.innerHTML = "";
    matchScore.classList.add("hidden");

    for (let i = 0; i < states.length; i++) {
      const li = document.createElement("li");
      const savedValue = savedData ? (savedData.answers[i] || "") : "";
      li.innerHTML = `<span class="state-name">${states[i].name} <span class="state-abbr">(${states[i].abbr})</span></span><input type="text" class="match-input" maxlength="2" data-index="${i}" inputmode="numeric" value="${savedValue}">`;
      statesList.appendChild(li);
    }

    for (let i = 0; i < shuffledCapitals.length; i++) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="capital-number">${i + 1}.</span><span class="capital-name">${shuffledCapitals[i]}</span>`;
      capitalsList.appendChild(li);
    }

    const inputs = statesList.querySelectorAll(".match-input");
    inputs.forEach((input, idx) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const next = inputs[idx + 1];
          if (next) next.focus();
        }
      });
      input.addEventListener("input", saveProgress);
    });
  }

  function checkAnswers() {
    const inputs = statesList.querySelectorAll(".match-input");
    let correct = 0;

    inputs.forEach((input, idx) => {
      const state = states[idx];
      const userNum = parseInt(input.value, 10);
      const correctCapital = state.capital;
      const userCapital = shuffledCapitals[userNum - 1];

      input.classList.remove("correct", "incorrect");

      if (userCapital && userCapital === correctCapital) {
        input.classList.add("correct");
        correct++;
      } else if (input.value.trim() !== "") {
        input.classList.add("incorrect");
      }
    });

    matchScore.textContent = `${correct} out of ${states.length} correct!`;
    matchScore.classList.remove("hidden");

    if (correct === states.length) {
      matchScore.textContent = "You're Awesome, Molly! Perfect score!";
    }
  }

  checkBtn.addEventListener("click", checkAnswers);
  shuffleBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    buildQuiz(null);
  });

  const lastUpdated = document.getElementById("last-updated");
  const modified = new Date(document.lastModified);
  lastUpdated.textContent = "Last updated: " + modified.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"
  });

  const saved = loadProgress();
  buildQuiz(saved);
});
