const PRACTICE_SESSION_PREFIX = "sehubs_practice_session_";

export const PRACTICE_DURATION_MS = 30 * 60 * 1000;

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
  const isValid =
    submission?.type === "github"
      ? isValidGithubUrl(submission.value)
      : Boolean(submission?.fileName);

  const passed = isValid && onTime;

  const item = {
    questionId: question.id,
    text: question.text,
    submission,
    selectedAnswer:
      submission?.type === "github" ? submission.value : submission?.fileName ?? null,
    isCorrect: passed,
  };

  return {
    total: 1,
    correctCount: passed ? 1 : 0,
    wrongCount: 0,
    unansweredCount: passed ? 0 : 1,
    scorePercent: passed ? 100 : 0,
    items: [item],
    submissionType: submission?.type ?? null,
    onTime,
    status: passed ? "submitted" : "invalid",
  };
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
