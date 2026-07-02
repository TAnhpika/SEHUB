import * as examsApi from "@/api/examsApi";
import { resolvePublicExamName } from "@/utils/examDisplay";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const STATUS_LABELS = {
  Submitted: "Đã nộp",
  InProgress: "Đang làm",
  Expired: "Hết hạn",
};

function formatAttemptTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function mapHistoryItem(dto) {
  const paperCode = resolvePublicExamName({
    code: dto.examPaperCode,
    title: dto.examPaperCode,
  });

  return {
    attemptId: dto.attemptId,
    examId: dto.examId,
    examPaperCode: paperCode || dto.examPaperCode,
    subjectCode: dto.subjectCode,
    status: dto.status,
    statusLabel: STATUS_LABELS[dto.status] ?? dto.status,
    startedAt: dto.startedAt,
    submittedAt: dto.submittedAt,
    startedAtLabel: formatAttemptTimestamp(dto.startedAt),
    submittedAtLabel: dto.submittedAt ? formatAttemptTimestamp(dto.submittedAt) : null,
    scorePercent: dto.scorePercent != null ? Math.round(Number(dto.scorePercent)) : null,
    totalQuestions: dto.totalQuestions ?? 0,
    correctCount: dto.correctCount ?? null,
    isSubmitted: dto.status === "Submitted",
    isInProgress: dto.status === "InProgress",
  };
}

export async function loadExamAttemptHistory(courseCode, pageKey = "review") {
  if (USE_MOCK || pageKey !== "review") {
    return [];
  }

  const subjectCode = courseCode?.toUpperCase() ?? "";
  if (!subjectCode) {
    return [];
  }

  try {
    const items = await examsApi.listAttemptHistory({
      code: subjectCode,
      type: "Final",
    });

    return (items ?? []).map(mapHistoryItem);
  } catch {
    return [];
  }
}

export function getAttemptHistoryResultHref(item, config, courseCode) {
  return `${config.detailBase}/${courseCode}/${encodeURIComponent(item.examPaperCode)}/result?attemptId=${item.attemptId}`;
}

export function getAttemptHistoryContinueHref(item, courseCode) {
  return `/exam/focus/final-exam/${courseCode}/${encodeURIComponent(item.examPaperCode)}/do`;
}
