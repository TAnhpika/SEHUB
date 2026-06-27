import * as adminApi from "@/api/adminApi";
import { mapModerationPostDetail, mapModerationPostListItem } from "@/api/adminMapper";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";

export const CONTENT_QUEUE_PAGE_SIZE = 4;
export const CONTENT_HISTORY_PAGE_SIZE = 5;

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất trước" },
  { value: "oldest", label: "Cũ nhất trước" },
];

export const HISTORY_STATUS_TABS = [
  { id: "pending", label: "Đang chờ" },
  { id: "approved", label: "Đã duyệt" },
  { id: "rejected", label: "Đã từ chối" },
  { id: "all", label: "Tất cả" },
];

export const TYPE_META = {
  post: { label: "Bài viết", tone: "primary" },
};

/** Trạng thái pre-moderation bài viết (SEHUB_PhanTichNghiepVu §C) */
export const STATUS_META = {
  pending: { label: "Chờ duyệt", tone: "warning" },
  approved: { label: "Đã duyệt", tone: "success" },
  rejected: { label: "Đã từ chối", tone: "danger" },
};

export const DEFAULT_REJECT_REASON = "Không đáp ứng quy định nội dung cộng đồng SEHUB.";

/** Bài viết sinh viên gửi — chờ duyệt trước khi hiển thị trên feed (mock) */
export const CONTENT_QUEUE_MOCK = [
  {
    id: "cq-1",
    type: "post",
    title: "Hỏi về kinh nghiệm thi môn Cấu trúc dữ liệu",
    excerpt:
      "Mọi người cho mình hỏi môn Cấu trúc dữ liệu thi FE có khó không? Mình đang ôn theo slide của thầy...",
    content: `Mọi người cho mình hỏi môn Cấu trúc dữ liệu thi FE có khó không?

Mình đang ôn theo slide của thầy tuần 1–8, phần đệ quy và cây nhị phân hơi yếu. FE thường ra dạng trace code hay implement BST không ạ?

Mình attach slide ôn và vài bài tập mẫu bên dưới. Cảm ơn mọi người!`,
    semester: "Fall 2025",
    major: "SE",
    tags: ["CSD", "FE"],
    coverImage: {
      url: "https://picsum.photos/seed/sehub-csd/960/480",
      alt: "Ảnh bìa — ôn tập Cấu trúc dữ liệu",
    },
    inlineImages: [
      {
        url: "https://picsum.photos/seed/sehub-bst/720/405",
        caption: "Minh họa cây nhị phân tìm kiếm (BST)",
      },
    ],
    attachments: [
      {
        id: "att-1",
        name: "CSD_FE_slide_week1-8.pdf",
        sizeLabel: "2.4 MB",
        type: "pdf",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
      {
        id: "att-2",
        name: "bst_exercises.zip",
        sizeLabel: "890 KB",
        type: "zip",
        url: "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-zip-file.zip",
      },
    ],
    allowComments: true,
    anonymous: false,
    authorName: "Nguyễn Văn A",
    authorInitial: "NV",
    studentId: "SE160000",
    submittedAtLabel: "10 phút trước",
    timeLabel: "10 phút trước",
    status: "pending",
    sortOrder: 1,
  },
  {
    id: "cq-3",
    type: "post",
    title: "Tuyển thành viên tham gia Hackathon FPT 2024",
    excerpt:
      "Team mình đang tìm thêm 2 bạn backend và 1 bạn UI/UX cho cuộc thi Hackathon FPT 2024...",
    content: `Team mình đang tìm thêm 2 bạn backend (Node/Spring) và 1 bạn UI/UX cho Hackathon FPT 2024.

Thời gian: 48h liên tục, chủ đề EdTech. Repo mẫu và pitch deck mình đính kèm.

Inbox GitHub hoặc comment bên dưới nếu bạn quan tâm nhé!`,
    semester: "Fall 2025",
    major: "SE",
    tags: ["Hackathon", "Team"],
    coverImage: {
      url: "https://picsum.photos/seed/sehub-hack/960/480",
      alt: "Poster Hackathon FPT 2024",
    },
    inlineImages: [],
    attachments: [{ id: "att-3", name: "hackathon_pitch_deck.pdf", sizeLabel: "3.1 MB", type: "pdf" }],
    allowComments: true,
    anonymous: false,
    authorName: "Lê Hoàng D",
    authorInitial: "LH",
    studentId: "SE140999",
    submittedAtLabel: "1 giờ trước",
    timeLabel: "1 giờ trước",
    status: "pending",
    sortOrder: 2,
  },
  {
    id: "cq-5",
    type: "post",
    title: "Chia sẻ lộ trình học PRF192 trong 4 tuần",
    excerpt: "Mình vừa hoàn thành PRF192 với điểm A. Dưới đây là lịch học từng tuần...",
    content: `Mình vừa hoàn thành PRF192 với điểm A. Dưới đây là lịch học từng tuần:

Tuần 1–2: OOP cơ bản, class/object, constructor.
Tuần 3: Collections, ArrayList, HashMap.
Tuần 4: Ôn FE + làm đề mẫu.

File lộ trình chi tiết và checklist ôn tập mình để trong file đính kèm.`,
    semester: "Summer 2025",
    major: "SE",
    tags: ["PRF192"],
    coverImage: null,
    inlineImages: [
      {
        url: "https://picsum.photos/seed/sehub-prf/720/405",
        caption: "Screenshot lịch ôn PRF192 trên Notion",
      },
    ],
    attachments: [
      { id: "att-4", name: "PRF192_4week_plan.pdf", sizeLabel: "1.2 MB", type: "pdf" },
      { id: "att-5", name: "PRF192_checklist.xlsx", sizeLabel: "420 KB", type: "file" },
    ],
    allowComments: true,
    anonymous: false,
    authorName: "Hoàng Minh F",
    authorInitial: "HF",
    studentId: "SE160045",
    submittedAtLabel: "3 giờ trước",
    timeLabel: "3 giờ trước",
    status: "pending",
    sortOrder: 3,
  },
  {
    id: "cq-7",
    type: "post",
    title: "Review môn SWR302 — Project cuối kỳ",
    excerpt: "Môn Software Requirements khá nặng phần document. Ai đã học cho mình xin tips...",
    content: `Môn Software Requirements khá nặng phần document — SRS, use case, activity diagram.

Tips của mình:
- Làm diagram sớm, đừng để cuối kỳ.
- Review kỹ rubric trước khi nộp.
- Phần khó nhất là use case diagram và mô tả luồng ngoại lệ.

Mình đính kèm template SRS team mình dùng (đạt 8.5).`,
    semester: "Fall 2025",
    major: "SE",
    tags: ["SWR302"],
    coverImage: {
      url: "https://picsum.photos/seed/sehub-swr/960/480",
      alt: "Use case diagram mẫu",
    },
    inlineImages: [],
    attachments: [{ id: "att-6", name: "SWR302_SRS_template.docx", sizeLabel: "680 KB", type: "file" }],
    allowComments: true,
    anonymous: true,
    authorName: "Ẩn danh",
    authorInitial: "?",
    studentId: "—",
    submittedAtLabel: "5 giờ trước",
    timeLabel: "5 giờ trước",
    status: "pending",
    sortOrder: 4,
  },
  {
    id: "cq-9",
    type: "post",
    title: "Góp ý cách ôn MAD hiệu quả trước FE",
    excerpt:
      "Mình thấy phần design pattern khó nhất. Mọi người có tài liệu hoặc tip nào chia sẻ không...",
    content: `Mình thấy phần design pattern khó nhất trong MAD, đặc biệt Singleton vs Factory.

Ai có mindmap hoặc slide tóm tắt pattern không? Mình cần ôn nhanh trước FE tuần sau.

Cảm ơn mọi người!`,
    semester: "Summer 2025",
    major: "SE",
    tags: ["MAD", "FE"],
    coverImage: null,
    inlineImages: [],
    attachments: [],
    allowComments: true,
    anonymous: false,
    authorName: "Ngô Văn K",
    authorInitial: "NK",
    studentId: "SE150012",
    submittedAtLabel: "8 giờ trước",
    timeLabel: "8 giờ trước",
    status: "pending",
    sortOrder: 5,
  },
  {
    id: "cq-11",
    type: "post",
    title: "Tổng hợp đề FE môn MAD — kỳ Summer 2025",
    excerpt: "Mình gom 3 đề FE gần nhất, có đáp án tham khảo (chưa verify 100%)...",
    content: `Mình gom 3 đề FE MAD kỳ Summer 2025 gần nhất.

Lưu ý: đáp án chỉ tham khảo, chưa verify 100% với giảng viên.

File ZIP gồm:
- 3 đề PDF
- Đáp án draft
- Ghi chú phần pattern hay gặp

Mọi người dùng cẩn thận, đối chiếu thêm slide nhé!`,
    semester: "Summer 2025",
    major: "SE",
    tags: ["MAD", "FE"],
    coverImage: {
      url: "https://picsum.photos/seed/sehub-mad/960/480",
      alt: "Trang bìa đề MAD",
    },
    inlineImages: [
      { url: "https://picsum.photos/seed/sehub-mad2/720/405", caption: "Trang 1 — đề trắc nghiệm mẫu" },
      { url: "https://picsum.photos/seed/sehub-mad3/720/405", caption: "Trang 2 — câu hỏi design pattern" },
    ],
    attachments: [
      { id: "att-7", name: "MAD_FE_Summer2025_bundle.zip", sizeLabel: "8.6 MB", type: "zip" },
      { id: "att-8", name: "answer_key_draft.pdf", sizeLabel: "1.8 MB", type: "pdf" },
    ],
    allowComments: false,
    anonymous: false,
    authorName: "Trịnh Văn M",
    authorInitial: "TM",
    studentId: "SE140556",
    submittedAtLabel: "12 giờ trước",
    timeLabel: "12 giờ trước",
    status: "pending",
    sortOrder: 6,
  },
];

/** Bài đã qua kiểm duyệt — lịch sử (mock) */
export const CONTENT_HISTORY_MOCK = [
  {
    id: "ch-1",
    type: "post",
    title: "Chia sẻ slide ôn WED201c — Responsive cơ bản",
    excerpt: "Tổng hợp slide tuần 1–5 và ví dụ Flexbox/Grid cho ai đang học WED201c...",
    content: `Tổng hợp slide tuần 1–5 và ví dụ Flexbox/Grid cho ai đang học WED201c.

Mình đã kiểm tra link và file PDF, không chứa nội dung vi phạm. Chúc mọi người ôn tốt!`,
    semester: "Fall 2025",
    major: "SE",
    tags: ["WED201c"],
    coverImage: {
      url: "https://picsum.photos/seed/sehub-wed/960/480",
      alt: "Slide WED201c",
    },
    inlineImages: [],
    attachments: [{ id: "att-h1", name: "WED201c_week1-5.pdf", sizeLabel: "4.2 MB", type: "pdf" }],
    allowComments: true,
    anonymous: false,
    authorName: "Phạm Thu B",
    authorInitial: "PB",
    studentId: "SE160112",
    submittedAtLabel: "2 ngày trước",
    timeLabel: "2 ngày trước",
    status: "approved",
    sortOrder: 101,
    moderation: {
      moderatorName: "Trần Kiểm Duyệt",
      moderatorId: "MOD002",
      actionAtLabel: "2 ngày trước, 15:20",
      note: "Nội dung học thuật phù hợp, file PDF hợp lệ.",
    },
  },
  {
    id: "ch-2",
    type: "post",
    title: "Kinh nghiệm làm đồ án SWP391 với team 4 người",
    excerpt: "Chia sẻ cách phân role, dùng Git flow và demo sprint review hiệu quả...",
    content: `Chia sẻ cách phân role, dùng Git flow và demo sprint review hiệu quả khi làm SWP391.

Team mình dùng branch develop + PR review, tránh merge thẳng main.`,
    semester: "Summer 2025",
    major: "SE",
    tags: ["SWP391", "Team"],
    coverImage: null,
    inlineImages: [
      { url: "https://picsum.photos/seed/sehub-swp/720/405", caption: "Board phân task trên Trello" },
    ],
    attachments: [],
    allowComments: true,
    anonymous: false,
    authorName: "Võ Minh C",
    authorInitial: "VC",
    studentId: "SE150088",
    submittedAtLabel: "3 ngày trước",
    timeLabel: "3 ngày trước",
    status: "approved",
    sortOrder: 102,
    moderation: {
      moderatorName: "Nguyễn Mod SEHUB",
      moderatorId: "MOD001",
      actionAtLabel: "3 ngày trước, 09:45",
      note: "Đã duyệt — hiển thị trên feed cộng đồng.",
    },
  },
  {
    id: "ch-3",
    type: "post",
    title: "Bán tài liệu PRF192 full đáp án FE (zalo inbox)",
    excerpt: "Inbox Zalo để mua bộ đề + đáp án PRF192, cam kết pass 100%...",
    content: `Inbox Zalo 0xxx để mua bộ đề + đáp án PRF192, cam kết pass 100%.

Giá 50k, chuyển khoản trước. Không refund.`,
    semester: "Fall 2025",
    major: "SE",
    tags: ["PRF192"],
    coverImage: null,
    inlineImages: [],
    attachments: [{ id: "att-h3", name: "preview_de.pdf", sizeLabel: "120 KB", type: "pdf" }],
    allowComments: false,
    anonymous: false,
    authorName: "user_spam01",
    authorInitial: "US",
    studentId: "SE160777",
    submittedAtLabel: "1 ngày trước",
    timeLabel: "1 ngày trước",
    status: "rejected",
    sortOrder: 103,
    moderation: {
      moderatorName: "Trần Kiểm Duyệt",
      moderatorId: "MOD002",
      actionAtLabel: "1 ngày trước, 11:10",
      reason: "Quảng cáo mua bán tài liệu / thu phí — vi phạm quy định cộng đồng.",
      resubmitHint: "Tác giả có thể chỉnh sửa và gửi duyệt lại.",
    },
  },
  {
    id: "ch-4",
    type: "post",
    title: "Link tải crack JetBrains full license",
    excerpt: "Share link tải bản crack IntelliJ IDEA, dùng keygen kèm hướng dẫn...",
    content: `Share link tải bản crack IntelliJ IDEA 2024, dùng keygen kèm hướng dẫn cài đặt.

Link: [đã gỡ] — dùng cho mục đích học tập.`,
    semester: "Fall 2025",
    major: "SE",
    tags: ["Tools"],
    coverImage: null,
    inlineImages: [],
    attachments: [],
    allowComments: true,
    anonymous: true,
    authorName: "Ẩn danh",
    authorInitial: "?",
    studentId: "—",
    submittedAtLabel: "4 ngày trước",
    timeLabel: "4 ngày trước",
    status: "rejected",
    sortOrder: 104,
    moderation: {
      moderatorName: "Nguyễn Mod SEHUB",
      moderatorId: "MOD001",
      actionAtLabel: "4 ngày trước, 16:00",
      reason: "Chia sẻ phần mềm crack / bản quyền vi phạm — từ chối đăng.",
      resubmitHint: "Tác giả có thể chỉnh sửa và gửi duyệt lại.",
    },
  },
  {
    id: "ch-5",
    type: "post",
    title: "Hỏi lịch thi MAE101 — Summer 2025 (gửi lại lần 2)",
    excerpt: "Mình đã sửa bài theo góp ý mod, xin hỏi lại lịch thi chính thức MAE101...",
    content: `Mình đã sửa bài theo góp ý moderator (bỏ link ngoài không liên quan).

Xin hỏi lịch thi chính thức MAE101 kỳ Summer 2025 và phòng thi FE ạ?`,
    semester: "Summer 2025",
    major: "SE",
    tags: ["MAE101"],
    coverImage: null,
    inlineImages: [],
    attachments: [],
    allowComments: true,
    anonymous: false,
    authorName: "Đặng Thị E",
    authorInitial: "DE",
    studentId: "SE160033",
    submittedAtLabel: "6 giờ trước",
    timeLabel: "6 giờ trước",
    status: "pending",
    resubmission: true,
    previousRejectId: "ch-3",
    sortOrder: 105,
    moderation: null,
  },
];

export function buildDefaultContentItems() {
  return [...CONTENT_QUEUE_MOCK, ...CONTENT_HISTORY_MOCK];
}

function buildItemHaystack(item) {
  return [
    item.title,
    item.excerpt,
    item.content,
    item.authorName,
    item.studentId,
    item.semester,
    item.major,
    item.moderation?.moderatorName,
    item.moderation?.reason,
    item.moderation?.note,
    ...(item.tags ?? []),
    ...(item.attachments ?? []).map((file) => file.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterContentItems(items, { status = "all", query = "", sort = "newest" }) {
  const normalizedQuery = query.trim().toLowerCase();

  let result = items.filter((item) => {
    if (item.type !== "post") return false;
    if (status !== "all" && item.status !== status) return false;
    if (!normalizedQuery) return true;
    return buildItemHaystack(item).includes(normalizedQuery);
  });

  result = [...result].sort((a, b) =>
    sort === "oldest" ? a.sortOrder - b.sortOrder : b.sortOrder - a.sortOrder,
  );

  return result;
}

/** Hàng đợi — chỉ bài chờ duyệt */
export function filterContentQueue(items, options) {
  return filterContentItems(items, { ...options, status: "pending" });
}

export function countContentByStatus(items) {
  return {
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
    all: items.filter((item) => item.type === "post").length,
  };
}

export async function loadModerationContentItems({ status, sort = "newest" } = {}) {
  if (USE_MOCK) {
    return buildDefaultContentItems();
  }

  const params = { pageSize: ADMIN_API_PAGE_SIZE, sort };
  if (status && status !== "all") {
    if (status === "pending") params.status = "Pending";
    else if (status === "approved") params.status = "Published";
    else if (status === "rejected") params.status = "Rejected";
  }

  const page = await adminApi.listModerationPosts(params);
  return (page.items ?? []).map(mapModerationPostListItem);
}

export async function fetchModerationContentDetail(id) {
  if (USE_MOCK) return null;
  const dto = await adminApi.getModerationPost(id);
  return mapModerationPostDetail(dto);
}
