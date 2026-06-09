/** Nội dung mock từng trang tài liệu — hiển thị khi SV xem online */

const PAGE_CONTENT = {
  "doc-prf192-free-lecture": {
    1: {
      title: "Tuần 1 — Giới thiệu Java & JVM",
      lines: [
        "Java là ngôn ngữ hướng đối tượng, chạy trên JVM (Java Virtual Machine).",
        "Cấu trúc chương trình: package → import → class → main method.",
        "Biến primitive: int, double, boolean, char…",
      ],
    },
    2: {
      title: "Tuần 2 — Cấu trúc điều khiển",
      lines: [
        "if / else, switch-case cho rẽ nhánh.",
        "Vòng lặp for, while, do-while — chọn theo số lần lặp biết trước hay không.",
        "break và continue điều khiển luồng trong vòng lặp.",
      ],
    },
    3: {
      title: "Tuần 3 — Mảng & chuỗi",
      lines: [
        "Khai báo mảng một chiều: int[] arr = new int[10];",
        "Duyệt mảng bằng for hoặc enhanced for (for-each).",
        "String là immutable — dùng equals() so sánh nội dung.",
      ],
    },
    4: {
      title: "Tuần 4 — Lớp & đối tượng (preview)",
      lines: [
        "class định nghĩa thuộc tính (fields) và hành vi (methods).",
        "Constructor khởi tạo trạng thái ban đầu của object.",
        "Premium: xem tiếp các chương OOP nâng cao trong file đầy đủ.",
      ],
    },
  },
  "doc-prf192-premium-lab": {
    1: {
      title: "Lab 1 — Hello World nâng cao",
      lines: [
        "Yêu cầu: in lời chào có tên sinh viên nhập từ bàn phím.",
        "Gợi ý: Scanner + System.out.printf.",
        "Đáp án mẫu có trong phần Premium của file này.",
      ],
    },
    2: {
      title: "Lab 2 — Xử lý ngoại lệ",
      lines: [
        "try-catch-finally cho NumberFormatException.",
        "Không để chương trình crash khi user nhập sai định dạng.",
      ],
    },
  },
  "doc-pro192-oop-slide": {
    1: {
      title: "OOP — Pillars",
      lines: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction"],
    },
    2: {
      title: "Class vs Object",
      lines: [
        "Class là khuôn mẫu; object là thể hiện cụ thể trong bộ nhớ.",
        "new ClassName() gọi constructor.",
      ],
    },
  },
  "doc-prj301-servlet": {
    1: {
      title: "Servlet lifecycle",
      lines: ["init() → service() → destroy()", "doGet / doPost xử lý HTTP request."],
    },
  },
  "doc-dbi202-er": {
    1: {
      title: "Mô hình ER",
      lines: [
        "Entity — thực thể (SinhVien, MonHoc).",
        "Relationship — quan hệ 1-1, 1-N, N-N.",
        "Primary key & foreign key.",
      ],
    },
  },
};

/**
 * @param {{ id: string, name: string, subject?: string, description?: string, pages?: number }} doc
 * @param {number} pageNum
 */
export function getDocumentPageContent(doc, pageNum) {
  const specific = PAGE_CONTENT[doc.id]?.[pageNum];
  if (specific) return specific;

  const subject = doc.subject ?? "—";
  const total = doc.pages ?? pageNum;

  return {
    title: `${doc.name} · Trang ${pageNum}/${total}`,
    lines: [
      `Môn ${subject} — nội dung mẫu trang ${pageNum}.`,
      doc.description ?? "Tài liệu học tập trên SEHub (mock data).",
      pageNum === 1
        ? "Trang bìa / mục lục: liệt kê các chương trong slide hoặc giáo trình."
        : `Tiếp nội dung chương — đoạn giải thích, ví dụ minh họa, hình ảnh slide (mock).`,
      pageNum <= 3
        ? "Tài khoản Basic chỉ xem được tối đa 3 trang đầu với file dài."
        : "Premium xem và tải toàn bộ file về máy.",
    ],
  };
}

/**
 * Tóm tắt nội dung slide / tài liệu — xem online không lật từng trang.
 * @param {{ id: string, name: string, subject?: string, description?: string, pages?: number }} doc
 */
export function getDocumentOverview(doc) {
  const pageMap = PAGE_CONTENT[doc.id];
  const topics = pageMap
    ? Object.values(pageMap).map((page) => page.title)
    : [
        `Giới thiệu môn ${doc.subject ?? "—"}`,
        "Nội dung lý thuyết và ví dụ minh họa",
        "Tóm tắt & bài tập tham khảo",
      ];

  const baseName = doc.name?.replace(/\.[^.]+$/i, "") ?? "Tài liệu";

  return {
    title: baseName,
    summary:
      doc.description ??
      `Tài liệu học tập môn ${doc.subject ?? "—"}.`,
    topics,
  };
}
