const chapterEl = document.getElementById("chapter");
const countEl = document.getElementById("question-count");
const chineseOnlyEl = document.getElementById("chinese-only");
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");
const quizArea = document.getElementById("quiz-area");
const quizForm = document.getElementById("quiz-form");
const resultEl = document.getElementById("result");
const submitBtn = document.getElementById("submit-btn");

let currentQuestions = [];
let currentSettings = null;

function selectedTypes() {
  return Array.from(document.querySelectorAll('input[name="type"]:checked')).map((el) => el.value);
}

function restoreSettings() {
  const saved = readStorage("quizSettings", null);
  if (!saved) return;
  chapterEl.value = saved.chapter;
  countEl.value = saved.count;
  chineseOnlyEl.checked = !!saved.chineseOnly;
  document.querySelectorAll('input[name="type"]').forEach((el) => {
    el.checked = saved.types.includes(el.value);
  });
}

async function startQuiz() {
  const settings = {
    chapter: chapterEl.value,
    types: selectedTypes(),
    count: Number(countEl.value),
    chineseOnly: chineseOnlyEl.checked
  };

  if (settings.types.length === 0) {
    alert("請至少選擇一種題型");
    return;
  }

  writeStorage("quizSettings", settings);

  const all = await loadChapter(settings.chapter);
  const filtered = all.filter((q) => settings.types.includes(q.type) && (!settings.chineseOnly || containsChinese(q.question)));
  if (filtered.length === 0) {
    alert("沒有符合條件的題目");
    return;
  }

  const count = Math.max(1, Math.min(settings.count || 1, filtered.length));
  currentQuestions = shuffle(filtered).slice(0, count);
  currentSettings = settings;

  quizForm.innerHTML = currentQuestions
    .map((q, index) => {
      const safeQuestion = escapeHtml(q.question);
      if (q.type === "text") {
        return `<div class="question"><p>${index + 1}. ${safeQuestion}</p><input type="text" data-idx="${index}" data-kind="text"/></div>`;
      }
      const inputType = q.type === "multiple" ? "checkbox" : "radio";
      const name = `q${index}`;
      const options = (q.options || [])
        .map(
          (option) =>
            `<label><input type="${inputType}" name="${name}" data-idx="${index}" data-kind="${q.type}" value="${escapeHtml(option)}"/> ${escapeHtml(option)}</label>`
        )
        .join("<br/>");
      return `<div class="question"><p>${index + 1}. ${safeQuestion}</p>${options}</div>`;
    })
    .join("");

  quizArea.hidden = false;
  resultEl.hidden = true;
  retryBtn.hidden = false;
}

function collectUserAnswer(index, type) {
  if (type === "text") {
    const el = quizForm.querySelector(`input[data-kind="text"][data-idx="${index}"]`);
    return [String(el?.value ?? "").trim()];
  }
  if (type === "single") {
    const el = quizForm.querySelector(`input[data-kind="single"][data-idx="${index}"]:checked`);
    return [String(el?.value ?? "").trim()];
  }
  return Array.from(quizForm.querySelectorAll(`input[data-kind="multiple"][data-idx="${index}"]:checked`)).map((el) => String(el.value).trim());
}

function saveResult(score, wrongs) {
  const oldStats = readStorage("quizStats", { attempts: 0, totalScore: 0, averageScore: 0, wrongCount: 0 });
  const wrongHistory = readStorage("wrongQuestions", []);
  const updatedWrongs = wrongHistory.concat(wrongs);

  const attempts = (oldStats.attempts || 0) + 1;
  const totalScore = (oldStats.totalScore || 0) + score;

  writeStorage("wrongQuestions", updatedWrongs);
  writeStorage("quizStats", {
    attempts,
    totalScore,
    averageScore: totalScore / attempts,
    wrongCount: updatedWrongs.length
  });
}

function checkResult() {
  if (currentQuestions.length === 0) return;

  let correct = 0;
  const wrongs = [];

  currentQuestions.forEach((q, index) => {
    const expected = normalizeAnswer(q.answer).sort();
    const actual = collectUserAnswer(index, q.type).sort();
    const ok = JSON.stringify(expected) === JSON.stringify(actual);
    if (ok) {
      correct += 1;
      return;
    }
    wrongs.push({
      chapter: q.chapter,
      type: q.type,
      question: q.question,
      userAnswer: actual,
      answer: expected,
      timestamp: new Date().toISOString()
    });
  });

  const score = (correct / currentQuestions.length) * 100;
  saveResult(score, wrongs);

  resultEl.hidden = false;
  resultEl.innerHTML = `<h2>結果</h2><p>答對 ${correct} / ${currentQuestions.length} 題，分數 ${Math.round(score)}%</p><p>新增錯題 ${wrongs.length} 題</p>`;
}

startBtn.addEventListener("click", () => {
  startQuiz().catch((error) => {
    alert(error.message);
  });
});

submitBtn.addEventListener("click", checkResult);

retryBtn.addEventListener("click", () => {
  if (!currentSettings) return;
  chapterEl.value = currentSettings.chapter;
  countEl.value = currentSettings.count;
  chineseOnlyEl.checked = currentSettings.chineseOnly;
  document.querySelectorAll('input[name="type"]').forEach((el) => {
    el.checked = currentSettings.types.includes(el.value);
  });
  startQuiz().catch((error) => {
    alert(error.message);
  });
});

restoreSettings();
