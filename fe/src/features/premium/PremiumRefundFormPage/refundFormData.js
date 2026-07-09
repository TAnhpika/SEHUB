/**
 * @fileoverview Hằng số và tiện ích cho form nhận hoàn tiền Premium.
 *
 * @module features/premium/PremiumRefundFormPage/refundFormData
 */

/**
 * Số ảnh chứng từ chuyển khoản tối đa được upload.
 *
 * @constant {number}
 * @readonly
 * @default 5
 */
export const MAX_REFUND_PROOF_FILES = 5;

/**
 * Kích thước tối đa mỗi file ảnh chứng từ (10 MB).
 *
 * @constant {number}
 * @readonly
 */
export const MAX_REFUND_PROOF_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Chuỗi MIME types chấp nhận cho input file upload.
 *
 * @constant {string}
 * @readonly
 */
export const REFUND_PROOF_FILE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Định dạng kích thước file thân thiện (B / KB / MB).
 *
 * @param {number} bytes - Kích thước file tính bằng byte.
 * @returns {string} Chuỗi hiển thị, ví dụ `"1.5 MB"`.
 *
 * @example
 * formatFileSize(1536); // => '1.5 KB'
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
