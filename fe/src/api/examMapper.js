export function mapExamDetailDtoToFeExam(dto, courseCode) {
  const examTypeLabel = dto.examType === "Practice" ? "Thực hành" : "Cuối kỳ";

  return {
    id: dto.code || dto.id,
    apiId: dto.id,
    courseCode: courseCode?.toUpperCase() ?? dto.major ?? "",
    type: examTypeLabel,
    examType: dto.examType,
    questionCount: dto.questionCount ?? 0,
    title: dto.title,
    description: dto.description,
    assetUrl: dto.assetUrl,
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
    correctAnswer: null,
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
  const correctOption = question.options.find((option) => option.optionId === dto.correctOptionId);

  return {
    ...question,
    correctAnswer: correctOption?.key ?? null,
  };
}

export function mapAttemptAnswersToUi(questions, apiAnswers = {}) {
  const answers = {};

  for (const question of questions) {
    const selectedOptionId = apiAnswers[question.id];
    if (!selectedOptionId) continue;

    const option = question.options.find((item) => item.optionId === selectedOptionId);
    if (option) {
      answers[String(question.id)] = option.key;
    }
  }

  return answers;
}

export function buildSaveAnswersPayload(questions, uiAnswers) {
  const answers = {};

  for (const question of questions) {
    const selectedKey = uiAnswers[String(question.id)];
    if (!selectedKey) continue;

    const option = question.options.find((item) => item.key === selectedKey);
    if (option?.optionId) {
      answers[question.id] = option.optionId;
    }
  }

  return { answers };
}

export function mapExamResultToLocalResult(apiResult, questions) {
  const questionMap = new Map(questions.map((question) => [String(question.id), question]));

  const items = (apiResult.answers ?? []).map((answer) => {
    const question = questionMap.get(String(answer.questionId));
    const selectedOption = question?.options.find(
      (option) => option.optionId === answer.selectedOptionId,
    );
    const correctOption = question?.options.find(
      (option) => option.optionId === answer.correctOptionId,
    );

    return {
      questionId: answer.questionId,
      text: question?.text ?? "",
      options: question?.options ?? [],
      correctAnswer: correctOption?.key ?? question?.correctAnswer ?? null,
      selectedAnswer: selectedOption?.key ?? null,
      isCorrect: answer.isCorrect,
    };
  });

  const total = apiResult.totalQuestions ?? items.length;
  const correctCount = apiResult.correctCount ?? 0;
  const wrongCount = items.filter((item) => item.selectedAnswer && !item.isCorrect).length;
  const unansweredCount = items.filter((item) => !item.selectedAnswer).length;

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
