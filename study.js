const studyState = {
  questions: [],
  answerFrequency: new Map(),
  optionFrequency: new Map(),
};

function addFrequency(map, value) {
  const key = normalizeText(value);
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}

function buildFrequencies(questions) {
  const answerFrequency = new Map();
  const optionFrequency = new Map();

  questions.forEach((q) => {
    q.answers.forEach((answer) => addFrequency(answerFrequency, answer));
    q.options.forEach((option) => addFrequency(optionFrequency, option));
  });

  studyState.answerFrequency = answerFrequency;
  studyState.optionFrequency = optionFrequency;
}

function optionCountInCurrentQuestion(question, answer) {
  const key = normalizeText(answer);
  return question.options.reduce((sum, option) => sum + (normalizeText(option) === key ? 1 : 0), 0);
}

function isSpecialMemory(question) {
  return question.answers.some((answer) => {
    const key = normalizeText(answer);
    const total = studyState.optionFrequency.get(key) || 0;
    const current = optionCountInCurrentQuestion(question, answer);
    return key && total - current <= 0;
  });
}

function renderStats(list) {
  const counts = { single: 0, multiple: 0, text: 0 };
  let highlights = 0;

  list.forEach((question) => {
    counts[question.type] += 1;
    if (isSpecialMemory(question)) {
      highlights += 1;
    }
  });

  document.getElementById("statTotal").textContent = String(list.length);
  document.getElementById("statHighlight").textContent = String(highlights);
  document.getElementById("statSingle").textContent = String(counts.single);
  document.getElementById("statMultiple").textContent = String(counts.multiple);
  document.getElementById("statText").textContent = String(counts.text);
}

function renderList() {
  const chapter = document.getElementById("studyChapter").value;
  const type = document.getElementById("studyType").value;
  const chineseOnly = document.getElementById("studyChineseOnly").checked;
  const sortMode = document.getElementById("sortMode").value;

  let list = studyState.questions.filter((q) => {
    const chapterPass = chapter === "all" || q.chapter === chapter;
    const typePass = type === "all" || q.type === type;
    const chinesePass = !chineseOnly || hasChinese(q.question);
    return chapterPass && typePass && chinesePass;
  });

  if (sortMode === "answerFrequency") {
    list = [...list].sort((a, b) => {
      const aMax = Math.max(0, ...a.answers.map((ans) => studyState.answerFrequency.get(normalizeText(ans)) || 0));
      const bMax = Math.max(0, ...b.answers.map((ans) => studyState.answerFrequency.get(normalizeText(ans)) || 0));
      return bMax - aMax;
    });
  }

  renderStats(list);

  const container = document.getElementById("studyList");
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = '<div class="empty">沒有符合條件的題目</div>';
    return;
  }

  list.forEach((q, idx) => {
    const special = isSpecialMemory(q);
    const card = document.createElement("article");
    card.className = `card${special ? " highlight" : ""}`;
    const options = q.options.length ? `<p class="small" style="margin-top:6px">選項：${q.options.join("｜")}</p>` : "";
    const answerTags = q.answers
      .map((answer) => {
        const key = normalizeText(answer);
        const freq = studyState.answerFrequency.get(key) || 0;
        const unique = (studyState.optionFrequency.get(key) || 0) - optionCountInCurrentQuestion(q, answer) <= 0;
        return `<span class="tag">✓ ${answer} (${freq})${unique ? " ⭐" : ""}</span>`;
      })
      .join(" ");

    card.innerHTML = `
      <div><span class="badge">${q.chapter}</span> <span class="tag">${q.type}</span> ${special ? '<span class="tag">特別記憶 ⭐</span>' : ""}</div>
      <h3 style="margin-top:6px">${idx + 1}. ${q.question}</h3>
      ${options}
      <p class="small" style="margin-top:6px">答案：${answerTags || "(空)"}</p>
    `;
    container.appendChild(card);
  });
}

async function setup() {
  const status = document.getElementById("studyStatus");
  status.textContent = "載入題庫中...";

  const { questions, errors } = await loadChapters(CHAPTERS);
  studyState.questions = questions;
  buildFrequencies(questions);

  const chapterSelect = document.getElementById("studyChapter");
  CHAPTERS.forEach((chapter) => {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapter;
    chapterSelect.appendChild(option);
  });

  document.getElementById("studyChapter").addEventListener("change", renderList);
  document.getElementById("studyType").addEventListener("change", renderList);
  document.getElementById("studyChineseOnly").addEventListener("change", renderList);
  document.getElementById("sortMode").addEventListener("change", renderList);

  renderList();
  status.textContent = errors.length ? `部分章節載入失敗：${errors.join("；")}` : `已載入 ${questions.length} 題`;
  status.className = errors.length ? "message error" : "message";
}

setup();
