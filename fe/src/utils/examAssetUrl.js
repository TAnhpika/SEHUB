const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

export function isPdfAttachment(attachment) {
  if (!attachment) return false;

  const contentType = attachment.contentType?.toLowerCase() ?? "";
  if (contentType.includes("pdf")) return true;

  const name = attachment.name ?? attachment.originalFileName ?? "";
  return /\.pdf$/i.test(name);
}

export function getPrimaryExamAttachment(exam) {
  const attachment = exam?.attachments?.[0];
  if (attachment?.viewUrl || attachment?.viewPath) {
    return {
      id: attachment.id,
      name: attachment.name ?? attachment.originalFileName ?? "exam-attachment",
      url: attachment.viewUrl ?? resolveExamAssetUrl(attachment.viewPath),
      contentType: attachment.contentType ?? "",
    };
  }

  if (exam?.assetUrl) {
    return {
      name: getExamAssetFileName(exam.assetUrl, exam.fileName),
      url: resolveExamAssetUrl(exam.assetUrl),
    };
  }

  return null;
}

export function resolveExamAssetUrl(assetUrl) {
  if (!assetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }

  if (assetUrl.startsWith("/")) {
    return `${API_BASE_URL}${assetUrl}`;
  }

  return `${API_BASE_URL}/${assetUrl}`;
}

export function getExamAssetFileName(assetUrl, fallback = "exam-attachment") {
  if (!assetUrl) {
    return fallback;
  }

  const segment = assetUrl.split("/").pop();
  return segment ? decodeURIComponent(segment.replace(/^[a-f0-9]{32}_/i, "")) : fallback;
}
