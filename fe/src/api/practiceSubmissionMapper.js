const STATUS_TO_FE = {
  Submitted: "pending",
  Reviewed: "reviewed",
  Passed: "pass",
  Failed: "fail",
};

export function mapApiStatusToFe(status) {
  return STATUS_TO_FE[status] ?? String(status ?? "pending").toLowerCase();
}

export function mapFeReviewStatusToApi(status) {
  if (status === "pass") return "Passed";
  if (status === "fail") return "Failed";
  return null;
}

export function buildReviewerComment(grade, feedback) {
  const parts = [];
  if (grade?.trim()) {
    parts.push(`Điểm: ${grade.trim()}`);
  }
  if (feedback?.trim()) {
    parts.push(feedback.trim());
  }
  return parts.join("\n\n") || null;
}

export function parseGradeFromComment(comment) {
  if (!comment) return null;
  const match = comment.match(/Điểm:\s*([\d.]+)/i);
  return match?.[1] ?? null;
}

export function parseFeedbackFromComment(comment) {
  if (!comment) return "";
  return comment.replace(/^Điểm:\s*[\d.]+\s*\n?\n?/i, "").trim();
}

function resolveCourseCode(exam, fallbackCourseCode) {
  if (fallbackCourseCode) {
    return fallbackCourseCode.toUpperCase();
  }

  if (exam?.major) {
    return String(exam.major).toUpperCase();
  }

  const code = exam?.code ?? "";
  const match = code.match(/^([A-Z0-9]+)-/i);
  return match?.[1]?.toUpperCase() ?? "";
}

export function mapPracticeSubmissionDto(dto, context = {}) {
  const feedback = dto.reviewerComment ?? "";

  return {
    id: dto.id,
    apiExamId: dto.examId,
    courseCode: resolveCourseCode(context.exam, context.courseCode),
    examId: context.examId ?? context.exam?.code ?? "",
    student: context.student ?? context.username ?? "",
    displayName: context.displayName ?? context.student ?? "",
    githubUrl: dto.gitHubRepoUrl,
    submittedAt: dto.submittedAt,
    status: mapApiStatusToFe(dto.status),
    grade: parseGradeFromComment(feedback),
    feedback: parseFeedbackFromComment(feedback),
    gradedAt: dto.reviewedAt ?? null,
    gradedBy: context.gradedBy ?? null,
  };
}

export function mapPracticeSubmissionListItem(dto, exam) {
  const feedback = dto.reviewerComment ?? "";

  return {
    id: dto.id,
    apiExamId: dto.examId,
    courseCode: resolveCourseCode(exam),
    examId: exam?.code ?? "",
    student: dto.user?.username ?? "unknown",
    displayName: dto.user?.displayName ?? dto.user?.username ?? "Unknown",
    githubUrl: dto.gitHubRepoUrl,
    submittedAt: dto.submittedAt,
    status: mapApiStatusToFe(dto.status),
    grade: parseGradeFromComment(feedback),
    feedback: parseFeedbackFromComment(feedback),
    gradedAt: dto.reviewedAt ?? null,
    gradedBy: null,
  };
}
