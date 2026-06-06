export function getScoreGrade(scorePercent) {
  if (scorePercent >= 90) return { label: "A", tone: "excellent" };
  if (scorePercent >= 80) return { label: "B", tone: "good" };
  if (scorePercent >= 70) return { label: "C", tone: "good" };
  if (scorePercent >= 50) return { label: "D", tone: "average" };
  return { label: "F", tone: "weak" };
}

export function getScoreOnTen(correctCount, total) {
  if (!total) return 0;
  return Math.round((correctCount / total) * 100) / 10;
}

export function getPassStatus(scoreOnTen) {
  return scoreOnTen >= 5 ? "pass" : "fail";
}

export function getMockPeerComparison(scorePercent) {
  const delta = Math.max(8, Math.min(92, scorePercent - 12 + (scorePercent % 7)));
  return {
    percentile: delta,
    message: `Kết quả của bạn cao hơn ${delta}% người làm cùng đề thi này.`,
  };
}
