import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  buildFinalExamContributionPayload,
  recordExamDraft,
} from "@/features/moderator/exams/moderatorExamContributionStore";
import { useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import { parseTotalQuestions } from "@/features/moderator/finalExams/finalExamData";
import FinalExamInfoFields from "@/features/exams/finalExam/FinalExamInfoFields";
import WizardBottomActions from "@/features/moderator/finalExams/components/WizardBottomActions";
import styles from "./FinalExamInfoStep.module.css";

function FinalExamInfoStep() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const moderator = user?.username ?? "mod_sehub";
  const { examInfo, setExamInfo, ensureQuestionSlots, basePath, isEditMode } = useFinalExamWizard();
  const [questionCountInput, setQuestionCountInput] = useState(() =>
    String(examInfo.totalQuestions ?? ""),
  );

  const previewQuestionCount = parseTotalQuestions(questionCountInput);

  function validateExamInfo() {
    if (!examInfo.semesterLabel.trim()) {
      showToast("Vui lòng chọn học kỳ.");
      return false;
    }
    if (!examInfo.subjectCode.trim()) {
      showToast("Vui lòng chọn mã môn học.");
      return false;
    }
    if (!examInfo.examCode.trim()) {
      showToast("Vui lòng nhập mã đề thi.");
      return false;
    }
    if (examInfo.durationMinutes < 15 || examInfo.durationMinutes > 180) {
      showToast("Thời gian làm bài phải từ 15 đến 180 phút.");
      return false;
    }
    if (examInfo.totalQuestions < 1 || examInfo.totalQuestions > 100) {
      showToast("Số câu hỏi phải từ 1 đến 100.");
      return false;
    }
    return true;
  }

  function handleSaveDraft() {
    if (!validateExamInfo()) return;
    recordExamDraft(
      buildFinalExamContributionPayload(moderator, examInfo, 0, "Bước 1: Thông tin đề"),
    );
    showToast("Đã lưu nháp thông tin đề thi.");
  }

  function handleContinue() {
    if (!examInfo.semesterLabel.trim()) {
      showToast("Vui lòng chọn học kỳ.");
      return;
    }
    if (!examInfo.subjectCode.trim()) {
      showToast("Vui lòng chọn mã môn học.");
      return;
    }
    const totalQuestions = parseTotalQuestions(questionCountInput);
    if (totalQuestions === null) {
      showToast("Số câu hỏi phải lớn hơn 0.");
      return;
    }
    setExamInfo((prev) => ({ ...prev, totalQuestions }));
    ensureQuestionSlots(totalQuestions);
    navigate(`${basePath}/questions`);
  }

  return (
    <div className={styles.step}>
      <header className={styles.header}>
        <h1 className={styles.title}>Thông tin đề thi</h1>
        <p className={styles.subtitle}>
          Nhập metadata đề trắc nghiệm cuối kỳ. Sinh viên Premium có thể làm bài online (
          {previewQuestionCount ?? "—"} câu theo nghiệp vụ).
        </p>
      </header>

      <section className={styles.card}>
        <FinalExamInfoFields
          value={examInfo}
          onChange={(patch) => setExamInfo((prev) => ({ ...prev, ...patch }))}
          isEditMode={isEditMode}
          questionCountInput={questionCountInput}
          onQuestionCountInputChange={setQuestionCountInput}
        />
      </section>

      <WizardBottomActions
        onSaveDraft={handleSaveDraft}
        onBack={() => navigate("/moderator/practice-exams/add")}
        onContinue={handleContinue}
        showBack={false}
        continueLabel="Tiếp tục"
      />
    </div>
  );
}

export default FinalExamInfoStep;
