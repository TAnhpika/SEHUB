/**
 * Nhật ký đóng góp đề — Moderator (§2.4).
 * Gửi duyệt qua API; lưu nháp giữ local cho đến khi gửi.
 */

import {
  getAdminApprovedExams,
  getAdminPendingExams,
  getAdminRejectedExams,
  submitModeratorFinalExam,
  submitModeratorPracticeExam,
} from "@/features/admin/exams/adminExamData";
import {
  mapFinalExamWizardToCreateRequest,
  mapPracticeExamFormToCreateRequest,
} from "@/api/adminMapper";
import { ApiError } from "@/api/httpClient";
import {
  CONTRIBUTION_STATUS_FILTERS,
  CONTRIBUTION_STATUS_LABELS,
  CONTRIBUTION_TYPE_FILTERS,
  EXAM_CONTRIBUTION_TYPE_LABELS,
} from "@/features/moderator/exams/moderatorExamConstants";
import {
  fetchModeratorExamContributions,
  mapApiExamToContributionEntry,
} from "@/features/moderator/exams/moderatorExamService";

export {
  CONTRIBUTION_STATUS_FILTERS,
  CONTRIBUTION_STATUS_LABELS,
  CONTRIBUTION_TYPE_FILTERS,
  EXAM_CONTRIBUTION_TYPE_LABELS,
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const STORAGE_KEY = "sehubs_moderator_exam_contribution_audit";
const LEGACY_PRACTICE_KEY = "sehubs_practice_exam_contribution_audit";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }

  try {
    const legacy = localStorage.getItem(LEGACY_PRACTICE_KEY);
    if (legacy) {
      const migrated = JSON.parse(legacy).map((entry) => ({
        ...entry,
        examType: entry.examType ?? "practice",
      }));
      saveStore(migrated);
      return migrated;
    }
  } catch {
    /* ignore */
  }

  return [];
}

function saveStore(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function parseSemesterId(semesterLabel) {
  const match = semesterLabel?.match(/\d+/);
  return match ? match[0] : "5";
}

function appendEntry(entry) {
  saveStore([entry, ...loadStore()]);
  return entry;
}

/**
 * @param {string | null | undefined} pendingId
 */
export function resolvePendingStatus(pendingId) {
  if (!pendingId) return "draft_saved";
  if (getAdminPendingExams().some((item) => item.id === pendingId)) return "pending_admin";
  if (getAdminApprovedExams().some((item) => item.id === pendingId)) return "approved";
  if (getAdminRejectedExams().some((item) => item.id === pendingId)) return "rejected";
  return "pending_admin";
}

function enrichLocalEntry(entry) {
  const status = entry.resolvedStatus
    ?? (entry.pendingId ? resolvePendingStatus(entry.pendingId) : "draft_saved");
  const rejected = entry.pendingId
    ? getAdminRejectedExams().find((item) => item.id === entry.pendingId)
    : null;

  return {
    ...entry,
    status,
    statusLabel: CONTRIBUTION_STATUS_LABELS[status],
    typeLabel: EXAM_CONTRIBUTION_TYPE_LABELS[entry.examType] ?? entry.examType,
    adminNote: rejected?.rejectReasonLabel ?? null,
    adminDetail: rejected?.rejectReasonFull ?? null,
  };
}

function getLocalDraftEntries(moderator, filters = {}) {
  let entries = loadStore().map(enrichLocalEntry);
  if (moderator) {
    entries = entries.filter((entry) => entry.moderator === moderator);
  }
  if (filters.examType && filters.examType !== "all") {
    entries = entries.filter((entry) => entry.examType === filters.examType);
  }
  if (filters.status && filters.status !== "all") {
    entries = entries.filter((entry) => entry.status === filters.status);
  }
  return entries.sort((a, b) => (a.at < b.at ? 1 : -1));
}

function getContributionExamId(entry) {
  return entry?.examApiId ?? entry?.pendingId ?? entry?.id ?? null;
}

function mergeContributionEntries(localEntries, apiEntries) {
  if (!apiEntries) {
    return localEntries;
  }

  const apiExamIds = new Set(
    apiEntries.map((entry) => getContributionExamId(entry)).filter(Boolean),
  );

  const localOnly = localEntries.filter((entry) => {
    if (entry.action === "draft_saved" && !entry.pendingId) {
      return true;
    }

    const examId = getContributionExamId(entry);
    return !examId || !apiExamIds.has(examId);
  });

  return [...localOnly, ...apiEntries].sort((a, b) => (a.at < b.at ? 1 : -1));
}

/**
 * @param {{
 *   examType: import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType;
 *   moderator: string;
 *   subjectCode: string;
 *   semester: string;
 *   title: string;
 *   description?: string;
 *   wizardStep?: string;
 * }} payload
 */
export function recordExamDraft(payload) {
  return appendEntry({
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    at: new Date().toISOString(),
    moderator: payload.moderator,
    examType: payload.examType,
    action: "draft_saved",
    subjectCode: payload.subjectCode,
    semester: payload.semester,
    title: payload.title.trim(),
    description: payload.description?.trim() ?? "",
    wizardStep: payload.wizardStep ?? null,
    pendingId: null,
  });
}

/**
 * @param {object} payload
 * @param {{ examInfo?: object; questions?: object[]; confirmDuplicate?: boolean }} [options]
 */
export async function submitExamForApproval(payload, options = {}) {
  const { examInfo, questions, confirmDuplicate = false } = options;
  const semesterId = parseSemesterId(payload.semester);

  const pending =
    payload.examType === "final"
      ? await submitModeratorFinalExam(
          {
            subjectCode: payload.subjectCode,
            subjectName: payload.title,
            semesterId,
            title: payload.title,
            description: payload.description,
            submittedBy: payload.moderator,
            examCode: payload.examCode,
            durationMinutes: payload.durationMinutes,
            questionCount: payload.questionCount,
            fileName: payload.fileName,
          },
          examInfo && questions ? mapFinalExamWizardToCreateRequest(examInfo, questions) : null,
          { confirmDuplicate },
        )
      : await submitModeratorPracticeExam(
          {
            subject: payload.subjectCode,
            semesterId,
            title: payload.title,
            description: payload.description ?? "",
            submittedBy: payload.moderator,
            attachments: payload.attachments,
            allowDiscussion: payload.allowDiscussion,
            pinExam: payload.pinExam,
          },
          mapPracticeExamFormToCreateRequest({
            subjectCode: payload.subjectCode,
            semester: payload.semester,
            title: payload.title,
            description: payload.description,
          }),
          { confirmDuplicate },
        );

  const audit = USE_MOCK
    ? appendEntry({
        id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        at: new Date().toISOString(),
        moderator: payload.moderator,
        examType: payload.examType,
        action: "submitted",
        subjectCode: payload.subjectCode,
        semester: payload.semester,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? "",
        pendingId: pending.id,
        examApiId: pending.apiId ?? pending.id,
        examCode: payload.examCode ?? null,
        questionCount: payload.questionCount ?? null,
      })
    : {
        id: pending.apiId ?? pending.id,
        at: pending.submittedAt ?? new Date().toISOString(),
        moderator: payload.moderator,
        examType: payload.examType,
        action: "submitted",
        subjectCode: payload.subjectCode,
        semester: payload.semester,
        title: payload.title.trim(),
        pendingId: pending.id,
        examApiId: pending.apiId ?? pending.id,
      };

  return { pending, audit };
}

export { ApiError };

/**
 * @param {string | undefined} moderator
 * @param {{ examType?: 'all' | import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType; status?: string }} [filters]
 */
export async function loadExamContributionAudit(moderator, filters = {}) {
  const { status, ...baseFilters } = filters;
  const localDrafts = getLocalDraftEntries(moderator, baseFilters);
  const apiEntries = await fetchModeratorExamContributions(moderator, baseFilters);

  if (apiEntries === null) {
    if (status && status !== "all") {
      return localDrafts.filter((entry) => entry.status === status);
    }
    return localDrafts;
  }

  let merged = mergeContributionEntries(localDrafts, apiEntries);
  if (status && status !== "all") {
    merged = merged.filter((entry) => entry.status === status);
  }
  return merged;
}

/** @deprecated Prefer loadExamContributionAudit */
export function getExamContributionAudit(moderator, filters = {}) {
  return getLocalDraftEntries(moderator, filters);
}

/** @param {string | undefined} moderator @param {import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType | 'all'} [examType] */
export async function loadPendingContributionCount(moderator, examType = "all") {
  const entries = await loadExamContributionAudit(moderator, { examType });
  return entries.filter((entry) => entry.status === "pending_admin").length;
}

/** @deprecated Prefer loadPendingContributionCount */
export function getPendingContributionCount(moderator, examType = "all") {
  return getLocalDraftEntries(moderator, { examType }).filter(
    (entry) => entry.status === "pending_admin",
  ).length;
}

/** @deprecated — dùng recordExamDraft với examType: 'practice' */
export function recordPracticeExamDraft(payload) {
  return recordExamDraft({
    examType: "practice",
    moderator: payload.moderator,
    subjectCode: payload.subject,
    semester: payload.semester,
    title: payload.title,
    description: payload.description,
  });
}

/** @deprecated — dùng getExamContributionAudit(..., { examType: 'practice' }) */
export function getPracticeExamContributionAudit(moderator) {
  return getExamContributionAudit(moderator, { examType: "practice" });
}

/**
 * @param {string} moderator
 * @param {object} examInfo
 * @param {number} completeCount
 * @param {string} [wizardStep]
 */
export function buildFinalExamContributionPayload(moderator, examInfo, completeCount, wizardStep) {
  return {
    examType: "final",
    moderator,
    subjectCode: examInfo.subjectCode,
    semester: examInfo.semesterLabel,
    title: examInfo.examCode || `${examInfo.subjectCode} — Cuối kỳ`,
    description: `${examInfo.subjectName} · ${completeCount}/${examInfo.totalQuestions} câu hoàn thiện`,
    wizardStep,
    examCode: examInfo.examCode,
    durationMinutes: examInfo.durationMinutes,
    questionCount: completeCount,
    fileName: `${examInfo.subjectCode}-final.pdf`,
  };
}

export { mapApiExamToContributionEntry };
