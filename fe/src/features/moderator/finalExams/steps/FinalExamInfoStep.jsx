import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  buildFinalExamContributionPayload,
  recordExamDraft,
} from "@/features/moderator/exams/moderatorExamContributionStore";
import { useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import { parseTotalQuestions } from "@/features/moderator/finalExams/finalExamData";
import {
  getSubjectOptionsForSemester,
  PRACTICE_SEMESTER_OPTIONS,
} from "@/features/moderator/practiceExams/practiceExamData";
import { loadReviewCourses, REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import WizardBottomActions from "@/features/moderator/finalExams/components/WizardBottomActions";
import {
  generateExamPaperCode,
  loadExistingExamPaperIdentifiers,
} from "@/utils/examPaperCode";
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
  const [existingPaperCodes, setExistingPaperCodes] = useState([]);
  const [reviewCourses, setReviewCourses] = useState(REVIEW_COURSES);

  const previewQuestionCount = parseTotalQuestions(questionCountInput);
  const subjectOptions = useMemo(
    () => getSubjectOptionsForSemester(examInfo.semesterLabel, reviewCourses),
    [examInfo.semesterLabel, reviewCourses],
  );

  useEffect(() => {
    let cancelled = false;
    loadReviewCourses()
      .then((courses) => {
        if (!cancelled) setReviewCourses(courses);
      })
      .catch(() => {
        // Giữ catalog tĩnh khi API/DB không phản hồi — tránh dropdown trống.
        if (!cancelled) setReviewCourses(REVIEW_COURSES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadExistingExamPaperIdentifiers()
      .then((codes) => {
        if (!cancelled) setExistingPaperCodes(codes);
      })
      .catch(() => {
        if (!cancelled) setExistingPaperCodes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditMode) return;
    if (!examInfo.subjectCode.trim()) {
      setExamInfo((prev) => (prev.examCode ? { ...prev, examCode: "" } : prev));
      return;
    }

    const nextCode = generateExamPaperCode("final", examInfo.subjectCode, existingPaperCodes);
    setExamInfo((prev) => (prev.examCode === nextCode ? prev : { ...prev, examCode: nextCode }));
  }, [examInfo.subjectCode, existingPaperCodes, isEditMode, setExamInfo]);

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
      showToast("Mã đề chưa được sinh tự động. Vui lòng chọn lại môn học.");
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

  function handleSemesterChange(event) {
    const semesterLabel = event.target.value;
    setExamInfo((prev) => ({
      ...prev,
      semesterLabel,
      subjectCode: "",
      subjectName: "",
      examCode: "",
    }));
  }

  function handleSubjectChange(event) {
    const code = event.target.value;
    setExamInfo((prev) => ({
      ...prev,
      subjectCode: code,
      subjectName: code ? prev.subjectName || `Môn ${code}` : "",
    }));
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
              Học kỳ <span className={styles.required}>*</span>
            </span>
            <select
              className={styles.input}
              value={examInfo.semesterLabel}
              required
              disabled={isEditMode}
              onChange={handleSemesterChange}
            >
              <option value="">Chọn học kỳ</option>
              {PRACTICE_SEMESTER_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              Mã môn học <span className={styles.required}>*</span>
            </span>
            <select
              className={styles.input}
              value={examInfo.subjectCode}
              required
              disabled={!examInfo.semesterLabel || isEditMode}
              onChange={handleSubjectChange}
            >
              <option value="">
                {examInfo.semesterLabel ? "Chọn môn học" : "Chọn học kỳ trước"}
              </option>
              {subjectOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
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
            <span className={styles.label}>Mã đề thi</span>
            <input
              type="text"
              className={styles.input}
              value={examInfo.examCode}
              readOnly={!isEditMode}
              placeholder="Tự động sinh khi chọn môn học"
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
