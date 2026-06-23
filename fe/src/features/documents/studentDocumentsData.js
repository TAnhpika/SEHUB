import * as documentsApi from "@/api/documentsApi";
import { resolveAssetUrl } from "@/api/assetUrl";
import {
  mapDocumentDetailDto,
  mapDocumentToSubjectListItem,
} from "@/api/documentMapper";
import { getAdminDocumentById, getStudentDocumentsBySubject } from "@/features/admin/documents/adminDocumentData";
import { isValidGuid } from "@/features/feed/postUtils";
import { getExamPapersForCourse } from "@/features/subjects/SubjectDetailPage/subjectDetailData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const DEMO_API_DOCUMENT_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

export function resolveDocumentApiId(docOrId) {
  if (USE_MOCK) return null;

  const value =
    typeof docOrId === "object" ? docOrId?.apiId ?? docOrId?.id : String(docOrId ?? "").trim();

  if (!value) return null;
  if (isValidGuid(value)) return value;
  return null;
}

function buildMockDocumentItems(courseCode) {
  const normalized = courseCode?.toUpperCase() ?? "";
  const docs = getStudentDocumentsBySubject(normalized, "all");

  if (docs.length > 0) {
    return mapMockDocsToSubjectItems(docs, normalized);
  }

  return getExamPapersForCourse(normalized, "Tài liệu", "DOC");
}

function mapMockDocsToSubjectItems(docs, courseCode) {
  return docs.map((doc) => ({
    id: doc.id,
    courseCode: doc.subject,
    name: doc.name,
    year: "2026",
    term: "SP",
    termLabel: "Spring",
    uploadedAt: doc.uploadedAt,
    type: doc.name?.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? "—",
    questionCount: doc.pages,
    document: doc,
  }));
}

function findMockDocumentExamItem(courseCode, examId) {
  const normalized = courseCode?.toUpperCase() ?? "";
  const docs = getStudentDocumentsBySubject(normalized, "all");
  const hit = docs.find((doc) => doc.id === examId);

  if (hit) {
    return mapMockDocsToSubjectItems([hit], normalized)[0];
  }

  return getExamPapersForCourse(normalized, "Tài liệu", "DOC").find((item) => item.id === examId) ?? null;
}

async function fetchDocumentsForCourse(courseCode) {
  const normalized = courseCode?.toUpperCase() ?? "";
  const queries = [{ major: normalized }];

  if (normalized.startsWith("SE") && normalized !== "SE") {
    queries.push({ major: "SE" });
  }

  const collected = new Map();

  for (const params of queries) {
    const page = await documentsApi.listDocuments({ ...params, pageSize: 100 });
    for (const item of page.items ?? []) {
      collected.set(item.id, item);
    }
  }

  if (collected.size === 0) {
    const page = await documentsApi.listDocuments({ pageSize: 100 });
    for (const item of page.items ?? []) {
      if (
        item.category?.toUpperCase().includes(normalized) ||
        item.title?.toUpperCase().includes(normalized)
      ) {
        collected.set(item.id, item);
      }
    }
  }

  return [...collected.values()].map((dto) => mapDocumentToSubjectListItem(dto, normalized));
}

export async function loadDocumentItemsForCourse(courseCode) {
  const normalized = courseCode?.toUpperCase() ?? "";
  const mockDocs = getStudentDocumentsBySubject(normalized, "all");

  if (USE_MOCK) {
    return buildMockDocumentItems(normalized);
  }

  try {
    const apiItems = await fetchDocumentsForCourse(normalized);
    if (apiItems.length > 0) {
      return apiItems;
    }
  } catch {
    /* fallback below */
  }

  if (mockDocs.length > 0) {
    return mapMockDocsToSubjectItems(mockDocs, normalized);
  }

  return buildMockDocumentItems(normalized);
}

export async function loadDocumentDetail(docOrId) {
  const mockDoc =
    typeof docOrId === "object" && docOrId
      ? docOrId
      : getAdminDocumentById(String(docOrId ?? ""));

  if (mockDoc?.pageLimit !== undefined && mockDoc?.canDownload !== undefined) {
    return mockDoc;
  }

  const apiId = resolveDocumentApiId(docOrId);
  if (!apiId || USE_MOCK) {
    return mockDoc ?? null;
  }

  try {
    const dto = await documentsApi.getDocument(apiId);
    return mapDocumentDetailDto(dto);
  } catch {
    return mockDoc ?? null;
  }
}

export async function loadDocumentExamItem(courseCode, examId, scope = "community") {
  void scope;
  const mockExam = findMockDocumentExamItem(courseCode, examId);
  if (mockExam?.document) {
    return mockExam;
  }

  const apiId = resolveDocumentApiId(examId);
  if (!apiId || USE_MOCK) {
    return null;
  }

  const doc = await loadDocumentDetail(apiId);
  if (!doc) {
    return null;
  }

  return mapDocumentToSubjectListItem(
    {
      id: doc.apiId ?? doc.id,
      title: doc.name,
      category: doc.description ?? doc.subject,
      pageCount: doc.pages,
      accessTier: doc.access?.includes("Premium") ? "PremiumFull" : "FreePreview",
      mimeType: doc.mimeType,
    },
    courseCode,
  );
}

export async function loadDocumentPreviewPage(doc, pageNum) {
  const apiId = resolveDocumentApiId(doc);
  if (!apiId || USE_MOCK) {
    return null;
  }

  const preview = await documentsApi.getDocumentPreview(apiId, pageNum);
  if (!preview) {
    return null;
  }

  if (documentsApi.isAuthenticatedDocumentContentUrl(preview.contentUrl)) {
    const blobUrl = await documentsApi.fetchDocumentContentBlobUrl(apiId, pageNum);
    return { ...preview, contentUrl: blobUrl };
  }

  return {
    ...preview,
    contentUrl: resolveAssetUrl(preview.contentUrl),
  };
}

export async function fetchDocumentDownloadUrl(doc) {
  const apiId = resolveDocumentApiId(doc);
  if (!apiId || USE_MOCK) {
    return null;
  }

  const result = await documentsApi.getDocumentDownloadUrl(apiId);
  const downloadUrl = result?.downloadUrl ?? null;
  if (documentsApi.isAuthenticatedDocumentContentUrl(downloadUrl)) {
    return { apiId, requiresAuthDownload: true };
  }

  return downloadUrl;
}
