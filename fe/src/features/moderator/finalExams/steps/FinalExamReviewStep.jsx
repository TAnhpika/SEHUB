import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  ApiError,
  buildFinalExamContributionPayload,
  recordExamDraft,
  submitExamForApproval,
} from "@/features/moderator/exams/moderatorExamContributionStore";
import { useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import WizardBottomActions from "@/features/moderator/finalExams/components/WizardBottomActions";
import styles from "./FinalExamReviewStep.module.css";

function FinalExamReviewStep() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const moderator = user?.username ?? "mod_sehub";
  const [submitting, setSubmitting] = useState(false);
  const { examInfo, questions, enteredCount, completeCount, totalQuestions } =
    useFinalExamWizard();

  function handleSaveDraft() {
    recordExamDraft(
      buildFinalExamContributionPayload(moderator, examInfo, completeCount, "Bước 3: Xem lại"),
    );
    showToast("Đã lưu nháp. Đề chờ Admin duyệt trước khi xuất bản.");
  }

  async function handlePublish() {
    if (completeCount < 1) {
      showToast("Cần ít nhất một câu hỏi hoàn chỉnh trước khi gửi duyệt.");
      return;
    }

    const payload = buildFinalExamContributionPayload(
      moderator,
      examInfo,
      completeCount,
      "Bước 3: Xem lại",
    );

    async function send(confirmDuplicate = false) {
      await submitExamForApproval(payload, { examInfo, questions, confirmDuplicate });
      showToast(
        "Đề thi cuối kỳ đã được gửi. Trạng thái: chờ Admin duyệt trước khi public (theo nghiệp vụ).",
      );
      navigate("/moderator/exams/history?type=final");
    }

    setSubmitting(true);
    try {
      await send(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const confirmed = window.confirm(
          "Đề trùng nội dung (SHA-256) với đề đã có. Gửi duyệt anyway?",
        );
        if (confirmed) {
          try {
            await send(true);
            return;
          } catch (retryError) {
            showToast(retryError?.message ?? "Không gửi được đề.");
            return;
          }
        }
        return;
      }
      showToast(error?.message ?? "Không gửi được đề.");
    } finally {
      setSubmitting(false);
    }
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
        continueLabel={submitting ? "Đang gửi..." : "Gửi duyệt"}
        continueDisabled={submitting}
      />
    </div>
  );
}

export default FinalExamReviewStep;
