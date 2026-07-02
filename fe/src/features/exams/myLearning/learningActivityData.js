import * as learningActivityApi from "@/api/learningActivityApi";
import {
  mapExamAttemptHistoryPage,
  mapPracticeHistoryPage,
} from "./learningActivityMapper";
import {
  EXAM_HISTORY_PAGE_SIZE,
  PRACTICE_HISTORY_PAGE_SIZE,
} from "./learningActivityConstants";
import { getMockPracticeSubmissions } from "./learningActivityMock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function paginateMock(items, page, pageSize, source) {
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items: slice,
    page,
    pageSize,
    totalCount,
    hasNextPage: page < totalPages,
    source,
  };
}

function isApiNotReadyError(error) {
  return error?.status === 404 || error?.status === 501;
}

/**
 * @param {{ page?: number; pageSize?: number }} [options]
 */
export async function loadExamAttemptHistory(options = {}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? EXAM_HISTORY_PAGE_SIZE;

  const response = await learningActivityApi.getMyExamAttempts({ page, pageSize });
  return mapExamAttemptHistoryPage(response);
}

/**
 * @param {{ page?: number; pageSize?: number }} [options]
 */
export async function loadPracticeSubmissionHistory(options = {}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? PRACTICE_HISTORY_PAGE_SIZE;

  if (USE_MOCK) {
    return paginateMock(getMockPracticeSubmissions(), page, pageSize, "mock");
  }

  try {
    const response = await learningActivityApi.getMyPracticeSubmissions({ page, pageSize });
    return mapPracticeHistoryPage(response);
  } catch (error) {
    if (isApiNotReadyError(error)) {
      return {
        items: [],
        page,
        pageSize,
        totalCount: 0,
        hasNextPage: false,
        source: "api-unavailable",
      };
    }
    throw error;
  }
}
