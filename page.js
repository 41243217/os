const tbody = document.getElementById("overview-body");

Promise.all(CHAPTERS.map((chapter) => loadChapter(chapter)))
  .then((rows) => {
    const chapterRows = rows.map((questions, index) => {
      const chapter = CHAPTERS[index];
      const single = questions.filter((q) => q.type === "single").length;
      const multiple = questions.filter((q) => q.type === "multiple").length;
      const text = questions.filter((q) => q.type === "text").length;
      return {
        chapter,
        total: questions.length,
        single,
        multiple,
        text
      };
    });

    document.getElementById("chapter-total").textContent = String(chapterRows.length);
    document.getElementById("question-total").textContent = String(chapterRows.reduce((sum, item) => sum + item.total, 0));

    tbody.innerHTML = chapterRows
      .map(
        (row) => `
          <tr>
            <td>${row.chapter}.json</td>
            <td>${row.total}</td>
            <td>${row.single}</td>
            <td>${row.multiple}</td>
            <td>${row.text}</td>
          </tr>
        `
      )
      .join("");
  })
  .catch((error) => {
    tbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  });
