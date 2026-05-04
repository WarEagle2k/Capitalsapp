document.addEventListener("DOMContentLoaded", () => {
  const flashStateName = document.getElementById("flash-state-name");
  const flashStateAbbr = document.getElementById("flash-state-abbr");
  const flashOptions = document.getElementById("flash-options");
  const flashFeedback = document.getElementById("flash-feedback");
  const flashNext = document.getElementById("flash-next");
  const flashComplete = document.getElementById("flash-complete");
  const flashCard = document.getElementById("flash-card");
  const flashFinalScore = document.getElementById("flash-final-score");
  const flashRestart = document.getElementById("flash-restart");
  const flashCorrect = document.getElementById("flash-correct");
  const flashIncorrect = document.getElementById("flash-incorrect");
  const flashRemaining = document.getElementById("flash-remaining");

  let states = [];
  let missed = [];
  let currentIndex = 0;
  let correctNum = 0;
  let incorrectNum = 0;
  let inReview = false;

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const allCapitals = Object.values(STATE_DATA).map(info => info.capital);

  function startGame() {
    states = shuffle(
      Object.entries(STATE_DATA).map(([abbr, info]) => ({
        abbr,
        name: info.name,
        capital: info.capital
      }))
    );
    missed = [];
    currentIndex = 0;
    correctNum = 0;
    incorrectNum = 0;
    inReview = false;
    flashComplete.classList.add("hidden");
    flashCard.classList.remove("hidden");
    updateScoreboard();
    showCard();
  }

  function startReview() {
    states = shuffle(missed);
    missed = [];
    currentIndex = 0;
    inReview = true;
    flashCard.classList.remove("hidden");
    updateScoreboard();
    showCard();
  }

  function updateScoreboard() {
    flashCorrect.textContent = `Correct: ${correctNum}`;
    flashIncorrect.textContent = `Incorrect: ${incorrectNum}`;
    flashRemaining.textContent = `Remaining: ${states.length - currentIndex}`;
  }

  function showCard() {
    const state = states[currentIndex];
    flashStateName.textContent = state.name;
    flashStateAbbr.textContent = inReview ? `(${state.abbr}) — Review` : `(${state.abbr})`;
    flashFeedback.classList.add("hidden");
    flashFeedback.classList.remove("correct", "incorrect");
    flashNext.classList.add("hidden");

    const wrongChoices = shuffle(allCapitals.filter(c => c !== state.capital)).slice(0, 3);
    const options = shuffle([state.capital, ...wrongChoices]);

    flashOptions.innerHTML = "";
    for (const city of options) {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = city;
      btn.addEventListener("click", () => handleAnswer(btn, city, state));
      flashOptions.appendChild(btn);
    }
  }

  function handleAnswer(btn, chosen, state) {
    const buttons = flashOptions.querySelectorAll(".option-btn");
    const isCorrect = chosen === state.capital;

    buttons.forEach(b => {
      b.disabled = true;
      if (b.textContent === state.capital) {
        b.classList.add("correct");
      }
    });

    flashFeedback.classList.remove("hidden", "correct", "incorrect");

    if (isCorrect) {
      correctNum++;
      btn.classList.add("correct");
      flashFeedback.classList.add("correct");
      flashFeedback.textContent = `You're Awesome, Molly! ${state.capital} is correct!`;
    } else {
      incorrectNum++;
      missed.push(state);
      btn.classList.add("incorrect");
      flashFeedback.classList.add("incorrect");
      flashFeedback.textContent = `Not quite. ${state.capital} is the capital of ${state.name}.`;
    }

    updateScoreboard();

    if (currentIndex < states.length - 1) {
      flashNext.classList.remove("hidden");
    } else if (missed.length > 0) {
      flashNext.classList.remove("hidden");
      flashNext.textContent = `Review ${missed.length} Missed`;
    } else {
      setTimeout(showComplete, 1500);
    }
  }

  function showComplete() {
    flashCard.classList.add("hidden");
    flashComplete.classList.remove("hidden");
    if (incorrectNum === 0) {
      flashFinalScore.textContent = "Perfect score! You're Awesome, Molly!";
    } else {
      flashFinalScore.textContent = `You got ${correctNum} out of ${correctNum + incorrectNum} correct!`;
    }
  }

  flashNext.addEventListener("click", () => {
    if (currentIndex >= states.length - 1 && missed.length > 0) {
      flashNext.textContent = "Next";
      startReview();
    } else {
      currentIndex++;
      updateScoreboard();
      showCard();
    }
  });

  const flashStartOver = document.getElementById("flash-startover");
  flashRestart.addEventListener("click", startGame);
  flashStartOver.addEventListener("click", startGame);

  const lastUpdated = document.getElementById("last-updated");
  const modified = new Date(document.lastModified);
  lastUpdated.textContent = "Last updated: " + modified.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"
  });

  startGame();
});
