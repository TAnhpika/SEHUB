function mapAccessTierLabel(accessTier) {
  if (accessTier === "PremiumFull") return "Premium";
  return "Free (3 trang)";
}

function extractSubjectCode(category, fallback = "") {
  const match = category?.match(/^([A-Z0-9]+)/i);
  return match?.[1]?.toUpperCase() ?? fallback.toUpperCase();
}

function formatUploadedAt(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";

  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function inferFileName(title, mimeType) {
  if (/\.[a-z0-9]+$/i.test(title ?? "")) {
    return title;
  }

  if (mimeType === "application/pdf") return `${title}.pdf`;
  return title ?? "TaiLieu";
}

export function mapDocumentListItemDto(dto, courseCode = "") {
  const subject = extractSubjectCode(dto.category, courseCode);

  return {
    id: dto.id,
    apiId: dto.id,
    name: inferFileName(dto.title, dto.mimeType),
    subject,
    semester: "1",
    track: "SE",
    access: mapAccessTierLabel(dto.accessTier),
    pages: dto.pageCount ?? 0,
    uploadedAt: "—",
    description: dto.category ?? dto.title ?? "",
  };
}

export function mapDocumentDetailDto(dto) {
  const subject = extractSubjectCode(dto.category);

  return {
    id: dto.id,
    apiId: dto.id,
    name: inferFileName(dto.title, dto.mimeType),
    subject,
    semester: "1",
    track: "SE",
    access: mapAccessTierLabel(dto.accessTier),
    pages: dto.pageCount ?? 0,
    pageLimit: dto.pageLimit,
    canDownload: dto.canDownload,
    mimeType: dto.mimeType ?? null,
    uploadedAt: formatUploadedAt(dto.createdAt),
    description: dto.category ?? dto.title ?? "",
  };
}

export function mapDocumentToSubjectListItem(dto, courseCode) {
  const doc = mapDocumentListItemDto(dto, courseCode);
  const ext = doc.name?.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? "—";

  return {
    id: doc.id,
    courseCode: doc.subject || courseCode?.toUpperCase() || "",
    name: doc.name,
    year: "2026",
    term: "SP",
    termLabel: "Spring",
    uploadedAt: doc.uploadedAt,
    type: ext,
    questionCount: doc.pages,
    document: doc,
  };
}
