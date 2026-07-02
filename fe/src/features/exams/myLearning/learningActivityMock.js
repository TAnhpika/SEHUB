/** @typedef {import("./learningActivityTypes").ExamAttemptHistoryItem} ExamAttemptHistoryItem */
/** @typedef {import("./learningActivityTypes").PracticeHistoryItem} PracticeHistoryItem */

/** @type {ExamAttemptHistoryItem[]} */
export const MOCK_EXAM_ATTEMPTS = [
  {
    attemptId: "mock-attempt-1",
    examId: "mock-exam-1",
    examCode: "PRF192-F24",
    examTitle: "Final Examination",
    major: "SE",
    semester: 5,
    submittedAt: "2026-06-28T09:15:00.000Z",
    scorePercent: 86,
    correctCount: 43,
    totalQuestions: 50,
    rewardPoints: 15,
  },
  {
    attemptId: "mock-attempt-2",
    examId: "mock-exam-2",
    examCode: "MAE101-S25",
    examTitle: "Final Examination",
    major: "SE",
    semester: 3,
    submittedAt: "2026-06-20T14:30:00.000Z",
    scorePercent: 72,
    correctCount: 36,
    totalQuestions: 50,
    rewardPoints: 15,
  },
  {
    attemptId: "mock-attempt-3",
    examId: "mock-exam-3",
    examCode: "CSI104-F24",
    examTitle: "Final Examination",
    major: "SE",
    semester: 4,
    submittedAt: "2026-06-10T11:00:00.000Z",
    scorePercent: 38,
    correctCount: 19,
    totalQuestions: 50,
    rewardPoints: 15,
  },
];

/** @type {PracticeHistoryItem[]} */
export const MOCK_PRACTICE_SUBMISSIONS = [
  {
    id: "mock-practice-1",
    examId: "mock-pe-1",
    examCode: "PRF192-PE1",
    examTitle: "Practice Set 1 — Variables & Loops",
    courseCode: "PRF192",
    githubUrl: "https://github.com/demo-student/prf192-pe1",
    status: "pending",
    submittedAt: "2026-07-01T08:20:00.000Z",
    reviewedAt: null,
    grade: null,
    feedback: "",
  },
  {
    id: "mock-practice-2",
    examId: "mock-pe-2",
    examCode: "PRF192-PE2",
    examTitle: "Lab Assignment — OOP Basics",
    courseCode: "PRF192",
    githubUrl: "https://github.com/demo-student/prf192-lab2",
    status: "pass",
    submittedAt: "2026-06-25T16:45:00.000Z",
    reviewedAt: "2026-06-30T10:00:00.000Z",
    grade: "8.5",
    feedback: "Code sạch, thiếu validate input ở phần nhập liệu.",
  },
  {
    id: "mock-practice-3",
    examId: "mock-pe-3",
    examCode: "MAE101-PE1",
    examTitle: "Practice — Linear Algebra",
    courseCode: "MAE101",
    githubUrl: "https://github.com/demo-student/mae101-pe1",
    status: "fail",
    submittedAt: "2026-06-18T13:10:00.000Z",
    reviewedAt: "2026-06-22T09:30:00.000Z",
    grade: "4.0",
    feedback: "Chưa đúng yêu cầu ma trận nghịch đảo. Xem lại bài 3.",
  },
  {
    id: "mock-practice-4",
    examId: "mock-pe-4",
    examCode: "CSI104-PE1",
    examTitle: "Practice — Database Design",
    courseCode: "CSI104",
    githubUrl: "https://github.com/demo-student/csi104-db",
    status: "reviewed",
    submittedAt: "2026-06-15T07:55:00.000Z",
    reviewedAt: "2026-06-16T15:20:00.000Z",
    grade: null,
    feedback: "",
  },
];

export function getMockExamAttempts() {
  return [...MOCK_EXAM_ATTEMPTS];
}

export function getMockPracticeSubmissions() {
  return [...MOCK_PRACTICE_SUBMISSIONS];
}
