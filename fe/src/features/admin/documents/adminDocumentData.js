/** Mock store — tài liệu Admin theo kì / môn */

/** @typedef {'upload' | 'exam'} AdminDocumentSource */

/** @type {Array<{ id: string, name: string, subject: string, semester: string, track: string, access: string, pages: number, uploadedAt: string, source?: AdminDocumentSource, examTitle?: string, description?: string }>} */
let documentsStore = [
  /* PRF192 Kỳ 1 — bộ demo phân quyền Basic / Premium */
  {
    id: "doc-prf192-free-lecture",
    name: "BaiGiang_Java_Week1-4.pdf",
    subject: "PRF192",
    semester: "1",
    track: "SE",
    access: "Free (3 trang)",
    pages: 24,
    uploadedAt: "2026-05-10",
    source: "upload",
    description:
      "Slide bài giảng 4 tuần — SV Basic xem 3 trang đầu; Premium xem & tải toàn bộ 24 trang.",
  },
  {
    id: "doc-prf192-premium-lab",
    name: "Lab_GiaiChiem_Full.pdf",
    subject: "PRF192",
    semester: "1",
    track: "SE",
    access: "Premium",
    pages: 36,
    uploadedAt: "2026-05-12",
    source: "upload",
    description:
      "Đáp án lab chi tiết — chỉ Premium mở được; SV Basic thấy khóa & gợi ý nâng cấp.",
  },
  {
    id: "doc-prf192-free-cheatsheet",
    name: "CheatSheet_Syntax.docx",
    subject: "PRF192",
    semester: "1",
    track: "SE",
    access: "Free (3 trang)",
    pages: 5,
    uploadedAt: "2026-05-20",
    source: "upload",
    description:
      "Tóm tắt cú pháp Java — file ngắn (5 trang): Basic vẫn chỉ xem tối đa 3 trang.",
  },
  {
    id: "d1",
    name: "Slide_OOP_Java.pdf",
    subject: "PRJ301",
    semester: "4",
    track: "SE",
    access: "Premium",
    pages: 84,
    uploadedAt: "2026-05-15",
    source: "upload",
    description: "Slide OOP nâng cao — Premium only.",
  },
];

export function getAdminDocuments() {
  return [...documentsStore];
}

export function getAdminDocumentsBySubject(subjectCode, semester) {
  const code = subjectCode?.trim().toUpperCase() ?? "";
  return documentsStore.filter((doc) => {
    if (doc.subject !== code) return false;
    if (semester && semester !== "all" && doc.semester !== semester) return false;
    return true;
  });
}

export function getAdminDocumentById(id) {
  return documentsStore.find((doc) => doc.id === id) ?? null;
}

/** Danh sách tài liệu SV — dùng chung store Admin */
export function getStudentDocumentsBySubject(subjectCode, semester) {
  return getAdminDocumentsBySubject(subjectCode, semester);
}

export function addAdminDocumentFromApprovedExam(exam) {
  const fileName =
    exam.attachments?.[0]?.name ?? (exam.typeKey === "final" ? `${exam.code}-final.pdf` : null);
  if (!fileName) return null;

  const entry = {
    id: `doc-${Date.now()}`,
    name: fileName,
    subject: exam.code,
    semester: exam.semester ?? "1",
    track: exam.track ?? "SE",
    access: "Premium",
    pages: exam.typeKey === "final" ? exam.questionCount || 0 : 0,
    uploadedAt: new Date().toISOString().slice(0, 10),
    source: "exam",
    examTitle: exam.title,
  };
  documentsStore = [entry, ...documentsStore];
  return entry;
}

export function addAdminDocument(payload) {
  const entry = {
    id: `doc-${Date.now()}`,
    name: payload.name,
    subject: payload.subject?.trim().toUpperCase() ?? "",
    semester: payload.semester ?? "1",
    track: payload.track ?? "SE",
    access: payload.access ?? "Premium",
    pages: payload.pages ?? 0,
    uploadedAt: new Date().toISOString().slice(0, 10),
    source: "upload",
    description: payload.description?.trim() ?? "",
  };
  documentsStore = [entry, ...documentsStore];
  return entry;
}

export function parseDocumentAccessKey(access) {
  return access?.includes("Premium") ? "premium" : "free";
}

export function formatDocumentAccessLabel(accessKey) {
  return accessKey === "free" ? "Free (3 trang)" : "Premium";
}

/**
 * @param {string} id
 * @param {{ accessKey?: string, pages?: number, semester?: string, description?: string }} payload
 */
export function updateAdminDocument(id, payload) {
  const index = documentsStore.findIndex((doc) => doc.id === id);
  if (index === -1) {
    return { ok: false, message: "Không tìm thấy tài liệu." };
  }

  const current = documentsStore[index];
  const pagesRaw = Number(payload.pages);
  const pages =
    Number.isFinite(pagesRaw) && pagesRaw > 0 ? pagesRaw : Math.max(current.pages, 1);

  const accessKey = payload.accessKey ?? parseDocumentAccessKey(current.access);
  const next = {
    ...current,
    access: formatDocumentAccessLabel(accessKey),
    pages,
    description: payload.description?.trim() ?? "",
  };

  if (current.source !== "exam" && payload.semester) {
    next.semester = payload.semester;
  }

  documentsStore = documentsStore.map((doc, docIndex) =>
    docIndex === index ? next : doc,
  );

  return { ok: true, document: next };
}

export function removeAdminDocument(id) {
  const before = documentsStore.length;
  documentsStore = documentsStore.filter((d) => d.id !== id);
  return documentsStore.length < before;
}
