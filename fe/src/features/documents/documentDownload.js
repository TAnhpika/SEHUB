import { getDocumentPageContent } from "@/features/documents/documentPageContent";
import { fetchDocumentDownloadUrl } from "@/features/documents/studentDocumentsData";
import * as documentsApi from "@/api/documentsApi";

const MIME_BY_EXT = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain;charset=utf-8",
};

function getExtension(fileName) {
  const match = fileName?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

function isSlideDocument(doc) {
  const fileName = doc?.name ?? "";
  const ext = getExtension(fileName);
  return ext === "ppt" || ext === "pptx" || (ext === "pdf" && /slide|bai\s*giang|giang/i.test(fileName));
}

export { isSlideDocument };

/**
 * Gom toàn bộ trang/slide vào một file tải xuống (§3.5 — Premium download đầy đủ).
 * @param {{ name: string, subject?: string, pages?: number, description?: string }} doc
 */
function buildFullDocumentContent(doc) {
  const totalPages = Math.max(doc.pages ?? 1, 1);
  const ext = getExtension(doc.name);
  const slidePack = isSlideDocument(doc);
  const typeLabel = slidePack
    ? "Slide / bài giảng"
    : ext === "pdf"
      ? "PDF"
      : ext === "docx" || ext === "doc"
        ? "Word"
        : ext === "pptx" || ext === "ppt"
          ? "PowerPoint"
          : "Tài liệu";

  const header = [
    "SEHUB — Tài liệu học tập (mock download — full file)",
    "====================================================",
    `File: ${doc.name}`,
    `Môn: ${doc.subject ?? "—"}`,
    `Loại: ${typeLabel}`,
    `Tổng số trang: ${totalPages}`,
    "",
    doc.description ?? "",
    "",
    slidePack
      ? `Nội dung ${totalPages} slide được gói trong một file tải xuống.`
      : `Nội dung đầy đủ ${totalPages} trang trong một file tải xuống.`,
    "",
  ].filter(Boolean);

  const pageSections = Array.from({ length: totalPages }, (_, index) => {
    const pageNum = index + 1;
    const page = getDocumentPageContent(doc, pageNum);
    const slideLabel = slidePack ? `Slide ${pageNum}` : `Trang ${pageNum}`;
    return [
      `${"=".repeat(48)}`,
      `${slideLabel} / ${totalPages}`,
      page.title,
      `${"─".repeat(48)}`,
      ...page.lines,
      "",
    ].join("\n");
  });

  return [...header, ...pageSections].join("\n");
}

/** @param {{ name: string, subject?: string, pages?: number, description?: string }} doc */
export async function downloadStudentDocument(doc) {
  try {
    const downloadTarget = await fetchDocumentDownloadUrl(doc);
    if (downloadTarget?.requiresAuthDownload && downloadTarget.apiId) {
      await documentsApi.downloadDocumentContent(downloadTarget.apiId, doc.name);
      return;
    }

    if (typeof downloadTarget === "string" && downloadTarget) {
      const link = document.createElement("a");
      link.href = downloadTarget;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  } catch {
    /* fallback to mock blob below */
  }

  downloadStudentDocumentMock(doc);
}

/** @param {{ name: string, subject?: string, pages?: number, description?: string }} doc */
function downloadStudentDocumentMock(doc) {
  const ext = getExtension(doc.name);
  const mimeType = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const content = buildFullDocumentContent(doc);
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = doc.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
