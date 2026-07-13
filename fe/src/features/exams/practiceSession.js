const PRACTICE_SESSION_PREFIX = "sehubs_practice_session_";

/** §3.4 — Làm bài thực hành: 85 phút mỗi bài */
export const PRACTICE_DURATION_MS = 85 * 60 * 1000;

function sessionKey(examId, questionId) {
  return `${PRACTICE_SESSION_PREFIX}${examId}_q${questionId}`;
}

function readSession(examId, questionId) {
  try {
    const raw = sessionStorage.getItem(sessionKey(examId, questionId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(examId, questionId, session) {
  sessionStorage.setItem(sessionKey(examId, questionId), JSON.stringify(session));
}

export function createPracticeSession(examId, questionId) {
  const session = {
    examId,
    questionId,
    startedAt: Date.now(),
    submission: null,
    submitted: false,
    submittedAt: null,
    result: null,
  };
  writeSession(examId, questionId, session);
  return session;
}

export function getPracticeSession(examId, questionId) {
  return readSession(examId, questionId);
}

export function getOrCreatePracticeSession(examId, questionId) {
  return getPracticeSession(examId, questionId) ?? createPracticeSession(examId, questionId);
}

export function savePracticeSubmission(examId, questionId, submission) {
  const session = getOrCreatePracticeSession(examId, questionId);
  session.submission = submission;
  writeSession(examId, questionId, session);
  return session;
}

export function isValidGithubUrl(url) {
  const trimmed = url?.trim() ?? "";
  return /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?.*$/i.test(trimmed);
}

export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildPracticeResult(question, submission, startedAt, submittedAt) {
  const onTime = submittedAt - startedAt <= PRACTICE_DURATION_MS;
  const submissionValid =
    submission?.type === "github"
      ? isValidGithubUrl(submission.value)
      : Boolean(submission?.fileName);

  const item = {
    questionId: question.id,
    text: question.text,
    submission,
    selectedAnswer:
      submission?.type === "github" ? submission.value : submission?.fileName ?? null,
    isCorrect: null,
    gradingStatus: "pending",
  };

  return {
    total: 1,
    correctCount: 0,
    wrongCount: 0,
    unansweredCount: 0,
    submittedCount: submissionValid ? 1 : 0,
    scorePercent: null,
    scoreOnTen: null,
    gradingStatus: "pending",
    items: [item],
    submissionType: submission?.type ?? null,
    onTime,
    submissionValid,
    status: "submitted",
  };
}

/**
 * Gộp kết quả chấm từ Mod/Admin (API) vào session local sau khi SV đã nộp bài.
 * §3.4 / §4.1 — điểm chỉ hiển thị khi status là pass hoặc fail.
 */
export function mergeGradedPracticeResult(result, submission) {
  if (!result || !submission) {
    return result;
  }

  if (submission.status !== "pass" && submission.status !== "fail") {
    return result;
  }

  const gradeNum = Number.parseFloat(submission.grade);
  const scoreOnTen = Number.isFinite(gradeNum)
    ? gradeNum
    : submission.status === "pass"
      ? 5
      : 0;
  const scorePercent = Math.min(100, Math.max(0, Math.round(scoreOnTen * 10)));
  const passed = submission.status === "pass";

  return {
    ...result,
    gradingStatus: "graded",
    correctCount: passed ? 1 : 0,
    wrongCount: passed ? 0 : 1,
    unansweredCount: 0,
    submittedCount: 1,
    scorePercent,
    scoreOnTen: scoreOnTen.toFixed(2),
    passStatus: passed ? "pass" : "fail",
    moderatorFeedback: submission.feedback ?? "",
    moderatorGrade: submission.grade ?? null,
    items: result.items.map((item) => ({
      ...item,
      isCorrect: passed,
      gradingStatus: "graded",
    })),
  };
}

export function isPracticeResultGraded(result) {
  return result?.gradingStatus === "graded";
}

export function submitPracticeSession(examId, questionId, question, submission) {
  const session = getOrCreatePracticeSession(examId, questionId);
  const submittedAt = Date.now();
  const result = buildPracticeResult(question, submission, session.startedAt, submittedAt);
  const next = {
    ...session,
    submission,
    submitted: true,
    submittedAt,
    result,
  };
  writeSession(examId, questionId, next);
  return next;
}

export function clearPracticeSession(examId, questionId) {
  sessionStorage.removeItem(sessionKey(examId, questionId));
}

export function getPracticeTimeRemaining(session) {
  if (!session?.startedAt) return PRACTICE_DURATION_MS;
  return Math.max(0, PRACTICE_DURATION_MS - (Date.now() - session.startedAt));
}
