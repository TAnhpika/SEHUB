import { FE_ID_BY_PLAN_CODE } from "@/api/premiumMapper";
import { resolveAssetUrl } from "@/api/assetUrl";

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
  if (value === "pendingapproval") return "draft";
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
    levelName: null,
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
  };
}

export function mapAdminExamListItem(dto) {
  const typeKey = mapExamTypeKey(dto.examType);
  const status = mapExamStatus(dto.status);

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
    attachments: (dto.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.originalFileName,
      size: attachment.fileSize ?? 0,
      viewPath: attachment.viewPath,
      viewUrl: resolveAssetUrl(attachment.viewPath),
    })),
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

const WIZARD_ANSWER_KEYS = ["A", "B", "C", "D"];

function parseSemesterNumber(semesterLabel) {
  const match = String(semesterLabel ?? "").match(/\d+/);
  return match ? match[0] : "1";
}

export function mapWizardQuestionsToCreateItems(questions) {
  return questions
    .filter(
      (question) =>
        question.content?.trim() &&
        WIZARD_ANSWER_KEYS.some((key) => question.answers?.[key]?.trim()),
    )
    .map((question, index) => {
      const options = WIZARD_ANSWER_KEYS.map((key) => ({
        id: crypto.randomUUID(),
        label: key,
        text: question.answers[key]?.trim() ?? "",
      }));
      const correct =
        options.find((option) => option.label === question.correctAnswer) ?? options[0];

      return {
        orderIndex: index + 1,
        content: question.content.trim(),
        options,
        correctOptionId: correct.id,
      };
    });
}

export function mapFinalExamWizardToCreateRequest(examInfo, questions) {
  return {
    code: examInfo.subjectCode.trim(),
    title: examInfo.examCode?.trim() || `${examInfo.subjectCode} — Cuối kỳ`,
    examType: "Final",
    semester: parseSemesterNumber(examInfo.semesterLabel),
    major: "SE",
    description: examInfo.subjectName ?? "",
    questions: mapWizardQuestionsToCreateItems(questions),
  };
}

export function mapMockOcrQuestionsToCreateItems(questions) {
  return (questions ?? []).map((question, index) => {
    const options = (question.options ?? []).map((text, optionIndex) => ({
      id: crypto.randomUUID(),
      label: String.fromCharCode(65 + optionIndex),
      text: String(text ?? ""),
    }));
    const correctOption = options[question.correct] ?? options[0];

    return {
      orderIndex: index + 1,
      content: question.text?.trim() ?? "",
      options,
      correctOptionId: correctOption?.id ?? crypto.randomUUID(),
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

  return {
    code: form.subjectCode.trim(),
    title: form.title.trim(),
    examType: "Practice",
    semester: parseSemesterNumber(form.semester),
    major: "SE",
    description: [form.description, githubGuide].filter(Boolean).join("\n\n"),
    questions: [],
  };
}

export function mapPendingExamListItem(dto, meta = {}) {
  const base = mapAdminExamListItem(dto);
  const fileName =
    meta.fileName ??
    `${base.code}-${base.typeKey === "final" ? "final" : "practice"}.${base.typeKey === "final" ? "pdf" : "pdf"}`;

  return {
    ...base,
    submittedBy: meta.submittedBy ?? "—",
    submittedAt: base.createdAt,
    urgent: Boolean(meta.urgent),
    fileName,
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

export function mapAdminReportListItem(dto) {
  const status = mapReportStatus(dto.status);

  return {
    id: dto.id,
    apiId: dto.id,
    postId: dto.postId,
    reasonId: "other",
    reason: dto.reason,
    reporter: dto.reporter?.username ?? "unknown",
    reportedUser: dto.reportedUser?.username ?? dto.postAuthor?.username ?? "unknown",
    status,
    urgent: false,
    createdAt: formatAdminDateTime(dto.createdAt),
    post: {
      author: dto.reporter?.username ?? "unknown",
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
  const slug = slugify(dto.code || dto.name);

  return {
    id: dto.id,
    apiId: dto.id,
    slug,
    name: dto.name,
    description: dto.conditionJson ?? dto.name,
    category: "community",
    triggerType: "custom",
    triggerValue: 1,
    pointsReward: 0,
    icon: "🏅",
    active: true,
    unlockCount: dto.earnedCount ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

export function mergeDashboardStats(mockPayload, stats) {
  if (!stats) return mockPayload;

  const revenueM = Math.round(Number(stats.totalRevenue ?? 0) / 1_000_000 * 10) / 10;
  const premiumCount = stats.activeSubscriptions ?? 0;
  const usersTotal = stats.totalUsers ?? mockPayload.studentPlan?.totalStudents ?? 0;

  return {
    ...mockPayload,
    stats: mockPayload.stats.map((item) => {
      if (item.id === "users") {
        return {
          ...item,
          value: usersTotal.toLocaleString("vi-VN"),
          change: `${usersTotal} tài khoản`,
        };
      }
      if (item.id === "revenue") {
        return {
          ...item,
          value: revenueM > 0 ? `${revenueM.toLocaleString("vi-VN")} tr` : "0 tr",
        };
      }
      if (item.id === "premium") {
        return {
          ...item,
          value: usersTotal
            ? `${Math.round((premiumCount / usersTotal) * 1000) / 10}%`
            : "0%",
          change: `${premiumCount} subscription`,
        };
      }
      if (item.id === "reports") {
        return {
          ...item,
          value: String(stats.pendingReports ?? item.value),
        };
      }
      if (item.id === "exams") {
        return {
          ...item,
          value: String(stats.totalExams ?? item.value),
        };
      }
      return item;
    }),
    studentPlan: {
      ...mockPayload.studentPlan,
      totalStudents: usersTotal,
      premium: {
        ...mockPayload.studentPlan.premium,
        count: premiumCount,
      },
    },
  };
}
