/**
 * Nhật ký đóng góp đề — Moderator (§2.4).
 * Mod thêm đề cuối kỳ / thực hành → gửi Admin duyệt trước khi public.
 * Tách biệt với bài nộp GitHub của sinh viên (§3.4).
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

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const STORAGE_KEY = "sehubs_moderator_exam_contribution_audit";
const LEGACY_PRACTICE_KEY = "sehubs_practice_exam_contribution_audit";

/** @typedef {'practice' | 'final'} ExamContributionType */
/** @typedef {'draft_saved' | 'submitted'} ModContributionAction */
/** @typedef {'draft_saved' | 'pending_admin' | 'approved' | 'rejected'} ContributionDisplayStatus */

export const EXAM_CONTRIBUTION_TYPE_LABELS = {
  practice: "Thực hành",
  final: "Cuối kỳ",
};

export const CONTRIBUTION_STATUS_LABELS = {
  draft_saved: "Lưu nháp",
  pending_admin: "Chờ Admin duyệt",
  approved: "Admin đã duyệt",
  rejected: "Admin từ chối",
};

export const CONTRIBUTION_TYPE_FILTERS = [
  { id: "all", label: "Tất cả loại đề" },
  { id: "final", label: "Cuối kỳ" },
  { id: "practice", label: "Thực hành" },
];

export const CONTRIBUTION_STATUS_FILTERS = [
  { id: "all", label: "Mọi trạng thái" },
  { id: "draft_saved", label: "Lưu nháp" },
  { id: "pending_admin", label: "Chờ Admin duyệt" },
  { id: "approved", label: "Đã duyệt" },
  { id: "rejected", label: "Từ chối" },
];

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
 * @returns {ContributionDisplayStatus}
 */
export function resolvePendingStatus(pendingId) {
  if (!pendingId) return "draft_saved";
  if (getAdminPendingExams().some((p) => p.id === pendingId)) return "pending_admin";
  if (getAdminApprovedExams().some((p) => p.id === pendingId)) return "approved";
  if (getAdminRejectedExams().some((p) => p.id === pendingId)) return "rejected";
  return "pending_admin";
}

function enrichEntry(entry) {
  const status = entry.resolvedStatus
    ?? (entry.pendingId ? resolvePendingStatus(entry.pendingId) : "draft_saved");
  const rejected = entry.pendingId
    ? getAdminRejectedExams().find((p) => p.id === entry.pendingId)
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

/**
 * @param {{
 *   examType: ExamContributionType;
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
 * @param {{
 *   examType: ExamContributionType;
 *   moderator: string;
 *   subjectCode: string;
 *   semester: string;
 *   title: string;
 *   description?: string;
 *   attachments?: Array<{ name?: string }>;
 *   allowDiscussion?: boolean;
 *   pinExam?: boolean;
 *   examCode?: string;
 *   durationMinutes?: number;
 *   questionCount?: number;
 *   fileName?: string;
 * }} payload
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

  const audit = appendEntry({
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
    resolvedStatus: USE_MOCK ? undefined : "pending_admin",
    examCode: payload.examCode ?? null,
    questionCount: payload.questionCount ?? null,
  });

  return { pending, audit };
}

export { ApiError };

/**
 * @param {string | undefined} moderator
 * @param {{ examType?: 'all' | ExamContributionType; status?: string }} [filters]
 */
export function getExamContributionAudit(moderator, filters = {}) {
  let entries = loadStore();
  if (moderator) {
    entries = entries.filter((e) => e.moderator === moderator);
  }
  if (filters.examType && filters.examType !== "all") {
    entries = entries.filter((e) => e.examType === filters.examType);
  }

  const enriched = entries.map(enrichEntry);

  if (filters.status && filters.status !== "all") {
    return enriched
      .filter((e) => e.status === filters.status)
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  }

  return enriched.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** @param {string | undefined} moderator @param {ExamContributionType | 'all'} [examType] */
export function getPendingContributionCount(moderator, examType = "all") {
  return getExamContributionAudit(moderator, { examType }).filter(
    (e) => e.status === "pending_admin",
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

/** @deprecated — dùng submitExamForApproval với examType: 'practice' */
export function submitPracticeExamForApproval(payload) {
  return submitExamForApproval({
    examType: "practice",
    moderator: payload.moderator,
    subjectCode: payload.subject,
    semester: payload.semester,
    title: payload.title,
    description: payload.description,
    attachments: payload.attachments,
    allowDiscussion: payload.allowDiscussion,
    pinExam: payload.pinExam,
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
