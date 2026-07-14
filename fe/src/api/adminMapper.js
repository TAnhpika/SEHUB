import { FE_ID_BY_PLAN_CODE } from "@/api/premiumMapper";
import { resolveAssetUrl } from "@/api/assetUrl";
import {
  buildExamDisplayFields,
  extractCourseSubjectCode,
  isBareSubjectCode,
  isExamPaperCode,
  normalizeCourseSubjectCode,
  resolveExamMajor,
  resolvePublicExamName,
  stripRevisionLabel,
} from "@/utils/examDisplay";
import { mapModerationPostImages } from "@/utils/mapModerationPostImages";
import { getExamAssetFileName } from "@/utils/examAssetUrl";
import {
  mapImportedExamQuestions,
  sanitizeWizardQuestionContent,
} from "@/features/moderator/finalExams/finalExamData";
import {
  createDefaultExamTermFields,
  parseTermFromExamCode,
} from "@/features/exams/finalExam/examTermOptions";
import {
  extractQuestionImageUrl,
  stripQuestionImageMarkup,
} from "@/utils/examQuestionContent";
import { createPickerItemFromExisting, getNewImageFiles } from "@/features/posts/PostImagesPicker/PostImagesPicker";
import * as adminApi from "@/api/adminApi";

function mapQuestionImagesFromDto(question) {
  const fromDto = question.images ?? question.Images ?? [];
  if (fromDto.length > 0) {
    return fromDto.map((image) =>
      createPickerItemFromExisting({
        id: image.id ?? image.Id,
        url: resolveAssetUrl(image.imagePath ?? image.ImagePath ?? image.url),
        sortOrder: image.sortOrder ?? image.SortOrder ?? 0,
      }),
    );
  }

  const legacyUrl =
    question.imageUrl ??
    question.ImageUrl ??
    extractQuestionImageUrl(question.content ?? question.Content ?? "") ??
    null;
  if (!legacyUrl) return [];
  return [
    createPickerItemFromExisting({
      id: null,
      url: resolveAssetUrl(legacyUrl),
      sortOrder: 0,
    }),
  ];
}

function getKeptImageUrls(question) {
  return (question.images ?? [])
    .filter((item) => !item.file && (item.url || item.previewUrl))
    .map((item) => item.url ?? item.previewUrl)
    .filter(Boolean);
}

function isWizardQuestionFilled(question) {
  return Boolean(
    question.content?.trim() &&
      (question.optionLabels ?? ["A", "B", "C", "D"]).some((key) =>
        question.answers?.[key]?.trim(),
      ),
  );
}

/**
 * Upload file ảnh mới cho từng câu sau create/update exam (match theo OrderIndex).
 * @returns {Promise<string|null>} Warning message nếu có lỗi upload.
 */
export async function syncQuestionGalleryImages(examDto, wizardQuestions) {
  const filtered = (wizardQuestions ?? []).filter(isWizardQuestionFilled);
  const saved = [...(examDto?.questions ?? [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  let warning = null;
  for (let index = 0; index < filtered.length; index += 1) {
    const files = getNewImageFiles(filtered[index].images ?? []);
    const questionId = saved[index]?.id;
    if (!files.length || !questionId) continue;
    try {
      await adminApi.uploadExamQuestionImages(questionId, files);
    } catch (error) {
      warning = error.message ?? "Không tải được một số ảnh câu hỏi.";
    }
  }
  return warning;
}

/**
 * @fileoverview Mapper chuyển đổi DTO admin/moderation từ API sang shape UI nội bộ của SEHUB.
 *
 * Module này tập trung vào ba nhóm nghiệp vụ chính:
 * - Quản trị người dùng, thanh toán, voucher, dashboard.
 * - Duyệt và biên tập đề thi cuối kỳ/thực hành.
 * - Đồng bộ các object moderation/report sang format FE thống nhất.
 *
 * @module api/adminMapper
 */

/**
 * @typedef {Object} AdminMapperMetaOptions
 * @property {string} [fileName] - Tên file override khi map đề chờ duyệt.
 * @property {string} [submittedBy] - Người nộp override từ context FE.
 * @property {boolean} [urgent] - Đánh dấu ưu tiên xử lý.
 * @property {string} [githubGuide] - Hướng dẫn GitHub đã tách riêng.
 * @property {boolean} [pinExam] - Có ghim đề thực hành sau khi duyệt hay không.
 */

const ROLE_MAP = {
  student: "student",
  moderator: "moderator",
  admin: "admin",
};

/**
 * Format ngày cho màn hình admin theo chuẩn `YYYY-MM-DD`.
 *
 * @param {string|null|undefined} dateStr - Chuỗi ngày từ API.
 * @returns {string} Ngày đã format hoặc `—` nếu thiếu/không hợp lệ.
 */
function formatAdminDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Format ngày giờ cho màn hình admin theo chuẩn `YYYY-MM-DD HH:mm:ss`.
 *
 * @param {string|null|undefined} dateStr - Chuỗi ngày giờ từ API.
 * @returns {string} Ngày giờ đã format hoặc `—` nếu thiếu/không hợp lệ.
 */
function formatAdminDateTime(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Chuẩn hóa role backend sang role key FE.
 *
 * @param {string|null|undefined} role - Role từ API.
 * @returns {'student'|'moderator'|'admin'} Role đã chuẩn hóa cho UI/route guard.
 */
function mapRole(role) {
  return ROLE_MAP[String(role ?? "Student").toLowerCase()] ?? "student";
}

/**
 * Suy ra mã môn ngắn từ category tài liệu.
 *
 * @param {string|null|undefined} category - Tên category hoặc metadata tài liệu.
 * @returns {string} Subject code viết hoa; mặc định `SE`.
 */
function extractSubjectCode(category) {
  const match = category?.match(/^([A-Z0-9]+)/i);
  return match?.[1]?.toUpperCase() ?? "SE";
}

/**
 * Gắn nhãn quyền truy cập tài liệu theo access tier backend.
 *
 * @param {string|null|undefined} accessTier - Tầng truy cập từ API.
 * @returns {string} Nhãn hiển thị cho admin.
 */
function mapAccessTierLabel(accessTier) {
  if (accessTier === "PremiumFull") return "Premium";
  return "Free (3 trang)";
}

/**
 * Chuẩn hóa trạng thái đề thi backend sang status FE của admin.
 *
 * @param {string|null|undefined} status - Trạng thái gốc từ API.
 * @returns {'published'|'pending_approval'|'rejected'|'draft'} Status FE cho UI quản trị.
 */
function mapExamStatus(status) {
  const value = String(status ?? "").toLowerCase();
  if (value === "published") return "published";
  if (value === "pendingapproval") return "pending_approval";
  if (value === "rejected") return "rejected";
  if (value === "archived") return "draft";
  return "draft";
}

/**
 * Xác định loại đề để route đúng form/luồng xử lý.
 *
 * @param {string|null|undefined} examType - Loại đề từ API.
 * @returns {'practice'|'final'} Key loại đề phía FE.
 */
function mapExamTypeKey(examType) {
  return String(examType ?? "").toLowerCase() === "practice" ? "practice" : "final";
}

/**
 * Chuẩn hóa trạng thái giao dịch thanh toán sang enum FE.
 *
 * @param {string|null|undefined} status - Trạng thái giao dịch từ backend.
 * @returns {string} Status FE phục vụ badge/bộ lọc admin.
 */
function mapPaymentStatus(status) {
  const value = String(status ?? "").toLowerCase();
  if (value === "paid") return "activated";
  if (value === "refundrequested") return "refund_requested";
  if (value === "processingrefund") return "processing_refund";
  if (value === "refunded") return "refunded";
  if (value === "failed") return "failed";
  if (value === "cancelled") return "failed";
  if (value === "expired") return "expired";
  if (value === "waitingconfirmation") return "waiting_confirmation";
  if (value === "pending") return "pending_payment";
  return "pending_payment";
}

/**
 * Suy luận FE plan ID từ dữ liệu API thanh toán/subscription.
 *
 * Ưu tiên map trực tiếp qua `planCode`; nếu không có thì suy luận từ `planName`.
 *
 * @param {{planCode?: string|null, planName?: string|null}} params - Dữ liệu plan từ API.
 * @returns {'trial'|'semester'|'full'} FE plan ID gần đúng nhất.
 */
function inferPlanIdFromApi({ planCode, planName }) {
  const code = String(planCode ?? "").toLowerCase();
  if (code && FE_ID_BY_PLAN_CODE[code]) {
    return FE_ID_BY_PLAN_CODE[code];
  }

  const name = String(planName ?? "").toLowerCase();
  if (name.includes("8") || name.includes("semester") || name.includes("học kỳ")) {
    return "semester";
  }
  if (name.includes("4 năm") || name.includes("4 year") || name.includes("full") || name.includes("toàn khóa")) {
    return "full";
  }
  return "trial";
}

/**
 * Suy luận FE plan ID chỉ từ tên gói.
 *
 * @param {string|null|undefined} planName - Tên gói từ backend hoặc UI.
 * @returns {'trial'|'semester'|'full'} FE plan ID gần đúng nhất.
 */
function inferPlanIdFromName(planName) {
  return inferPlanIdFromApi({ planName });
}

/**
 * Tạo slug an toàn cho badge/rank/rule.
 *
 * @param {string|null|undefined} value - Chuỗi nguồn.
 * @returns {string} Slug lower-case dùng cho FE.
 */
function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Map DTO người dùng admin list sang card/table row của FE.
 *
 * @param {Object} dto - User DTO từ API admin.
 * @returns {Object} User item đã chuẩn hóa cho danh sách quản trị.
 */
export function mapAdminUserListItem(dto) {
  const role = mapRole(dto.role);

  return {
    id: dto.id,
    apiId: dto.id,
    username: dto.username,
    email: dto.email,
    displayName: dto.displayName,
    role,
    plan: role === "student" ? (dto.isPremium ? "Premium" : "Free") : "—",
    status: dto.isBanned ? "banned" : "active",
    joinedAt: formatAdminDate(dto.createdAt),
    points: dto.points ?? 0,
    levelName: dto.levelName ?? null,
    streakCount: dto.streakCount ?? 0,
    trustScore: dto.trustScore ?? null,
    trustTier: dto.trustTier ?? null,
    apiId: dto.id,
  };
}

/**
 * Map DTO người dùng chi tiết sang object phục vụ drawer/detail panel.
 *
 * @param {Object} dto - User detail DTO từ API admin.
 * @returns {Object} Chi tiết người dùng đã chuẩn hóa cho FE.
 */
export function mapAdminUserDetail(dto) {
  const role = mapRole(dto.role);
  const listItem = mapAdminUserListItem({
    ...dto,
    isPremium: dto.isPremium,
    isBanned: dto.isBanned,
    points: dto.points,
  });

  return {
    ...listItem,
    banReason: dto.banReason ?? null,
    bannedAt: dto.isBanned ? formatAdminDateTime(dto.banUntil ?? dto.createdAt) : null,
    premiumExpiresAt: dto.subscriptionExpiresAt
      ? formatAdminDate(dto.subscriptionExpiresAt)
      : null,
    premiumSince: dto.isPremium ? formatAdminDate(dto.createdAt) : null,
    points: dto.points ?? 0,
    levelName: dto.levelName ?? null,
    streakCount: dto.streakCount ?? 0,
    aiTokensConsumedToday: dto.aiTokensConsumedToday ?? 0,
    lastActivityDate: dto.lastActivityDate ? formatAdminDateTime(dto.lastActivityDate) : null,
    lastLogin: dto.lastLoginAt ? formatAdminDateTime(dto.lastLoginAt) : null,
    postsCount: dto.postsCount ?? 0,
    examsCompleted: dto.examsCompleted ?? 0,
    reportsFiled: dto.reportsFiled ?? 0,
    reportsAgainst: dto.reportsAgainst ?? 0,
    trust: dto.trust
      ? {
          score: dto.trust.score,
          tier: dto.trust.tier,
          conductScore: dto.trust.conductScore,
          competenceScore: dto.trust.competenceScore,
          engagementScore: dto.trust.engagementScore,
          confidence: dto.trust.confidence,
        }
      : null,
  };
}

function readExamSubjectCode(dto) {
  return dto.subjectCode ?? dto.code ?? "";
}

function readExamPaperCode(dto) {
  return dto.paperCode ?? dto.title ?? "";
}

/**
 * Map DTO đề thi sang item danh sách quản trị.
 *
 * Chuẩn hóa tên môn, mã đề, tệp đính kèm, trạng thái và metadata revision để các màn hình
 * pending/published/rejected dùng lại cùng một cấu trúc.
 *
 * @param {Object} dto - Exam DTO từ API admin/moderation.
 * @returns {Object} Exam list item thân thiện với UI.
 */
export function mapAdminExamListItem(dto) {
  const typeKey = mapExamTypeKey(dto.examType);
  const status = mapExamStatus(dto.status);
  const subjectCode = readExamSubjectCode(dto);
  const paperCode = readExamPaperCode(dto);
  const attachments = (dto.attachments ?? []).map((attachment) => ({
    id: attachment.id,
    name: attachment.originalFileName,
    contentType: attachment.contentType ?? "",
    fileSize: attachment.fileSize ?? 0,
    size: attachment.fileSize ?? 0,
    viewPath: attachment.viewPath,
    viewUrl: resolveAssetUrl(attachment.viewPath),
  }));
  const primaryAttachment = attachments[0];
  const assetUrl = primaryAttachment?.viewUrl ?? primaryAttachment?.viewPath ?? dto.assetUrl ?? null;

  return {
    id: dto.id,
    apiId: dto.id,
    code: subjectCode,
    title: paperCode,
    subjectCode,
    paperCode,
    type: typeKey === "practice" ? "Thực hành" : "Cuối kỳ",
    typeKey,
    track: dto.major ?? "SE",
    semester: dto.semester ?? "1",
    status,
    questions: dto.questionCount ?? 0,
    questionCount: dto.questionCount ?? 0,
    updatedAt: formatAdminDate(dto.updatedAt ?? dto.createdAt),
    createdAt: formatAdminDate(dto.createdAt),
    sha256: dto.contentHash ?? "",
    description: dto.description ?? "",
    assetUrl,
    attachments: attachments.length > 0
      ? attachments
      : assetUrl
        ? [{ id: "asset", name: assetUrl.split("/").pop() ?? "asset", url: assetUrl }]
        : [],
    revisionOfExamId: dto.revisionOfExamId ?? null,
    revisionSourceCode: dto.revisionSourceSubjectCode ?? dto.revisionSourceCode ?? null,
    revisionSourceTitle: dto.revisionSourcePaperCode ?? dto.revisionSourceTitle ?? null,
    rejectionReasonCode: dto.rejectionReasonCode ?? null,
    rejectionReasonDetail: dto.rejectionReasonDetail ?? null,
    rejectedAt: dto.rejectedAt ?? null,
    canResubmit: dto.canResubmit ?? false,
    isContentLocked: dto.isContentLocked ?? false,
    ...buildExamDisplayFields({ ...dto, code: subjectCode, title: paperCode }),
  };
}

/**
 * Map một câu hỏi review từ API sang model FE của trang xem/duyệt đề.
 *
 * Hỗ trợ cả dữ liệu mới (`correctOptionIds`) lẫn field legacy (`correct`, `correctOptionId`).
 *
 * @param {Object} question - DTO câu hỏi từ API.
 * @param {number} [index=0] - Index fallback khi dữ liệu không có `orderIndex`.
 * @returns {Object} Câu hỏi FE đã chuẩn hóa, gồm lựa chọn đúng và cờ multi-select.
 */
export function mapAdminReviewQuestion(question, index = 0) {
  const options = question.options ?? [];
  const optionTexts = options.map((opt) =>
    typeof opt === "string" ? opt : String(opt?.text ?? opt?.Text ?? ""),
  );

  const correctOptionIds = new Set(
    (question.correctOptionIds ?? question.CorrectOptionIds ?? [])
      .map((id) => String(id))
      .filter(Boolean),
  );
  const fallbackId = question.correctOptionId ?? question.CorrectOptionId;
  if (fallbackId && correctOptionIds.size === 0) {
    correctOptionIds.add(String(fallbackId));
  }

  const isMulti =
    String(question.questionType ?? question.QuestionType ?? "").toLowerCase() === "multiselect"
    || correctOptionIds.size > 1;

  const correctIndices = options
    .map((opt, optionIndex) => {
      const optId = String(opt?.id ?? opt?.Id ?? "");
      return correctOptionIds.has(optId) ? optionIndex : -1;
    })
    .filter((optionIndex) => optionIndex >= 0);

  const legacyCorrect =
    typeof question.correct === "number" && question.correct >= 0 ? question.correct : 0;

  const rawText = question.content ?? question.Content ?? question.text ?? "";
  const images = mapQuestionImagesFromDto(question);
  const imageUrl = images[0]?.previewUrl ?? images[0]?.url ?? null;

  return {
    id: question.orderIndex ?? question.OrderIndex ?? question.id ?? index + 1,
    text: stripQuestionImageMarkup(rawText),
    imageUrl,
    images,
    options: optionTexts,
    correct: correctIndices[0] ?? legacyCorrect,
    correctIndices: correctIndices.length > 0 ? correctIndices : [legacyCorrect],
    isMulti,
    requiredSelectCount:
      question.requiredSelectCount
      ?? question.RequiredSelectCount
      ?? (isMulti ? Math.max(correctIndices.length, 2) : 1),
  };
}

/**
 * Map DTO đề thi chi tiết sang object FE với danh sách câu hỏi đã chuẩn hóa.
 *
 * @param {Object} dto - Exam detail DTO từ API.
 * @returns {Object} Dữ liệu chi tiết đề thi phục vụ trang xem/chỉnh sửa admin.
 */
export function mapAdminExamDetail(dto) {
  const base = mapAdminExamListItem(dto);

  return {
    ...base,
    questions: dto.questions ?? [],
    questionsData: (dto.questions ?? []).map((question, index) =>
      mapAdminReviewQuestion(question, index),
    ),
  };
}

const WIZARD_ANSWER_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function parseSemesterNumber(semesterLabel) {
  const match = String(semesterLabel ?? "").match(/\d+/);
  return match ? match[0] : "1";
}

function getWizardOptionLabels(question) {
  const labels = (question.optionLabels ?? WIZARD_ANSWER_KEYS.slice(0, 4))
    .map((label) => String(label).trim().toUpperCase())
    .filter((label) => WIZARD_ANSWER_KEYS.includes(label));

  return labels.length > 0 ? labels : WIZARD_ANSWER_KEYS.slice(0, 4);
}

/**
 * Chuyển câu hỏi từ wizard FE sang payload tạo đề backend.
 *
 * Bỏ qua câu hỏi rỗng và chuẩn hóa lựa chọn đúng cho cả single choice lẫn multi-select.
 *
 * @param {Array<Object>} questions - Danh sách câu hỏi dạng wizard FE.
 * @returns {Array<Object>} Payload câu hỏi sẵn sàng gửi API tạo đề.
 */
export function mapWizardQuestionsToCreateItems(questions) {
  return questions
    .filter(isWizardQuestionFilled)
    .map((question, index) => {
      const optionLabels = getWizardOptionLabels(question);
      const options = optionLabels.map((key) => ({
        id: crypto.randomUUID(),
        label: key,
        text: question.answers[key]?.trim() ?? "",
      }));

      const isMulti = String(question.questionType ?? "").toLowerCase() === "multiselect";
      const correctLabels = isMulti
        ? (question.correctAnswers ?? []).filter((label) => optionLabels.includes(label))
        : [question.correctAnswer].filter(Boolean);

      const correctOptions = options.filter((option) => correctLabels.includes(option.label));
      const fallbackCorrect = correctOptions[0] ?? options[0];

      return {
        orderIndex: index + 1,
        content: sanitizeWizardQuestionContent(question.content).trim(),
        questionType: isMulti ? "MultiSelect" : "SingleChoice",
        requiredSelectCount: isMulti
          ? question.requiredSelectCount ?? correctOptions.length
          : null,
        options,
        correctOptionId: fallbackCorrect?.id,
        correctOptionIds: correctOptions.map((option) => option.id),
        imageUrls: getKeptImageUrls(question),
      };
    });
}

/**
 * Chuyển dữ liệu wizard đề cuối kỳ sang request tạo mới backend.
 *
 * @param {Object} examInfo - Metadata đề thi từ bước thông tin.
 * @param {Array<Object>} questions - Danh sách câu hỏi wizard.
 * @returns {Object} Payload tạo đề cuối kỳ.
 */
export function mapFinalExamWizardToCreateRequest(examInfo, questions) {
  const subjectCode =
    normalizeCourseSubjectCode(examInfo.subjectCode) ?? examInfo.subjectCode.trim();
  const paperCode = examInfo.examCode?.trim();
  const major = resolveExamMajor({
    major: examInfo.major,
    subjectCode,
    semester: parseSemesterNumber(examInfo.semesterLabel),
  });

  return {
    subjectCode,
    paperCode: paperCode || `${subjectCode} — Cuối kỳ`,
    examType: "Final",
    description: `${examInfo.subjectName ?? subjectCode} · ${examInfo.durationMinutes} phút`,
    questions: mapWizardQuestionsToCreateItems(questions),
  };
}

export function mapFinalExamWizardToUpdateRequest(examInfo, questions) {
  const subjectCode =
    normalizeCourseSubjectCode(examInfo.subjectCode) ?? examInfo.subjectCode.trim();
  const paperCode = examInfo.examCode?.trim() || `${subjectCode} — Cuối kỳ`;

  return {
    subjectCode,
    paperCode,
    examType: "Final",
    description: `${examInfo.subjectName ?? subjectCode} · ${examInfo.durationMinutes} phút`,
    questions: mapWizardQuestionsToCreateItems(questions),
  };
}

/**
 * Chuyển dữ liệu wizard đề cuối kỳ sang payload resubmit/revision.
 *
 * @param {Object} examInfo - Metadata đề thi từ wizard.
 * @param {Array<Object>} questions - Danh sách câu hỏi wizard.
 * @param {{isRevision?: boolean}} [options={}] - Cờ cho biết đây là đề revision.
 * @returns {Object} Payload resubmit đề cuối kỳ.
 */
export function mapFinalExamWizardToResubmitRequest(examInfo, questions, { isRevision = false } = {}) {
  const title = isRevision
    ? resolvePublicExamName({
        revisionSourceCode: examInfo.revisionSourceCode,
        revisionSourceTitle: examInfo.revisionSourceTitle,
        code: examInfo.examCode,
        title: examInfo.subjectName,
      })
    : examInfo.examCode?.trim() || examInfo.subjectName?.trim() || examInfo.subjectCode.trim();

  return {
    paperCode: title,
    description: `${examInfo.subjectName ?? examInfo.subjectCode} · ${examInfo.durationMinutes} phút`,
    questions: mapWizardQuestionsToCreateItems(questions),
  };
}

/**
 * Map DTO đề thi chi tiết sang state đầu vào cho wizard FE.
 *
 * @param {Object} dto - DTO đề thi chi tiết từ API.
 * @returns {Object} State khởi tạo cho wizard chỉnh sửa/resubmit.
 */
export function mapExamDetailToWizard(dto) {
  const rawQuestions = dto.questions ?? dto.questionsData ?? [];
  const wizardQuestions = mapImportedExamQuestions(rawQuestions);

  const durationMatch = String(dto.description ?? "").match(/(\d+)\s*phút/);
  const durationMinutes = durationMatch ? Number(durationMatch[1]) : 60;
  const questionCount = Math.max(dto.questionCount ?? 0, wizardQuestions.length, 1);
  const subjectCode = readExamSubjectCode(dto);
  const paperCode = isExamPaperCode(readExamPaperCode(dto))
    ? stripRevisionLabel(readExamPaperCode(dto))
    : resolvePublicExamName({ ...dto, code: subjectCode, title: readExamPaperCode(dto) });
  const major = resolveExamMajor({
    major: dto.major,
    subjectCode,
    semester: dto.semester,
  });
  const termParts = parseTermFromExamCode(paperCode);
  const defaultTerm = createDefaultExamTermFields();

  return {
    examInfo: {
      subjectCode,
      subjectName:
        dto.subjectName
        ?? ((String(dto.description ?? "").split(" · ")[0]?.trim()) || paperCode),
      major,
      semesterLabel: dto.semester ? `Học kỳ ${dto.semester}` : "",
      termSeason: termParts?.termSeason ?? defaultTerm.termSeason,
      academicYear: termParts?.academicYear ?? defaultTerm.academicYear,
      examCode: paperCode,
      revisionSourceCode: dto.revisionSourceSubjectCode ?? dto.revisionSourceCode ?? null,
      revisionSourceTitle: dto.revisionSourcePaperCode ?? dto.revisionSourceTitle ?? null,
      durationMinutes,
      totalQuestions: questionCount,
    },
    questions: wizardQuestions.length ? wizardQuestions : undefined,
    revisionOfExamId: dto.revisionOfExamId ?? null,
    canResubmit: dto.canResubmit ?? false,
    isContentLocked: dto.isContentLocked ?? false,
  };
}

function normalizeCreateExamOption(option, optionIndex) {
  if (typeof option === "string") {
    return {
      id: crypto.randomUUID(),
      label: String.fromCharCode(65 + optionIndex),
      text: option.trim(),
    };
  }

  const label =
    String(option?.label ?? option?.Label ?? "").trim() ||
    String.fromCharCode(65 + optionIndex);
  const text = String(option?.text ?? option?.Text ?? "").trim();

  return {
    id: option?.id ?? option?.Id ?? crypto.randomUUID(),
    label,
    text,
  };
}

function resolveCorrectOptionIds(question, options) {
  const fromRequest = (question.correctOptionIds ?? question.CorrectOptionIds ?? [])
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);
  if (fromRequest.length > 0) {
    const optionIds = new Set(options.map((option) => String(option.id)));
    const valid = fromRequest.filter((id) => optionIds.has(id));
    if (valid.length > 0) {
      return valid;
    }
  }

  const singleId = question.correctOptionId ?? question.CorrectOptionId;
  if (singleId) {
    return [String(singleId)];
  }

  if (Number.isInteger(question.correct) && question.correct >= 0) {
    const match = options[question.correct];
    if (match?.id) {
      return [String(match.id)];
    }
  }

  return options[0]?.id ? [String(options[0].id)] : [];
}

/**
 * Chuẩn hóa danh sách câu hỏi OCR/mock sang payload tạo đề backend.
 *
 * Dùng cho luồng import từ OCR hoặc dữ liệu AI/mock, đảm bảo ảnh câu hỏi được giữ trong `content`.
 *
 * @param {Array<Object>} questions - Danh sách câu hỏi thô từ OCR/mock.
 * @returns {Array<Object>} Payload câu hỏi đã chuẩn hóa cho backend.
 */
export function mapMockOcrQuestionsToCreateItems(questions) {
  return (questions ?? []).map((question, index) => {
    const options = (question.options ?? []).map(normalizeCreateExamOption);
    const correctOptionIds = resolveCorrectOptionIds(question, options);
    const fallbackCorrect = options.find((option) => correctOptionIds.includes(String(option.id))) ?? options[0];
    const questionType = String(question.questionType ?? question.QuestionType ?? "").toLowerCase();
    const isMulti = questionType === "multiselect";
    const baseContent = stripQuestionImageMarkup(
      String(question.content ?? question.Content ?? question.text ?? "").trim(),
    );
    const imageUrls = getKeptImageUrls({
      images: mapQuestionImagesFromDto(question),
    });

    return {
      orderIndex: question.orderIndex ?? question.OrderIndex ?? index + 1,
      content: baseContent,
      questionType: isMulti ? "MultiSelect" : "SingleChoice",
      requiredSelectCount: isMulti
        ? question.requiredSelectCount ?? question.RequiredSelectCount ?? correctOptionIds.length
        : null,
      options,
      correctOptionId: fallbackCorrect?.id ?? crypto.randomUUID(),
      correctOptionIds,
      imageUrls,
    };
  });
}

/**
 * Chuyển form tạo đề admin sang request tạo mới backend.
 *
 * @param {Object} form - Form FE của admin.
 * @param {{questions?: Array<Object>}} [options={}] - Danh sách câu hỏi đã chuẩn hóa.
 * @returns {Object} Payload tạo đề mới.
 */
export function mapAdminExamFormToCreateRequest(form, { questions = [] } = {}) {
  const githubGuide =
    form.githubGuide ??
    "Nộp link repository GitHub công khai. README ghi rõ MSSV, họ tên và hướng dẫn chạy project.";

  const subjectCode =
    normalizeCourseSubjectCode(form.code) ?? String(form.code ?? "").trim();
  const paperCode = String(form.title ?? "").trim();

  const description =
    form.typeKey === "practice"
      ? [form.description?.trim(), githubGuide].filter(Boolean).join("\n\n")
      : form.description?.trim() ?? "";

  return {
    subjectCode,
    paperCode,
    examType: form.typeKey === "final" ? "Final" : "Practice",
    description,
    questions,
  };
}

/**
 * Chuyển form sửa đề admin sang request cập nhật backend.
 *
 * @param {Object} form - Form FE hiện tại.
 * @param {{questions?: Array<Object>|null}} [options={}] - Câu hỏi cập nhật nếu có.
 * @returns {Object} Payload update đề.
 */
export function mapAdminExamFormToUpdateRequest(form, { questions = null } = {}) {
  const subjectCode =
    normalizeCourseSubjectCode(form.code) ?? String(form.code ?? "").trim();
  const paperCode = String(form.title ?? "").trim();

  const body = {
    subjectCode,
    paperCode,
    examType: form.typeKey === "final" ? "Final" : "Practice",
    description: form.description?.trim() ?? "",
  };

  if (Array.isArray(questions)) {
    body.questions = questions;
  }

  return body;
}

/**
 * Chuyển form đề thực hành sang payload tạo mới backend.
 *
 * @param {Object} form - Practice exam form FE.
 * @returns {Object} Payload tạo đề thực hành.
 */
export function mapPracticeExamFormToCreateRequest(form) {
  const githubGuide =
    form.githubGuide ??
    "Nộp link repository GitHub công khai. README ghi rõ MSSV, họ tên và hướng dẫn chạy project.";
  const subjectCode =
    normalizeCourseSubjectCode(form.subjectCode) ?? form.subjectCode.trim();
  const paperCode = form.title.trim();
  const major = resolveExamMajor({
    major: form.major,
    subjectCode,
    semester: parseSemesterNumber(form.semester),
  });

  return {
    subjectCode,
    paperCode,
    examType: "Practice",
    description: [form.description, githubGuide].filter(Boolean).join("\n\n"),
    questions: [],
    isPinned: Boolean(form.pinExam),
  };
}

/**
 * Map đề đang chờ duyệt sang item hàng chờ admin.
 *
 * Có thể bổ sung metadata từ FE như tên file, người nộp hoặc cờ ưu tiên.
 *
 * @param {Object} dto - Pending exam DTO từ API.
 * @param {AdminMapperMetaOptions} [meta={}] - Metadata bổ sung từ FE.
 * @returns {Object} Pending exam item dùng cho list/detail.
 */
export function mapPendingExamListItem(dto, meta = {}) {
  const base = mapAdminExamListItem(dto);
  const primaryAttachment = base.attachments?.[0];
  const fileName =
    meta.fileName ??
    primaryAttachment?.name ??
    (base.assetUrl ? getExamAssetFileName(base.assetUrl) : null) ??
    "Chưa có file đính kèm";
  const submittedBy =
    meta.submittedBy ??
    dto.submittedByUsername ??
    dto.submittedByDisplayName ??
    "—";

  return {
    ...base,
    submittedBy,
    submittedAt: base.createdAt,
    urgent: Boolean(meta.urgent),
    fileName,
    assetUrl: base.assetUrl ?? primaryAttachment?.viewUrl ?? primaryAttachment?.viewPath ?? null,
    githubGuide: meta.githubGuide ?? (base.typeKey === "practice" ? githubGuideFromDescription(base.description) : ""),
    pinExam: meta.pinExam ?? false,
  };
}

const EXAM_REJECT_REASON_LOOKUP = {
  ocr_error: "OCR sai / thiếu câu hỏi hoặc đáp án",
  duplicate: "Trùng đề đã publish (SHA / nội dung)",
  wrong_meta: "Sai mã môn, kỳ học hoặc loại đề",
  low_quality: "Chất lượng đề không đạt (mơ hồ, lỗi format)",
  policy: "Vi phạm quy định / nội dung không phù hợp",
  other: "Lý do khác",
};

/**
 * Map DTO đề bị từ chối sang item FE có nhãn lý do đầy đủ.
 *
 * @param {Object} dto - Rejected exam DTO từ API.
 * @returns {Object} Rejected exam item cho tab/history bị từ chối.
 */
export function mapRejectedExamFromApi(dto) {
  const base = mapPendingExamListItem(dto);
  const reasonCode = dto.rejectionReasonCode ?? "";
  const reasonLabel = EXAM_REJECT_REASON_LOOKUP[reasonCode] ?? (reasonCode || "—");
  const detail = dto.rejectionReasonDetail?.trim() ?? "";

  return {
    ...base,
    rejectedAt: formatAdminDate(dto.rejectedAt ?? dto.updatedAt),
    rejectReasonId: reasonCode,
    rejectReasonLabel: reasonLabel,
    rejectReasonDetail: detail,
    rejectReasonFull: detail ? `${reasonLabel} — ${detail}` : reasonLabel,
  };
}

/**
 * Map DTO đề đã duyệt sang item FE cho lịch sử phê duyệt.
 *
 * @param {Object} dto - Approved exam DTO từ API.
 * @returns {Object} Approved exam item.
 */
export function mapApprovedExamFromApi(dto) {
  const base = mapPendingExamListItem(dto);
  return {
    ...base,
    approvedAt: formatAdminDate(dto.updatedAt ?? dto.createdAt),
    publishedExamId: dto.id,
  };
}

/**
 * Chuyển form resubmit đề thực hành sang payload backend.
 *
 * @param {Object} payload - Dữ liệu form FE.
 * @param {{isRevision?: boolean}} [options={}] - Có phải revision của đề cũ hay không.
 * @returns {Object} Payload resubmit đề thực hành.
 */
export function mapPracticeExamFormToResubmitRequest(payload, { isRevision = false } = {}) {
  const title = isRevision
    ? resolvePublicExamName({
        revisionSourceCode: payload.revisionSourceCode,
        revisionSourceTitle: payload.revisionSourceTitle,
        code: payload.title,
        title: payload.title,
      })
    : payload.title?.trim() ?? "";

  return {
    paperCode: title,
    description: payload.description?.trim() ?? "",
    questions: [],
  };
}

/**
 * Map chi tiết đề thực hành từ API về form FE để chỉnh sửa/resubmit.
 *
 * @param {Object} dto - Practice exam detail DTO.
 * @returns {Object} Form state đã được tách subject/title/attachments.
 */
export function mapPracticeExamDetailToForm(dto) {
  const subjectCode = isBareSubjectCode(readExamSubjectCode(dto))
    ? (normalizeCourseSubjectCode(readExamSubjectCode(dto)) ?? readExamSubjectCode(dto))
    : (extractCourseSubjectCode(
      readExamSubjectCode(dto),
      dto.revisionSourceSubjectCode ?? dto.revisionSourceCode,
      readExamPaperCode(dto),
    ) ?? readExamSubjectCode(dto));
  const paperCode = isExamPaperCode(readExamPaperCode(dto))
    ? stripRevisionLabel(readExamPaperCode(dto))
    : resolvePublicExamName({ ...dto, code: subjectCode, title: readExamPaperCode(dto) });
  const description = String(dto.description ?? "").split("\n\n")[0]?.trim() ?? dto.description ?? "";

  return {
    examId: dto.id,
    revisionOfExamId: dto.revisionOfExamId ?? null,
    revisionSourceCode: dto.revisionSourceCode ?? null,
    revisionSourceTitle: dto.revisionSourceTitle ?? null,
    subjectCode,
    semester: dto.semester ? `Học kỳ ${dto.semester}` : "",
    title: paperCode,
    description,
    attachments: (dto.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.originalFileName,
      status: "done",
      existing: true,
      sizeLabel: attachment.fileSize ? `${(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB` : "",
      type: String(attachment.contentType ?? "").includes("pdf") ? "pdf" : "zip",
      contentType: attachment.contentType ?? "",
      fileSize: attachment.fileSize ?? 0,
    })),
  };
}

function githubGuideFromDescription(description) {
  const parts = String(description ?? "").split("\n\n");
  return parts.length > 1 ? parts.slice(1).join("\n\n") : "";
}

/**
 * Map response tạo đề sang item pending để FE chèn ngay vào queue hiện tại.
 *
 * @param {Object} dto - DTO phản hồi từ API sau khi tạo đề.
 * @param {AdminMapperMetaOptions} [payload={}] - Metadata FE vừa submit.
 * @returns {Object} Pending exam item.
 */
export function mapPendingExamFromCreate(dto, payload = {}) {
  return mapPendingExamListItem(dto, {
    submittedBy: payload.submittedBy,
    fileName: payload.fileName,
    githubGuide: payload.githubGuide,
    pinExam: payload.pinExam,
  });
}

/**
 * Map DTO tài liệu sang item danh sách quản trị tài liệu.
 *
 * @param {Object} dto - Document DTO từ API.
 * @returns {Object} Document item cho admin table.
 */
export function mapAdminDocumentListItem(dto) {
  const subject = extractSubjectCode(dto.category);

  return {
    id: dto.id,
    apiId: dto.id,
    categoryId: dto.categoryId,
    name: dto.title,
    subject,
    semester: dto.semester ? String(dto.semester) : "1",
    track: "SE",
    access: mapAccessTierLabel(dto.accessTier),
    pages: dto.pageCount ?? 0,
    uploadedAt: formatAdminDateTime(dto.createdAt),
    source: "upload",
    description: dto.category ?? dto.title ?? "",
    mimeType: dto.mimeType ?? null,
    filePath: dto.filePath ?? null,
    categoryId: dto.categoryId ?? null,
    isDeleted: Boolean(dto.isDeleted),
  };
}

/**
 * Map audit log liên quan thanh toán sang item FE.
 *
 * @param {Object} dto - Payment audit log DTO.
 * @returns {Object} Audit log item với username mục tiêu đã trích xuất nếu có.
 */
export function mapPaymentAuditLogItem(dto) {
  const action = String(dto.action ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  let targetUsername = "—";
  if (dto.payloadJson) {
    try {
      const payload = JSON.parse(dto.payloadJson);
      targetUsername =
        payload.Username ??
        payload.username ??
        payload.UserName ??
        payload.userName ??
        "—";
    } catch {
      targetUsername = "—";
    }
  }

  return {
    id: dto.id,
    at: dto.createdAt,
    admin: dto.actorUsername ?? "admin",
    action,
    username: targetUsername,
    detail: dto.detail ?? null,
    payloadJson: dto.payloadJson ?? null,
    meta: { paymentId: dto.orderId, orderId: dto.orderId },
    sortKey: dto.createdAt,
    type: "payment",
  };
}

/**
 * Map DTO giao dịch thanh toán sang item danh sách admin payments.
 *
 * @param {Object} dto - Payment DTO từ API.
 * @returns {Object} Payment item đã chuẩn hóa.
 */
export function mapAdminPaymentListItem(dto) {
  const mappedStatus = mapPaymentStatus(dto.status);

  return {
    id: dto.id,
    apiId: dto.id,
    payosOrderId: dto.payOsOrderCode,
    username: dto.username,
    userEmail: dto.userEmail ?? null,
    planId: inferPlanIdFromApi({ planCode: dto.planCode, planName: dto.planName }),
    amount: Number(dto.amount ?? 0),
    transferContent: dto.payOsOrderCode,
    status: mappedStatus,
    webhookAt: dto.paidAt ? formatAdminDateTime(dto.paidAt) : null,
    activatedAt:
      mappedStatus === "activated" ||
      mappedStatus === "refund_requested" ||
      mappedStatus === "processing_refund" ||
      mappedStatus === "refunded"
        ? formatAdminDateTime(dto.paidAt ?? dto.createdAt)
        : null,
    createdAt: formatAdminDateTime(dto.createdAt),
    planName: dto.planName ?? null,
    refundReason: dto.refundRequestReason ?? null,
    refundRequestedAt: dto.refundRequestedAt
      ? formatAdminDateTime(dto.refundRequestedAt)
      : null,
    note:
      mappedStatus === "refund_requested" && dto.refundRequestReason
        ? `SV yêu cầu hoàn tiền: ${dto.refundRequestReason}`
        : null,
  };
}

function mapReportStatus(status) {
  const value = String(status ?? "Pending").toLowerCase();
  return value === "pending" ? "pending" : "resolved";
}

export {
  mapModerationPostDetail,
  mapModerationPostListItem,
  mapModerationUiStatus,
} from "./contentModerationMapper";

/**
 * Map DTO báo cáo community/user sang item danh sách báo cáo admin.
 *
 * @param {Object} dto - Report DTO từ API.
 * @returns {Object} Report item cho admin report queue.
 */
export function mapAdminReportListItem(dto) {
  const status = mapReportStatus(dto.status);

  return {
    id: dto.id,
    apiId: dto.id,
    kind: dto.kind ?? "post",
    postId: dto.postId,
    commentId: dto.commentId ?? null,
    reasonId: "other",
    reason: dto.reason,
    reporter: dto.reporter?.username ?? "unknown",
    reporterId: dto.reporter?.id ?? null,
    reportedUser: dto.reportedUser?.username ?? "unknown",
    reportedUserId: dto.reportedUser?.id ?? null,
    reportedUserTrustScore: dto.reportedUser?.trustScore ?? null,
    reportedUserTrustTier: dto.reportedUser?.trustTier ?? null,
    status,
    urgent: false,
    createdAt: formatAdminDateTime(dto.createdAt),
    createdAtIso: dto.createdAt,
    post: {
      author: dto.reportedUser?.username ?? dto.reporter?.username ?? "unknown",
      postedAt: formatAdminDateTime(dto.createdAt),
      title: dto.postTitle,
      excerpt: dto.commentExcerpt ?? dto.postExcerpt ?? dto.postTitle,
    },
    resolution: dto.resolvedAt
      ? {
          action: String(dto.status ?? "Resolved"),
          note: dto.reason,
          resolvedAt: formatAdminDateTime(dto.resolvedAt),
          resolvedBy: dto.resolvedBy?.username ?? "admin",
        }
      : undefined,
  };
}

/**
 * Map DTO người dùng bị khóa sang item FE cho tab banned users.
 *
 * @param {Object} dto - Ban record DTO từ API.
 * @returns {Object} Banned user item đã chuẩn hóa thời hạn và loại khóa.
 */
export function mapAdminBannedUser(dto) {
  const banType = String(dto.banType ?? "").toLowerCase();
  const type = banType.includes("permanent") ? "permanent" : "temporary";

  return {
    id: dto.id,
    apiId: dto.id,
    userId: dto.userId,
    username: dto.username,
    displayName: dto.displayName,
    email: "",
    reason: dto.reason ?? "—",
    bannedBy: dto.actorUsername ?? "Admin SEHub",
    bannedAt: formatAdminDateTime(dto.createdAt),
    until: dto.until ? formatAdminDate(dto.until) : null,
    type,
    days: dto.until
      ? Math.max(
          1,
          Math.ceil((new Date(dto.until).getTime() - new Date(dto.createdAt).getTime()) / 86400000),
        )
      : undefined,
  };
}

function mapLevelNameToRank(levelName) {
  const normalized = String(levelName ?? "").trim().toLowerCase();
  if (normalized.includes("platinum")) return "platinum";
  if (normalized.includes("gold")) return "gold";
  if (normalized.includes("silver")) return "silver";
  return "bronze";
}

function mapViolationHistoryItem(dto) {
  const banType = String(dto.banType ?? "").toLowerCase();
  let actionLabel = "Ghi nhận";
  if (banType.includes("warning")) actionLabel = "Cảnh báo";
  else if (banType.includes("temp")) actionLabel = "Khóa tạm";
  else if (banType.includes("permanent")) actionLabel = "Khóa vĩnh viễn";

  return {
    id: dto.id,
    banType: dto.banType,
    actionLabel,
    reason: dto.reason ?? "—",
    until: dto.until ? formatAdminDateTime(dto.until) : null,
    createdAt: formatAdminDateTime(dto.createdAt),
    actorUsername: dto.actorUsername ?? "Moderator",
  };
}

/**
 * Map user vi phạm sang item FE cho màn moderator/admin xử lý vi phạm.
 *
 * @param {Object} dto - Violating user DTO từ API.
 * @returns {Object} Dữ liệu người dùng vi phạm cho list/detail.
 */
export function mapViolatingUser(dto) {
  const displayName = dto.displayName ?? dto.username ?? "Unknown";
  const username = dto.username ?? "unknown";
  const semesterLabel = dto.semester ? `Kỳ ${dto.semester}` : null;
  const subtitle = [dto.major, semesterLabel].filter(Boolean).join(" · ") || `@${username}`;

  return {
    id: dto.id,
    apiId: dto.id,
    username,
    studentId: subtitle,
    displayName,
    email: dto.email ?? "",
    department: dto.major ? `Chuyên ngành ${dto.major}` : "—",
    major: dto.major ?? null,
    semester: dto.semester ?? null,
    rank: mapLevelNameToRank(dto.levelName),
    levelName: dto.levelName ?? null,
    points: dto.points ?? 0,
    violations: dto.violationCount ?? 0,
    warningCount: dto.warningCount ?? 0,
    status: String(dto.status ?? "normal").toLowerCase(),
    banType: dto.banType ?? null,
    lockDurationDays: dto.lockDurationDays ?? null,
    lockedUntil: dto.banUntil ?? null,
    banReason: dto.banReason ?? null,
    lastActionAt: dto.lastActionAt ?? null,
    initial: displayName.charAt(0).toUpperCase(),
  };
}

/**
 * Map chi tiết user vi phạm, bổ sung lịch sử xử lý.
 *
 * @param {Object} dto - Violating user detail DTO.
 * @returns {Object} Dữ liệu chi tiết gồm history.
 */
export function mapViolatingUserDetail(dto) {
  return {
    ...mapViolatingUser(dto),
    tempBanCount: dto.tempBanCount ?? 0,
    history: (dto.history ?? []).map(mapViolationHistoryItem),
  };
}

/**
 * Map cấu hình level/rank backend sang tier FE.
 *
 * @param {Object} dto - Level config DTO.
 * @param {number} index - Thứ tự trong danh sách để tạo `sortOrder`.
 * @returns {Object} Rank tier dùng cho trang quản lý rank/voucher.
 */
export function mapLevelConfigToRankTier(dto, index) {
  const slug = slugify(dto.name) || `rank-${index + 1}`;

  return {
    id: dto.id ?? slug,
    apiId: dto.id ?? null,
    slug,
    name: dto.name,
    minPoints: dto.minPoints ?? 0,
    sortOrder: index + 1,
    colorKey: slug.includes("silver") ? "silver" : slug.includes("gold") ? "gold" : slug.includes("platinum") ? "platinum" : "bronze",
    voucherDiscount: dto.voucherPercent ?? null,
    rewardLabel: dto.voucherPercent ? `Voucher FTES ${dto.voucherPercent}%` : "",
    description: dto.name,
    active: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Map badge DTO từ backend admin sang shape FE.
 *
 * @param {Object} dto - Badge DTO từ API.
 * @returns {Object} Badge admin item.
 */
export function mapBadgeAdminDto(dto) {
  let meta = {};
  if (dto.conditionJson) {
    try {
      const parsed = JSON.parse(dto.conditionJson);
      if (parsed && typeof parsed === "object") meta = parsed;
    } catch {
      meta = { description: dto.conditionJson };
    }
  }

  const slug = meta.slug ?? slugify(dto.code || dto.name);

  return {
    id: dto.id,
    apiId: dto.id,
    slug,
    name: dto.name,
    description: meta.description ?? dto.name,
    category: meta.category ?? "community",
    triggerType: meta.triggerType ?? "custom",
    triggerValue: meta.triggerValue ?? 1,
    pointsReward: meta.pointsReward ?? 0,
    icon: meta.icon ?? "🏅",
    active: meta.active !== false,
    unlockCount: dto.earnedCount ?? 0,
    createdAt: meta.createdAt ?? new Date().toISOString(),
    updatedAt: meta.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Chuyển badge FE sang payload tạo mới backend.
 *
 * @param {Object} data - Dữ liệu badge từ form FE.
 * @returns {Object} Payload tạo badge.
 */
export function mapBadgeToCreateRequest(data) {
  const now = new Date().toISOString();
  return {
    code: data.slug,
    name: data.name,
    conditionJson: JSON.stringify({
      slug: data.slug,
      description: data.description,
      category: data.category,
      triggerType: data.triggerType,
      triggerValue: data.triggerValue,
      pointsReward: data.pointsReward,
      icon: data.icon,
      active: data.active !== false,
      createdAt: now,
      updatedAt: now,
    }),
  };
}

/**
 * Chuyển badge FE sang payload cập nhật backend.
 *
 * @param {Object} badge - Badge hiện tại trên FE.
 * @returns {Object} Payload cập nhật badge.
 */
export function mapBadgeToUpdateRequest(badge) {
  return {
    name: badge.name,
    conditionJson: JSON.stringify({
      slug: badge.slug,
      description: badge.description,
      category: badge.category,
      triggerType: badge.triggerType,
      triggerValue: badge.triggerValue,
      pointsReward: badge.pointsReward,
      icon: badge.icon,
      active: badge.active !== false,
      updatedAt: new Date().toISOString(),
    }),
  };
}

const POINT_RULE_EVENT_TO_FE = {
  "streak.milestone_7": "streak_milestone",
  "auth.daily_login": "daily_login",
  "post.published": "post_published",
  "exam.completed": "exam_passed",
  "like.received": "manual",
  "comment.created": "manual",
  "ai.used": "manual",
  "document.read": "manual",
};

const POINT_RULE_EVENT_TO_BE = {
  streak_milestone: "streak.milestone_7",
  daily_login: "auth.daily_login",
  post_published: "post.published",
  exam_passed: "exam.completed",
  manual: "manual",
};

function mapPointRuleEventToFe(eventType) {
  return POINT_RULE_EVENT_TO_FE[eventType] ?? "manual";
}

function mapPointRuleEventToBe(eventType) {
  return POINT_RULE_EVENT_TO_BE[eventType] ?? eventType;
}

/**
 * Map point rule DTO từ backend sang object FE.
 *
 * @param {Object} dto - Point rule DTO.
 * @returns {Object} Point rule item cho admin settings.
 */
export function mapPointRuleAdminDto(dto) {
  const slug = dto.code ?? "";
  const eventType = mapPointRuleEventToFe(dto.eventType ?? "");
  return {
    id: dto.id,
    apiId: dto.id,
    slug,
    name: dto.description?.trim() || slug.replace(/-/g, " "),
    eventType,
    points: dto.points ?? 0,
    intervalDays: eventType === "streak_milestone" ? 7 : null,
    description: dto.description ?? "",
    active: dto.isActive !== false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Chuyển point rule FE sang payload tạo mới backend.
 *
 * @param {Object} data - Dữ liệu point rule từ FE.
 * @returns {Object} Payload tạo point rule.
 */
export function mapPointRuleToCreateRequest(data) {
  return {
    code: data.slug,
    eventType: mapPointRuleEventToBe(data.eventType),
    points: data.points,
    isActive: data.active !== false,
    description: data.description || data.name,
  };
}

/**
 * Chuyển point rule FE sang payload cập nhật backend.
 *
 * @param {Object} rule - Point rule hiện tại trên FE.
 * @returns {Object} Payload cập nhật point rule.
 */
export function mapPointRuleToUpdateRequest(rule) {
  return {
    eventType: mapPointRuleEventToBe(rule.eventType),
    points: rule.points,
    isActive: rule.active !== false,
    description: rule.description || rule.name,
  };
}

/**
 * Chuyển danh sách rank tiers FE sang payload cập nhật levels backend.
 *
 * @param {Array<Object>} ranks - Danh sách tier/rank trên FE.
 * @returns {{levels: Array<Object>}} Payload cập nhật levels.
 */
export function mapRankTiersToUpdateLevelsRequest(ranks) {
  return {
    levels: ranks.map((rank) => ({
      name: rank.name,
      minPoints: rank.minPoints,
      voucherPercent: rank.voucherDiscount ?? null,
    })),
  };
}

/**
 * Trộn số liệu dashboard live API vào mock payload hiện có.
 *
 * Cách làm này giữ nguyên cấu trúc UI mock nhưng thay các giá trị có thể lấy từ backend.
 *
 * @param {Object} mockPayload - Dashboard payload nền của FE.
 * @param {Object|null|undefined} stats - Số liệu live từ API.
 * @param {Object} [extras={}] - Dữ liệu phụ như số tài liệu hay pending reports.
 * @returns {Object} Payload dashboard đã merge.
 */
export function mergeDashboardStats(mockPayload, stats, extras = {}) {
  if (!stats) return mockPayload;

  const revenueM = Math.round(Number(stats.totalRevenue ?? 0) / 1_000_000 * 10) / 10;
  const premiumCount = stats.activeSubscriptions ?? 0;
  const usersTotal = stats.totalUsers ?? mockPayload.studentPlan?.totalStudents ?? 0;
  const studentsFree = Math.max(0, usersTotal - premiumCount);
  const premiumPct = usersTotal
    ? Math.round((premiumCount / usersTotal) * 1000) / 10
    : 0;
  const documentCount = stats.totalDocuments ?? extras.documentCount ?? mockPayload.stats?.find((s) => s.id === "documents")?.value ?? 0;
  const pendingReports = extras.pendingReports ?? stats.pendingReports ?? 0;

  return {
    ...mockPayload,
    stats: mockPayload.stats.map((item) => {
      if (item.id === "users") {
        return {
          ...item,
          value: usersTotal.toLocaleString("vi-VN"),
          change: `${usersTotal} tài khoản`,
          changeDetail: "tổng tài khoản trong hệ thống",
        };
      }
      if (item.id === "revenue") {
        return {
          ...item,
          value: revenueM > 0 ? `${revenueM.toLocaleString("vi-VN")} tr` : "0 tr",
          changeDetail: "PayOS · dữ liệu API",
        };
      }
      if (item.id === "premium") {
        return {
          ...item,
          value: `${premiumPct}%`,
          change: `${premiumCount} subscription`,
          changeDetail: "tỉ lệ trên tổng user",
        };
      }
      if (item.id === "reports") {
        return {
          ...item,
          value: String(pendingReports),
          urgent: pendingReports > 0,
          trend: pendingReports > 0 ? "down" : "up",
        };
      }
      if (item.id === "exams") {
        return {
          ...item,
          value: String(stats.totalExams ?? item.value),
        };
      }
      if (item.id === "documents") {
        return {
          ...item,
          value: String(documentCount),
        };
      }
      if (item.id === "posts") {
        return {
          ...item,
          value: String(stats.totalPosts ?? "—"),
          change: stats.totalPosts ? `${stats.totalPosts} bài` : "—",
          changeDetail: "bài viết đã publish",
        };
      }
      return item;
    }),
    studentPlan: {
      ...mockPayload.studentPlan,
      totalStudents: usersTotal,
      basic: {
        ...mockPayload.studentPlan.basic,
        count: studentsFree,
        percent: usersTotal ? Math.round((studentsFree / usersTotal) * 1000) / 10 : 0,
      },
      premium: {
        ...mockPayload.studentPlan.premium,
        count: premiumCount,
        percent: premiumPct,
      },
    },
  };
}

/**
 * Map voucher DTO sang item danh sách voucher admin.
 *
 * @param {Object} dto - Voucher DTO từ API.
 * @returns {Object} Voucher item đã chuẩn hóa thời gian và trạng thái.
 */
export function mapAdminVoucherListItem(dto) {
  return {
    id: dto.id,
    userId: dto.userId,
    username: dto.username,
    displayName: dto.displayName,
    levelId: dto.levelId,
    levelName: dto.levelName ?? "—",
    discountPercent: dto.discountPercent ?? 0,
    status: String(dto.status ?? "active").toLowerCase(),
    grantedAt: formatAdminDateTime(dto.grantedAt),
    expiresAt: formatAdminDate(dto.expiresAt),
  };
}

/**
 * Map DTO thống kê voucher sang object FE.
 *
 * @param {Object} dto - Voucher stats DTO.
 * @returns {Object} Thống kê voucher đã chuẩn hóa với đủ nhóm FE cần dùng.
 */
export function mapAdminVoucherStats(dto) {
  return {
    total: dto.total ?? 0,
    active: dto.active ?? 0,
    used: dto.used ?? 0,
    expired: dto.expired ?? 0,
    revoked: dto.revoked ?? 0,
    manual: 0,
  };
}

/**
 * Map payload chart dashboard sang cấu trúc FE cho biểu đồ tăng trưởng/doanh thu/traffic.
 *
 * @param {Object} dto - Dashboard charts DTO từ API.
 * @returns {Object} Bộ dữ liệu chart đã chuẩn hóa.
 */
export function mapDashboardCharts(dto) {
  const toTraffic = (series) => ({
    data: (series?.data ?? []).map((point) => ({
      label: point.label,
      value: Number(point.value ?? 0),
    })),
    peak: Number(series?.peak ?? 0),
    seriesName: series?.seriesName ?? "Phiên hoạt động",
    period: series?.period ?? "",
    dataSource: "live",
  });

  return {
    userGrowth: {
      data: (dto.userRegistrations?.data ?? []).map((point) => ({
        label: point.label,
        value: Number(point.value ?? 0),
      })),
      seriesName: dto.userRegistrations?.seriesName ?? "Đăng ký mới",
      summary: {
        total: (dto.userRegistrations?.data ?? []).reduce((sum, row) => sum + Number(row.value ?? 0), 0),
        delta: "",
        period: dto.userRegistrations?.period ?? "",
      },
      dataSource: "live",
    },
    revenue: {
      data: (dto.revenue?.data ?? []).map((point) => ({
        label: point.label,
        value: Number(point.value ?? 0),
      })),
      summary: {
        total: "",
        delta: "",
        period: dto.revenue?.period ?? "",
      },
      valueSuffix: " tr",
      dataSource: "live",
    },
    traffic: toTraffic(dto.traffic),
  };
}

/**
 * Map audit log tổng quát admin sang item timeline FE.
 *
 * @param {Object} dto - Audit log DTO.
 * @returns {Object} Audit log item đã format thời gian.
 */
export function mapAdminAuditLogItem(dto) {
  return {
    id: dto.id,
    time: formatAdminDateTime(dto.createdAt),
    text: dto.text ?? dto.detail ?? dto.action ?? "",
    type: dto.type ?? "payment",
    sortKey: dto.createdAt,
  };
}

/**
 * Map user activity DTO sang item hiển thị hoạt động gần đây.
 *
 * @param {Object} dto - Activity DTO từ API.
 * @returns {Object} Activity item cho timeline/list.
 */
export function mapAdminUserActivityItem(dto) {
  return {
    id: dto.id,
    time: formatAdminDateTime(dto.createdAt),
    text: dto.text ?? dto.action ?? "",
    type: dto.type ?? "payment",
  };
}
