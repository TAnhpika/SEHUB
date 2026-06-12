import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  buildFinalExamContributionPayload,
  recordExamDraft,
} from "@/features/moderator/exams/moderatorExamContributionStore";
import { useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import QuestionEditorCard from "@/features/moderator/finalExams/components/QuestionEditorCard";
import WizardBottomActions from "@/features/moderator/finalExams/components/WizardBottomActions";
import styles from "./FinalExamQuestionsStep.module.css";

function FinalExamQuestionsStep() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const moderator = user?.username ?? "mod_sehub";
  const {
    examInfo,
    questions,
    activeQuestionIndex,
    enteredCount,
    completeCount,
    totalQuestions,
    progressPercent,
    updateActiveQuestion,
    updateActiveAnswer,
    addQuestion,
    removeActiveQuestion,
    setActiveQuestionIndex,
  } = useFinalExamWizard();

  const activeQuestion = questions[activeQuestionIndex];
  const questionNumber = activeQuestionIndex + 1;
  const examSubtitle = `Cấu trúc đề thi ${examInfo.subjectName} (${examInfo.subjectCode}) - ${examInfo.semesterLabel}`;

  function handleSaveDraft() {
    recordExamDraft(
      buildFinalExamContributionPayload(
        moderator,
        examInfo,
        completeCount,
        "Bước 2: Soạn câu hỏi",
      ),
    );
    showToast("Đã lưu nháp danh sách câu hỏi.");
  }

  function handleAddQuestion() {
    const added = addQuestion();
    if (!added) {
      showToast(`Đề thi đã đạt tối đa ${totalQuestions} câu.`);
      return;
    }
    showToast(`Đã thêm câu ${questions.length + 1}.`);
  }

  function handleContinue() {
    if (completeCount < 1) {
      showToast("Cần ít nhất một câu hỏi hoàn chỉnh trước khi tiếp tục.");
      return;
    }
    navigate("/moderator/final-exams/add/review");
  }

  if (!activeQuestion) {
    return null;
  }

  return (
    <div className={styles.step}>
      <section className={styles.summary}>
        <div className={styles.summaryHead}>
          <div>
            <h1 className={styles.title}>Nhập câu hỏi trắc nghiệm</h1>
            <p className={styles.subtitle}>{examSubtitle}</p>
          </div>
          <p className={styles.count}>
            Hoàn thiện: {completeCount}/{totalQuestions} câu · {enteredCount} câu trong đề
          </p>
        </div>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      <QuestionEditorCard
        questionNumber={questionNumber}
        question={activeQuestion}
        onChange={updateActiveQuestion}
        onAnswerChange={updateActiveAnswer}
        onCorrectAnswerChange={(key) => updateActiveQuestion({ correctAnswer: key })}
        onToggleExplanation={() =>
          updateActiveQuestion({ showExplanation: !activeQuestion.showExplanation })
        }
        onRemove={removeActiveQuestion}
      />

      <button
        type="button"
        className={styles.addQuestion}
        onClick={handleAddQuestion}
        disabled={questions.length >= totalQuestions}
      >
        <FontAwesomeIcon icon={faPlus} />
        Thêm câu hỏi
      </button>

      {questions.length > 1 && (
        <div className={styles.picker}>
          <span className={styles.pickerLabel}>Chuyển câu:</span>
          <div className={styles.pickerList}>
            {questions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.pickerBtn} ${
                  index === activeQuestionIndex ? styles["pickerBtn-active"] : ""
                }`}
                onClick={() => setActiveQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <WizardBottomActions
        onSaveDraft={handleSaveDraft}
        onBack={() => navigate("/moderator/final-exams/add")}
        onContinue={handleContinue}
      />
    </div>
  );
}

export default FinalExamQuestionsStep;
