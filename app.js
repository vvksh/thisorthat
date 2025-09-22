// Preference Ranker — interactive merge sort with A/B choices

/**
 * App State
 */
const state = {
  items: [],
  comparisonsMade: 0,
  totalEstimatedComparisons: 0,
  // Binary insertion interactive state
  ranked: [],
  currentIndex: 0, // index into items we are inserting
  low: 0,
  high: -1,
  mid: -1,
  // Choice log
  choiceLog: [],
};

/** DOM Elements */
const viewInput = document.getElementById("view-input");
const viewQuiz = document.getElementById("view-quiz");
const viewResults = document.getElementById("view-results");

const textarea = document.getElementById("items-text");
const btnStart = document.getElementById("btn-start");
const btnFill = document.getElementById("btn-fill-sample");
const inputError = document.getElementById("input-error");

const textA = document.getElementById("text-a");
const textB = document.getElementById("text-b");
const btnChooseA = document.getElementById("btn-choose-a");
const btnChooseB = document.getElementById("btn-choose-b");
const btnCancel = document.getElementById("btn-cancel");
const progressFill = document.getElementById("progress-fill");
const compareCount = document.getElementById("compare-count");

const resultsList = document.getElementById("results-list");
const finalCompareCount = document.getElementById("final-compare-count");
const btnRestart = document.getElementById("btn-restart");
const btnDownloadLog = document.getElementById("btn-download-log");

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

function estimateComparisons(n) {
  // Sum of ceil(log2(k+1)) for k = 0..n-2 (worst-case comparisons per insertion)
  if (n <= 1) return 0;
  let sum = 0;
  for (let k = 1; k <= n - 1; k++) {
    sum += Math.ceil(Math.log2(k + 1));
  }
  return sum;
}

function updateProgress() {
  compareCount.textContent = String(state.comparisonsMade);
  const denom = Math.max(1, state.totalEstimatedComparisons);
  const pct = Math.min(100, Math.round((state.comparisonsMade / denom) * 100));
  progressFill.style.width = `${pct}%`;
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

/** Interactive Binary Insertion Logic */
function beginRanking() {
  state.ranked = [];
  state.currentIndex = 0;
  state.low = 0;
  state.high = -1;
  state.mid = -1;
  state.comparisonsMade = 0;
  state.choiceLog = [];
  advanceToNextItem();
}

function advanceToNextItem() {
  if (state.currentIndex >= state.items.length) {
    return finishRanking(state.ranked.slice());
  }
  const currentItem = state.items[state.currentIndex];
  if (state.ranked.length === 0) {
    state.ranked.push(currentItem);
    state.currentIndex++;
    updateProgress();
    return advanceToNextItem();
  }
  state.low = 0;
  state.high = state.ranked.length - 1;
  promptNextComparison();
}

function promptNextComparison() {
  if (state.low > state.high) {
    // Insert at position low
    const item = state.items[state.currentIndex];
    state.ranked.splice(state.low, 0, item);
    state.currentIndex++;
    updateProgress();
    return advanceToNextItem();
  }
  state.mid = Math.floor((state.low + state.high) / 2);
  // Show current item (A) vs candidate in ranked (B)
  textA.textContent = state.items[state.currentIndex];
  textB.textContent = state.ranked[state.mid];
  updateProgress();
}

function renderPair() {
  // Repurpose: current item vs ranked[mid]
  if (state.currentIndex < state.items.length && state.low <= state.high && state.mid >= 0) {
    textA.textContent = state.items[state.currentIndex];
    textB.textContent = state.ranked[state.mid];
    updateProgress();
  }
}

function choose(which) {
  if (!(which === "a" || which === "b")) return;
  // Record current comparison
  if (state.currentIndex < state.items.length && state.mid >= 0 && state.mid < state.ranked.length) {
    const a = state.items[state.currentIndex];
    const b = state.ranked[state.mid];
    state.choiceLog.push({ a, b, chosen: which });
    state.comparisonsMade++;
  }
  // If choose A => current item preferred over ranked[mid], search left half (towards front)
  if (which === "a") {
    state.high = state.mid - 1;
  } else {
    // choose B => existing ranked[mid] preferred, search right half
    state.low = state.mid + 1;
  }
  promptNextComparison();
}

// (No depositMerged in binary insertion)

function finishRanking(finalRanking) {
  const final = Array.isArray(finalRanking) ? finalRanking : state.ranked.slice();
  renderResults(final);
}

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
  state.totalEstimatedComparisons = 0;
  state.ranked = [];
  state.currentIndex = 0;
  state.low = 0;
  state.high = -1;
  state.mid = -1;
  state.choiceLog = [];
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
  state.items = items;
  state.totalEstimatedComparisons = estimateComparisons(items.length);
  setView("quiz");
  updateProgress();
  beginRanking();
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
  if (viewQuiz.classList.contains("active")) {
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


