import { FE_ID_BY_PLAN_CODE } from "@/api/premiumMapper";
import { resolveAssetUrl } from "@/api/assetUrl";
import {
  buildExamDisplayFields,
  extractCourseSubjectCode,
  normalizeCourseSubjectCode,
  resolvePublicExamName,
} from "@/utils/examDisplay";
import { mapModerationPostImages } from "@/utils/mapModerationPostImages";
import { getExamAssetFileName } from "@/utils/examAssetUrl";
import {
  mapImportedExamQuestions,
  sanitizeWizardQuestionContent,
} from "@/features/moderator/finalExams/finalExamData";

const ROLE_MAP = {
  student: "student",
  moderator: "moderator",
  admin: "admin",
};

function formatAdminDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatAdminDateTime(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function mapRole(role) {
  return ROLE_MAP[String(role ?? "Student").toLowerCase()] ?? "student";
}

function extractSubjectCode(category) {
  const match = category?.match(/^([A-Z0-9]+)/i);
  return match?.[1]?.toUpperCase() ?? "SE";
}

function mapAccessTierLabel(accessTier) {
  if (accessTier === "PremiumFull") return "Premium";
  return "Free (3 trang)";
}

function mapExamStatus(status) {
  const value = String(status ?? "").toLowerCase();
  if (value === "published") return "published";
  if (value === "pendingapproval") return "pending_approval";
  if (value === "rejected") return "rejected";
  if (value === "archived") return "draft";
  return "draft";
}

function mapExamTypeKey(examType) {
  return String(examType ?? "").toLowerCase() === "practice" ? "practice" : "final";
}

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

function inferPlanIdFromName(planName) {
  return inferPlanIdFromApi({ planName });
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
    apiId: dto.id,
  };
}

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
  };
}

export function mapAdminExamListItem(dto) {
  const typeKey = mapExamTypeKey(dto.examType);
  const status = mapExamStatus(dto.status);
  const assetUrl = dto.assetUrl ?? null;

  return {
    id: dto.id,
    apiId: dto.id,
    code: dto.code,
    title: dto.title,
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
    attachments: (dto.attachments ?? []).length > 0
      ? (dto.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          name: attachment.originalFileName,
          contentType: attachment.contentType ?? "",
          fileSize: attachment.fileSize ?? 0,
          size: attachment.fileSize ?? 0,
          viewPath: attachment.viewPath,
          viewUrl: resolveAssetUrl(attachment.viewPath),
        }))
      : assetUrl
        ? [{ id: "asset", name: assetUrl.split("/").pop() ?? "asset", url: assetUrl }]
        : [],
    revisionOfExamId: dto.revisionOfExamId ?? null,
    revisionSourceCode: dto.revisionSourceCode ?? null,
    revisionSourceTitle: dto.revisionSourceTitle ?? null,
    rejectionReasonCode: dto.rejectionReasonCode ?? null,
    rejectionReasonDetail: dto.rejectionReasonDetail ?? null,
    rejectedAt: dto.rejectedAt ?? null,
    canResubmit: dto.canResubmit ?? false,
    isContentLocked: dto.isContentLocked ?? false,
    ...buildExamDisplayFields(dto),
  };
}

export function mapAdminExamDetail(dto) {
  const base = mapAdminExamListItem(dto);

  return {
    ...base,
    questionsData: (dto.questions ?? []).map((question) => ({
      id: question.id,
      text: question.content,
      options: (question.options ?? []).map((option) => option.text),
      correct: (question.options ?? []).findIndex((option) => option.id === question.correctOptionId),
    })),
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

export function mapWizardQuestionsToCreateItems(questions) {
  return questions
    .filter(
      (question) =>
        question.content?.trim() &&
        getWizardOptionLabels(question).some((key) => question.answers?.[key]?.trim()),
    )
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
      };
    });
}

export function mapFinalExamWizardToCreateRequest(examInfo, questions) {
  const subjectCode =
    normalizeCourseSubjectCode(examInfo.subjectCode) ?? examInfo.subjectCode.trim();
  const paperCode = examInfo.examCode?.trim();

  return {
    code: paperCode,
    title: paperCode || `${subjectCode} — Cuối kỳ`,
    examType: "Final",
    semester: parseSemesterNumber(examInfo.semesterLabel),
    major: subjectCode,
    description: `${examInfo.subjectName ?? subjectCode} · ${examInfo.durationMinutes} phút`,
    questions: mapWizardQuestionsToCreateItems(questions),
  };
}

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
    title,
    description: `${examInfo.subjectName ?? examInfo.subjectCode} · ${examInfo.durationMinutes} phút`,
    questions: mapWizardQuestionsToCreateItems(questions),
  };
}

export function mapExamDetailToWizard(dto) {
  const rawQuestions = dto.questions ?? dto.questionsData ?? [];
  const wizardQuestions = mapImportedExamQuestions(rawQuestions);

  const durationMatch = String(dto.description ?? "").match(/(\d+)\s*phút/);
  const durationMinutes = durationMatch ? Number(durationMatch[1]) : 60;
  const questionCount = Math.max(dto.questionCount ?? 0, wizardQuestions.length, 1);
  const publicName = resolvePublicExamName(dto);
  const subjectCode =
    extractCourseSubjectCode(dto.major, dto.revisionSourceCode, dto.code, dto.title) ??
    dto.major ??
    "";

  return {
    examInfo: {
      subjectCode,
      subjectName: String(dto.description ?? "").split(" · ")[0]?.trim() || publicName,
      semesterLabel: dto.semester ? `Học kỳ ${dto.semester}` : "",
      examCode: publicName,
      revisionSourceCode: dto.revisionSourceCode ?? null,
      revisionSourceTitle: dto.revisionSourceTitle ?? null,
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

export function mapMockOcrQuestionsToCreateItems(questions) {
  return (questions ?? []).map((question, index) => {
    const options = (question.options ?? []).map(normalizeCreateExamOption);
    const correctOptionIds = resolveCorrectOptionIds(question, options);
    const fallbackCorrect = options.find((option) => correctOptionIds.includes(String(option.id))) ?? options[0];
    const questionType = String(question.questionType ?? question.QuestionType ?? "").toLowerCase();
    const isMulti = questionType === "multiselect";
    const content = String(question.content ?? question.Content ?? question.text ?? "").trim();

    return {
      orderIndex: question.orderIndex ?? question.OrderIndex ?? index + 1,
      content,
      questionType: isMulti ? "MultiSelect" : "SingleChoice",
      requiredSelectCount: isMulti
        ? question.requiredSelectCount ?? question.RequiredSelectCount ?? correctOptionIds.length
        : null,
      options,
      correctOptionId: fallbackCorrect?.id ?? crypto.randomUUID(),
      correctOptionIds,
    };
  });
}

export function mapAdminExamFormToCreateRequest(form, { questions = [] } = {}) {
  const githubGuide =
    form.githubGuide ??
    "Nộp link repository GitHub công khai. README ghi rõ MSSV, họ tên và hướng dẫn chạy project.";

  const description =
    form.typeKey === "practice"
      ? [form.description?.trim(), githubGuide].filter(Boolean).join("\n\n")
      : form.description?.trim() ?? "";

  return {
    code: form.code.trim(),
    title: form.title.trim(),
    examType: form.typeKey === "practice" ? "Practice" : "Final",
    semester: form.semester,
    major: form.track ?? "SE",
    description,
    questions,
  };
}

export function mapAdminExamFormToUpdateRequest(form, { questions = null } = {}) {
  const body = {
    code: form.code.trim(),
    title: form.title.trim(),
    examType: form.typeKey === "practice" ? "Practice" : "Final",
    semester: form.semester,
    major: form.track ?? "SE",
    description: form.description?.trim() ?? "",
  };

  if (Array.isArray(questions)) {
    body.questions = questions;
  }

  return body;
}

export function mapPracticeExamFormToCreateRequest(form) {
  const githubGuide =
    form.githubGuide ??
    "Nộp link repository GitHub công khai. README ghi rõ MSSV, họ tên và hướng dẫn chạy project.";
  const subjectCode =
    normalizeCourseSubjectCode(form.subjectCode) ?? form.subjectCode.trim();
  const paperCode = form.title.trim();

  return {
    code: paperCode,
    title: paperCode,
    examType: "Practice",
    semester: parseSemesterNumber(form.semester),
    major: subjectCode,
    description: [form.description, githubGuide].filter(Boolean).join("\n\n"),
    assetUrl: form.assetUrl ?? null,
    questions: [],
  };
}

export function mapPendingExamListItem(dto, meta = {}) {
  const base = mapAdminExamListItem(dto);
  const primaryAttachment = base.attachments?.[0];
  const fileName =
    meta.fileName ??
    primaryAttachment?.name ??
    (base.assetUrl ? getExamAssetFileName(base.assetUrl) : null) ??
    "Chưa có file đính kèm";

  return {
    ...base,
    submittedBy: meta.submittedBy ?? "—",
    submittedAt: base.createdAt,
    urgent: Boolean(meta.urgent),
    fileName,
    assetUrl: base.assetUrl ?? primaryAttachment?.viewUrl ?? primaryAttachment?.viewPath ?? null,
    githubGuide: meta.githubGuide ?? (base.typeKey === "practice" ? githubGuideFromDescription(base.description) : ""),
    allowDiscussion: meta.allowDiscussion ?? false,
    pinExam: meta.pinExam ?? false,
  };
}

function githubGuideFromDescription(description) {
  const parts = String(description ?? "").split("\n\n");
  return parts.length > 1 ? parts.slice(1).join("\n\n") : "";
}

export function mapPendingExamFromCreate(dto, payload = {}) {
  return mapPendingExamListItem(dto, {
    submittedBy: payload.submittedBy,
    fileName: payload.fileName,
    githubGuide: payload.githubGuide,
    allowDiscussion: payload.allowDiscussion,
    pinExam: payload.pinExam,
  });
}

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

export function mapPaymentAuditLogItem(dto) {
  return {
    id: dto.id,
    at: dto.createdAt,
    admin: dto.actorUsername ?? "admin",
    action: String(dto.action ?? "").toLowerCase(),
    username: dto.actorUsername ?? "—",
    detail: dto.detail ?? null,
    payloadJson: dto.payloadJson ?? null,
    sortKey: dto.createdAt,
    type: "payment",
  };
}

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

function mapModerationPostStatus(status) {
  const value = String(status ?? "Pending").toLowerCase();
  if (value === "published") return "approved";
  if (value === "rejected") return "rejected";
  return "pending";
}

function toModerationInitials(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return String(name ?? "?").slice(0, 2).toUpperCase() || "?";
}

export function mapModerationPostListItem(dto) {
  const status = mapModerationPostStatus(dto.status);
  const createdMs = new Date(dto.createdAt).getTime();
  const { coverImage, inlineImages } = mapModerationPostImages(dto.images ?? []);

  return {
    id: dto.id,
    apiId: dto.id,
    type: "post",
    title: dto.title,
    excerpt: dto.excerpt ?? dto.title,
    content: dto.excerpt ?? "",
    semester: dto.semester ? `Học kỳ ${dto.semester}` : "—",
    major: dto.major ?? "SE",
    tags: dto.tags ?? [],
    authorName: dto.author?.displayName || dto.author?.username || "—",
    authorInitial: toModerationInitials(dto.author?.displayName || dto.author?.username),
    studentId: dto.author?.username ?? "—",
    submittedAtLabel: formatAdminDateTime(dto.createdAt),
    timeLabel: formatAdminDateTime(dto.createdAt),
    status,
    sortOrder: Number.isNaN(createdMs) ? 0 : createdMs,
    createdAt: dto.createdAt,
    allowComments: true,
    anonymous: false,
    attachments: [],
    coverImage,
    inlineImages,
    resubmission: status === "pending" && Boolean(dto.moderatedAt),
    moderation: dto.moderatedAt
      ? {
          moderatorName: dto.moderatorUsername ?? "Moderator",
          moderatorId: "—",
          actionAtLabel: formatAdminDateTime(dto.moderatedAt),
          note: status === "approved" ? dto.moderationNote ?? "Đã duyệt — hiển thị trên feed cộng đồng." : undefined,
          reason: status === "rejected" ? dto.moderationNote ?? "—" : undefined,
          resubmitHint:
            status === "rejected"
              ? "Tác giả có thể chỉnh sửa bài Rejected rồi gửi duyệt lại (Pending)."
              : undefined,
        }
      : null,
  };
}

export function mapModerationPostDetail(dto) {
  const base = mapModerationPostListItem(dto);
  return {
    ...base,
    content: dto.content ?? base.excerpt,
  };
}

export function mapAdminReportListItem(dto) {
  const status = mapReportStatus(dto.status);

  return {
    id: dto.id,
    apiId: dto.id,
    postId: dto.postId,
    reasonId: "other",
    reason: dto.reason,
    reporter: dto.reporter?.username ?? "unknown",
    reporterId: dto.reporter?.id ?? null,
    reportedUser: dto.reportedUser?.username ?? "unknown",
    reportedUserId: dto.reportedUser?.id ?? null,
    status,
    urgent: false,
    createdAt: formatAdminDateTime(dto.createdAt),
    createdAtIso: dto.createdAt,
    post: {
      author: dto.reportedUser?.username ?? dto.reporter?.username ?? "unknown",
      postedAt: formatAdminDateTime(dto.createdAt),
      title: dto.postTitle,
      excerpt: dto.postExcerpt ?? dto.postTitle,
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

export function mapViolatingUserDetail(dto) {
  return {
    ...mapViolatingUser(dto),
    tempBanCount: dto.tempBanCount ?? 0,
    history: (dto.history ?? []).map(mapViolationHistoryItem),
  };
}

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

export function mapPointRuleToCreateRequest(data) {
  return {
    code: data.slug,
    eventType: mapPointRuleEventToBe(data.eventType),
    points: data.points,
    isActive: data.active !== false,
    description: data.description || data.name,
  };
}

export function mapPointRuleToUpdateRequest(rule) {
  return {
    eventType: mapPointRuleEventToBe(rule.eventType),
    points: rule.points,
    isActive: rule.active !== false,
    description: rule.description || rule.name,
  };
}

export function mapRankTiersToUpdateLevelsRequest(ranks) {
  return {
    levels: ranks.map((rank) => ({
      name: rank.name,
      minPoints: rank.minPoints,
      voucherPercent: rank.voucherDiscount ?? null,
    })),
  };
}

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

export function mapAdminAuditLogItem(dto) {
  return {
    id: dto.id,
    time: formatAdminDateTime(dto.createdAt),
    text: dto.text ?? dto.detail ?? dto.action ?? "",
    type: dto.type ?? "payment",
    sortKey: dto.createdAt,
  };
}

export function mapAdminUserActivityItem(dto) {
  return {
    id: dto.id,
    time: formatAdminDateTime(dto.createdAt),
    text: dto.text ?? dto.action ?? "",
    type: dto.type ?? "payment",
  };
}
