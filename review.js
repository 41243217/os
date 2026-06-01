const listEl = document.getElementById("wrong-list");
const chapterFilterEl = document.getElementById("chapter-filter");
const typeFilterEl = document.getElementById("type-filter");
const clearBtn = document.getElementById("clear-btn");

function getFilteredItems() {
  const wrongs = readStorage("wrongQuestions", []);
  return wrongs
    .map((item, index) => ({ ...item, index }))
    .filter((item) => (chapterFilterEl.value === "all" ? true : item.chapter === chapterFilterEl.value))
    .filter((item) => (typeFilterEl.value === "all" ? true : item.type === typeFilterEl.value));
}

function render() {
  const items = getFilteredItems();
  if (items.length === 0) {
    listEl.innerHTML = '<article class="card">目前沒有錯題記錄。</article>';
    return;
  }

  listEl.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          <p class="meta">${item.chapter} / ${item.type} / ${new Date(item.timestamp).toLocaleString()}</p>
          <p><strong>題目：</strong>${escapeHtml(item.question)}</p>
          <p><strong>你的答案：</strong>${escapeHtml(formatAnswer(item.userAnswer))}</p>
          <p><strong>正確答案：</strong>${escapeHtml(formatAnswer(item.answer))}</p>
          <button type="button" data-index="${item.index}" class="danger delete-btn">刪除</button>
        </article>
      `
    )
    .join("");
}

listEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("delete-btn")) return;

  const index = Number(target.dataset.index);
  const wrongs = readStorage("wrongQuestions", []);
  wrongs.splice(index, 1);
  writeStorage("wrongQuestions", wrongs);

  const stats = readStorage("quizStats", { attempts: 0, totalScore: 0, averageScore: 0, wrongCount: 0 });
  stats.wrongCount = wrongs.length;
  writeStorage("quizStats", stats);
  render();
});

chapterFilterEl.addEventListener("change", render);
typeFilterEl.addEventListener("change", render);

clearBtn.addEventListener("click", () => {
  if (!confirm("確定清除所有錯題？")) return;
  writeStorage("wrongQuestions", []);
  const stats = readStorage("quizStats", { attempts: 0, totalScore: 0, averageScore: 0, wrongCount: 0 });
  stats.wrongCount = 0;
  writeStorage("quizStats", stats);
  render();
});

render();
