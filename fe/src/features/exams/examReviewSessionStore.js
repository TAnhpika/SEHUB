/** Phiên ôn tập đề cuối kỳ — xáo thứ tự & hiện đáp án đúng khi bấm nút (Premium, §3.3) */

const STORAGE_PREFIX = "sehubs_review_session";

/**
 * @typedef {{ correctAnswerRevealed: boolean; order: number[] | null; optionOrders: Record<string, number[]> }} ReviewSession
 */

function storageKey(examId, username) {
  return `${STORAGE_PREFIX}:${examId}:${username ?? "guest"}`;
}

function normalizeSession(parsed) {
  if (typeof parsed?.correctAnswerRevealed === "boolean") {
    return {
      correctAnswerRevealed: parsed.correctAnswerRevealed,
      order: Array.isArray(parsed?.order) ? parsed.order : null,
      optionOrders:
        parsed?.optionOrders && typeof parsed.optionOrders === "object"
          ? parsed.optionOrders
          : {},
    };
  }

  // Phiên cũ (ẩn/hiện toàn bộ lựa chọn) — mặc định chỉ xem lựa chọn bình thường
  return {
    correctAnswerRevealed: false,
    order: Array.isArray(parsed?.order) ? parsed.order : null,
    optionOrders:
      parsed?.optionOrders && typeof parsed.optionOrders === "object"
        ? parsed.optionOrders
        : {},
  };
}

function readSession(examId, username) {
  try {
    const raw = localStorage.getItem(storageKey(examId, username));
    if (!raw) return { correctAnswerRevealed: false, order: null, optionOrders: {} };
    return normalizeSession(JSON.parse(raw));
  } catch {
    return { correctAnswerRevealed: false, order: null, optionOrders: {} };
  }
}

function writeSession(examId, username, session) {
  localStorage.setItem(storageKey(examId, username), JSON.stringify(session));
}

/** @returns {ReviewSession} */
export function getReviewSession(examId, username) {
  return readSession(examId, username);
}

function shuffleIds(ids) {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * @param {Array<{ id: number }>} allQuestions
 * @param {ReviewSession} session
 */
export function getOrderedReviewQuestions(allQuestions, session) {
  if (!session.order?.length) return allQuestions;

  const rank = new Map(session.order.map((id, index) => [id, index]));
  return [...allQuestions].sort(
    (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/** @param {ReviewSession} session */
export function isReviewCorrectAnswerRevealed(session) {
  return session.correctAnswerRevealed === true;
}

/**
 * @param {string} examId
 * @param {string | undefined} username
 * @param {number[]} questionIds
 */
export function shuffleReviewQuestions(examId, username, questionIds) {
  const session = readSession(examId, username);
  session.order = shuffleIds(questionIds);
  writeSession(examId, username, session);
  return session;
}

/**
 * @param {string} examId
 * @param {string | undefined} username
 */
export function toggleReviewCorrectAnswerReveal(examId, username) {
  const session = readSession(examId, username);
  session.correctAnswerRevealed = !isReviewCorrectAnswerRevealed(session);
  writeSession(examId, username, session);
  return session;
}

function questionKey(questionId) {
  return String(questionId);
}

/**
 * Lấy hoặc tạo thứ tự xáo nội dung đáp án (giữ nhãn A/B/C/D cố định).
 * @param {number} optionCount
 */
export function ensureReviewOptionOrder(examId, username, questionId, optionCount) {
  if (!optionCount) return [];

  const session = readSession(examId, username);
  const key = questionKey(questionId);
  const existing = session.optionOrders?.[key];

  if (existing?.length === optionCount) {
    return existing;
  }

  session.optionOrders = {
    ...(session.optionOrders ?? {}),
    [key]: shuffleIds([...Array(optionCount).keys()]),
  };
  writeSession(examId, username, session);
  return session.optionOrders[key];
}

/**
 * Xáo lại nội dung đáp án của một câu (nhãn A/B/C/D không đổi).
 */
export function shuffleReviewQuestionOptions(examId, username, questionId, optionCount) {
  if (optionCount < 2) return readSession(examId, username);

  const session = readSession(examId, username);
  const key = questionKey(questionId);
  session.optionOrders = {
    ...(session.optionOrders ?? {}),
    [key]: shuffleIds([...Array(optionCount).keys()]),
  };
  writeSession(examId, username, session);
  return session;
}

/** @param {string} examId @param {string | undefined} username */
export function resetReviewSession(examId, username) {
  writeSession(examId, username, { correctAnswerRevealed: false, order: null, optionOrders: {} });
  return { correctAnswerRevealed: false, order: null, optionOrders: {} };
}

/** @deprecated — dùng getOrderedReviewQuestions */
export function getVisibleReviewQuestions(allQuestions, session) {
  return getOrderedReviewQuestions(allQuestions, session);
}

/** @deprecated — dùng toggleReviewCorrectAnswerReveal */
export function toggleReviewAnswersVisibility(examId, username) {
  return toggleReviewCorrectAnswerReveal(examId, username);
}

/** @deprecated — dùng isReviewCorrectAnswerRevealed */
export function isReviewAnswersVisible(session) {
  return isReviewCorrectAnswerRevealed(session);
}

/** @deprecated */
export function toggleReviewAnswerMask(examId, username, _questionId) {
  return toggleReviewCorrectAnswerReveal(examId, username);
}

/** @deprecated */
export function isReviewAnswerMasked(session) {
  return !isReviewCorrectAnswerRevealed(session);
}

/** @deprecated */
export function hideReviewQuestion(examId, username, _questionId) {
  return toggleReviewCorrectAnswerReveal(examId, username);
}
