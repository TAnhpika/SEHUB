/** §3.4 — Nội dung đề thực hành: PDF / hình ảnh / text mô tả yêu cầu */

const PRACTICE_BRIEF_PAGES = [
  [
    "Yêu cầu chung: đọc kỹ rubric, tuân thủ quy định nộp bài và deadline.",
    "Input/Output: mô tả rõ format dữ liệu đầu vào và kết quả mong đợi.",
    "Ràng buộc: không copy nguyên mẫu; ghi chú MSSV và họ tên trong README hoặc header code.",
  ],
  [
    "Phần 1 — Phân tích: liệt kê use case và mô hình dữ liệu.",
    "Phần 2 — Thiết kế: sơ đồ luồng hoặc class diagram (ảnh/PDF đính kèm).",
    "Phần 3 — Triển khai: code chạy được, có hướng dẫn build trong README.",
  ],
  [
    "Tiêu chí chấm: đúng yêu cầu (40%), chất lượng code (30%), tài liệu (20%), deadline (10%).",
    "Nộp qua GitHub public repo hoặc file ZIP theo hướng dẫn giảng viên.",
    "Liên hệ mentor trên SEHUB nếu cần làm rõ đề trước khi nộp.",
  ],
];

function buildMockPdfPages(questionText, questionId) {
  const extra = PRACTICE_BRIEF_PAGES[(questionId - 1) % PRACTICE_BRIEF_PAGES.length];
  return [
    {
      pageNum: 1,
      title: "Đề bài thực hành",
      lines: [questionText, ...extra.slice(0, 2)],
    },
    {
      pageNum: 2,
      title: "Rubric & lưu ý nộp bài",
      lines: extra.slice(1),
    },
  ];
}

function buildPreviewImageDataUri(courseCode, examId, questionId) {
  const title = `${courseCode} · Bài ${questionId}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
    <rect width="960" height="540" fill="#f8fafc"/>
    <rect x="48" y="48" width="864" height="444" rx="12" fill="#fff" stroke="#c3c6d7"/>
    <text x="96" y="120" font-family="Inter,Arial,sans-serif" font-size="28" font-weight="700" fill="#004ac6">${title}</text>
    <text x="96" y="168" font-family="Inter,Arial,sans-serif" font-size="18" fill="#434655">${examId}</text>
    <line x1="96" y1="196" x2="864" y2="196" stroke="#e2e8f0"/>
    <text x="96" y="244" font-family="Inter,Arial,sans-serif" font-size="16" fill="#191c1e">Ảnh scan / screenshot đề bài thực hành (mock)</text>
    <text x="96" y="280" font-family="Inter,Arial,sans-serif" font-size="14" fill="#737686">Sinh viên có thể tải file gốc bên dưới để làm offline.</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function formatAttachmentName(courseCode, examId, questionId, ext) {
  return `${courseCode}_${examId}_Bai${questionId}.${ext}`;
}

/**
 * @param {string} examId
 * @param {number} questionId
 * @param {string} courseCode
 * @param {string} [questionText]
 */
export function getPracticeBrief(examId, questionId, courseCode, questionText = "") {
  const normalizedCode = courseCode?.toUpperCase() ?? "SUBJECT";
  const variant = (questionId - 1) % 3;
  const pdfName = formatAttachmentName(normalizedCode, examId, questionId, "pdf");
  const pngName = formatAttachmentName(normalizedCode, examId, questionId, "png");
  const zipName = formatAttachmentName(normalizedCode, examId, questionId, "zip");

  const pages = buildMockPdfPages(questionText, questionId);
  const previewImageUrl = buildPreviewImageDataUri(normalizedCode, examId, questionId);

  if (variant === 0) {
    return {
      format: "pdf",
      label: "PDF đề bài",
      summary:
        "Đề bài đính kèm dạng PDF — xem trực tiếp trên SEHUB hoặc tải về máy để làm offline.",
      pages,
      previewImageUrl: null,
      attachments: [
        {
          id: `${examId}-q${questionId}-pdf`,
          name: pdfName,
          sizeLabel: "1.4 MB",
          kind: "pdf",
          mimeType: "application/pdf",
          mockContent: buildDownloadText(normalizedCode, examId, questionId, questionText, "PDF"),
        },
      ],
    };
  }

  if (variant === 1) {
    return {
      format: "image",
      label: "Ảnh đề bài",
      summary:
        "Đề bài dạng hình ảnh (scan/screenshot) — phóng to để đọc hoặc tải file PNG gốc.",
      pages: null,
      previewImageUrl,
      attachments: [
        {
          id: `${examId}-q${questionId}-png`,
          name: pngName,
          sizeLabel: "820 KB",
          kind: "image",
          mimeType: "image/png",
          previewUrl: previewImageUrl,
          mockContent: buildDownloadText(normalizedCode, examId, questionId, questionText, "PNG"),
        },
      ],
    };
  }

  return {
    format: "file",
    label: "File đề & tài nguyên",
    summary:
      "Gói ZIP gồm mô tả đề, rubric và file mẫu (nếu có) — tải về giải nén rồi làm bài.",
    pages: null,
    previewImageUrl: null,
    attachments: [
      {
        id: `${examId}-q${questionId}-zip`,
        name: zipName,
        sizeLabel: "3.6 MB",
        kind: "zip",
        mimeType: "application/zip",
        mockContent: buildDownloadText(normalizedCode, examId, questionId, questionText, "ZIP"),
      },
      {
        id: `${examId}-q${questionId}-pdf-alt`,
        name: pdfName,
        sizeLabel: "980 KB",
        kind: "pdf",
        mimeType: "application/pdf",
        mockContent: buildDownloadText(normalizedCode, examId, questionId, questionText, "PDF"),
      },
    ],
  };
}

function buildDownloadText(courseCode, examId, questionId, questionText, formatLabel) {
  return [
    "SEHUB — Đề thi thực hành (mock download)",
    "========================================",
    `Môn: ${courseCode}`,
    `Mã đề: ${examId}`,
    `Bài: ${questionId}`,
    `Định dạng: ${formatLabel}`,
    "",
    "Mô tả yêu cầu:",
    questionText,
    "",
    "Lưu ý: File mock phục vụ demo FE. Production sẽ tải file thật do Admin/Moderator upload.",
  ].join("\n");
}

/** @param {{ name: string, mimeType?: string, mockContent?: string, previewUrl?: string }} attachment */
export function downloadPracticeAttachment(attachment) {
  if (attachment.previewUrl?.startsWith("data:image/svg+xml")) {
    const link = document.createElement("a");
    link.href = attachment.previewUrl;
    link.download = attachment.name;
    link.click();
    return;
  }

  const blob = new Blob([attachment.mockContent ?? attachment.name], {
    type: attachment.mimeType ?? "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.name;
  link.click();
  URL.revokeObjectURL(url);
}
