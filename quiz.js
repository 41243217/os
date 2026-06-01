const state = {
  questions: [],
  lastSettings: null,
};

function createCheckGroup(containerId, values, defaults) {
  const container = document.getElementById(containerId);
  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = "checkbox-item";
    label.innerHTML = `<input type="checkbox" name="${containerId}" value="${value}" ${defaults.includes(value) ? "checked" : ""}/> ${value}`;
    container.appendChild(label);
  });
}

function getCheckedValues(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map((el) => el.value);
}

function getSettingsFromForm() {
  return {
    chapters: getCheckedValues("chapterOptions"),
    types: getCheckedValues("typeOptions"),
    count: Math.max(1, Number(document.getElementById("questionCount").value) || 1),
    chineseOnly: document.getElementById("chineseOnly").checked,
    autoStartOnce: false,
  };
}

function applySettings(settings) {
  const chapters = new Set(settings?.chapters || CHAPTERS);
  const types = new Set(settings?.types || TYPES);
  document.querySelectorAll("#chapterOptions input").forEach((el) => {
    el.checked = chapters.has(el.value);
  });
  document.querySelectorAll("#typeOptions input").forEach((el) => {
    el.checked = types.has(el.value);
  });
  document.getElementById("questionCount").value = String(settings?.count || 10);
  document.getElementById("chineseOnly").checked = Boolean(settings?.chineseOnly);
}

function randomSample(list, count) {
  const cloned = [...list];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, Math.min(count, cloned.length));
}

function renderQuizQuestions() {
  const list = document.getElementById("quizList");
  list.innerHTML = "";
  state.questions.forEach((q, idx) => {
    const card = document.createElement("article");
    card.className = "card question-card";
    card.dataset.id = q.id;
    const title = `<div><span class="badge">${q.chapter}</span> <span class="tag">${q.type}</span></div><h3 style="margin-top:6px">${idx + 1}. ${q.question}</h3>`;

    if (q.type === "single") {
      const options = q.options
        .map(
          (option, optionIdx) =>
            `<label class="radio-item"><input type="radio" name="answer-${q.id}" value="${encodeURIComponent(option)}"/> ${String.fromCharCode(65 + optionIdx)}. ${option}</label>`
        )
        .join("");
      card.innerHTML = `${title}<div class="radio-group" style="margin-top:8px">${options}</div><div class="answer-note"></div>`;
    } else if (q.type === "multiple") {
      const options = q.options
        .map(
          (option, optionIdx) =>
            `<label class="checkbox-item"><input type="checkbox" name="answer-${q.id}" value="${encodeURIComponent(option)}"/> ${String.fromCharCode(65 + optionIdx)}. ${option}</label>`
        )
        .join("");
      card.innerHTML = `${title}<div class="checkbox-group" style="margin-top:8px">${options}</div><div class="answer-note"></div>`;
    } else {
      card.innerHTML = `${title}<div style="margin-top:8px"><input type="text" name="answer-${q.id}" placeholder="請輸入答案" /></div><div class="answer-note"></div>`;
    }

    list.appendChild(card);
  });

  document.getElementById("quizPanel").style.display = state.questions.length ? "block" : "none";
}

function readUserAnswer(question) {
  const name = `answer-${question.id}`;
  if (question.type === "single") {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? [decodeURIComponent(selected.value)] : [];
  }
  if (question.type === "multiple") {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => decodeURIComponent(el.value));
  }
  const input = document.querySelector(`input[name="${name}"]`);
  return input?.value ? [input.value.trim()] : [];
}

function toWrongRecord(question, userAnswer) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    chapter: question.chapter,
    type: question.type,
    question: question.question,
    options: question.options,
    userAnswer,
    userAnswerText: joinAnswers(userAnswer),
    correctAnswer: question.answers,
    correctAnswerText: joinAnswers(question.answers),
  };
}

function updateStats(total, wrongCount) {
  const current = readJSON("quizStats", { attempts: 0, totalWrong: 0, totalScore: 0 });
  const next = {
    attempts: (Number(current.attempts) || 0) + 1,
    totalWrong: (Number(current.totalWrong) || 0) + wrongCount,
    totalScore: (Number(current.totalScore) || 0) + ((total - wrongCount) / Math.max(1, total)) * 100,
  };
  writeJSON("quizStats", next);
}

function gradeQuiz() {
  let correct = 0;
  const wrongRecords = [];

  state.questions.forEach((question) => {
    const card = document.querySelector(`.question-card[data-id="${question.id}"]`);
    const note = card.querySelector(".answer-note");
    const userAnswer = readUserAnswer(question);
    const isCorrect = sameAnswerSets(userAnswer, question.answers);

    card.classList.remove("correct", "wrong");
    if (isCorrect) {
      correct += 1;
      card.classList.add("correct");
      note.className = "answer-note ok";
      note.textContent = "答對了";
    } else {
      card.classList.add("wrong");
      note.className = "answer-note wrong";
      note.textContent = `答錯。你的答案：${joinAnswers(userAnswer)}；正確答案：${joinAnswers(question.answers)}`;
      wrongRecords.push(toWrongRecord(question, userAnswer));
    }
  });

  const existing = readJSON("wrongQuestions", []);
  writeJSON("wrongQuestions", [...wrongRecords, ...existing]);
  updateStats(state.questions.length, wrongRecords.length);

  const score = ((correct / Math.max(1, state.questions.length)) * 100).toFixed(1);
  document.getElementById("resultSummary").textContent = `共 ${state.questions.length} 題，答對 ${correct} 題，分數 ${score}%`;
  document.getElementById("resultPanel").style.display = "block";
}

async function startQuiz() {
  const status = document.getElementById("status");
  status.className = "message";
  status.textContent = "載入題庫中...";

  const settings = getSettingsFromForm();
  state.lastSettings = settings;
  writeJSON("quizSettings", settings);

  if (!settings.chapters.length) {
    status.className = "message error";
    status.textContent = "請至少選擇一個章節。";
    return;
  }
  if (!settings.types.length) {
    status.className = "message error";
    status.textContent = "請至少選擇一個題型。";
    return;
  }

  const { questions, errors } = await loadChapters(settings.chapters);
  let pool = questions.filter((q) => settings.types.includes(q.type));
  if (settings.chineseOnly) {
    pool = pool.filter((q) => hasChinese(q.question));
  }

  if (!pool.length) {
    status.className = "message error";
    status.textContent = `沒有符合條件的題目。${errors.length ? `（${errors.join("；")}）` : ""}`;
    state.questions = [];
    renderQuizQuestions();
    return;
  }

  state.questions = randomSample(pool, settings.count);
  renderQuizQuestions();

  status.className = "message";
  const issue = errors.length ? `；部分章節載入失敗：${errors.join("；")}` : "";
  status.textContent = `已載入 ${state.questions.length} 題${issue}`;
  document.getElementById("resultPanel").style.display = "none";
}

function setup() {
  createCheckGroup("chapterOptions", CHAPTERS, CHAPTERS);
  createCheckGroup("typeOptions", TYPES, TYPES);

  const cached = readJSON("quizSettings", { chapters: CHAPTERS, types: TYPES, count: 10, chineseOnly: false });
  applySettings(cached);

  document.getElementById("startBtn").addEventListener("click", startQuiz);
  document.getElementById("submitBtn").addEventListener("click", gradeQuiz);

  document.getElementById("retryBtn").addEventListener("click", () => {
    const retrySettings = { ...(state.lastSettings || getSettingsFromForm()), autoStartOnce: true };
    writeJSON("quizSettings", retrySettings);
    location.href = "./quiz.html";
  });

  if (cached.autoStartOnce) {
    cached.autoStartOnce = false;
    writeJSON("quizSettings", cached);
    startQuiz();
  }
}

setup();
