const DISPLAY_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function labelRank(label) {
  const index = DISPLAY_LABELS.indexOf(String(label ?? "").toUpperCase());
  return index === -1 ? DISPLAY_LABELS.length : index;
}

function normalizeSourceOptions(options = []) {
  return [...options]
    .sort((a, b) => labelRank(a.key) - labelRank(b.key))
    .map((option) => ({
      key: option.key,
      label: option.label,
      optionId: option.optionId,
    }));
}

/**
 * @param {Array<{ key: string; label: string; optionId?: string }>} options
 * @param {number[] | null | undefined} permutation indices into normalized source options
 */
export function buildDisplayOptions(options, permutation) {
  const source = normalizeSourceOptions(options);
  if (source.length === 0) return [];

  const order =
    permutation?.length === source.length
      ? permutation
      : source.map((_, index) => index);

  return order.map((sourceIndex, displayIndex) => {
    const option = source[sourceIndex];
    return {
      key: DISPLAY_LABELS[displayIndex] ?? String(displayIndex + 1),
      label: option.label,
      optionId: option.optionId,
      sourceKey: option.key,
    };
  });
}

export function mapCorrectAnswerToDisplay(question, displayOptions) {
  const labels = mapCorrectAnswersToDisplay(question, displayOptions);
  return labels[0] ?? null;
}

export function mapCorrectAnswersToDisplay(question, displayOptions) {
  const sourceKeys = [];
  if (Array.isArray(question?.correctAnswers) && question.correctAnswers.length > 0) {
    sourceKeys.push(...question.correctAnswers);
  } else if (question?.correctAnswer) {
    sourceKeys.push(question.correctAnswer);
  }

  if (sourceKeys.length === 0 || displayOptions.length === 0) {
    return [];
  }

  return sourceKeys
    .map((sourceKey) =>
      displayOptions.find(
        (option) => option.sourceKey === sourceKey || option.key === sourceKey,
      )?.key,
    )
    .filter(Boolean);
}
