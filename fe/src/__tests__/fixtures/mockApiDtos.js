export const mockApiUserDto = {
  id: "11111111-1111-1111-1111-111111111101",
  username: "demo_student",
  email: "demo.student@sehub.local",
  displayName: "Demo Premium",
  role: "Student",
  isPremium: true,
  points: 1250,
  levelName: "Gold",
  avatarUrl: "/uploads/avatars/demo.png",
  emailConfirmed: true,
};

export const mockFreeApiUserDto = {
  ...mockApiUserDto,
  id: "22222222-2222-2222-2222-222222222202",
  username: "free_student",
  displayName: "",
  isPremium: false,
  points: 80,
  levelName: "Bronze",
};

export const mockExamDetailDto = {
  id: "exam-api-uuid-001",
  examType: "Final",
  subjectCode: "PRF192",
  subjectName: "Programming Fundamentals",
  paperCode: "FE-PRF192-SU2026-1",
  title: "FE-PRF192-SU2026-1",
  description: "Đề ôn tập PRF192",
  questionCount: 40,
  semester: 3,
  major: "SE",
  status: "Published",
  attachments: [
    {
      id: "att-001",
      originalFileName: "de-thi-prf192.pdf",
      contentType: "application/pdf",
      fileSize: 204800,
      viewPath: "/api/v1/exams/exam-api-uuid-001/attachments/att-001/view",
    },
  ],
};

export const mockPracticeExamDetailDto = {
  ...mockExamDetailDto,
  id: "exam-api-uuid-002",
  examType: "Practice",
  paperCode: "PE-SWE201c-SU2026-1",
  title: "PE-SWE201c-SU2026-1",
  subjectCode: "SWE201c",
};

export const mockQuestionPublicDto = {
  id: "q-001",
  orderIndex: 1,
  content: "<p>What is OOP?</p>",
  questionType: "SingleChoice",
  options: [
    { id: "opt-a", label: "A", text: "Object-Oriented Programming" },
    { id: "opt-b", label: "B", text: "Optional Output Protocol" },
  ],
};

export const mockQuestionAnswerDto = {
  ...mockQuestionPublicDto,
  correctOptionId: "opt-a",
  correctOptionIds: ["opt-a"],
};

export const mockMultiSelectQuestionDto = {
  id: "q-002",
  orderIndex: 2,
  content: "Select all SOLID principles",
  questionType: "MultiSelect",
  requiredSelectCount: 2,
  options: [
    { id: "opt-a", label: "A", text: "Single Responsibility" },
    { id: "opt-b", label: "B", text: "Open/Closed" },
    { id: "opt-c", label: "C", text: "Liskov Substitution" },
  ],
  correctOptionIds: ["opt-a", "opt-c"],
};

export const mockProfileDto = {
  userId: "11111111-1111-1111-1111-111111111101",
  username: "demo_student",
  displayName: "Demo Premium",
  bio: "SEHUB learner",
  major: "SE",
  semester: "3",
  gender: "male",
  dateOfBirth: "2004-05-15",
  phone: "0901234567",
  address: "Đà Nẵng",
  avatarUrl: "/uploads/avatars/demo.png",
  followersCount: 42,
  followingCount: 18,
  isFollowing: false,
  memberSince: "2025-09-01T00:00:00Z",
  profileUpdatedAt: "2026-06-01T10:00:00Z",
  points: 1250,
  levelName: "Gold",
  nextLevelPoints: 2000,
  streakCount: 7,
  highestStreak: 14,
};

export const mockProfileStatsDto = {
  points: 1250,
  levelName: "Gold",
  nextLevelName: "Platinum",
  nextLevelPoints: 2000,
  progressPercent: 62,
  remainingPoints: 750,
  streakCount: 7,
  highestStreak: 14,
  examsCompleted: 12,
  commentsCount: 34,
  postsCount: 5,
};

export const mockConversationDto = {
  conversationId: "conv-001",
  otherUserId: "user-99",
  otherUsername: "peer_student",
  otherFullName: "Nguyễn Văn A",
  otherAvatarUrl: "/uploads/avatars/peer.png",
  otherUserIsOnline: true,
  lastMessagePreview: "Chào bạn!",
  lastMessageAt: "2026-07-10T11:30:00Z",
  unreadCount: 2,
};

export const mockMessageDto = {
  id: "msg-001",
  senderId: "user-99",
  content: "Chào bạn!",
  sentAt: "2026-07-10T11:30:00Z",
  messageType: "Text",
};

export const mockImageMessageDto = {
  id: "msg-002",
  senderId: "11111111-1111-1111-1111-111111111101",
  content: "",
  sentAt: "2026-07-10T11:35:00Z",
  messageType: "Image",
  attachmentUrl: "/uploads/chat/photo.jpg",
  attachmentFileName: "photo.jpg",
};

export const mockPracticeSubmissionDto = {
  id: "sub-001",
  examId: "exam-api-uuid-002",
  examCode: "PE-SWE201c-SU2026-1",
  gitHubRepoUrl: "https://github.com/demo/student-repo",
  submittedAt: "2026-07-09T14:00:00Z",
  status: "Submitted",
  reviewerComment: null,
  reviewedAt: null,
  user: {
    username: "demo_student",
    displayName: "Demo Premium",
  },
};

export const mockReviewedSubmissionDto = {
  ...mockPracticeSubmissionDto,
  id: "sub-002",
  status: "Passed",
  reviewerComment: "Điểm: 8.5\n\nCode sạch, đúng yêu cầu.",
  reviewedAt: "2026-07-10T09:00:00Z",
};

export const mockPostListDto = {
  id: "post-001",
  title: "Kinh nghiệm ôn PRF192",
  excerpt: "Chia sẻ cách ôn hiệu quả...",
  contentPreview: "Chia sẻ cách ôn hiệu quả...",
  tags: ["PRF192", "ôn thi"],
  createdAt: "2026-07-08T08:00:00Z",
  likeCount: 15,
  commentCount: 3,
  viewCount: 120,
  isPinned: false,
  isFeatured: true,
  coverImageUrl: "/uploads/posts/cover.jpg",
  author: {
    id: "author-1",
    username: "demo_student",
    displayName: "Demo Premium",
  },
  images: [
    { id: "img-1", sortOrder: 0, imagePath: "/uploads/posts/inline-1.jpg" },
  ],
};

export const mockNotificationDto = {
  id: "notif-001",
  type: "comment",
  title: "Bình luận mới",
  body: "Ai đó đã bình luận bài viết của bạn",
  linkUrl: "/community/post/post-001",
  actorUserId: "user-99",
  actorUsername: "peer_student",
  referenceId: "post-001",
  createdAt: "2026-07-10T10:00:00Z",
  isRead: false,
};

export const mockModerationPostDto = {
  id: "mod-post-001",
  title: "Tips học CSD203",
  excerpt: "Cấu trúc dữ liệu cơ bản...",
  content: "Cấu trúc dữ liệu cơ bản và cách luyện tập.",
  tags: ["CSD203"],
  semester: 4,
  major: "AI",
  status: "Pending",
  createdAt: "2026-07-09T16:00:00Z",
  moderatedAt: null,
  moderatorUsername: null,
  moderationNote: null,
  author: {
    username: "demo_student",
    displayName: "Demo Premium",
  },
  images: [
    { id: "img-cover", sortOrder: 0, imagePath: "/uploads/mod/cover.jpg" },
    { id: "img-inline", sortOrder: 1, imagePath: "/uploads/mod/inline.jpg" },
  ],
};

export const mockRejectedModerationPostDto = {
  ...mockModerationPostDto,
  id: "mod-post-002",
  status: "Rejected",
  moderatedAt: "2026-07-10T08:00:00Z",
  moderatorUsername: "demo_moderator",
  moderationNote: "Nội dung chưa đủ chi tiết",
};

export const mockPremiumPlanTemplates = [
  {
    id: "trial",
    name: "Dùng thử 1 tháng",
    duration: "1 tháng",
    checkout: { packageTitle: "Premium 1 tháng", tagline: "Trải nghiệm đầy đủ" },
  },
  {
    id: "semester",
    name: "Gói học kỳ",
    duration: "8 tháng",
    checkout: { packageTitle: "Premium học kỳ", tagline: "Tiết kiệm cho sinh viên" },
  },
  {
    id: "full",
    name: "Gói 4 năm",
    duration: "4 năm",
    checkout: { packageTitle: "Premium 4 năm", tagline: "Tối ưu dài hạn" },
  },
];

export const mockApiPremiumPlanDto = {
  code: "8m",
  durationDays: 240,
  priceVnd: 384000,
};

export const mockPaymentOrderDto = {
  orderId: "order-001",
  payOsOrderCode: 12345678,
  amount: 345600,
  originalAmount: 384000,
  discountPercent: 10,
  discountSource: "rank",
  status: "Pending",
  qrUrl: "https://pay.payos.vn/qr/abc",
  checkoutUrl: "https://pay.payos.vn/checkout/abc",
  expiredAt: "2026-07-10T18:00:00Z",
  planCode: "8m",
};
