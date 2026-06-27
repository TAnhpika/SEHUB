import * as adminApi from "@/api/adminApi";
import * as examsApi from "@/api/examsApi";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import { MODERATION_QUEUE_FETCH_SIZE } from "@/features/moderator/reports/shared/reportCategoryConstants";
import { formatRelativeTime } from "@/utils/dateTime";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
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

function buildQuestionPreview(question) {
  if (!question) return "";
  const options =
    question.options?.map((option) => `${option.key}. ${option.label}`).join(" · ") ?? "";
  return options ? `${question.text}\n\n${options}` : question.text;
}

function toModeratorReport(entry) {
  const reporterUsername = entry.reporterUsername?.startsWith("@")
    ? entry.reporterUsername
    : `@${entry.reporterUsername ?? "student"}`;
  const initial = reporterUsername.replace("@", "").slice(0, 2).toUpperCase() || "SV";

  return {
    id: entry.id,
    code: entry.code,
    category: "exam_question",
    status: entry.status?.toLowerCase?.() ?? entry.status,
    reason: entry.reason,
    reporterUsername,
    reporterInitial: initial,
    timeLabel: entry.timeLabel ?? formatRelativeTime(entry.createdAt),
    reportedAt: entry.reportedAt ?? formatRelativeTime(entry.createdAt),
    snippet: entry.snippet,
    reporterReason: entry.detail ?? entry.reporterReason,
    violatingContent: entry.questionPreview ?? entry.questionText,
    examId: entry.examId,
    courseCode: entry.courseCode ?? entry.examCode,
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
    resolution: entry.resolution ?? entry.resolutionNote ?? null,
  };
}

function mapApiReport(dto) {
  const questionText = dto.questionText ?? "";
  return toModeratorReport({
    id: dto.id,
    code: dto.code,
    status: dto.status,
    reason: dto.reason,
    detail: dto.detail,
    examId: dto.examCode || dto.examId,
    examCode: dto.examCode,
    questionId: dto.questionId,
    questionIndex: dto.questionIndex,
    questionText,
    markedAnswer: dto.markedAnswer,
    questionPreview: questionText,
    reporterUsername: dto.reporterUsername,
    createdAt: dto.createdAt,
    createdAtIso: dto.createdAt,
    resolutionNote: dto.resolutionNote,
    snippet: `Câu ${dto.questionIndex} · ${dto.examCode} — ${
      questionText.length > 72 ? `${questionText.slice(0, 72)}…` : questionText
    }`,
  });
}

export async function getExamQuestionReports({ pageSize = ADMIN_API_PAGE_SIZE } = {}) {
  if (USE_MOCK) {
    return readAll().map(toModeratorReport);
  }

  const page = await adminApi.listQuestionReports({ page: 1, pageSize });
  return (page.items ?? []).map(mapApiReport);
}

export async function findExamQuestionReportById(id) {
  const items = await getExamQuestionReports({ pageSize: MODERATION_QUEUE_FETCH_SIZE });
  return items.find((item) => item.id === id) ?? null;
}

export async function getPendingExamQuestionReportCount() {
  if (USE_MOCK) {
    return getPendingExamQuestionReportCountSync();
  }

  try {
    const result = await adminApi.getPendingQuestionReportCount();
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

export function getPendingExamQuestionReportCountSync() {
  return readAll().filter((entry) => entry.status === "pending").length;
}

export async function submitExamQuestionReport(payload) {
  if (USE_MOCK) {
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
      reportedAt: now.toLocaleString("vi-VN"),
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

  const dto = await examsApi.reportExamQuestion(payload.examId, payload.question.id, {
    reason: payload.reason,
    detail: payload.detail.trim(),
  });
  window.dispatchEvent(new CustomEvent("sehubs-exam-reports-changed"));
  return mapApiReport(dto);
}

export async function resolveExamQuestionReport(id, resolution) {
  if (USE_MOCK) {
    const next = readAll().map((entry) =>
      entry.id === id ? { ...entry, status: "resolved", resolution } : entry,
    );
    writeAll(next);
    window.dispatchEvent(new CustomEvent("sehubs-exam-reports-changed"));
    const resolved = next.find((entry) => entry.id === id);
    return resolved ? toModeratorReport(resolved) : null;
  }

  const dto = await adminApi.resolveQuestionReport(id, {
    status: "Resolved",
    resolutionNote: resolution,
  });
  window.dispatchEvent(new CustomEvent("sehubs-exam-reports-changed"));
  return mapApiReport(dto);
}
