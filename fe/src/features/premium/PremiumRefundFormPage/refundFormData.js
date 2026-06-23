export const MAX_REFUND_PROOF_FILES = 5;
export const MAX_REFUND_PROOF_FILE_SIZE = 10 * 1024 * 1024;

export const REFUND_PROOF_FILE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
