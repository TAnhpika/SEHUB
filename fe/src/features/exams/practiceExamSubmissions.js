/** Mock store — bài nộp đề thực hành (GitHub). §3.4 SEHUB_PhanTichNghiepVu */

import * as adminApi from "@/api/adminApi";
import * as examsApi from "@/api/examsApi";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import * as practiceSubmissionsApi from "@/api/practiceSubmissionsApi";
import {
  buildReviewerComment,
  mapFeReviewStatusToApi,
  mapModerationPracticeSubmission,
  mapPracticeSubmissionDto,
  mapPracticeSubmissionListItem,
} from "@/api/practiceSubmissionMapper";
import { resolveExamApiId } from "@/features/exams/examDetailData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const STORAGE_KEY = "sehubs_practice_submissions";

/** @typedef {"pending" | "reviewed" | "pass" | "fail"} SubmissionStatus */

/**
 * @typedef {object} PracticeExamSubmission
 * @property {string} id
 * @property {string} courseCode
 * @property {string} examId
 * @property {string} student
 * @property {string} displayName
 * @property {string} githubUrl
 * @property {string} submittedAt
 * @property {SubmissionStatus} status
 * @property {string | null} grade
 * @property {string} feedback
 * @property {string | null} gradedAt
 * @property {string | null} gradedBy
 */

const STATUS_LABELS = {
  pending: "Chờ chấm",
  reviewed: "Đã xem",
  pass: "Đạt",
  fail: "Không đạt",
};

const SEED_VERSION = 3;
const VERSION_KEY = "sehubs_practice_submissions_v";

const SEED_SUBMISSIONS = [
  {
    id: "sub-seed-1",
    courseCode: "PRF192",
    examId: "PE-PRF192-SP2025",
    student: "minhanh_dev",
    displayName: "Trần Minh Anh",
    githubUrl: "https://github.com/minhanh/prf192-midterm",
    submittedAt: "2026-06-02T10:00:00",
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  },
  {
    id: "sub-seed-2",
    courseCode: "PRF192",
    examId: "PE-PRF192-SP2025",
    student: "hoa_nguyen_d",
    displayName: "Hoa Nguyễn D",
    githubUrl: "https://github.com/hoand/prf192-react-lab",
    submittedAt: "2026-06-01T16:30:00",
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  },
  {
    id: "sub-seed-3",
    courseCode: "PRF192",
    examId: "PE-PRF192-SP2025",
    student: "anhcoding12345",
    displayName: "Anhpika",
    githubUrl: "https://github.com/anhpika/prf192-lab",
    submittedAt: "2026-05-28T14:20:00",
    status: "pass",
    grade: "8.5",
    feedback: "Repo đầy đủ README, chạy được demo. Cần thêm unit test.",
    gradedAt: "2026-05-29T09:00:00",
    gradedBy: "mod_sehub",
  },
  {
    id: "sub-seed-4",
    courseCode: "PRF192",
    examId: "PE-PRF192-FA2024",
    student: "lee_dev_99",
    displayName: "Lê Văn Đức",
    githubUrl: "https://github.com/leedev/prf192",
    submittedAt: "2026-05-22T18:45:00",
    status: "fail",
    grade: "4.0",
    feedback: "Thiếu phần backend theo rubric.",
    gradedAt: "2026-05-23T11:30:00",
    gradedBy: "admin_sehub",
  },
  {
    id: "sub-seed-5",
    courseCode: "PRF192",
    examId: "PE-PRF192-SU2025",
    student: "vu_minh_c",
    displayName: "Vũ Minh C",
    githubUrl: "https://github.com/vuminhc/prf192-summer",
    submittedAt: "2026-05-30T08:15:00",
    status: "reviewed",
    grade: null,
    feedback: "Đã xem repo, chờ chấm điểm cuối.",
    gradedAt: "2026-05-31T10:00:00",
    gradedBy: "mod_sehub",
  },
  {
    id: "sub-seed-6",
    courseCode: "NLP201",
    examId: "PE-NLP201-SP2026",
    student: "coding_ninja",
    displayName: "Coding Ninja",
    githubUrl: "https://github.com/codingninja/nlp201-assignment1",
    submittedAt: "2026-06-02T21:00:00",
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  },
  {
    id: "sub-seed-7",
    courseCode: "NLP201",
    examId: "PE-NLP201-SP2026",
    student: "study_group_7",
    displayName: "Study Group 7",
    githubUrl: "https://github.com/studygroup7/nlp-sentiment",
    submittedAt: "2026-06-01T11:40:00",
    status: "pass",
    grade: "9.0",
    feedback: "Notebook rõ ràng, kết quả F1 đạt yêu cầu.",
    gradedAt: "2026-06-02T08:00:00",
    gradedBy: "admin_sehub",
  },
  {
    id: "sub-seed-8",
    courseCode: "PRJ301",
    examId: "PE-PRJ301-FA2025",
    student: "user_4421",
    displayName: "User 4421",
    githubUrl: "https://github.com/user4421/prj301-oop-lab",
    submittedAt: "2026-05-27T13:20:00",
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  },
  {
    id: "sub-seed-9",
    courseCode: "PRJ301",
    examId: "PE-PRJ301-FA2025",
    student: "premium_trial",
    displayName: "Premium Trial",
    githubUrl: "https://github.com/premiumtrial/java-oop-midterm",
    submittedAt: "2026-05-26T09:50:00",
    status: "fail",
    grade: "5.5",
    feedback: "Thiếu diagram UML và test case.",
    gradedAt: "2026-05-27T15:00:00",
    gradedBy: "mod_sehub",
  },
  {
    id: "sub-seed-10",
    courseCode: "SWP391",
    examId: "PE-SWP391-SP2026",
    student: "tran_van_a",
    displayName: "Trần Văn A",
    githubUrl: "https://github.com/tranva/swp391-capstone",
    submittedAt: "2026-06-03T07:30:00",
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  },
  {
    id: "sub-seed-11",
    courseCode: "PRF192",
    examId: "PE-PRF192-SP2026",
    student: "banned_temp_01",
    displayName: "Banned Temp",
    githubUrl: "https://github.com/bannedtemp/prf192-retry",
    submittedAt: "2026-06-03T12:00:00",
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  },
  {
    id: "sub-seed-12",
    courseCode: "NLP201",
    examId: "PE-NLP201-FA2025",
    student: "hoa_nguyen_d",
    displayName: "Hoa Nguyễn D",
    githubUrl: "https://github.com/hoand/nlp201-final",
    submittedAt: "2026-05-29T17:20:00",
    status: "reviewed",
    grade: null,
    feedback: "Đang đối chiếu notebook với rubric.",
    gradedAt: "2026-05-30T09:15:00",
    gradedBy: "mod_sehub",
  },
  {
    id: "sub-seed-13",
    courseCode: "SWP391",
    examId: "PE-SWP391-FA2025",
    student: "coding_ninja",
    displayName: "Coding Ninja",
    githubUrl: "https://github.com/codingninja/swp391-phase2",
    submittedAt: "2026-05-31T20:45:00",
    status: "pass",
    grade: "8.0",
    feedback: "Demo ổn, thiếu tài liệu API.",
    gradedAt: "2026-06-01T14:00:00",
    gradedBy: "admin_sehub",
  },
  {
    id: "sub-seed-14",
    courseCode: "PRJ301",
    examId: "PE-PRJ301-SP2026",
    student: "study_group_7",
    displayName: "Study Group 7",
    githubUrl: "https://github.com/studygroup7/prj301-team",
    submittedAt: "2026-06-02T07:10:00",
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  },
  {
    id: "sub-seed-15",
    courseCode: "PRF192",
    examId: "PE-PRF192-FA2025",
    student: "mod_khanh",
    displayName: "Trần Khánh Mod",
    githubUrl: "https://github.com/modkhanh/prf192-sample",
    submittedAt: "2026-05-20T11:00:00",
    status: "pass",
    grade: "10",
    feedback: "Bài mẫu tham khảo.",
    gradedAt: "2026-05-21T08:30:00",
    gradedBy: "admin_sehub",
  },
];

/** @type {PracticeExamSubmission[]} */
let submissionsStore = loadFromStorage();

function loadFromStorage() {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== String(SEED_VERSION)) {
      localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
      const seeded = SEED_SUBMISSIONS.map((s) => ({ ...s }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return SEED_SUBMISSIONS.map((s) => ({ ...s }));
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissionsStore));
}

export function getSubmissionStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

/** @param {string} courseCode @param {string} examId */
export function buildSubmissionExamKey(courseCode, examId) {
  return `${courseCode.toUpperCase()}:${examId}`;
}

/** @param {string} courseCode */
export function getSubmissionsByCourseCode(courseCode) {
  const code = courseCode.toUpperCase();
  return submissionsStore
    .filter((s) => s.courseCode.toUpperCase() === code)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/** @param {string} courseCode @param {string} examId */
export function getSubmissionsByExam(courseCode, examId) {
  const key = buildSubmissionExamKey(courseCode, examId);
  return submissionsStore
    .filter((s) => buildSubmissionExamKey(s.courseCode, s.examId) === key)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/** @param {string} courseCode @param {string} examId @param {string} username */
export function getStudentSubmission(courseCode, examId, username) {
  const key = buildSubmissionExamKey(courseCode, examId);
  return (
    submissionsStore.find(
      (s) =>
        buildSubmissionExamKey(s.courseCode, s.examId) === key &&
        s.student.toLowerCase() === username.toLowerCase(),
    ) ?? null
  );
}

export function getAllPracticeSubmissions() {
  return [...submissionsStore].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getPendingPracticeSubmissions() {
  return getAllPracticeSubmissions().filter((s) => s.status === "pending" || s.status === "reviewed");
}

export function getPendingPracticeSubmissionCount() {
  return getAllPracticeSubmissions().filter((s) => s.status === "pending").length;
}

/** @param {string} courseCode */
export function getSubmissionCountByCourseCode(courseCode) {
  return getSubmissionsByCourseCode(courseCode).length;
}

/**
 * @param {{
 *   courseCode: string;
 *   examId: string;
 *   student: string;
 *   displayName: string;
 *   githubUrl: string;
 * }} payload
 */
export function submitPracticeExam(payload) {
  const courseCode = payload.courseCode.toUpperCase();
  const existing = getStudentSubmission(courseCode, payload.examId, payload.student);
  if (existing) {
    const idx = submissionsStore.findIndex((s) => s.id === existing.id);
    submissionsStore[idx] = {
      ...existing,
      githubUrl: payload.githubUrl.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      grade: null,
      feedback: "",
      gradedAt: null,
      gradedBy: null,
    };
    persist();
    return submissionsStore[idx];
  }

  const entry = {
    id: `sub-${Date.now()}`,
    courseCode,
    examId: payload.examId,
    student: payload.student,
    displayName: payload.displayName,
    githubUrl: payload.githubUrl.trim(),
    submittedAt: new Date().toISOString(),
    status: "pending",
    grade: null,
    feedback: "",
    gradedAt: null,
    gradedBy: null,
  };
  submissionsStore = [entry, ...submissionsStore];
  persist();
  return entry;
}

/**
 * @param {string} submissionId
 * @param {{
 *   status: SubmissionStatus;
 *   grade?: string | null;
 *   feedback?: string;
 *   gradedBy: string;
 * }} payload
 */
export function gradePracticeSubmission(submissionId, payload) {
  const idx = submissionsStore.findIndex((s) => s.id === submissionId);
  if (idx === -1) return null;

  submissionsStore[idx] = {
    ...submissionsStore[idx],
    status: payload.status,
    grade: payload.grade ?? submissionsStore[idx].grade,
    feedback: payload.feedback ?? submissionsStore[idx].feedback,
    gradedAt: new Date().toISOString(),
    gradedBy: payload.gradedBy,
  };
  persist();
  return submissionsStore[idx];
}

/** @param {string} url */
export function isValidGithubUrl(url) {
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname === "github.com" && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

export async function loadStudentSubmission(courseCode, examId, username, options = {}) {
  if (USE_MOCK) {
    return getStudentSubmission(courseCode, examId, username);
  }

  const apiExamId =
    options.apiExamId
    ?? (await resolveExamApiId(examId, { type: "Practice" }))
    ?? (await resolveExamApiId(examId));

  if (!apiExamId) {
    return null;
  }

  const dto = await practiceSubmissionsApi.getMyPracticeSubmission(apiExamId);
  if (!dto) return null;

  return mapPracticeSubmissionDto(dto, {
    courseCode,
    examId,
    student: username,
    username,
  });
}

export async function submitPracticeExamAsync(payload) {
  if (USE_MOCK) {
    return submitPracticeExam(payload);
  }

  const apiExamId =
    payload.apiExamId
    ?? (await resolveExamApiId(payload.examId, { type: "Practice" }))
    ?? (await resolveExamApiId(payload.examId));

  if (!apiExamId) {
    throw new Error("Không tìm thấy đề thực hành trên hệ thống. Vui lòng tải lại trang.");
  }

  const dto = await practiceSubmissionsApi.submitPractice(apiExamId, {
    gitHubRepoUrl: payload.githubUrl.trim(),
  });

  return mapPracticeSubmissionDto(dto, {
    ...payload,
    apiExamId,
  });
}

export async function loadAllPracticeSubmissions() {
  if (USE_MOCK) {
    return getAllPracticeSubmissions();
  }

  try {
    const page = await adminApi.listModerationPracticeSubmissions({ pageSize: ADMIN_API_PAGE_SIZE });
    const submissions = (page.items ?? []).map((item) => mapModerationPracticeSubmission(item));
    if (submissions.length > 0) {
      return submissions.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    }
  } catch {
    /* fallback below */
  }

  try {
    const examsResult = await examsApi.listExams({ type: "Practice", pageSize: ADMIN_API_PAGE_SIZE });
    const submissions = [];

    for (const exam of examsResult.items ?? []) {
      try {
        const page = await practiceSubmissionsApi.listPracticeSubmissions(exam.id, {
          pageSize: ADMIN_API_PAGE_SIZE,
        });

        for (const item of page.items ?? []) {
          submissions.push(mapPracticeSubmissionListItem(item, exam));
        }
      } catch {
        /* skip exams without moderator access or empty */
      }
    }

    if (submissions.length > 0) {
      return submissions.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    }
  } catch {
    /* fallback below */
  }

  return getAllPracticeSubmissions();
}

export async function loadPendingPracticeSubmissionCount() {
  const submissions = await loadAllPracticeSubmissions();
  return submissions.filter((item) => item.status === "pending").length;
}

export async function savePracticeSubmissionReview(submission, payload) {
  if (USE_MOCK || !submission?.apiExamId) {
    return gradePracticeSubmission(submission.id, payload);
  }

  const apiStatus = mapFeReviewStatusToApi(payload.status);
  if (!apiStatus) {
    throw new Error("Trạng thái chấm bài không được hỗ trợ qua API.");
  }

  const dto = await practiceSubmissionsApi.reviewPracticeSubmission(
    submission.apiExamId,
    submission.id,
    {
      status: apiStatus,
      reviewerComment: buildReviewerComment(payload.grade, payload.feedback),
    },
  );

  return mapPracticeSubmissionDto(dto, {
    ...submission,
    gradedBy: payload.gradedBy,
  });
}
