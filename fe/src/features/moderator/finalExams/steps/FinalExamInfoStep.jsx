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
import {
  PRACTICE_SEMESTER_OPTIONS,
  PRACTICE_SUBJECT_OPTIONS,
} from "@/features/moderator/practiceExams/practiceExamData";
import WizardBottomActions from "@/features/moderator/finalExams/components/WizardBottomActions";
import styles from "./FinalExamInfoStep.module.css";

function FinalExamInfoStep() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const moderator = user?.username ?? "mod_sehub";
  const { examInfo, setExamInfo, ensureQuestionSlots } = useFinalExamWizard();
  const [questionCountInput, setQuestionCountInput] = useState(() =>
    String(examInfo.totalQuestions ?? ""),
  );

  const previewQuestionCount = parseTotalQuestions(questionCountInput);

  function handleSaveDraft() {
    if (!examInfo.subjectCode.trim()) {
      showToast("Chọn mã môn học trước khi lưu nháp.");
      return;
    }
    recordExamDraft(
      buildFinalExamContributionPayload(moderator, examInfo, 0, "Bước 1: Thông tin đề"),
    );
    showToast("Đã lưu nháp thông tin đề thi.");
  }

  function handleContinue() {
    if (!examInfo.subjectCode.trim()) {
      showToast("Vui lòng chọn mã môn học.");
      return;
    }
    if (!examInfo.semesterLabel.trim()) {
      showToast("Vui lòng chọn học kỳ.");
      return;
    }
    const totalQuestions = parseTotalQuestions(questionCountInput);
    if (totalQuestions === null) {
      showToast("Số câu hỏi phải lớn hơn 0.");
      return;
    }
    setExamInfo((prev) => ({ ...prev, totalQuestions }));
    ensureQuestionSlots(totalQuestions);
    navigate("/moderator/final-exams/add/questions");
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
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>
              Mã môn học <span className={styles.required}>*</span>
            </span>
            <select
              className={styles.input}
              value={examInfo.subjectCode}
              onChange={(event) => {
                const code = event.target.value;
                setExamInfo((prev) => ({
                  ...prev,
                  subjectCode: code,
                  subjectName: code ? `Môn ${code}` : "",
                  examCode: code ? `FE-${code}-SP2024` : "",
                }));
              }}
            >
              <option value="">Chọn môn học</option>
              {PRACTICE_SUBJECT_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Học kỳ <span className={styles.required}>*</span>
            </span>
            <select
              className={styles.input}
              value={examInfo.semesterLabel}
              onChange={(event) =>
                setExamInfo((prev) => ({ ...prev, semesterLabel: event.target.value }))
              }
            >
              <option value="">Chọn học kỳ</option>
              {PRACTICE_SEMESTER_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Tên môn học</span>
          <input
            type="text"
            className={styles.input}
            value={examInfo.subjectName}
            onChange={(event) =>
              setExamInfo((prev) => ({ ...prev, subjectName: event.target.value }))
            }
            placeholder="VD: Mạng máy tính"
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Mã đề</span>
            <input
              type="text"
              className={styles.input}
              value={examInfo.examCode}
              onChange={(event) =>
                setExamInfo((prev) => ({ ...prev, examCode: event.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Thời gian làm bài (phút)</span>
            <input
              type="number"
              min={15}
              max={180}
              className={styles.input}
              value={examInfo.durationMinutes}
              onChange={(event) =>
                setExamInfo((prev) => ({
                  ...prev,
                  durationMinutes: Number(event.target.value) || 60,
                }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Số câu hỏi</span>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              value={questionCountInput}
              onChange={(event) => setQuestionCountInput(event.target.value)}
              placeholder="VD: 50"
            />
          </label>
        </div>
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
