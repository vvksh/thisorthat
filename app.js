// Preference Ranker — knockout comparisons with A/B choices

/**
 * App State
 */
const state = {
  items: [],
  comparisonsMade: 0,
  totalComparisons: 0,
  choiceLog: [],
  isAnimating: false,
  champion: null,
  challenger: null,
  bench: [],
  eliminated: [],
};

/** DOM Elements */
const viewInput = document.getElementById("view-input");
const viewQuiz = document.getElementById("view-quiz");
const viewResults = document.getElementById("view-results");

const textarea = document.getElementById("items-text");
const btnStart = document.getElementById("btn-start");
const btnFill = document.getElementById("btn-fill-sample");
const inputError = document.getElementById("input-error");

// Ensure multiline placeholder uses real line breaks (not literal "\n")
textarea.placeholder = "e.g.\nPizza\nSushi\nTacos\nBurgers\nSalad";

const textA = document.getElementById("text-a");
const textB = document.getElementById("text-b");
const cardA = document.getElementById("choice-a");
const cardB = document.getElementById("choice-b");
const btnChooseA = document.getElementById("btn-choose-a");
const btnChooseB = document.getElementById("btn-choose-b");
const btnCancel = document.getElementById("btn-cancel");
const progressFill = document.getElementById("progress-fill");
const compareCount = document.getElementById("compare-count");

const resultsList = document.getElementById("results-list");
const finalCompareCount = document.getElementById("final-compare-count");
const btnRestart = document.getElementById("btn-restart");
const btnDownloadLog = document.getElementById("btn-download-log");
const arena = document.querySelector(".arena");

/** Utilities */
function setView(which) {
  for (const el of [viewInput, viewQuiz, viewResults]) el.classList.remove("active");
  if (which === "input") viewInput.classList.add("active");
  if (which === "quiz") viewQuiz.classList.add("active");
  if (which === "results") viewResults.classList.add("active");
}

function parseItems(text) {
  return text
    .split(/\r?\n/) // split by lines
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((value, index, self) => self.indexOf(value) === index); // dedupe
}

function updateProgress() {
  compareCount.textContent = String(state.comparisonsMade);
  const denom = Math.max(1, state.totalComparisons);
  const pct = Math.min(100, Math.round((state.comparisonsMade / denom) * 100));
  progressFill.style.width = `${pct}%`;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function estimateKnockoutComparisons(n) {
  // Rough upper bound: each item faces about log2(n) matches; keep for progress bar
  if (n <= 1) return 0;
  return Math.max(n - 1, Math.round(n * Math.log2(n) * 0.75));
}

function startConfetti() {
  const root = document.getElementById("confetti-root");
  if (!root) return;
  root.innerHTML = "";
  const pieces = 120;
  for (let idx = 0; idx < pieces; idx++) {
    const piece = document.createElement("div");
    piece.style.position = "absolute";
    const size = 6 + Math.random() * 10;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.borderRadius = `${Math.random() < 0.4 ? 50 : 10}%`;
    const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `-10px`;
    piece.style.opacity = "0.9";
    const duration = 2000 + Math.random() * 2500;
    const translateX = (-50 + Math.random() * 100).toFixed(0);
    piece.animate(
      [
        { transform: `translate(${translateX}px, 0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${translateX}px, 120vh) rotate(${Math.random() * 360}deg)`, opacity: 0.9 },
      ],
      { duration, easing: "cubic-bezier(.2,.8,.2,1)", iterations: 1, fill: "forwards", delay: Math.random() * 400 }
    );
    root.appendChild(piece);
  }
  setTimeout(() => (root.innerHTML = ""), 6000);
}

function applyArenaTransition(exit, enter, next) {
  if (!arena) {
    next();
    return;
  }
  arena.classList.remove("transition-in", "transition-out");
  if (exit) {
    arena.classList.add("transition-out");
    setTimeout(() => {
      arena.classList.remove("transition-out");
      next();
      if (enter) {
        arena.classList.add("transition-in");
        setTimeout(() => arena.classList.remove("transition-in"), 420);
      }
    }, 420);
  } else {
    next();
    if (enter) {
      arena.classList.add("transition-in");
      setTimeout(() => arena.classList.remove("transition-in"), 420);
    }
  }
}

/** Interactive Binary Insertion Logic */
function startKnockout(items) {
  state.items = items.slice();
  state.choiceLog = [];
  state.champion = null;
  state.challenger = null;
  state.eliminated = [];
  state.comparisonsMade = 0;
  state.isAnimating = false;
  state.bench = items.slice();
  shuffle(state.bench);
  // Seed champion with first item
  state.champion = state.bench.shift();
  state.challenger = state.bench.shift() ?? null;
  updateProgress();
  showCurrentMatch();
}

function beginRanking() {}
function advanceToNextItem() {}
function promptNextComparison() {}
function renderPair() {}

function choose(which) {
  if (!(which === "a" || which === "b")) return;
  if (state.isAnimating) return;
  if (!state.champion || !state.challenger) return;
  state.isAnimating = true;

  const winner = which === "a" ? state.champion : state.challenger;
  const loser = which === "a" ? state.challenger : state.champion;

  const chosenCard = which === "a" ? cardA : cardB;
  const otherCard = which === "a" ? cardB : cardA;
  if (chosenCard) {
    chosenCard.classList.remove("card-grow");
    void chosenCard.offsetWidth;
    chosenCard.classList.add("card-grow");
  }
  if (otherCard) {
    otherCard.classList.remove("card-fade");
    void otherCard.offsetWidth;
    otherCard.classList.add("card-fade");
  }
  if (arena) {
    arena.classList.remove("fade-in");
    arena.classList.add("fade-out");
  }

  setTimeout(() => {
    if (chosenCard) chosenCard.classList.remove("card-grow");
    if (otherCard) otherCard.classList.remove("card-fade");
    if (arena) arena.classList.remove("fade-out");

    advanceWinner(winner, loser);
    state.isAnimating = false;
    if (arena) {
      arena.classList.add("fade-in");
      setTimeout(() => arena.classList.remove("fade-in"), 450);
    }
  }, 1000);
}

// (No depositMerged in binary insertion)

function renderResults(finalRanking) {
  setView("results");
  resultsList.innerHTML = "";
  finalRanking.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    resultsList.appendChild(li);
  });
  finalCompareCount.textContent = String(state.comparisonsMade);
  startConfetti();
}

function resetAll() {
  state.items = [];
  state.comparisonsMade = 0;
  state.totalComparisons = 0;
  state.choiceLog = [];
  state.champion = null;
  state.challenger = null;
  state.bench = [];
  state.eliminated = [];
  state.isAnimating = false;
  progressFill.style.width = "0%";
  compareCount.textContent = "0";
  textarea.value = "";
  inputError.textContent = "";
  setView("input");
}

/** Event Wiring */
btnFill.addEventListener("click", () => {
  textarea.value = [
    "Pizza",
    "Sushi",
    "Tacos",
    "Burgers",
    "Pasta",
    "Ramen",
    "Ice Cream",
    "Salad",
    "Steak",
  ].join("\n");
});

btnStart.addEventListener("click", () => {
  const items = parseItems(textarea.value);
  if (items.length < 2) {
    inputError.textContent = "Please enter at least 2 items.";
    return;
  }
  inputError.textContent = "";
  state.totalComparisons = estimateKnockoutComparisons(items.length);
  setView("quiz");
  startKnockout(items);
});

document.querySelectorAll(".pick-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const which = btn.getAttribute("data-choice");
    choose(which);
  });
});
btnChooseA.addEventListener("click", () => choose("a"));
btnChooseB.addEventListener("click", () => choose("b"));

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (viewQuiz.classList.contains("active") && !state.isAnimating) {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") choose("a");
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "b") choose("b");
  }
});

btnCancel.addEventListener("click", resetAll);
btnRestart.addEventListener("click", resetAll);

btnDownloadLog.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ items: state.items, choices: state.choiceLog }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "preference-choices.json";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
});

function showCurrentMatch() {
  if (!state.champion || !state.challenger) {
    if (state.champion && state.bench.length === 0) {
      return finishKnockout();
    }
    if (!fillChallenger()) {
      return finishKnockout();
    }
  }
  textA.textContent = state.champion ?? "";
  textB.textContent = state.challenger ?? "";
  updateProgress();
}

function fillChallenger() {
  if (state.bench.length === 0) return false;
  state.challenger = state.bench.shift();
  return true;
}

function advanceWinner(winner, loser) {
  state.choiceLog.push({ champion: state.champion, challenger: state.challenger, winner });
  state.comparisonsMade++;
  if (winner === state.champion) {
    state.eliminated.push(loser);
    if (!fillChallenger()) {
      state.challenger = null;
    }
  } else {
    state.eliminated.push(state.champion);
    state.champion = winner;
    state.challenger = null;
    fillChallenger();
  }
  showCurrentMatch();
}

function finishKnockout() {
  const ranking = [state.champion, ...state.eliminated].filter(Boolean);
  renderResults(ranking);
}


