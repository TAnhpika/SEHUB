export const MAX_FEEDBACK_FILES = 10;
export const MAX_FEEDBACK_FILE_SIZE = 100 * 1024 * 1024;

export const ACCEPTED_FILE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf";

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
