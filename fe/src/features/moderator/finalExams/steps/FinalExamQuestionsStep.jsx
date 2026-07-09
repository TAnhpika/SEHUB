import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  buildMockOcrImportQuestions,
  FINAL_EXAM_DEFAULTS,
  importExamQuestionsFromMarkdown,
} from "@/features/admin/exams/adminExamData";
import {
  buildFinalExamContributionPayload,
  recordExamDraft,
} from "@/features/moderator/exams/moderatorExamContributionStore";
import {
  isQuestionComplete,
  mapImportedExamQuestions,
} from "@/features/moderator/finalExams/finalExamData";
import { useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import FinalExamMarkdownImportPanel from "@/features/exams/finalExam/FinalExamMarkdownImportPanel";
import QuestionEditorCard from "@/features/moderator/finalExams/components/QuestionEditorCard";
import WizardBottomActions from "@/features/moderator/finalExams/components/WizardBottomActions";
import styles from "./FinalExamQuestionsStep.module.css";

/**
 * @fileoverview Bước 2 wizard đề cuối kỳ — nhập / import câu hỏi trắc nghiệm.
 *
 * Hỗ trợ:
 * - Soạn thủ công từng câu qua `QuestionEditorCard`.
 * - Import Markdown hoặc OCR (mock) từ file.
 * - Theo dõi tiến độ hoàn thiện và lưu nháp đóng góp.
 *
 * @module features/moderator/finalExams/steps/FinalExamQuestionsStep
 */

/**
 * Bước 2 wizard: soạn hoặc import danh sách câu hỏi.
 *
 * @returns {import('react').ReactElement | null} Giao diện nhập câu hỏi hoặc `null` khi chưa có câu active.
 */
function FinalExamQuestionsStep() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const moderator = user?.username ?? "mod_sehub";
  const {
    examInfo,
    questions,
    activeQuestionIndex,
    completeCount,
    totalQuestions,
    progressPercent,
    ensureQuestionSlots,
    updateActiveQuestion,
    updateActiveAnswer,
    setActiveQuestionIndex,
    setQuestions,
    setExamInfo,
    basePath,
    flowScope,
  } = useFinalExamWizard();

  const [markdownText, setMarkdownText] = useState("");
  const [importingMarkdown, setImportingMarkdown] = useState(false);
  const [inputMode, setInputMode] = useState("manual");
  const [importSubMode, setImportSubMode] = useState("upload");
  const [fileName, setFileName] = useState("");
  const [ocrRunning, setOcrRunning] = useState(false);

  useEffect(() => {
    ensureQuestionSlots(totalQuestions);
  }, [ensureQuestionSlots, totalQuestions]);

  const activeQuestion = questions[activeQuestionIndex];
  const questionNumber = activeQuestionIndex + 1;
  const examSubtitle = `Cấu trúc đề thi ${examInfo.subjectName} (${examInfo.subjectCode}) - ${examInfo.semesterLabel}`;

  const isAdminFlow = flowScope === "admin";

  function handleSaveDraft() {
    if (isAdminFlow) return;
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

  function handleContinue() {
    if (completeCount < 1) {
      showToast("Cần ít nhất một câu hỏi hoàn chỉnh trước khi tiếp tục.");
      return;
    }
    navigate(`${basePath}/review`);
  }

  function applyImportedQuestions(imported, warnings = []) {
    const mapped = mapImportedExamQuestions(imported, warnings);
    setQuestions(mapped);
    setExamInfo((prev) => ({ ...prev, totalQuestions: mapped.length }));
    setActiveQuestionIndex(0);
    setInputMode("manual");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    event.target.value = "";
  }

  async function handleRunOcr() {
    if (!fileName) {
      showToast("Chọn file PDF/ảnh trước khi OCR.");
      return;
    }

    setOcrRunning(true);
    try {
      const imported = buildMockOcrImportQuestions();
      applyImportedQuestions(imported);
      showToast("OCR hoàn tất — rà soát đáp án trước khi tiếp tục.");
    } catch (err) {
      showToast(err.message ?? "OCR thất bại.");
    } finally {
      setOcrRunning(false);
    }
  }

  async function handleImportMarkdown() {
    if (!markdownText.trim()) {
      showToast("Dán nội dung Markdown câu hỏi trước khi import.");
      return;
    }

    setImportingMarkdown(true);
    try {
      const result = await importExamQuestionsFromMarkdown(markdownText);
      const imported = result?.questions ?? [];
      if (!imported.length) {
        showToast("Không parse được câu hỏi từ Markdown.");
        return;
      }

      const warnings = result?.warnings ?? [];
      applyImportedQuestions(imported, warnings);

      const skippedCount = warnings.length;
      if (skippedCount > 0) {
        const preview = warnings.slice(0, 2).join(" · ");
        const suffix = skippedCount > 2 ? ` · +${skippedCount - 2} cảnh báo` : "";
        showToast(
          `Đã import ${imported.length} câu. ${skippedCount} câu không hợp lệ: ${preview}${suffix}`,
          6000,
        );
      } else {
        showToast(`Đã import ${imported.length} câu hỏi từ Markdown.`);
      }
    } catch (err) {
      showToast(err.message ?? "Import Markdown thất bại.");
    } finally {
      setImportingMarkdown(false);
    }
  }

  if (!activeQuestion && inputMode === "manual") {
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
            Hoàn thiện: {completeCount}/{totalQuestions} câu
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

      <div className={styles.modeSwitch} role="tablist" aria-label="Cách nhập câu hỏi">
        <button
          type="button"
          role="tab"
          aria-selected={inputMode === "manual"}
          className={`${styles.modeBtn} ${inputMode === "manual" ? styles.modeBtnActive : ""}`}
          onClick={() => setInputMode("manual")}
        >
          Nhập thủ công
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inputMode === "import"}
          className={`${styles.modeBtn} ${inputMode === "import" ? styles.modeBtnActive : ""}`}
          onClick={() => setInputMode("import")}
        >
          Upload &amp; OCR / Markdown
        </button>
      </div>

      {inputMode === "manual" ? (
        <>
          <QuestionEditorCard
            questionNumber={questionNumber}
            question={activeQuestion}
            importWarnings={activeQuestion.importWarnings}
            onChange={updateActiveQuestion}
            onAnswerChange={updateActiveAnswer}
            onCorrectAnswerChange={(key) => updateActiveQuestion({ correctAnswer: key })}
            onCorrectAnswersChange={(correctAnswers) => updateActiveQuestion({ correctAnswers })}
            onToggleExplanation={() =>
              updateActiveQuestion({ showExplanation: !activeQuestion.showExplanation })
            }
          />

          {questions.length > 1 && (
            <div className={styles.picker}>
              <span className={styles.pickerLabel}>Chuyển câu ({questions.length} câu):</span>
              <div className={styles.pickerList}>
                {questions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.pickerBtn} ${
                      index === activeQuestionIndex ? styles["pickerBtn-active"] : ""
                    } ${isQuestionComplete(item) ? styles["pickerBtn-complete"] : ""} ${
                      item.importWarnings?.length ? styles["pickerBtn-warning"] : ""
                    }`}
                    onClick={() => setActiveQuestionIndex(index)}
                    title={
                      item.importWarnings?.length
                        ? item.importWarnings.join(" · ")
                        : undefined
                    }
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.markdownPanel}>
          <FinalExamMarkdownImportPanel
            showModeSwitch
            inputMode={importSubMode}
            onInputModeChange={setImportSubMode}
            markdownText={markdownText}
            onMarkdownChange={setMarkdownText}
            onImport={handleImportMarkdown}
            importing={importingMarkdown}
            fileName={fileName}
            onFileChange={handleFileChange}
            onRunOcr={handleRunOcr}
            ocrRunning={ocrRunning}
            maxQuestions={examInfo.totalQuestions ?? FINAL_EXAM_DEFAULTS.maxQuestions}
          />
        </div>
      )}

      <WizardBottomActions
        onSaveDraft={handleSaveDraft}
        onBack={() => navigate(basePath)}
        onContinue={handleContinue}
        showSaveDraft={!isAdminFlow}
      />
    </div>
  );
}

export default FinalExamQuestionsStep;
