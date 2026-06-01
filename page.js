async function renderOverview() {
  const body = document.getElementById("overviewBody");
  const status = document.getElementById("overviewStatus");
  body.innerHTML = "";

  let totalQuestions = 0;
  const totals = { single: 0, multiple: 0, text: 0 };
  const errors = [];

  const settled = await Promise.allSettled(CHAPTERS.map((chapter) => loadChapterQuestions(chapter)));

  settled.forEach((result, idx) => {
    const chapter = CHAPTERS[idx];
    if (result.status !== "fulfilled") {
      errors.push(`${chapter}: ${result.reason?.message || "載入失敗"}`);
      const row = document.createElement("tr");
      row.innerHTML = `<td>${chapter}</td><td colspan="4" class="error">載入失敗</td>`;
      body.appendChild(row);
      return;
    }

    const questions = result.value;
    const chapterCounts = { single: 0, multiple: 0, text: 0 };
    questions.forEach((q) => {
      chapterCounts[q.type] += 1;
    });

    totalQuestions += questions.length;
    totals.single += chapterCounts.single;
    totals.multiple += chapterCounts.multiple;
    totals.text += chapterCounts.text;

    const row = document.createElement("tr");
    row.innerHTML = `<td>${chapter}</td><td>${questions.length}</td><td>${chapterCounts.single}</td><td>${chapterCounts.multiple}</td><td>${chapterCounts.text}</td>`;
    body.appendChild(row);
  });

  document.getElementById("chapterFiles").textContent = String(CHAPTERS.length - errors.length);
  document.getElementById("totalQuestions").textContent = String(totalQuestions);
  document.getElementById("totalSingle").textContent = String(totals.single);
  document.getElementById("totalMultiple").textContent = String(totals.multiple);
  document.getElementById("totalText").textContent = String(totals.text);

  if (errors.length) {
    status.className = "message error";
    status.textContent = `部分檔案載入失敗：${errors.join("；")}`;
  } else {
    status.className = "message";
    status.textContent = "所有章節載入成功";
  }
}

renderOverview();
