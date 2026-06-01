const stats = readStorage("quizStats", {
  attempts: 0,
  totalScore: 0,
  averageScore: 0,
  wrongCount: 0
});

document.getElementById("attempts").textContent = String(stats.attempts || 0);
document.getElementById("wrong-count").textContent = String(stats.wrongCount || 0);
document.getElementById("avg-score").textContent = `${Math.round(stats.averageScore || 0)}%`;
