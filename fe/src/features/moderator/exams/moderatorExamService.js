import * as adminApi from "@/api/adminApi";
import { ANSWER_KEYS } from "@/features/moderator/finalExams/finalExamData";
import {
  CONTRIBUTION_STATUS_LABELS,
  EXAM_CONTRIBUTION_TYPE_LABELS,
} from "@/features/moderator/exams/moderatorExamConstants";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function parseSemesterId(semesterLabel) {
  const match = semesterLabel?.match(/\d+/);
  return match ? match[0] : "1";
}

function mapApiStatusToContribution(status) {
  const value = String(status ?? "").toLowerCase();
  if (value === "pendingapproval") return "pending_admin";
  if (value === "published") return "approved";
  if (value === "archived") return "rejected";
  if (value === "draft") return "draft_saved";
  return "pending_admin";
}

function mapApiExamType(examType) {
  return String(examType ?? "").toLowerCase() === "practice" ? "practice" : "final";
}

export function mapApiExamToContributionEntry(dto, moderatorUsername) {
  const examType = mapApiExamType(dto.examType);
  const status = mapApiStatusToContribution(dto.status);

  return {
    id: dto.id,
    at: dto.createdAt,
    moderator: moderatorUsername,
    examType,
    action: "submitted",
    subjectCode: dto.major ?? dto.code?.split("-")?.[0] ?? "",
    semester: dto.semester ? `Học kỳ ${dto.semester}` : "",
    title: dto.title,
    description: dto.description ?? "",
    pendingId: dto.id,
    examCode: dto.code,
    questionCount: dto.questionCount ?? null,
    status,
    statusLabel: CONTRIBUTION_STATUS_LABELS[status],
    typeLabel: EXAM_CONTRIBUTION_TYPE_LABELS[examType],
    adminNote: null,
    adminDetail: null,
  };
}

export function buildFinalExamCreateBody(examInfo, questions) {
  const apiQuestions = questions
    .filter((question) => question.content.trim())
    .map((question, index) => {
      const options = ANSWER_KEYS.map((key) => ({
        id: crypto.randomUUID(),
        label: key,
        text: question.answers[key]?.trim() ?? "",
      }));
      const correctOption = options.find((option) => option.label === question.correctAnswer) ?? options[0];

      return {
        orderIndex: index + 1,
        content: question.content.trim(),
        options,
        correctOptionId: correctOption.id,
      };
    });

  return {
    code: examInfo.examCode,
    title: examInfo.subjectName || examInfo.examCode,
    examType: "Final",
    semester: parseSemesterId(examInfo.semesterLabel),
    major: examInfo.subjectCode,
    description: `${examInfo.subjectName} · ${examInfo.durationMinutes} phút`,
    questions: apiQuestions,
  };
}

export function buildPracticeExamCreateBody(payload) {
  return {
    code: `${payload.subjectCode}-PRAC-${Date.now()}`,
    title: payload.title.trim(),
    examType: "Practice",
    semester: parseSemesterId(payload.semester),
    major: payload.subjectCode,
    description: payload.description?.trim() ?? "",
    questions: [],
  };
}

async function uploadExamPdfIfPresent(examId, payload) {
  const pdfFile = payload.pdfFile ?? payload.attachments?.find((item) => item.file instanceof File)?.file;
  if (!(pdfFile instanceof File)) {
    return;
  }

  await adminApi.uploadExamAttachment(examId, pdfFile);
}

/**
 * @param {string | undefined} moderatorUsername
 * @param {{ examType?: string; status?: string }} [filters]
 */
export async function fetchModeratorExamContributions(moderatorUsername, filters = {}) {
  if (USE_MOCK) {
    return null;
  }

  const params = { mine: true, pageSize: 100 };
  if (filters.examType === "final") params.type = "Final";
  if (filters.examType === "practice") params.type = "Practice";
  if (filters.status === "pending_admin") params.status = "PendingApproval";
  if (filters.status === "approved") params.status = "Published";
  if (filters.status === "rejected") params.status = "Archived";

  const result = await adminApi.listExams(params);
  let entries = (result.items ?? []).map((dto) =>
    mapApiExamToContributionEntry(dto, moderatorUsername),
  );

  if (filters.status && filters.status !== "all" && filters.status !== "draft_saved") {
    entries = entries.filter((entry) => entry.status === filters.status);
  }

  return entries.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export async function createFinalExamViaApi(examInfo, questions, confirmDuplicate = false) {
  const body = buildFinalExamCreateBody(examInfo, questions);
  const dto = await adminApi.createExam(body, confirmDuplicate);
  await uploadExamPdfIfPresent(dto.id, examInfo);
  return dto;
}

export async function createPracticeExamViaApi(payload, confirmDuplicate = false) {
  const body = buildPracticeExamCreateBody(payload);
  const dto = await adminApi.createExam(body, confirmDuplicate);
  await uploadExamPdfIfPresent(dto.id, payload);
  return dto;
}
