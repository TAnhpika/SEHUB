export const mockAdminExamDto = {
  id: "exam-admin-001",
  examType: "Final",
  status: "Published",
  subjectCode: "PRF192",
  paperCode: "FE-PRF192-SU2026-1",
  title: "FE-PRF192-SU2026-1",
  questionCount: 40,
  semester: 3,
  major: "SE",
  description: "Đề cuối kỳ PRF192",
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  attachments: [
    {
      id: "att-1",
      originalFileName: "de-thi.pdf",
      contentType: "application/pdf",
      fileSize: 102400,
      viewPath: "/api/v1/exams/exam-admin-001/attachments/att-1/view",
    },
  ],
};

export const mockPaymentAuditLogDto = {
  id: "audit-001",
  action: "Payment Verified",
  actorUsername: "admin",
  createdAt: "2026-07-10T10:00:00Z",
  orderId: "order-001",
  detail: "Xác minh thanh toán PayOS",
  payloadJson: JSON.stringify({ username: "demo_student" }),
};

export const mockAdminPaymentDto = {
  id: "pay-001",
  payOsOrderCode: 12345678,
  username: "demo_student",
  userEmail: "demo.student@sehub.local",
  planCode: "8m",
  planName: "Premium học kỳ",
  amount: 384000,
  status: "Paid",
  paidAt: "2026-07-09T14:00:00Z",
  createdAt: "2026-07-09T13:00:00Z",
};

export const mockAdminReportDto = {
  id: "report-001",
  kind: "post",
  postId: "post-001",
  reason: "Nội dung spam",
  status: "Pending",
  createdAt: "2026-07-10T08:00:00Z",
  postTitle: "Bài viết bị báo cáo",
  postExcerpt: "Nội dung không phù hợp",
  reporter: { id: "r-1", username: "reporter_user" },
  reportedUser: { id: "u-1", username: "reported_user", trustScore: 45, trustTier: "low" },
};

export const mockBannedUserDto = {
  id: "ban-001",
  userId: "user-banned",
  username: "banned_user",
  displayName: "Banned User",
  reason: "Vi phạm nhiều lần",
  banType: "Temporary",
  actorUsername: "demo_moderator",
  createdAt: "2026-07-01T00:00:00Z",
  until: "2026-07-31T23:59:59Z",
};

export const mockViolatingUserDto = {
  id: "violator-001",
  username: "bad_actor",
  displayName: "Bad Actor",
  email: "bad@sehub.local",
  major: "SE",
  semester: 4,
  levelName: "Gold",
  points: 800,
  violationCount: 3,
  warningCount: 2,
  status: "warned",
  banType: null,
  banUntil: null,
  banReason: null,
  lastActionAt: "2026-07-08T00:00:00Z",
};

export const mockViolatingUserDetailDto = {
  ...mockViolatingUserDto,
  tempBanCount: 1,
  history: [
    {
      id: "hist-1",
      banType: "Warning",
      reason: "Spam comment",
      createdAt: "2026-07-01T00:00:00Z",
      actorUsername: "mod",
      until: null,
    },
  ],
};

export const mockBadgeAdminDto = {
  id: "badge-001",
  code: "first-post",
  name: "Bài viết đầu tiên",
  earnedCount: 42,
  conditionJson: JSON.stringify({
    slug: "first-post",
    description: "Đăng bài đầu tiên",
    category: "community",
    triggerType: "post_published",
    triggerValue: 1,
    pointsReward: 10,
    icon: "📝",
    active: true,
  }),
};

export const mockPointRuleDto = {
  id: "rule-001",
  code: "daily-login",
  eventType: "auth.daily_login",
  points: 5,
  isActive: true,
  description: "Đăng nhập hàng ngày",
};

export const mockDashboardChartsDto = {
  userRegistrations: {
    seriesName: "Đăng ký mới",
    period: "7 ngày",
    data: [
      { label: "T2", value: 10 },
      { label: "T3", value: 15 },
    ],
  },
  revenue: {
    period: "7 ngày",
    data: [
      { label: "T2", value: 2.5 },
      { label: "T3", value: 3.1 },
    ],
  },
  traffic: {
    seriesName: "Phiên",
    period: "24h",
    peak: 120,
    data: [{ label: "00h", value: 30 }],
  },
};
