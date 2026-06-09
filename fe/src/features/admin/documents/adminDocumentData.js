/** Mock store — tài liệu Admin / Student theo kì & môn (§3.5) */

/** @typedef {'upload' | 'exam'} AdminDocumentSource */

/** @type {Array<{ id: string, name: string, subject: string, semester: string, track: string, access: string, pages: number, uploadedAt: string, source?: AdminDocumentSource, examTitle?: string, description?: string }>} */
let documentsStore = [
  /* ── PRF192 · Kỳ 1 · SE ── */
  {
    id: "doc-prf192-free-lecture",
    name: "BaiGiang_Java_Week1-4.pdf",
    subject: "PRF192",
    semester: "1",
    track: "SE",
    access: "Free (3 trang)",
    pages: 24,
    uploadedAt: "2026-05-10, 09:15:00",
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
    uploadedAt: "2026-05-12, 14:30:00",
    source: "upload",
    description: "Đáp án lab chi tiết — chỉ Premium mở được.",
  },
  {
    id: "doc-prf192-free-cheatsheet",
    name: "CheatSheet_Syntax.docx",
    subject: "PRF192",
    semester: "1",
    track: "SE",
    access: "Free (3 trang)",
    pages: 5,
    uploadedAt: "2026-05-20, 11:00:00",
    source: "upload",
    description: "Tóm tắt cú pháp Java — file ngắn, Basic vẫn giới hạn 3 trang.",
  },
  {
    id: "doc-prf192-slide-oop",
    name: "Slide_OOP_Intro.pptx",
    subject: "PRF192",
    semester: "1",
    track: "SE",
    access: "Free (3 trang)",
    pages: 18,
    uploadedAt: "2026-05-22, 16:45:00",
    source: "upload",
    description: "Slide giới thiệu OOP — có thể tải full khi Premium.",
  },

  /* ── PRO192 · Kỳ 2 · SE ── */
  {
    id: "doc-pro192-oop-slide",
    name: "PRO192_OOP_FullSlide.pdf",
    subject: "PRO192",
    semester: "2",
    track: "SE",
    access: "Free (3 trang)",
    pages: 42,
    uploadedAt: "2026-04-08, 10:20:00",
    source: "upload",
    description: "Slide OOP Java — inheritance, polymorphism, abstract class.",
  },
  {
    id: "doc-pro192-assignment",
    name: "Assignment_Week5-8.pdf",
    subject: "PRO192",
    semester: "2",
    track: "SE",
    access: "Premium",
    pages: 12,
    uploadedAt: "2026-04-15, 08:00:00",
    source: "upload",
    description: "Đề bài tập lớn PRO192 — Premium only.",
  },
  {
    id: "doc-pro192-review",
    name: "OnTap_GiuaKy.docx",
    subject: "PRO192",
    semester: "2",
    track: "SE",
    access: "Free (3 trang)",
    pages: 8,
    uploadedAt: "2026-04-20, 13:10:00",
    source: "upload",
    description: "Câu hỏi ôn giữa kỳ — kèm đáp án ở cuối file (Premium xem full).",
  },

  /* ── NWC203C · Kỳ 2 · SE ── */
  {
    id: "doc-nwc203-network",
    name: "MangMayTinh_CoBan.pdf",
    subject: "NWC203C",
    semester: "2",
    track: "SE",
    access: "Free (3 trang)",
    pages: 56,
    uploadedAt: "2026-03-05, 09:00:00",
    source: "upload",
    description: "OSI model, TCP/IP, subnetting cơ bản.",
  },
  {
    id: "doc-nwc203-lab-wireshark",
    name: "Lab_Wireshark.pptx",
    subject: "NWC203C",
    semester: "2",
    track: "SE",
    access: "Premium",
    pages: 22,
    uploadedAt: "2026-03-12, 15:30:00",
    source: "upload",
    description: "Hướng dẫn lab bắt gói tin Wireshark — Premium.",
  },

  /* ── PRJ301 · Kỳ 4 · SE ── */
  {
    id: "doc-prj301-servlet",
    name: "JavaWeb_Servlet_JSP.pdf",
    subject: "PRJ301",
    semester: "4",
    track: "SE",
    access: "Free (3 trang)",
    pages: 64,
    uploadedAt: "2026-02-01, 11:20:00",
    source: "upload",
    description: "Servlet, JSP, MVC pattern trên Java EE.",
  },
  {
    id: "doc-prj301-oop",
    name: "Slide_OOP_Java.pdf",
    subject: "PRJ301",
    semester: "4",
    track: "SE",
    access: "Premium",
    pages: 84,
    uploadedAt: "2026-05-15, 17:46:00",
    source: "upload",
    description: "Slide OOP nâng cao — Premium only.",
  },
  {
    id: "doc-prj301-jdbc",
    name: "HuongDan_JDBC.docx",
    subject: "PRJ301",
    semester: "4",
    track: "SE",
    access: "Free (3 trang)",
    pages: 15,
    uploadedAt: "2026-02-18, 09:45:00",
    source: "upload",
    description: "Kết nối MySQL qua JDBC, PreparedStatement.",
  },

  /* ── SWP391 · Kỳ 4 · SE ── */
  {
    id: "doc-swp391-capstone",
    name: "Capstone_ProjectGuide.pdf",
    subject: "SWP391",
    semester: "4",
    track: "SE",
    access: "Free (3 trang)",
    pages: 30,
    uploadedAt: "2026-01-10, 10:00:00",
    source: "upload",
    description: "Hướng dẫn đồ án tốt nghiệp — timeline, rubric chấm điểm.",
  },
  {
    id: "doc-swp391-template",
    name: "Report_Template.docx",
    subject: "SWP391",
    semester: "4",
    track: "SE",
    access: "Premium",
    pages: 20,
    uploadedAt: "2026-01-15, 14:00:00",
    source: "upload",
    description: "Mẫu báo cáo đồ án — Premium tải về chỉnh sửa.",
  },

  /* ── DBI202 · Kỳ 5 · SE ── */
  {
    id: "doc-dbi202-er",
    name: "Database_ER_Model.pdf",
    subject: "DBI202",
    semester: "5",
    track: "SE",
    access: "Free (3 trang)",
    pages: 48,
    uploadedAt: "2025-11-20, 08:30:00",
    source: "upload",
    description: "Thiết kế ER, chuẩn hóa 1NF–3NF, mapping sang relational schema.",
  },
  {
    id: "doc-dbi202-sql",
    name: "SQL_Practice_Sets.pdf",
    subject: "DBI202",
    semester: "5",
    track: "SE",
    access: "Premium",
    pages: 35,
    uploadedAt: "2025-11-25, 16:00:00",
    source: "upload",
    description: "Bộ bài tập SQL có lời giải — Premium.",
  },

  /* ── JPD123 · Kỳ 3 · SE ── */
  {
    id: "doc-jpd123-hiragana",
    name: "Hiragana_Katakana.pdf",
    subject: "JPD123",
    semester: "3",
    track: "SE",
    access: "Free (3 trang)",
    pages: 12,
    uploadedAt: "2026-06-01, 09:00:00",
    source: "upload",
    description: "Bảng chữ Hiragana & Katakana kèm ví dụ đọc.",
  },
  {
    id: "doc-jpd123-grammar",
    name: "N5_Grammar_Notes.docx",
    subject: "JPD123",
    semester: "3",
    track: "SE",
    access: "Free (3 trang)",
    pages: 28,
    uploadedAt: "2026-06-03, 11:30:00",
    source: "upload",
    description: "Ngữ pháp N5 — particles は, が, を…",
  },

  /* ── SWE201C · Kỳ 5 · SE ── */
  {
    id: "doc-swe201-agile",
    name: "Agile_Scrum_Overview.pptx",
    subject: "SWE201C",
    semester: "5",
    track: "SE",
    access: "Free (3 trang)",
    pages: 32,
    uploadedAt: "2025-10-05, 13:00:00",
    source: "upload",
    description: "Scrum roles, sprint, backlog, daily standup.",
  },
  {
    id: "doc-swe201-case",
    name: "CaseStudy_Startup.pdf",
    subject: "SWE201C",
    semester: "5",
    track: "SE",
    access: "Premium",
    pages: 18,
    uploadedAt: "2025-10-12, 10:15:00",
    source: "upload",
    description: "Case study quy trình phát triển phần mềm — Premium.",
  },

  /* ── CSI105 · Kỳ 1 · AI ── */
  {
    id: "doc-csi105-intro",
    name: "Intro_ComputerScience.pdf",
    subject: "CSI105",
    semester: "1",
    track: "AI",
    access: "Free (3 trang)",
    pages: 20,
    uploadedAt: "2026-05-08, 08:00:00",
    source: "upload",
    description: "Giới thiệu ngành AI & khoa học máy tính.",
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

/** Tổng số tài liệu mock (dashboard / thống kê) */
export function getStudentDocumentCount() {
  return documentsStore.length;
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
