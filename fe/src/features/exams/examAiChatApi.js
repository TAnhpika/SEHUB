import * as examsApi from "@/api/examsApi";
import { mapExamAiChatResponse } from "@/api/examMapper";
import { isValidGuid } from "@/features/feed/postUtils";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function loadExamAiChat(examId, questionId) {
  if (USE_MOCK || !isValidGuid(String(examId ?? "")) || !isValidGuid(String(questionId ?? ""))) {
    return { messages: [] };
  }

  const response = await examsApi.getExamAiChat(examId, questionId);
  return mapExamAiChatResponse(response);
}

export async function sendExamAiChatMessage(examId, questionId, message) {
  if (USE_MOCK || !isValidGuid(String(examId ?? "")) || !isValidGuid(String(questionId ?? ""))) {
    return null;
  }

  const response = await examsApi.sendExamAiChat(examId, questionId, { message });
  return mapExamAiChatResponse(response);
}
