/**
 * @typedef {object} ExamAttemptHistoryItem
 * @property {string} attemptId
 * @property {string} examId
 * @property {string} examCode
 * @property {string} examTitle
 * @property {string} major
 * @property {number} semester
 * @property {string} submittedAt
 * @property {number} scorePercent
 * @property {number} correctCount
 * @property {number} totalQuestions
 * @property {number} [rewardPoints]
 */

/**
 * @typedef {"pending" | "reviewed" | "pass" | "fail"} PracticeSubmissionStatus
 */

/**
 * @typedef {object} PracticeHistoryItem
 * @property {string} id
 * @property {string} examId
 * @property {string} examCode
 * @property {string} examTitle
 * @property {string} courseCode
 * @property {string} githubUrl
 * @property {PracticeSubmissionStatus} status
 * @property {string} submittedAt
 * @property {string | null} reviewedAt
 * @property {string | null} grade
 * @property {string} feedback
 */

/** @typedef {"exams" | "practice"} LearningActivityTab */

export {};
