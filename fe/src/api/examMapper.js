import { resolveAssetUrl } from "@/api/assetUrl";
import {
  isMultiSelectQuestion,
  optionIdsToLabels,
} from "@/features/exams/examQuestionTypes";

export function mapExamAttachmentDto(attachment, examId) {
  const viewPath =
    attachment.viewPath ??
    (attachment.id && examId
      ? `/api/v1/exams/${examId}/attachments/${attachment.id}/view`
      : null);

  return {
    id: attachment.id,
    name: attachment.originalFileName ?? attachment.name ?? "exam-attachment",
    contentType: attachment.contentType ?? "",
    fileSize: attachment.fileSize ?? 0,
    viewPath,
    viewUrl: resolveAssetUrl(viewPath),
  };
}

export function mapExamDetailDtoToFeExam(dto, courseCode) {
  const examTypeLabel = dto.examType === "Practice" ? "Thực hành" : "Cuối kỳ";
  const attachments = (dto.attachments ?? []).map((attachment) =>
    mapExamAttachmentDto(attachment, dto.id),
  );
  const primaryAttachment = attachments[0];

  return {
    id: dto.code || dto.id,
    apiId: dto.id,
    courseCode: courseCode?.toUpperCase() ?? dto.major ?? "",
    type: examTypeLabel,
    examType: dto.examType,
    questionCount: dto.questionCount ?? 0,
    title: dto.title,
    description: dto.description,
    assetUrl: dto.assetUrl ?? primaryAttachment?.viewUrl ?? primaryAttachment?.viewPath ?? null,
    attachments,
    semester: dto.semester,
    major: dto.major,
    status: dto.status,
  };
}

export function mapQuestionPublicDto(dto) {
  return {
    id: dto.id,
    orderIndex: dto.orderIndex,
    kind: "review",
    text: dto.content,
    questionType: dto.questionType ?? "SingleChoice",
    requiredSelectCount: dto.requiredSelectCount ?? null,
    correctAnswer: null,
    correctAnswers: [],
    options: (dto.options ?? []).map(mapQuestionOptionDto),
  };
}

export function mapQuestionOptionDto(dto) {
  return {
    key: dto.label,
    label: dto.text,
    optionId: dto.id,
  };
}

export function mapQuestionAnswerDto(dto) {
  const question = mapQuestionPublicDto(dto);
  const options = question.options;
  const correctOptionIds = dto.correctOptionIds ?? [];
  const correctLabels = optionIdsToLabels(options, correctOptionIds);

  if (correctLabels.length === 0 && dto.correctOptionId) {
    const single = options.find((option) => option.optionId === dto.correctOptionId);
    if (single?.key) {
      correctLabels.push(single.key);
    }
  }

  const isMulti = isMultiSelectQuestion({ questionType: dto.questionType });

  return {
    ...question,
    correctAnswer: correctLabels[0] ?? null,
    correctAnswers: isMulti ? correctLabels : [],
  };
}

function mapApiAnswerEntryToUiKeys(question, apiValue) {
  const optionIds = Array.isArray(apiValue) ? apiValue : apiValue ? [apiValue] : [];
  return optionIds
    .map((optionId) => question.options.find((item) => item.optionId === optionId)?.key)
    .filter(Boolean);
}

export function mapAttemptAnswersToUi(questions, apiAnswers = {}) {
  const answers = {};

  for (const question of questions) {
    const rawValue = apiAnswers[question.id];
    if (!rawValue) continue;

    const keys = mapApiAnswerEntryToUiKeys(question, rawValue);
    if (keys.length === 0) continue;

    answers[String(question.id)] = isMultiSelectQuestion(question) ? keys : keys[0];
  }

  return answers;
}

export function buildSaveAnswersPayload(questions, uiAnswers) {
  const answers = {};

  for (const question of questions) {
    const rawValue = uiAnswers[String(question.id)];
    if (!rawValue) continue;

    const selectedKeys = Array.isArray(rawValue) ? rawValue : [rawValue];
    const optionIds = selectedKeys
      .map((key) => question.options.find((item) => item.key === key)?.optionId)
      .filter(Boolean);

    if (optionIds.length > 0) {
      answers[question.id] = optionIds;
    }
  }

  return { answers };
}

export function mapExamResultToLocalResult(apiResult, questions) {
  const questionMap = new Map(questions.map((question) => [String(question.id), question]));

  const items = (apiResult.answers ?? []).map((answer) => {
    const question = questionMap.get(String(answer.questionId));
    const selectedLabels = optionIdsToLabels(question?.options ?? [], answer.selectedOptionIds ?? []);
    const correctLabels = optionIdsToLabels(question?.options ?? [], answer.correctOptionIds ?? []);
    const isMulti = isMultiSelectQuestion(question);

    return {
      questionId: answer.questionId,
      text: question?.text ?? "",
      options: question?.options ?? [],
      questionType: question?.questionType ?? "SingleChoice",
      correctAnswer: isMulti ? correctLabels.join(", ") : correctLabels[0] ?? question?.correctAnswer ?? null,
      correctAnswers: correctLabels,
      selectedAnswer: isMulti ? selectedLabels.join(", ") : selectedLabels[0] ?? null,
      selectedAnswers: selectedLabels,
      isCorrect: answer.isCorrect,
    };
  });

  const total = apiResult.totalQuestions ?? items.length;
  const correctCount = apiResult.correctCount ?? 0;
  const wrongCount = items.filter((item) => (item.selectedAnswers?.length || item.selectedAnswer) && !item.isCorrect).length;
  const unansweredCount = items.filter((item) => !item.selectedAnswers?.length && !item.selectedAnswer).length;

  return {
    total,
    correctCount,
    wrongCount,
    unansweredCount,
    scorePercent: Math.round(Number(apiResult.score ?? 0)),
    items,
  };
}

export function mapAiExplainResponse(response) {
  const explanation = response?.explanation?.trim() ?? "";

  if (!explanation) {
    return null;
  }

  const paragraphs = explanation.split(/\n{2,}/).filter(Boolean);

  return {
    intro: paragraphs[0] ?? explanation,
    bullets: paragraphs.slice(1).map((text, index) => ({
      label: `Ghi chú ${index + 1}`,
      text,
    })),
    note: "Giải thích từ SEHub AI (Gemini).",
    tokensUsed: response.tokensUsed,
    remainingTokens: response.remainingTokens,
  };
}

export function mapExamAiChatResponse(response) {
  const messages = (response?.messages ?? []).map((message) => ({
    id: message.id ?? `${message.role}-${message.createdAt}`,
    role: message.role === "assistant" ? "assistant" : "user",
    text: message.text ?? "",
    createdAt: message.createdAt ?? new Date().toISOString(),
  }));

  return {
    threadId: response?.threadId ?? null,
    reply: response?.reply ?? "",
    tokensUsed: response?.tokensUsed ?? null,
    remainingTokens: response?.remainingTokens ?? null,
    messages,
  };
}
