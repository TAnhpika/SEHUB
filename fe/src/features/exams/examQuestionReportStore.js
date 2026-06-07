const STORAGE_KEY = "sehubs_exam_question_reports";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function formatReportTime(date = new Date()) {
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildQuestionPreview(question) {
  if (!question) return "";
  const options =
    question.options?.map((option) => `${option.key}. ${option.label}`).join(" · ") ?? "";
  return options ? `${question.text}\n\n${options}` : question.text;
}

function toModeratorReport(entry) {
  return {
    id: entry.id,
    code: entry.code,
    category: "exam_question",
    status: entry.status,
    reason: entry.reason,
    reporterUsername: entry.reporterUsername,
    reporterInitial: entry.reporterInitial,
    timeLabel: entry.timeLabel,
    reportedAt: entry.reportedAt,
    snippet: entry.snippet,
    reporterReason: entry.detail,
    violatingContent: entry.questionPreview,
    examId: entry.examId,
    courseCode: entry.courseCode,
    questionId: entry.questionId,
    questionIndex: entry.questionIndex,
    questionText: entry.questionText,
    markedAnswer: entry.markedAnswer,
    reportedUser: {
      username: "Ngân hàng đề SEHUB",
      initial: "Đ",
      joinedAt: "Hệ thống",
      trustScore: 100,
    },
    resolution: entry.resolution ?? null,
  };
}

export function getExamQuestionReports() {
  return readAll().map(toModeratorReport);
}

export function getPendingExamQuestionReportCount() {
  return readAll().filter((entry) => entry.status === "pending").length;
}

/**
 * @param {{
 *   examId: string;
 *   courseCode: string;
 *   questionId: number;
 *   questionIndex: number;
 *   question: { text: string; correctAnswer?: string; options?: Array<{ key: string; label: string }> };
 *   reason: string;
 *   detail: string;
 *   reporter: { username?: string; displayName?: string };
 * }} payload
 */
export function submitExamQuestionReport(payload) {
  const now = new Date();
  const seq = readAll().length + 1;
  const id = `eqr-${Date.now()}`;
  const code = `EQR-${String(1000 + seq).slice(-4)}`;
  const reporterName = payload.reporter?.username ?? payload.reporter?.displayName ?? "student";
  const reporterUsername = reporterName.startsWith("@") ? reporterName : `@${reporterName}`;
  const initial = reporterUsername.replace("@", "").slice(0, 2).toUpperCase() || "SV";

  const entry = {
    id,
    code,
    status: "pending",
    reason: payload.reason,
    examId: payload.examId,
    courseCode: payload.courseCode,
    questionId: payload.questionId,
    questionIndex: payload.questionIndex,
    questionText: payload.question.text,
    markedAnswer: payload.question.correctAnswer ?? null,
    questionPreview: buildQuestionPreview(payload.question),
    detail: payload.detail.trim(),
    reporterUsername,
    reporterInitial: initial,
    timeLabel: "Vừa xong",
    reportedAt: formatReportTime(now),
    createdAt: now.toISOString(),
    snippet: `Câu ${payload.questionIndex} · ${payload.examId} — ${
      payload.question.text.length > 72
        ? `${payload.question.text.slice(0, 72)}…`
        : payload.question.text
    }`,
    resolution: null,
  };

  writeAll([entry, ...readAll()]);
  window.dispatchEvent(new CustomEvent("sehubs-exam-reports-changed"));
  return toModeratorReport(entry);
}

export function resolveExamQuestionReport(id, resolution) {
  const next = readAll().map((entry) =>
    entry.id === id ? { ...entry, status: "resolved", resolution } : entry,
  );
  writeAll(next);
  window.dispatchEvent(new CustomEvent("sehubs-exam-reports-changed"));
  return next.find((entry) => entry.id === id)
    ? toModeratorReport(next.find((entry) => entry.id === id))
    : null;
}
