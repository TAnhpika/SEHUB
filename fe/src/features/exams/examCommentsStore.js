const STORAGE_KEY = "sehubs_exam_comments";

function threadKey(examId, questionId) {
  return `${examId}::${questionId}`;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function formatTimeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function withDisplayFields(comment) {
  return {
    ...comment,
    timeAgo: formatTimeAgo(comment.createdAt),
  };
}

/** @returns {Array} */
export function getExamComments(examId, questionId) {
  const key = threadKey(examId, questionId);
  const store = readStore();

  if (!store[key]) {
    store[key] = [];
    writeStore(store);
  }

  return store[key].map(withDisplayFields);
}

export function addExamComment(examId, questionId, user, content) {
  const trimmed = content?.trim();
  if (!trimmed || !user) return null;

  const key = threadKey(examId, questionId);
  const store = readStore();

  if (!store[key]) {
    store[key] = [];
  }

  const displayName = user.displayName ?? user.username ?? "Sinh viên";
  const initial = user.initial ?? displayName.charAt(0).toUpperCase();

  const comment = {
    id: `cmt-${Date.now()}`,
    examId,
    questionId,
    userId: user.username ?? user.email,
    author: displayName,
    initial,
    avatarColor: "#004ac6",
    content: trimmed,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    highlighted: false,
  };

  store[key] = [...store[key], comment];
  writeStore(store);

  return withDisplayFields(comment);
}

export function toggleExamCommentLike(examId, questionId, commentId, userId) {
  const key = threadKey(examId, questionId);
  const store = readStore();
  if (!store[key]) return null;

  store[key] = store[key].map((comment) => {
    if (comment.id !== commentId) return comment;

    const likedByMe = !comment.likedByMe;
    return {
      ...comment,
      likedByMe,
      likes: Math.max(0, comment.likes + (likedByMe ? 1 : -1)),
    };
  });

  writeStore(store);
  return getExamComments(examId, questionId);
}
