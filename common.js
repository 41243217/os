const CHAPTERS = ["CH5", "CH6", "CH8", "CH9"];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeAnswer(answer) {
  return Array.isArray(answer) ? answer.map((v) => String(v).trim()) : [String(answer ?? "").trim()];
}

function normalizeType(question) {
  if (question.type === "single" || question.type === "multiple" || question.type === "text") {
    return question.type;
  }
  if (!Array.isArray(question.options) || question.options.length === 0) {
    return "text";
  }
  return normalizeAnswer(question.answer).length > 1 ? "multiple" : "single";
}

function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(String(text ?? ""));
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function loadChapter(chapter) {
  const response = await fetch(`${chapter}.json`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`無法載入 ${chapter}.json`);
  }
  const rows = await response.json();
  return rows.map((question) => ({ ...question, chapter, type: normalizeType(question) }));
}

function formatAnswer(answer) {
  return normalizeAnswer(answer).join("、");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
