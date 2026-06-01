const CHAPTERS = ["CH5", "CH6", "CH8", "CH9"];
const TYPES = ["single", "multiple", "text"];

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function hasChinese(text) {
  return /[\u3400-\u9fff]/.test(String(text || ""));
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeAnswerInput(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeAnswerInput(item));
  }
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === "number") {
    return [String(value)];
  }
  const text = String(value).trim();
  if (!text) {
    return [];
  }
  if (/[,，、;；]/.test(text)) {
    return text
      .split(/[,，、;；]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [text];
}

function mapAnswerTokenToOption(token, options) {
  const trimmed = String(token || "").trim();
  if (!trimmed || !Array.isArray(options) || !options.length) {
    return trimmed;
  }

  if (/^-?\d+$/.test(trimmed)) {
    const number = Number(trimmed);
    if (number >= 1 && number <= options.length) {
      return String(options[number - 1]);
    }
    if (number >= 0 && number < options.length) {
      return String(options[number]);
    }
  }

  if (/^[A-Za-z]$/.test(trimmed)) {
    const idx = trimmed.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) {
      return String(options[idx]);
    }
  }

  return trimmed;
}

function normalizeCorrectAnswers(rawAnswer, options) {
  const values = normalizeAnswerInput(rawAnswer).map((token) => mapAnswerTokenToOption(token, options));
  const unique = [];
  for (const value of values) {
    const text = String(value).trim();
    if (text && !unique.some((item) => normalizeText(item) === normalizeText(text))) {
      unique.push(text);
    }
  }
  return unique;
}

function inferType(question, rawAnswer) {
  const explicit = String(question.type || "").trim().toLowerCase();
  if (TYPES.includes(explicit)) {
    return explicit;
  }
  const options = Array.isArray(question.options) ? question.options.filter((o) => String(o).trim()) : [];
  if (!options.length) {
    return "text";
  }
  const answers = normalizeAnswerInput(rawAnswer);
  if (answers.length > 1) {
    return "multiple";
  }
  return "single";
}

function normalizeQuestion(raw, chapter, index) {
  const questionText = String(raw.question ?? raw.title ?? raw.text ?? "").trim();
  const options = Array.isArray(raw.options) ? raw.options.map((opt) => String(opt ?? "").trim()).filter(Boolean) : [];
  const rawAnswer = raw.answer ?? raw.answers ?? raw.correct ?? raw.correctAnswer ?? "";
  const type = inferType({ ...raw, options }, rawAnswer);
  const answers = normalizeCorrectAnswers(rawAnswer, options);

  return {
    id: `${chapter}-${index}-${Math.random().toString(16).slice(2, 8)}`,
    chapter,
    question: questionText,
    options,
    type,
    answerRaw: rawAnswer,
    answers,
    source: raw,
  };
}

async function loadChapterQuestions(chapter) {
  const response = await fetch(`./${chapter}.json`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${chapter}.json 載入失敗 (${response.status})`);
  }
  const data = await response.json();
  const list = Array.isArray(data) ? data : Array.isArray(data.questions) ? data.questions : [];
  return list.map((item, index) => normalizeQuestion(item || {}, chapter, index)).filter((q) => q.question);
}

async function loadChapters(selectedChapters) {
  const chapters = selectedChapters.filter((chapter) => CHAPTERS.includes(chapter));
  const results = await Promise.allSettled(chapters.map((chapter) => loadChapterQuestions(chapter)));

  const all = [];
  const errors = [];
  results.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    } else {
      errors.push(`${chapters[idx]}: ${result.reason?.message || "未知錯誤"}`);
    }
  });
  return { questions: all, errors };
}

function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString();
}

function joinAnswers(values) {
  const list = Array.isArray(values) ? values : normalizeAnswerInput(values);
  return list.length ? list.join("、") : "(空)";
}

function sameAnswerSets(a, b) {
  const normalizeList = (list) =>
    [...new Set((Array.isArray(list) ? list : [list]).map(normalizeText).filter(Boolean))].sort();
  const aList = normalizeList(a);
  const bList = normalizeList(b);
  return aList.length === bList.length && aList.every((value, index) => value === bList[index]);
}
