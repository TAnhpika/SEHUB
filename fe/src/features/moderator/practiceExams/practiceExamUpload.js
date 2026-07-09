/**
 * @fileoverview Helper upload file đính kèm đề thực hành.
 *
 * Validate loại file và dung lượng, format kích thước hiển thị,
 * tạo entry attachment cho state form.
 *
 * @module features/moderator/practiceExams/practiceExamUpload
 */

import { ApiError } from "@/api/httpClient";

/**
 * Chuỗi `accept` cho input file — PDF, ZIP, RAR, DOCX.
 *
 * @constant {string}
 * @readonly
 */
export const PRACTICE_UPLOAD_ACCEPT = ".pdf,.zip,.rar,.docx";

/**
 * Giới hạn dung lượng file upload (50 MB).
 *
 * @constant {number}
 * @readonly
 */
export const PRACTICE_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

/**
 * Suy ra loại icon hiển thị từ tên file.
 *
 * @param {string} fileName - Tên file gốc.
 * @returns {'pdf' | 'zip'} `'pdf'` nếu extension pdf, ngược lại `'zip'`.
 */
export function getPracticeFileType(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ext === "pdf" ? "pdf" : "zip";
}

/**
 * Validate file upload đề thực hành trước khi thêm vào form.
 *
 * @param {File} file - File người dùng chọn hoặc kéo thả.
 * @returns {string | null} Thông báo lỗi tiếng Việt hoặc `null` nếu hợp lệ.
 */
export function validatePracticeUploadFile(file) {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const allowed = [".pdf", ".zip", ".rar", ".docx"];
  if (!allowed.includes(ext)) {
    return "Chỉ hỗ trợ PDF, ZIP, RAR, DOCX.";
  }
  if (file.size > PRACTICE_UPLOAD_MAX_BYTES) {
    return `File "${file.name}" vượt quá 50 MB.`;
  }
  return null;
}

/**
 * Format kích thước file hiển thị trên UI.
 *
 * @param {number} bytes - Kích thước file tính bằng byte.
 * @returns {string} Chuỗi dạng `"1.2 MB"` hoặc `"128 KB"`.
 */
export function formatPracticeFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Tạo entry attachment sẵn sàng gắn vào state form (status `done`).
 *
 * @param {File} file - File hợp lệ đã qua validate.
 * @returns {object} Entry với id, name, sizeLabel, type, status, file.
 */
export function createPracticeAttachmentEntry(file) {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name: file.name,
    sizeLabel: formatPracticeFileSize(file.size),
    type: getPracticeFileType(file.name),
    status: "done",
    progress: 100,
    file,
    assetUrl: null,
  };
}

/**
 * Chuẩn bị metadata attachment trước upload API — throw nếu file không hợp lệ.
 *
 * @param {File} file - File cần upload.
 * @returns {{ fileName: string }} Metadata tối thiểu cho API.
 * @throws {import('@/api/httpClient').ApiError} HTTP 400 khi validate thất bại.
 */
export function preparePracticeAttachment(file) {
  const validationError = validatePracticeUploadFile(file);
  if (validationError) {
    throw new ApiError(validationError, { status: 400 });
  }

  return {
    fileName: file.name,
  };
}
