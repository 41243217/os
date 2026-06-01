function normalizeRecord(record) {
  return {
    id: record.id || `${record.chapter || ""}-${record.timestamp || Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    timestamp: record.timestamp || new Date().toISOString(),
    chapter: record.chapter || "未知",
    type: TYPES.includes(record.type) ? record.type : "text",
    question: String(record.question || "(無題目)"),
    userAnswer: Array.isArray(record.userAnswer) ? record.userAnswer : normalizeAnswerInput(record.userAnswerText || record.userAnswer),
    correctAnswer: Array.isArray(record.correctAnswer)
      ? record.correctAnswer
      : normalizeAnswerInput(record.correctAnswerText || record.correctAnswer),
  };
}

function getRecords() {
  return (readJSON("wrongQuestions", []) || []).map((item) => normalizeRecord(item));
}

function saveRecords(records) {
  writeJSON("wrongQuestions", records);
}

function initFilters(records) {
  const select = document.getElementById("chapterFilter");
  const seen = new Set(Array.from(select.options).map((opt) => opt.value));
  records.forEach((record) => {
    if (!seen.has(record.chapter)) {
      const option = document.createElement("option");
      option.value = record.chapter;
      option.textContent = record.chapter;
      select.appendChild(option);
      seen.add(record.chapter);
    }
  });
}

function render() {
  const chapter = document.getElementById("chapterFilter").value;
  const type = document.getElementById("typeFilter").value;
  const records = getRecords();

  const filtered = records.filter((record) => {
    const chapterPass = chapter === "all" || record.chapter === chapter;
    const typePass = type === "all" || record.type === type;
    return chapterPass && typePass;
  });

  const container = document.getElementById("wrongList");
  container.innerHTML = "";

  if (!filtered.length) {
    container.innerHTML = '<div class="empty">目前沒有錯題記錄</div>';
    return;
  }

  filtered.forEach((record) => {
    const item = document.createElement("article");
    item.className = "card";
    item.innerHTML = `
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
        <div>
          <span class="badge">${record.chapter}</span>
          <span class="tag">${record.type}</span>
          <span class="small muted">${formatDateTime(record.timestamp)}</span>
        </div>
        <button class="danger small" data-id="${record.id}">刪除</button>
      </div>
      <h3 style="margin-top:8px">${record.question}</h3>
      <p class="small" style="margin-top:6px">你的答案：${joinAnswers(record.userAnswer)}</p>
      <p class="small">正確答案：${joinAnswers(record.correctAnswer)}</p>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const next = getRecords().filter((record) => record.id !== id);
      saveRecords(next);
      render();
    });
  });
}

function setup() {
  const records = getRecords();
  initFilters(records);

  document.getElementById("chapterFilter").addEventListener("change", render);
  document.getElementById("typeFilter").addEventListener("change", render);

  document.getElementById("clearWrong").addEventListener("click", () => {
    if (!confirm("確定要清除所有錯題嗎？")) {
      return;
    }
    writeJSON("wrongQuestions", []);
    render();
  });

  render();
}

setup();
