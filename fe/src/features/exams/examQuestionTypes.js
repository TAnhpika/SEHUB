export const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const QUESTION_TYPES = {
  SINGLE: "SingleChoice",
  MULTI: "MultiSelect",
};

export function createEmptyAnswers(labels = OPTION_LABELS.slice(0, 4)) {
  return Object.fromEntries(labels.map((label) => [label, ""]));
}

export function isMultiSelectQuestion(question) {
  return String(question?.questionType ?? "").toLowerCase() === "multiselect";
}

export function getQuestionOptionLabels(question) {
  const fromAnswers = Object.keys(question?.answers ?? {})
    .filter((key) => OPTION_LABELS.includes(key))
    .sort((a, b) => OPTION_LABELS.indexOf(a) - OPTION_LABELS.indexOf(b));

  if (fromAnswers.length > 0) {
    return fromAnswers;
  }

  return OPTION_LABELS.slice(0, 4);
}

export function getSelectedAnswerKeys(questionId, answers) {
  const value = answers[String(questionId)];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value ? [value] : [];
}

export function isQuestionAnswered(questionId, answers, question) {
  const selected = getSelectedAnswerKeys(questionId, answers);
  if (isMultiSelectQuestion(question)) {
    const required = question.requiredSelectCount ?? question.correctAnswers?.length ?? 1;
    return selected.length >= required;
  }
  return selected.length > 0;
}

export function toggleMultiSelectAnswer(questionId, optionKey, answers, requiredCount) {
  const current = new Set(getSelectedAnswerKeys(questionId, answers));
  if (current.has(optionKey)) {
    current.delete(optionKey);
  } else if (current.size < requiredCount) {
    current.add(optionKey);
  } else {
    return answers;
  }

  return {
    ...answers,
    [String(questionId)]: OPTION_LABELS.filter((label) => current.has(label)),
  };
}

export function setSingleSelectAnswer(questionId, optionKey, answers) {
  return {
    ...answers,
    [String(questionId)]: optionKey,
  };
}

export function labelsToOptionIds(options, labels) {
  return labels
    .map((label) => options.find((option) => option.label === label || option.key === label))
    .filter(Boolean)
    .map((option) => option.id ?? option.optionId);
}

export function optionIdsToLabels(options, optionIds = []) {
  const idSet = new Set(optionIds.map(String));
  return options
    .filter((option) => idSet.has(String(option.id ?? option.optionId)))
    .map((option) => option.key ?? option.label);
}
