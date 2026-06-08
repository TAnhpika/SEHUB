const STORAGE_KEY = "sehubs_exam_ai_chat";

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

/** @returns {Array<{ id: string, role: "user" | "assistant", text: string, createdAt: string }>} */
export function getAiChatMessages(examId, questionId) {
  const store = readStore();
  return store[threadKey(examId, questionId)] ?? [];
}

export function appendAiChatMessages(examId, questionId, messages) {
  const key = threadKey(examId, questionId);
  const store = readStore();
  store[key] = [...(store[key] ?? []), ...messages];
  writeStore(store);
  return store[key];
}
