import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import WizardBottomActions from "@/features/moderator/finalExams/components/WizardBottomActions";
import styles from "./FinalExamReviewStep.module.css";

function FinalExamReviewStep() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { examInfo, questions, enteredCount, completeCount, totalQuestions } =
    useFinalExamWizard();

  function handleSaveDraft() {
    showToast("Đã lưu nháp. Đề chờ Admin duyệt trước khi xuất bản.");
  }

  function handlePublish() {
    showToast(
      "Đề thi cuối kỳ đã được gửi. Trạng thái: chờ Admin duyệt trước khi public (theo nghiệp vụ).",
    );
    navigate("/moderator/final-exams/add");
  }

  return (
    <div className={styles.step}>
      <header className={styles.header}>
        <h1 className={styles.title}>Xem lại & xuất bản</h1>
        <p className={styles.subtitle}>
          Kiểm tra thông tin trước khi gửi duyệt. Moderator không thể tự public — Admin sẽ duyệt
          theo quy trình SEHUB.
        </p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Thông tin đề thi</h2>
        <dl className={styles.meta}>
          <div>
            <dt>Môn học</dt>
            <dd>
              {examInfo.subjectName} ({examInfo.subjectCode})
            </dd>
          </div>
          <div>
            <dt>Học kỳ</dt>
            <dd>{examInfo.semesterLabel}</dd>
          </div>
          <div>
            <dt>Mã đề</dt>
            <dd>{examInfo.examCode}</dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd>{examInfo.durationMinutes} phút</dd>
          </div>
          <div>
            <dt>Số câu</dt>
            <dd>
              {completeCount}/{totalQuestions} câu hoàn thiện · {enteredCount} câu đã thêm vào đề
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Xem trước câu hỏi</h2>
        <ol className={styles.previewList}>
          {questions.slice(0, 5).map((question, index) => (
            <li key={question.id}>
              <strong>Câu {index + 1}:</strong>{" "}
              {question.content.trim() || "(Chưa nhập nội dung)"}
              <span className={styles.correct}> — Đáp án: {question.correctAnswer}</span>
            </li>
          ))}
        </ol>
        {questions.length > 5 && (
          <p className={styles.more}>... và {questions.length - 5} câu khác</p>
        )}
      </section>

      <WizardBottomActions
        onSaveDraft={handleSaveDraft}
        onBack={() => navigate("/moderator/final-exams/add/questions")}
        onContinue={handlePublish}
        continueLabel="Gửi duyệt"
      />
    </div>
  );
}

export default FinalExamReviewStep;
