export const mockDocumentListDto = {
  id: "doc-001",
  title: "Slide_CSD203_Chapter1",
  category: "CSD203 - Data Structures",
  mimeType: "application/pdf",
  pageCount: 45,
  accessTier: "PremiumFull",
  createdAt: "2026-06-15T10:30:00Z",
};

export const mockFreeDocumentDto = {
  id: "doc-002",
  title: "PRF192_Intro",
  category: "PRF192",
  mimeType: "application/pdf",
  pageCount: 3,
  accessTier: "FreePreview",
  createdAt: "2026-07-01T08:00:00Z",
};

export const mockDocumentDetailDto = {
  ...mockDocumentListDto,
  pageLimit: 3,
  canDownload: true,
};

export const mockChatbotSettingsDto = {
  systemPrompt: "Bạn là cố vấn học tập SEHUB.",
  welcomeMessage: "Xin chào! Tôi có thể giúp gì?",
  isEnabled: true,
};

export const mockChatbotConversationDto = {
  id: "conv-bot-001",
  title: "Hỏi về PRF192",
  createdAt: "2026-07-09T14:00:00Z",
  updatedAt: "2026-07-10T09:00:00Z",
};

export const mockChatbotMessageDto = {
  id: "msg-bot-001",
  role: "assistant",
  text: "OOP là lập trình hướng đối tượng.",
  createdAt: "2026-07-10T09:01:00Z",
};

export const mockChatbotReplyDto = {
  conversationId: "conv-bot-001",
  reply: "Bạn nên ôn lại inheritance và polymorphism.",
  tokensUsed: 15,
  remainingTokens: 985,
  messages: [mockChatbotMessageDto],
};

export const mockAdminUserDto = {
  id: "user-admin-001",
  username: "demo_student",
  email: "demo.student@sehub.local",
  displayName: "Demo Premium",
  role: "Student",
  isPremium: true,
  isBanned: false,
  points: 1250,
  levelName: "Gold",
  streakCount: 7,
  trustScore: 85,
  trustTier: "high",
  createdAt: "2025-09-01T00:00:00Z",
};

export const mockBannedAdminUserDto = {
  ...mockAdminUserDto,
  id: "user-banned-002",
  username: "banned_user",
  isBanned: true,
  banReason: "Spam",
  banUntil: "2026-12-31T23:59:59Z",
};

export const mockDashboardPayload = {
  stats: [
    { id: "users", value: "100", change: "100", changeDetail: "mock" },
    { id: "revenue", value: "0 tr", changeDetail: "mock" },
    { id: "premium", value: "20%", change: "20", changeDetail: "mock" },
    { id: "reports", value: "0", urgent: false, trend: "up" },
    { id: "exams", value: "50" },
    { id: "documents", value: "30" },
    { id: "posts", value: "10", change: "10", changeDetail: "mock" },
  ],
  studentPlan: {
    totalStudents: 100,
    basic: { count: 80, percent: 80 },
    premium: { count: 20, percent: 20 },
  },
};

export const mockDashboardStatsDto = {
  totalUsers: 500,
  totalRevenue: 125000000,
  activeSubscriptions: 120,
  totalExams: 85,
  totalDocuments: 42,
  totalPosts: 200,
  pendingReports: 5,
};
