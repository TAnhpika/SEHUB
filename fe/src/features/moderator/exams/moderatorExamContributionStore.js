/**
 * @fileoverview Nhật ký đóng góp đề — Moderator (§2.4).
 *
 * Gửi duyệt qua API; lưu nháp giữ local cho đến khi gửi.
 * Merge bản ghi localStorage với dữ liệu API, resolve trạng thái pending/approved/rejected.
 *
 * @module features/moderator/exams/moderatorExamContributionStore
 * @see {@link module:features/moderator/exams/moderatorExamService} — fetch và map entry từ API
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
  enrichRevisionContributionEntries,
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

/** @constant {string} Key localStorage lưu nhật ký đóng góp đề. */
const STORAGE_KEY = "sehubs_moderator_exam_contribution_audit";

/** @constant {string} Key legacy — tự migrate sang `STORAGE_KEY` khi đọc. */
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
 * Suy ra trạng thái hiển thị của entry từ hàng chờ Admin (mock) theo `pendingId`.
 *
 * @param {string | null | undefined} pendingId - ID đề trên hàng chờ Admin.
 * @returns {import('@/features/moderator/exams/moderatorExamConstants').ContributionDisplayStatus}
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
 * Ghi nhận bản lưu nháp đóng góp đề vào localStorage (chưa gửi Admin).
 *
 * @param {{
 *   examType: import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType;
 *   moderator: string;
 *   subjectCode: string;
 *   semester: string;
 *   title: string;
 *   description?: string;
 *   wizardStep?: string;
 * }} payload - Thông tin đề đang soạn.
 * @returns {object} Entry audit vừa append.
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
 * Gửi đề cuối kỳ hoặc thực hành lên Admin duyệt qua API (hoặc mock).
 *
 * @param {object} payload - Payload đóng góp (examType, moderator, subjectCode, ...).
 * @param {{ examInfo?: object; questions?: object[]; confirmDuplicate?: boolean }} [options={}]
 *   - `examInfo` + `questions` bắt buộc cho đề cuối kỳ; `confirmDuplicate` bỏ qua HTTP 409.
 * @returns {Promise<{ pending: object, audit: object }>} Kết quả pending và entry audit.
 * @throws {import('@/api/httpClient').ApiError} Khi API trả lỗi (ví dụ 409 trùng nội dung).
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
            pinExam: payload.pinExam,
          },
          mapPracticeExamFormToCreateRequest({
            subjectCode: payload.subjectCode,
            semester: payload.semester,
            title: payload.title,
            description: payload.description,
            pinExam: payload.pinExam,
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
 * Tải nhật ký đóng góp đề — merge local draft + API, enrich revision.
 *
 * @param {string | undefined} moderator - Username Moderator (lọc entry).
 * @param {{ examType?: 'all' | import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType; status?: string }} [filters={}]
 * @returns {Promise<Array<object>>} Danh sách entry audit đã sort mới nhất trước.
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
  merged = enrichRevisionContributionEntries(merged);
  if (status && status !== "all") {
    merged = merged.filter((entry) => entry.status === status);
  }
  return merged;
}

/**
 * @deprecated Prefer {@link loadExamContributionAudit}
 * @param {string | undefined} moderator
 * @param {object} [filters={}]
 * @returns {Array<object>} Chỉ bản ghi local, không merge API.
 */
export function getExamContributionAudit(moderator, filters = {}) {
  return getLocalDraftEntries(moderator, filters);
}

/**
 * Đếm số đóng góp đang chờ Admin duyệt (async, merge local + API).
 *
 * @param {string | undefined} moderator - Username Moderator.
 * @param {import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType | 'all'} [examType="all"]
 * @returns {Promise<number>} Số entry có `status === 'pending_admin'`.
 */
export async function loadPendingContributionCount(moderator, examType = "all") {
  const entries = await loadExamContributionAudit(moderator, { examType });
  return entries.filter((entry) => entry.status === "pending_admin").length;
}

/**
 * @deprecated Prefer {@link loadPendingContributionCount}
 * @param {string | undefined} moderator
 * @param {import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType | 'all'} [examType]
 * @returns {number}
 */
export function getPendingContributionCount(moderator, examType = "all") {
  return getLocalDraftEntries(moderator, { examType }).filter(
    (entry) => entry.status === "pending_admin",
  ).length;
}

/**
 * @deprecated Dùng {@link recordExamDraft} với `examType: 'practice'`.
 * @param {object} payload - Payload legacy (subject, semester, title, ...).
 * @returns {object}
 */
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

/**
 * @deprecated Dùng {@link getExamContributionAudit} với `{ examType: 'practice' }`.
 * @param {string | undefined} moderator
 * @returns {Array<object>}
 */
export function getPracticeExamContributionAudit(moderator) {
  return getExamContributionAudit(moderator, { examType: "practice" });
}

/**
 * Xây payload đóng góp đề cuối kỳ từ state wizard để lưu nháp hoặc gửi duyệt.
 *
 * @param {string} moderator - Username Moderator.
 * @param {object} examInfo - Metadata đề wizard.
 * @param {number} completeCount - Số câu đã hoàn thiện.
 * @param {string} [wizardStep] - Nhãn bước wizard hiện tại (audit log).
 * @returns {object} Payload chuẩn cho `recordExamDraft` / `submitExamForApproval`.
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
