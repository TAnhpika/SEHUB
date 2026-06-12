/**
 * Nhật ký đóng góp đề — Moderator (§2.4).
 * Gửi duyệt qua API; lưu nháp giữ local cho đến khi gửi.
 */

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

function appendEntry(entry) {
  saveStore([entry, ...loadStore()]);
  return entry;
}

function enrichLocalEntry(entry) {
  const status = "draft_saved";
  return {
    ...entry,
    status,
    statusLabel: CONTRIBUTION_STATUS_LABELS[status],
    typeLabel: EXAM_CONTRIBUTION_TYPE_LABELS[entry.examType] ?? entry.examType,
    adminNote: null,
    adminDetail: null,
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
 * @param {string | undefined} moderator
 * @param {{ examType?: 'all' | import("@/features/moderator/exams/moderatorExamConstants").ExamContributionType; status?: string }} [filters]
 */
export async function loadExamContributionAudit(moderator, filters = {}) {
  const localDrafts = getLocalDraftEntries(moderator, filters);
  const apiEntries = await fetchModeratorExamContributions(moderator, filters);

  if (apiEntries === null) {
    return localDrafts;
  }

  const merged = [...localDrafts, ...apiEntries];
  return merged.sort((a, b) => (a.at < b.at ? 1 : -1));
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
