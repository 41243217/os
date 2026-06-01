function renderHomeStats() {
  const stats = readJSON("quizStats", { attempts: 0, totalWrong: 0, totalScore: 0 });
  const attempts = Number(stats.attempts) || 0;
  const totalWrong = Number(stats.totalWrong) || 0;
  const totalScore = Number(stats.totalScore) || 0;
  const average = attempts > 0 ? totalScore / attempts : 0;

  document.getElementById("attempts").textContent = String(attempts);
  document.getElementById("wrongTotal").textContent = String(totalWrong);
  document.getElementById("avgScore").textContent = `${average.toFixed(1)}%`;
}

document.getElementById("clearData").addEventListener("click", () => {
  if (!confirm("確定要清除所有測驗統計與錯題資料嗎？")) {
    return;
  }
  localStorage.removeItem("quizStats");
  localStorage.removeItem("wrongQuestions");
  localStorage.removeItem("quizSettings");
  renderHomeStats();
});

renderHomeStats();
