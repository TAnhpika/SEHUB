import * as examsApi from "@/api/examsApi";
import { isValidGuid } from "@/features/feed/postUtils";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
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

function mapApiComment(dto) {
  const displayName = dto.author?.displayName ?? dto.author?.username ?? "User";
  return {
    id: dto.id,
    userId: dto.author?.id ?? null,
    author: displayName,
    username: dto.author?.username ?? "",
    initial: displayName.charAt(0).toUpperCase(),
    avatarColor: "#004ac6",
    content: dto.content,
    createdAt: dto.createdAt,
    timeAgo: formatTimeAgo(dto.createdAt),
    likes: 0,
    likedByMe: false,
    highlighted: false,
  };
}

function withDisplayFields(comment) {
  return {
    ...comment,
    timeAgo: formatTimeAgo(comment.createdAt),
  };
}

function getMockComments(examId, questionId) {
  const key = threadKey(examId, questionId);
  const store = readStore();
  if (!store[key]) {
    store[key] = [];
    writeStore(store);
  }
  return store[key].map(withDisplayFields);
}

export async function loadExamComments(examId, questionId) {
  if (USE_MOCK || !isValidGuid(String(examId ?? "")) || !isValidGuid(String(questionId ?? ""))) {
    return getMockComments(examId, questionId);
  }

  const items = await examsApi.getQuestionComments(examId, questionId);
  return (items ?? []).map(mapApiComment);
}

export async function addExamComment(examId, questionId, user, content) {
  const trimmed = content?.trim();
  if (!trimmed || !user) return null;

  if (USE_MOCK || !isValidGuid(String(examId ?? "")) || !isValidGuid(String(questionId ?? ""))) {
    const key = threadKey(examId, questionId);
    const store = readStore();
    if (!store[key]) store[key] = [];
    const displayName = user.displayName ?? user.username ?? "Sinh viên";
    const comment = {
      id: `cmt-${Date.now()}`,
      examId,
      questionId,
      userId: user.username ?? user.email,
      author: displayName,
      initial: displayName.charAt(0).toUpperCase(),
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

  const dto = await examsApi.createQuestionComment(examId, questionId, { content: trimmed });
  return mapApiComment(dto);
}

export async function toggleExamCommentLike(examId, questionId, commentId, userId) {
  if (!USE_MOCK) {
    return loadExamComments(examId, questionId);
  }

  const key = threadKey(examId, questionId);
  const store = readStore();
  if (!store[key]) return [];

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
  return getMockComments(examId, questionId);
}

/** @deprecated Use loadExamComments */
export function getExamComments(examId, questionId) {
  return getMockComments(examId, questionId);
}
