/** Mock data & helpers — quản lý đề thi Admin */

import * as adminApi from "@/api/adminApi";
import {
  mapAdminExamDetail,
  mapAdminExamFormToCreateRequest,
  mapAdminExamFormToUpdateRequest,
  mapAdminExamListItem,
  mapMockOcrQuestionsToCreateItems,
  mapPendingExamFromCreate,
  mapPendingExamListItem,
  mapPracticeExamFormToCreateRequest,
} from "@/api/adminMapper";
import { addAdminDocumentFromApprovedExam } from "@/features/admin/documents/adminDocumentData";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import { getSubmissionsByCourseCode } from "@/features/exams/practiceExamSubmissions";
import { isValidGuid } from "@/features/feed/postUtils";
import { enrichRevisionExamEntries } from "@/utils/examDisplay";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const ADMIN_EXAMS_PAGE_SIZE = 5;

export const EXAM_TRACKS = [
  { id: "all", label: "Tất cả ngành" },
  { id: "SE", label: "Khối SE" },
  { id: "AI", label: "Khối AI" },
];

export const EXAM_SEMESTERS = [
  { id: "all", label: "Tất cả kỳ" },
  ...Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return { id: String(n), label: `Kì ${n}` };
  }),
];

const TYPE_FINAL = "Cuối kỳ";
const TYPE_PRACTICE = "Thực hành";

/** Trạng thái đề — chỉ Admin thấy bản nháp; SV chỉ thấy đã xuất bản */
export const EXAM_STATUS_LABELS = {
  published: "Đã xuất bản",
  draft: "Bản nháp",
};

export const EXAM_TYPE_OPTIONS = [
  {
    key: "final",
    label: TYPE_FINAL,
    description: "OCR file PDF/ảnh → ngân hàng câu trắc nghiệm. Premium làm bài online.",
  },
  {
    key: "practice",
    label: TYPE_PRACTICE,
    description: "Upload PDF/ảnh/ZIP đề bài. Sinh viên Premium nộp link GitHub.",
  },
];

export const FINAL_EXAM_DEFAULTS = {
  durationMinutes: 60,
  maxQuestions: 50,
};

/** Lý do Admin từ chối đề từ Mod */
export const EXAM_REJECT_REASONS = [
  { id: "ocr_error", label: "OCR sai / thiếu câu hỏi hoặc đáp án" },
  { id: "duplicate", label: "Trùng đề đã publish (SHA / nội dung)" },
  { id: "wrong_meta", label: "Sai mã môn, kỳ học hoặc loại đề" },
  { id: "low_quality", label: "Chất lượng đề không đạt (mơ hồ, lỗi format)" },
  { id: "policy", label: "Vi phạm quy định / nội dung không phù hợp" },
  { id: "other", label: "Lý do khác" },
];

export const PRACTICE_EXAM_DEFAULTS = {
  githubGuide:
    "Nộp link repository GitHub công khai. README ghi rõ MSSV, họ tên và hướng dẫn chạy project.",
};

/** @type {import('./adminExamTypes').AdminExam[]} */
let examsStore = [
  {
    id: "ex1",
    code: "PRF192",
    title: "Giữa kỳ Lập trình Web",
    type: TYPE_PRACTICE,
    typeKey: "practice",
    track: "SE",
    semester: "5",
    status: "published",
    questions: 0,
    questionCount: 0,
    updatedAt: "2026-05-28",
    createdAt: "2026-05-10",
    sha256: "a3f2c891d4e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    description: "Xây dựng website theo rubric giữa kỳ. Nộp repo GitHub trước deadline.",
    githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
    deadline: "2026-06-15",
    attachments: [{ id: "f1", name: "PRF192-midterm-brief.pdf", size: 1200000 }],
  },
  {
    id: "ex2",
    code: "MAE101",
    title: "Cuối kỳ Toán rời rạc",
    type: TYPE_FINAL,
    typeKey: "final",
    track: "SE",
    semester: "3",
    status: "published",
    questions: 45,
    questionCount: 45,
    updatedAt: "2026-04-10",
    createdAt: "2026-03-01",
    sha256: "b4e3d792e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    description: "45 câu trắc nghiệm, thời gian 60 phút.",
  },
  {
    id: "ex3",
    code: "SWP391",
    title: "Đồ án tốt nghiệp — mẫu đề",
    type: TYPE_PRACTICE,
    typeKey: "practice",
    track: "SE",
    semester: "9",
    status: "draft",
    questions: 0,
    questionCount: 0,
    updatedAt: "2026-06-01",
    createdAt: "2026-05-28",
    sha256: "c5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    description: "Mô tả yêu cầu đồ án, rubric chấm.",
  },
  {
    id: "ex4",
    code: "DBI202",
    title: "Giữa kỳ Cơ sở dữ liệu",
    type: TYPE_FINAL,
    typeKey: "final",
    track: "SE",
    semester: "5",
    status: "published",
    questions: 40,
    questionCount: 40,
    updatedAt: "2026-05-15",
    createdAt: "2026-04-20",
    sha256: "d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
    description: "",
  },
  {
    id: "ex5",
    code: "AIL303",
    title: "Cuối kỳ Machine Learning",
    type: TYPE_FINAL,
    typeKey: "final",
    track: "AI",
    semester: "6",
    status: "published",
    questions: 50,
    questionCount: 50,
    updatedAt: "2026-05-20",
    createdAt: "2026-05-01",
    sha256: "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    description: "",
  },
  {
    id: "ex6",
    code: "PRJ301",
    title: "Thực hành Java OOP",
    type: TYPE_PRACTICE,
    typeKey: "practice",
    track: "SE",
    semester: "4",
    status: "draft",
    questions: 0,
    questionCount: 0,
    updatedAt: "2026-04-28",
    createdAt: "2026-04-15",
    sha256: "f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
    description: "Lab 1–5 trên GitHub.",
  },
  {
    id: "ex7",
    code: "PRF192",
    title: "Đề ôn PRF192 (bản scan cũ)",
    type: TYPE_FINAL,
    typeKey: "final",
    track: "SE",
    semester: "2",
    status: "draft",
    questions: 30,
    questionCount: 30,
    updatedAt: "2026-03-12",
    createdAt: "2026-03-01",
    sha256: "a3f2c891d4e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    description: "Trùng hash với đề đã OCR — cần review.",
  },
  {
    id: "ex8",
    code: "NLP201",
    title: "Thực hành NLP cơ bản",
    type: TYPE_PRACTICE,
    typeKey: "practice",
    track: "AI",
    semester: "7",
    status: "published",
    questions: 0,
    questionCount: 0,
    updatedAt: "2026-06-02",
    createdAt: "2026-05-25",
    sha256: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0b1a2",
    description: "",
  },
];

/** Hash trùng cố ý cho demo OCR */
export const DEMO_DUPLICATE_SHA =
  "a3f2c891d4e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0";

let pendingStore = [
  {
    id: "p1",
    code: "PRF192",
    title: "Đề thi giữa kỳ môn Lập trình Web",
    submittedBy: "Nguyễn Kiểm Duyệt",
    submittedAt: "2026-06-02",
    type: TYPE_PRACTICE,
    typeKey: "practice",
    track: "SE",
    semester: "5",
    urgent: true,
    fileName: "PRF192-midterm-brief.pdf",
    description:
      "Sinh viên nộp project React theo rubric giữa kỳ. README bắt buộc có MSSV và hướng dẫn chạy.",
    githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
  },
  {
    id: "p2",
    code: "DBI202",
    title: "Cuối kỳ Cơ sở dữ liệu",
    submittedBy: "Nguyễn Kiểm Duyệt",
    submittedAt: "2026-06-03",
    type: TYPE_FINAL,
    typeKey: "final",
    track: "SE",
    semester: "6",
    urgent: false,
    fileName: "DBI202-final.pdf",
    description: "",
    githubGuide: "",
  },
];

/** Cache đề chờ duyệt từ API (API mode) */
let apiPendingCache = [];

export const MOCK_OCR_QUESTIONS = [
  {
    id: "q1",
    text: "React Hook nào dùng để fetch dữ liệu khi mount?",
    options: ["useState", "useEffect", "useMemo", "useRef"],
    correct: 1,
  },
  {
    id: "q2",
    text: "Virtual DOM giúp tối ưu điều gì?",
    options: ["Băng thông", "Số lần thao tác DOM", "CSS", "SEO"],
    correct: 1,
  },
  {
    id: "q3",
    text: "Prop `key` trong list React dùng để?",
    options: ["Style", "Nhận diện phần tử khi re-render", "Event", "Router"],
    correct: 1,
  },
];

/** Chuẩn hóa kết quả OCR demo → format import câu hỏi (Moderator / Admin wizard). */
export function buildMockOcrImportQuestions() {
  return MOCK_OCR_QUESTIONS.map((question, index) => {
    const options = question.options.map((text, optionIndex) => ({
      id: crypto.randomUUID(),
      label: String.fromCharCode(65 + optionIndex),
      text,
    }));

    return {
      orderIndex: index + 1,
      content: question.text,
      questionType: "SingleChoice",
      options,
      correctOptionId: options[question.correct]?.id ?? null,
    };
  });
}

export function getAdminExams() {
  return [...examsStore];
}

export function getAdminExamById(id) {
  return examsStore.find((e) => e.id === id) ?? null;
}

export function getAdminPendingExams() {
  if (USE_MOCK) {
    return [...pendingStore];
  }
  return [...apiPendingCache];
}

export async function loadAdminPendingExams() {
  if (USE_MOCK) {
    return getAdminPendingExams();
  }

  const page = await adminApi.listExams({ status: "PendingApproval", pageSize: ADMIN_API_PAGE_SIZE });
  apiPendingCache = enrichRevisionExamEntries(
    (page.items ?? []).map((dto) => mapPendingExamListItem(dto)),
  );
  return apiPendingCache;
}

async function createExamViaApi(body, confirmDuplicate = false) {
  return adminApi.createExam(body, confirmDuplicate);
}

export async function importExamQuestionsFromMarkdown(markdown) {
  if (USE_MOCK) {
    return {
      questions: MOCK_OCR_QUESTIONS.map((q, index) => ({
        orderIndex: index + 1,
        content: q.text,
        options: q.options.map((text, optionIndex) => ({
          id: crypto.randomUUID(),
          label: String.fromCharCode(65 + optionIndex),
          text,
        })),
        correctOptionId: null,
      })),
      questionCount: MOCK_OCR_QUESTIONS.length,
      warnings: [],
    };
  }

  return adminApi.importExamMarkdown({ markdown });
}

function pickExamUploadFile(form, pdfFile) {
  if (pdfFile instanceof File) {
    return pdfFile;
  }

  if (form.typeKey === "practice") {
    const pdfAttachment = (form.attachments ?? []).find(
      (item) => item.file instanceof File && item.file.type === "application/pdf",
    );
    return pdfAttachment?.file ?? null;
  }

  return null;
}

async function uploadExamPdfIfPresent(examId, form, pdfFile) {
  const file = pickExamUploadFile(form, pdfFile);
  if (!file) {
    return null;
  }

  try {
    await adminApi.uploadExamAttachment(examId, file);
    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Không upload được file PDF lên Drive. Đề vẫn đã được lưu.";
  }
}

function upsertExamInStore(mappedListItem) {
  examsStore = [mappedListItem, ...examsStore.filter((exam) => exam.id !== mappedListItem.id)];
}

/**
 * Tạo đề qua API, publish nếu cần, upload PDF lên Drive khi có file.
 */
export async function saveAdminExamViaApi(form, options = {}) {
  const {
    status = "draft",
    ocrQuestions = [],
    questionsAreCreateItems = false,
    pdfFile = null,
    confirmDuplicate = false,
  } = options;

  if (USE_MOCK) {
    const created = createAdminExam({
      ...form,
      status,
      questionCount: form.typeKey === "final" ? ocrQuestions.length : 0,
      sha256: mockComputeSha256Unique(),
      ocrConfirmed: form.typeKey === "final",
    });
    return { exam: created, uploadWarning: null, listItem: created };
  }

  const questions =
    form.typeKey === "final"
      ? questionsAreCreateItems
        ? ocrQuestions
        : mapMockOcrQuestionsToCreateItems(ocrQuestions)
      : [];
  const body = mapAdminExamFormToCreateRequest(form, { questions });
  const dto = await adminApi.createExam(body, confirmDuplicate);

  if (status === "published") {
    await adminApi.approveExam(dto.id);
  }

  const uploadWarning = await uploadExamPdfIfPresent(dto.id, form, pdfFile);

  const refreshed = await adminApi.getExam(dto.id);
  const listItem = mapAdminExamListItem(refreshed);
  upsertExamInStore(listItem);
  return {
    exam: mapAdminExamDetail(refreshed),
    uploadWarning,
    listItem,
  };
}

/**
 * Cập nhật đề qua API, publish nếu cần, upload PDF khi có file mới.
 */
export async function updateAdminExamViaApi(examId, form, options = {}) {
  const {
    status = "draft",
    ocrQuestions = [],
    questionsAreCreateItems = false,
    pdfFile = null,
    confirmDuplicate = false,
  } = options;

  if (USE_MOCK) {
    const updated = updateAdminExam(examId, {
      ...form,
      status,
      questionCount: form.typeKey === "final" ? ocrQuestions.length : 0,
    });
    return { exam: updated, uploadWarning: null, listItem: updated };
  }

  const questions =
    form.typeKey === "final" && ocrQuestions.length > 0
      ? questionsAreCreateItems
        ? ocrQuestions
        : mapMockOcrQuestionsToCreateItems(ocrQuestions)
      : null;
  const body = mapAdminExamFormToUpdateRequest(form, { questions });

  await adminApi.updateExam(examId, body);

  if (status === "published") {
    await adminApi.approveExam(examId);
  }

  const uploadWarning = await uploadExamPdfIfPresent(examId, form, pdfFile);

  const refreshed = await adminApi.getExam(examId);
  const listItem = mapAdminExamListItem(refreshed);
  upsertExamInStore(listItem);
  return {
    exam: mapAdminExamDetail(refreshed),
    uploadWarning,
    listItem,
  };
}

export function removeAdminExam(id) {
  examsStore = examsStore.filter((e) => e.id !== id);
}

export async function removeAdminExamViaApi(id) {
  if (USE_MOCK) {
    const before = examsStore.length;
    removeAdminExam(id);
    return examsStore.length < before;
  }

  if (isValidGuid(String(id ?? ""))) {
    await adminApi.deleteExam(id);
  }

  const before = examsStore.length;
  removeAdminExam(id);
  return examsStore.length < before;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {object} payload
 * @returns {object}
 */
export function createAdminExam(payload) {
  const typeKey = payload.typeKey ?? "final";
  const newExam = {
    id: `ex${Date.now()}`,
    code: payload.code?.trim() ?? "",
    title: payload.title?.trim() ?? "",
    type: typeKey === "practice" ? TYPE_PRACTICE : TYPE_FINAL,
    typeKey,
    track: payload.track ?? "SE",
    semester: payload.semester ?? "5",
    status: payload.status ?? "draft",
    questions: payload.questionCount ?? 0,
    questionCount: payload.questionCount ?? 0,
    updatedAt: todayIso(),
    createdAt: todayIso(),
    sha256: payload.sha256 ?? "",
    description: payload.description ?? "",
    durationMinutes: payload.durationMinutes ?? FINAL_EXAM_DEFAULTS.durationMinutes,
    githubGuide: payload.githubGuide ?? "",
    deadline: payload.deadline ?? "",
    attachments: payload.attachments ?? [],
    ocrConfirmed: payload.ocrConfirmed ?? false,
  };
  examsStore = [newExam, ...examsStore];
  return newExam;
}

/**
 * @param {string} id
 * @param {object} payload
 */
export function updateAdminExam(id, payload) {
  const index = examsStore.findIndex((e) => e.id === id);
  if (index === -1) return null;
  const prev = examsStore[index];
  const typeKey = payload.typeKey ?? prev.typeKey;
  const updated = {
    ...prev,
    ...payload,
    type: typeKey === "practice" ? TYPE_PRACTICE : TYPE_FINAL,
    typeKey,
    questions: payload.questionCount ?? prev.questionCount,
    updatedAt: todayIso(),
  };
  examsStore = examsStore.map((e, i) => (i === index ? updated : e));
  return updated;
}

export function findDuplicateBySha(sha256, excludeId) {
  if (!sha256) return null;
  const norm = sha256.trim().toLowerCase();
  return (
    examsStore.find((e) => e.sha256?.toLowerCase() === norm && e.id !== excludeId) ?? null
  );
}

export function mockComputeSha256() {
  return DEMO_DUPLICATE_SHA;
}

export function mockComputeSha256Unique() {
  return `unique${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.padEnd(64, "0");
}

let approvedStore = [];
let rejectedStore = [];

/**
 * Moderator gửi đề thực hành vào hàng chờ Admin duyệt (§2.4).
 * @param {{
 *   subject: string;
 *   semesterId: string;
 *   title: string;
 *   description: string;
 *   submittedBy: string;
 *   attachments?: Array<{ name?: string }>;
 *   allowDiscussion?: boolean;
 *   pinExam?: boolean;
 * }} payload
 */
export async function submitModeratorPracticeExam(payload, createRequest, { confirmDuplicate = false } = {}) {
  const readyFiles = (payload.attachments ?? []).filter((file) => file.status === "done" && file.file);
  const primaryFile = readyFiles[0];
  const fileName = primaryFile?.name ?? payload.attachments?.find((f) => f.name)?.name ?? `${payload.subject}-practice-exam.pdf`;

  if (USE_MOCK) {
    const entry = {
      id: `p${Date.now()}`,
      code: payload.subject?.trim() ?? "",
      title: payload.title?.trim() ?? "",
      submittedBy: payload.submittedBy,
      submittedAt: todayIso(),
      type: TYPE_PRACTICE,
      typeKey: "practice",
      track: "SE",
      semester: payload.semesterId ?? "5",
      urgent: false,
      fileName,
      assetUrl: primaryFile
        ? `/uploads/exams/mock-${encodeURIComponent(primaryFile.name ?? fileName)}`
        : null,
      description: payload.description?.trim() ?? "",
      githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
      allowDiscussion: payload.allowDiscussion ?? false,
      pinExam: payload.pinExam ?? false,
    };

    pendingStore = [entry, ...pendingStore];
    return entry;
  }

  const body =
    createRequest ??
    mapPracticeExamFormToCreateRequest({
      subjectCode: payload.subject,
      semester: payload.semesterId,
      title: payload.title,
      description: payload.description,
      githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
    });

  const dto = await createExamViaApi(body, confirmDuplicate);

  for (const attachment of readyFiles) {
    await adminApi.uploadExamAttachment(dto.id, attachment.file);
  }

  const refreshed = readyFiles.length > 0 ? await adminApi.getExam(dto.id) : dto;
  const entry = mapPendingExamFromCreate(refreshed, {
    submittedBy: payload.submittedBy,
    fileName,
    githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
    allowDiscussion: payload.allowDiscussion,
    pinExam: payload.pinExam,
  });
  apiPendingCache = [entry, ...apiPendingCache.filter((item) => item.id !== entry.id)];
  return entry;
}

/**
 * Moderator gửi đề cuối kỳ vào hàng chờ Admin duyệt (§2.4).
 * @param {{
 *   subjectCode: string;
 *   subjectName?: string;
 *   semesterId: string;
 *   title: string;
 *   description?: string;
 *   submittedBy: string;
 *   examCode?: string;
 *   durationMinutes?: number;
 *   questionCount?: number;
 *   fileName?: string;
 * }} payload
 */
export async function submitModeratorFinalExam(payload, createRequest, { confirmDuplicate = false } = {}) {
  const fileName = payload.fileName ?? `${payload.subjectCode}-final.pdf`;

  if (USE_MOCK) {
    const entry = {
      id: `p${Date.now()}`,
      code: payload.subjectCode?.trim() ?? "",
      title: payload.title?.trim() ?? "",
      submittedBy: payload.submittedBy,
      submittedAt: todayIso(),
      type: TYPE_FINAL,
      typeKey: "final",
      track: "SE",
      semester: payload.semesterId ?? "5",
      urgent: false,
      fileName,
      description:
        payload.description?.trim() ??
        `${payload.subjectName ?? payload.subjectCode} · ${payload.questionCount ?? 0} câu trắc nghiệm`,
      githubGuide: "",
      examCode: payload.examCode ?? "",
      durationMinutes: payload.durationMinutes ?? FINAL_EXAM_DEFAULTS.durationMinutes,
      questionCount: payload.questionCount ?? 0,
    };

    pendingStore = [entry, ...pendingStore];
    return entry;
  }

  if (!createRequest) {
    throw new Error("Thiếu dữ liệu câu hỏi để gửi đề cuối kỳ.");
  }

  const dto = await createExamViaApi(createRequest, confirmDuplicate);
  const entry = mapPendingExamFromCreate(dto, {
    submittedBy: payload.submittedBy,
    fileName,
  });
  apiPendingCache = [entry, ...apiPendingCache.filter((item) => item.id !== entry.id)];
  return entry;
}

export async function approvePendingExam(pendingId) {
  if (USE_MOCK) {
    const item = pendingStore.find((p) => p.id === pendingId);
    if (!item) return null;
    pendingStore = pendingStore.filter((p) => p.id !== pendingId);
    const isFinal = item.typeKey === "final";
    const questionCount = isFinal ? MOCK_OCR_QUESTIONS.length : 0;
    const newExam = {
      id: `ex${Date.now()}`,
      code: item.code,
      title: item.title,
      type: item.type,
      typeKey: item.typeKey,
      track: item.track,
      semester: item.semester,
      status: "published",
      questions: questionCount,
      questionCount,
      updatedAt: new Date().toISOString().slice(0, 10),
      createdAt: item.submittedAt,
      sha256: mockComputeSha256Unique(),
      description: isFinal
        ? `Duyệt từ Mod — ${item.fileName}`
        : item.description || `Duyệt từ Mod — ${item.fileName}`,
      githubGuide: isFinal ? "" : item.githubGuide || PRACTICE_EXAM_DEFAULTS.githubGuide,
      durationMinutes: isFinal ? FINAL_EXAM_DEFAULTS.durationMinutes : undefined,
      attachments: item.assetUrl
        ? [{ id: "mod-file", name: item.fileName, size: 0, url: item.assetUrl }]
        : [{ id: "mod-file", name: item.fileName, size: 0 }],
      assetUrl: item.assetUrl ?? null,
      ocrConfirmed: isFinal,
    };
    examsStore = [newExam, ...examsStore];
    addAdminDocumentFromApprovedExam(newExam);
    const historyEntry = {
      ...item,
      approvedAt: new Date().toISOString().slice(0, 10),
      publishedExamId: newExam.id,
      questionCount,
    };
    approvedStore = [historyEntry, ...approvedStore];
    return newExam;
  }

  const item =
    apiPendingCache.find((p) => p.id === pendingId) ??
    (await loadAdminPendingExams()).find((p) => p.id === pendingId);
  if (!item) return null;

  await adminApi.approveExam(pendingId);
  apiPendingCache = apiPendingCache.filter((p) => p.id !== pendingId);
  const newExam = await loadAdminExamById(pendingId);
  if (newExam) {
    examsStore = [newExam, ...examsStore.filter((exam) => exam.id !== newExam.id)];
  }
  approvedStore = [
    {
      ...item,
      approvedAt: todayIso(),
      publishedExamId: pendingId,
      questionCount: item.questionCount ?? newExam?.questionCount ?? 0,
    },
    ...approvedStore,
  ];
  return newExam;
}

export function getAdminApprovedExams() {
  return [...approvedStore];
}

export function getAdminRejectedExams() {
  return [...rejectedStore];
}

export async function rejectPendingExam(pendingId, reasonPayload) {
  if (USE_MOCK) {
    const item = pendingStore.find((p) => p.id === pendingId);
    if (!item) return null;
    pendingStore = pendingStore.filter((p) => p.id !== pendingId);
    const entry = {
      ...item,
      rejectedAt: new Date().toISOString().slice(0, 10),
      rejectReasonId: reasonPayload.reasonId,
      rejectReasonLabel: reasonPayload.reasonLabel,
      rejectReasonDetail: reasonPayload.reasonDetail ?? "",
      rejectReasonFull: reasonPayload.reasonFull,
    };
    rejectedStore = [entry, ...rejectedStore];
    return entry;
  }

  const item =
    apiPendingCache.find((p) => p.id === pendingId) ??
    (await loadAdminPendingExams()).find((p) => p.id === pendingId);
  if (!item) return null;

  await adminApi.rejectExam(pendingId, {
    reasonCode: reasonPayload.reasonId,
    reasonLabel: reasonPayload.reasonLabel,
    detail: reasonPayload.reasonDetail ?? "",
  });
  apiPendingCache = apiPendingCache.filter((p) => p.id !== pendingId);
  const entry = {
    ...item,
    rejectedAt: todayIso(),
    rejectReasonId: reasonPayload.reasonId,
    rejectReasonLabel: reasonPayload.reasonLabel,
    rejectReasonDetail: reasonPayload.reasonDetail ?? "",
    rejectReasonFull: reasonPayload.reasonFull,
  };
  rejectedStore = [entry, ...rejectedStore];
  return entry;
}

export function getExamQuestions(examId) {
  const exam = getAdminExamById(examId);
  if (!exam || exam.questionCount === 0) return [];
  if (examId === "ex2") {
    return MOCK_OCR_QUESTIONS.concat([
      {
        id: "q4",
        text: "Tập hợp rỗng có bao nhiêu phần tử?",
        options: ["0", "1", "Không xác định", "∞"],
        correct: 0,
      },
    ]);
  }
  return MOCK_OCR_QUESTIONS.slice(0, Math.min(exam.questionCount, MOCK_OCR_QUESTIONS.length));
}

export function getExamSubmissions(examId) {
  const exam = getAdminExamById(examId);
  if (!exam) return [];
  return getSubmissionsByCourseCode(exam.code);
}

export function getSemesterLabel(id) {
  return EXAM_SEMESTERS.find((s) => s.id === id)?.label ?? id;
}

export function getTrackLabel(id) {
  return EXAM_TRACKS.find((t) => t.id === id)?.label ?? id;
}

export async function loadAdminExams() {
  if (USE_MOCK) {
    return getAdminExams();
  }

  try {
    const page = await adminApi.listExams({ pageSize: ADMIN_API_PAGE_SIZE });
    const apiExams = (page.items ?? []).map(mapAdminExamListItem);
    examsStore = apiExams.map((exam) => ({ ...exam }));
    return apiExams;
  } catch {
    return getAdminExams();
  }
}

export async function loadAdminExamById(id) {
  const mockExam = getAdminExamById(id);
  if (USE_MOCK || !isValidGuid(String(id ?? ""))) {
    return mockExam;
  }

  try {
    const dto = await adminApi.getExam(id);
    return mapAdminExamDetail(dto);
  } catch {
    return mockExam;
  }
}
