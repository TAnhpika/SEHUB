import * as adminApi from "@/api/adminApi";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import {
  mapExamDetailToWizard,
  mapFinalExamWizardToResubmitRequest,
  mapPracticeExamDetailToForm,
  mapPracticeExamFormToResubmitRequest,
  mapWizardQuestionsToCreateItems,
  syncQuestionGalleryImages,
} from "@/api/adminMapper";
import {
  buildExamDisplayFields,
  enrichRevisionExamEntries,
  extractCourseSubjectCode,
  isBareSubjectCode,
  normalizeCourseSubjectCode,
  resolveExamMajor,
} from "@/utils/examDisplay";
import { invalidateExamPaperCodeCache } from "@/utils/examPaperCode";
import {
  CONTRIBUTION_STATUS_LABELS,
  EXAM_CONTRIBUTION_TYPE_LABELS,
} from "@/features/moderator/exams/moderatorExamConstants";

/**
 * @fileoverview Tầng service API cho đóng góp đề của Moderator.
 *
 * Cung cấp:
 * - Map DTO API sang entry nhật ký đóng góp.
 * - Tạo body request đề cuối kỳ / thực hành.
 * - Tải đề để chỉnh sửa wizard, gửi lại (resubmit), tạo revision.
 * - Lấy danh sách đóng góp của Moderator hiện tại từ API.
 *
 * @module features/moderator/exams/moderatorExamService
 * @see {@link module:features/moderator/exams/moderatorExamContributionStore} — merge local + API audit
 */

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function parseSemesterId(semesterLabel) {
  const match = semesterLabel?.match(/\d+/);
  return match ? match[0] : "1";
}

function mapApiStatusToContribution(status, revisionOfExamId) {
  const value = String(status ?? "").toLowerCase();
  if (value === "pendingapproval") {
    return revisionOfExamId ? "pending_admin" : "pending_admin";
  }
  if (value === "draft") {
    return revisionOfExamId ? "revision_draft" : "draft_saved";
  }
  if (value === "published") return "approved";
  if (value === "rejected") return "rejected";
  if (value === "archived") return "rejected";
  return "pending_admin";
}

function mapApiExamType(examType) {
  return String(examType ?? "").toLowerCase() === "practice" ? "practice" : "final";
}

/**
 * Map DTO exam từ Admin API sang entry nhật ký đóng góp hiển thị trên UI.
 *
 * @param {object} dto - Exam DTO từ `adminApi.listExams` / `getExam`.
 * @param {string} moderatorUsername - Username Moderator sở hữu đóng góp.
 * @returns {object} Entry audit đã enrich label trạng thái, loại đề, mã hiển thị.
 */
export function mapApiExamToContributionEntry(dto, moderatorUsername) {
  const examType = mapApiExamType(dto.examType);
  const revisionOfExamId = dto.revisionOfExamId ?? null;
  const status = mapApiStatusToContribution(dto.status, revisionOfExamId);
  const subjectCodeRaw = dto.subjectCode ?? dto.code ?? "";
  const paperCodeRaw = dto.paperCode ?? dto.title ?? "";

  return {
    id: dto.id,
    at: dto.updatedAt ?? dto.createdAt,
    moderator: moderatorUsername,
    examType,
    action: revisionOfExamId ? "revision_submitted" : "submitted",
    subjectCode: isBareSubjectCode(subjectCodeRaw)
      ? (normalizeCourseSubjectCode(subjectCodeRaw) ?? subjectCodeRaw)
      : (dto.subjectName ? normalizeCourseSubjectCode(subjectCodeRaw) : extractCourseSubjectCode(subjectCodeRaw, paperCodeRaw)) ?? "",
    semester: dto.semester ? `Học kỳ ${dto.semester}` : "",
    title: paperCodeRaw,
    paperCode: paperCodeRaw,
    description: dto.description ?? "",
    pendingId: dto.id,
    examApiId: dto.id,
    examCode: paperCodeRaw || subjectCodeRaw,
    questionCount: dto.questionCount ?? null,
    status,
    statusLabel: CONTRIBUTION_STATUS_LABELS[status],
    typeLabel: EXAM_CONTRIBUTION_TYPE_LABELS[examType],
    adminNote: dto.rejectionReasonDetail ?? null,
    adminDetail: dto.rejectionReasonCode ?? null,
    canResubmit: dto.canResubmit ?? false,
    isContentLocked: dto.isContentLocked ?? false,
    revisionOfExamId,
    revisionSourceCode: dto.revisionSourceSubjectCode ?? dto.revisionSourceCode ?? null,
    revisionSourceTitle: dto.revisionSourcePaperCode ?? dto.revisionSourceTitle ?? null,
    ...buildExamDisplayFields({ ...dto, code: subjectCodeRaw, title: paperCodeRaw }),
  };
}

/**
 * Bổ sung thông tin hiển thị cho các entry revision (đề cập nhật từ bản public).
 *
 * @param {Array<object>} entries - Danh sách entry đóng góp.
 * @returns {Array<object>} Entries đã gắn `displayTitle`, `displayExamCode`.
 */
export function enrichRevisionContributionEntries(entries) {
  return enrichRevisionExamEntries(entries).map((entry) => ({
    ...entry,
    displayTitle: entry.displayTitle,
    displayExamCode: entry.displayExamCode,
  }));
}

/**
 * Xây body `createExam` cho đề cuối kỳ từ state wizard.
 *
 * @param {object} examInfo - Metadata đề wizard.
 * @param {Array<object>} questions - Danh sách câu hỏi wizard.
 * @returns {object} Body request API tạo đề Final.
 */
export function buildFinalExamCreateBody(examInfo, questions) {
  const apiQuestions = mapWizardQuestionsToCreateItems(questions);

  const subjectCode =
    normalizeCourseSubjectCode(examInfo.subjectCode) ?? examInfo.subjectCode.trim();
  const paperCode = examInfo.examCode?.trim();
  const major = resolveExamMajor({
    major: examInfo.major,
    subjectCode,
    semester: parseSemesterId(examInfo.semesterLabel),
  });

  return {
    subjectCode,
    paperCode: paperCode || `${subjectCode} — Cuối kỳ`,
    examType: "Final",
    description: `${examInfo.subjectName ?? subjectCode} · ${examInfo.durationMinutes} phút`,
    questions: apiQuestions,
  };
}

/**
 * Xây body `createExam` cho đề thực hành từ payload form.
 *
 * @param {object} payload - Payload form đề thực hành (subjectCode, title, ...).
 * @returns {object} Body request API tạo đề Practice (không kèm câu hỏi inline).
 */
export function buildPracticeExamCreateBody(payload) {
  const subjectCode =
    normalizeCourseSubjectCode(payload.subjectCode) ?? payload.subjectCode.trim();
  const paperCode = payload.title.trim();
  const major = resolveExamMajor({
    major: payload.major,
    subjectCode,
    semester: parseSemesterId(payload.semester),
  });

  return {
    subjectCode,
    paperCode,
    examType: "Practice",
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
 * Lấy danh sách đóng góp đề của Moderator từ API (bỏ qua khi `VITE_USE_MOCK=true`).
 *
 * @param {string | undefined} moderatorUsername - Username Moderator (dùng khi map entry).
 * @param {{ examType?: string; status?: string }} [filters={}] - Bộ lọc loại đề và trạng thái.
 * @returns {Promise<Array<object> | null>} Danh sách entry đã sort mới nhất trước; `null` khi mock mode.
 */
export async function fetchModeratorExamContributions(moderatorUsername, filters = {}) {
  if (USE_MOCK) {
    return null;
  }

  const params = { mine: true, pageSize: ADMIN_API_PAGE_SIZE };
  if (filters.examType === "final") params.type = "Final";
  if (filters.examType === "practice") params.type = "Practice";
  if (filters.status === "pending_admin") params.status = "PendingApproval";
  if (filters.status === "approved") params.status = "Published";
  if (filters.status === "rejected") params.status = "Rejected";

  const result = await adminApi.listExams(params);
  let entries = (result.items ?? []).map((dto) =>
    mapApiExamToContributionEntry(dto, moderatorUsername),
  );
  entries = enrichRevisionContributionEntries(entries);

  if (filters.status && filters.status !== "all" && filters.status !== "draft_saved") {
    entries = entries.filter((entry) => entry.status === filters.status);
  }

  return entries.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/**
 * Tải đề thực hành để chỉnh sửa và map sang model form.
 *
 * @param {string} examId - ID đề trên API.
 * @returns {Promise<object>} Form state (subjectCode, semester, attachments, ...).
 * @throws {Error} Khi API `getExam` thất bại.
 */
export async function loadPracticeExamForEdit(examId) {
  const dto = await adminApi.getExam(examId);
  return mapPracticeExamDetailToForm(dto);
}

/**
 * Gửi lại đề thực hành đã chỉnh sửa qua API resubmit.
 *
 * Upload file đính kèm mới (nếu có) sau khi resubmit thành công.
 *
 * @param {string} examId - ID đề cần gửi lại.
 * @param {object} payload - Payload form đề thực hành.
 * @param {{ isRevision?: boolean }} [options={}] - `isRevision: true` khi gửi bản cập nhật đề public.
 * @returns {Promise<object>} DTO exam sau resubmit (hoặc sau khi upload file).
 * @throws {Error} Khi resubmit hoặc upload attachment thất bại.
 */
export async function resubmitPracticeExamViaApi(examId, payload, { isRevision = false } = {}) {
  const body = mapPracticeExamFormToResubmitRequest(payload, { isRevision });
  const dto = await adminApi.resubmitExam(examId, body);

  const newFiles = (payload.attachments ?? []).filter(
    (file) => file.status === "done" && file.file instanceof File,
  );
  for (const attachment of newFiles) {
    await adminApi.uploadExamAttachment(examId, attachment.file);
  }

  invalidateExamPaperCodeCache();
  return newFiles.length > 0 ? adminApi.getExam(examId) : dto;
}

/**
 * Tạo đề cuối kỳ mới qua API (Admin flow hoặc backend trực tiếp).
 *
 * @param {object} examInfo - Metadata wizard.
 * @param {Array<object>} questions - Câu hỏi wizard.
 * @param {boolean} [confirmDuplicate=false] - Bỏ qua cảnh báo trùng SHA-256.
 * @returns {Promise<object>} DTO exam vừa tạo.
 * @throws {import('@/api/httpClient').ApiError} HTTP 409 khi trùng nội dung và chưa confirm.
 */
export async function createFinalExamViaApi(examInfo, questions, confirmDuplicate = false) {
  const body = buildFinalExamCreateBody(examInfo, questions);
  const dto = await adminApi.createExam(body, confirmDuplicate);
  const imageWarning = await syncQuestionGalleryImages(dto, questions);
  await uploadExamPdfIfPresent(dto.id, examInfo);
  invalidateExamPaperCodeCache();
  if (imageWarning) {
    dto.imageUploadWarning = imageWarning;
  }
  return dto;
}

/**
 * Tạo đề thực hành mới qua API.
 *
 * @param {object} payload - Payload form đề thực hành.
 * @param {boolean} [confirmDuplicate=false] - Bỏ qua cảnh báo trùng metadata.
 * @returns {Promise<object>} DTO exam vừa tạo.
 * @throws {import('@/api/httpClient').ApiError} HTTP 409 khi trùng metadata và chưa confirm.
 */
export async function createPracticeExamViaApi(payload, confirmDuplicate = false) {
  const body = buildPracticeExamCreateBody(payload);
  const dto = await adminApi.createExam(body, confirmDuplicate);
  await uploadExamPdfIfPresent(dto.id, payload);
  invalidateExamPaperCodeCache();
  return dto;
}

/**
 * Tải đề cuối kỳ để hydrate wizard chỉnh sửa.
 *
 * @param {string} examId - ID đề trên API.
 * @returns {Promise<{ examId: string, examInfo: object, questions: Array<object>, revisionOfExamId?: string | null }>}
 * @throws {Error} Khi API `getExam` thất bại.
 */
export async function loadExamForWizardEdit(examId) {
  const dto = await adminApi.getExam(examId);
  return {
    examId: dto.id,
    ...mapExamDetailToWizard(dto),
  };
}

/**
 * Gửi lại đề cuối kỳ đã chỉnh sửa qua API resubmit.
 *
 * @param {string} examId - ID đề cần gửi lại.
 * @param {object} examInfo - Metadata wizard.
 * @param {Array<object>} questions - Câu hỏi wizard.
 * @param {{ isRevision?: boolean }} [options={}] - `isRevision: true` khi gửi bản cập nhật.
 * @returns {Promise<object>} DTO exam sau resubmit.
 * @throws {Error} Khi API resubmit thất bại.
 */
export async function resubmitFinalExamViaApi(examId, examInfo, questions, { isRevision = false } = {}) {
  const body = mapFinalExamWizardToResubmitRequest(examInfo, questions, { isRevision });
  const dto = await adminApi.resubmitExam(examId, body);
  const imageWarning = await syncQuestionGalleryImages(dto, questions);
  if (imageWarning) {
    dto.imageUploadWarning = imageWarning;
  }
  return dto;
}

/**
 * Tạo bản nháp revision từ đề đã public để Moderator chỉnh sửa.
 *
 * Đề public giữ nguyên cho đến khi Admin duyệt bản cập nhật.
 *
 * @param {string} publishedExamId - ID đề đang public.
 * @returns {Promise<object>} DTO revision mới (chứa `id` bản nháp).
 * @throws {Error} Khi API `createExamRevision` thất bại.
 */
export async function createExamRevisionViaApi(publishedExamId) {
  return adminApi.createExamRevision(publishedExamId);
}
