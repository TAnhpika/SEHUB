import { ApiError } from "@/api/httpClient";

export const PRACTICE_UPLOAD_ACCEPT = ".pdf,.zip,.rar,.docx";
export const PRACTICE_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

export function getPracticeFileType(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ext === "pdf" ? "pdf" : "zip";
}

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

export function formatPracticeFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

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

export function preparePracticeAttachment(file) {
  const validationError = validatePracticeUploadFile(file);
  if (validationError) {
    throw new ApiError(validationError, { status: 400 });
  }

  return {
    fileName: file.name,
  };
}
