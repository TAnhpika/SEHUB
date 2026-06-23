const SESSION_PREFIX = "sehubs_exam_session_";

function readSession(examId) {
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${examId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(examId, session) {
  sessionStorage.setItem(`${SESSION_PREFIX}${examId}`, JSON.stringify(session));
}

export function createExamSession(examId, extras = {}) {
  const session = {
    examId,
    apiExamId: extras.apiExamId ?? null,
    attemptId: extras.attemptId ?? null,
    startedAt: extras.startedAt ?? Date.now(),
    answers: extras.answers ?? {},
    submitted: false,
    result: null,
  };
  writeSession(examId, session);
  return session;
}

export function getExamSession(examId) {
  return readSession(examId);
}

export function getOrCreateExamSession(examId) {
  return getExamSession(examId) ?? createExamSession(examId);
}

export function saveExamAnswer(examId, questionId, answerKey) {
  const session = getOrCreateExamSession(examId);
  const key = String(questionId);

  if (answerKey == null) {
    delete session.answers[key];
  } else {
    session.answers[key] = answerKey;
  }

  session.answers[String(questionId)] = answerKey;
  writeSession(examId, session);
  return session;
}

export function gradeExam(questions, answers) {
  const items = questions.map((question) => {
    const selected = answers[String(question.id)] ?? null;
    const isCorrect = selected === question.correctAnswer;

    return {
      questionId: question.id,
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      selectedAnswer: selected,
      isCorrect,
    };
  });

  const correctCount = items.filter((item) => item.isCorrect).length;
  const wrongCount = items.filter(
    (item) => item.selectedAnswer && !item.isCorrect,
  ).length;
  const unansweredCount = items.filter((item) => !item.selectedAnswer).length;

  return {
    total: questions.length,
    correctCount,
    wrongCount,
    unansweredCount,
    scorePercent: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
    items,
  };
}

export function gradePracticeExam(questions, answers) {
  const items = questions.map((question) => {
    const selected = answers[String(question.id)] ?? null;
    const isCompleted = selected === "done";

    return {
      questionId: question.id,
      text: question.text,
      correctAnswer: null,
      selectedAnswer: isCompleted ? "done" : null,
      isCorrect: isCompleted,
    };
  });

  const correctCount = items.filter((item) => item.isCorrect).length;
  const unansweredCount = items.filter((item) => !item.selectedAnswer).length;

  return {
    total: questions.length,
    correctCount,
    wrongCount: 0,
    unansweredCount,
    scorePercent: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
    items,
  };
}

export function getScoreFeedback(scorePercent) {
  if (scorePercent >= 90) {
    return { label: "Xuất sắc", message: "Bạn nắm vững kiến thức môn học này!" };
  }
  if (scorePercent >= 70) {
    return { label: "Khá tốt", message: "Kết quả ổn, hãy ôn lại các câu sai để cải thiện." };
  }
  if (scorePercent >= 50) {
    return { label: "Trung bình", message: "Cần luyện tập thêm để đạt điểm cao hơn." };
  }
  return { label: "Cần cố gắng", message: "Đừng nản, xem lại đáp án và thử làm lại nhé!" };
}

export function submitExamSession(examId, questions) {
  const session = getOrCreateExamSession(examId);
  const result = gradeExam(questions, session.answers);
  const next = {
    ...session,
    submitted: true,
    submittedAt: Date.now(),
    result,
  };
  writeSession(examId, next);
  return next;
}

export function applyApiExamResult(
  examId,
  { apiExamId, attemptId, startedAt, submittedAt, answers, result },
) {
  const next = {
    examId,
    apiExamId: apiExamId ?? null,
    attemptId: attemptId ?? null,
    startedAt: startedAt ?? Date.now(),
    submittedAt: submittedAt ?? Date.now(),
    answers: answers ?? {},
    submitted: true,
    result,
  };
  writeSession(examId, next);
  return next;
}

export function usesApiAttempt(session) {
  return Boolean(session?.apiExamId && session?.attemptId);
}

export function clearExamSession(examId) {
  sessionStorage.removeItem(`${SESSION_PREFIX}${examId}`);
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
