const chapterFilter = document.getElementById("chapter-filter");
const typeFilter = document.getElementById("type-filter");
const chineseOnly = document.getElementById("chinese-only");
const studyList = document.getElementById("study-list");

let allQuestions = [];

function answerKey(question) {
  return normalizeAnswer(question.answer).slice().sort().join("|");
}

function isSpecial(question, index, rows) {
  const answers = normalizeAnswer(question.answer);
  return answers.every((ans) => {
    const value = String(ans).trim();
    return !rows.some((row, rowIndex) => {
      if (rowIndex === index) return false;
      const options = Array.isArray(row.options) ? row.options : [];
      return options.map((opt) => String(opt).trim()).includes(value);
    });
  });
}

function render() {
  const filtered = allQuestions
    .filter((q) => (chapterFilter.value === "all" ? true : q.chapter === chapterFilter.value))
    .filter((q) => (typeFilter.value === "all" ? true : q.type === typeFilter.value))
    .filter((q) => (!chineseOnly.checked ? true : containsChinese(q.question)));

  const answerCounts = filtered.reduce((map, q) => {
    const key = answerKey(q);
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});

  const sorted = filtered.slice().sort((a, b) => (answerCounts[answerKey(b)] || 0) - (answerCounts[answerKey(a)] || 0));

  let specialCount = 0;
  sorted.forEach((question, idx) => {
    if (isSpecial(question, idx, sorted)) specialCount += 1;
  });

  document.getElementById("total-count").textContent = String(sorted.length);
  document.getElementById("special-count").textContent = String(specialCount);
  document.getElementById("single-count").textContent = String(sorted.filter((q) => q.type === "single").length);
  document.getElementById("multiple-count").textContent = String(sorted.filter((q) => q.type === "multiple").length);
  document.getElementById("text-count").textContent = String(sorted.filter((q) => q.type === "text").length);

  if (sorted.length === 0) {
    studyList.innerHTML = '<article class="card">沒有符合條件的題目。</article>';
    return;
  }

  studyList.innerHTML = sorted
    .map((q, index) => {
      const special = isSpecial(q, index, sorted);
      return `
        <article class="card">
          <p class="meta">${q.chapter} / ${q.type}</p>
          <p>${escapeHtml(q.question)}</p>
          <p>✓ <strong>${escapeHtml(formatAnswer(q.answer))}</strong> ${special ? "⭐" : ""}</p>
          <p class="meta">答案重複次數：${answerCounts[answerKey(q)] || 1}</p>
        </article>
      `;
    })
    .join("");
}

Promise.all(CHAPTERS.map((chapter) => loadChapter(chapter)))
  .then((rows) => {
    allQuestions = rows.flat();
    render();
  })
  .catch((error) => {
    studyList.innerHTML = `<article class="card">${error.message}</article>`;
  });

chapterFilter.addEventListener("change", render);
typeFilter.addEventListener("change", render);
chineseOnly.addEventListener("change", render);
