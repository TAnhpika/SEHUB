import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { importExamQuestionsFromMarkdown } from "@/features/admin/exams/adminExamData";
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
  } = useFinalExamWizard();

  const [markdownText, setMarkdownText] = useState("");
  const [importingMarkdown, setImportingMarkdown] = useState(false);
  const [inputMode, setInputMode] = useState("manual");

  useEffect(() => {
    ensureQuestionSlots(totalQuestions);
  }, [ensureQuestionSlots, totalQuestions]);

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

  function handleContinue() {
    if (completeCount < 1) {
      showToast("Cần ít nhất một câu hỏi hoàn chỉnh trước khi tiếp tục.");
      return;
    }
    navigate(`${basePath}/review`);
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
      const mapped = mapImportedExamQuestions(imported, warnings);
      setQuestions(mapped);
      setExamInfo((prev) => ({ ...prev, totalQuestions: mapped.length }));
      setActiveQuestionIndex(0);
      setInputMode("manual");

      const skippedCount = warnings.length;
      if (skippedCount > 0) {
        const preview = warnings.slice(0, 2).join(" · ");
        const suffix = skippedCount > 2 ? ` · +${skippedCount - 2} cảnh báo` : "";
        showToast(
          `Đã import ${mapped.length} câu. ${skippedCount} câu không hợp lệ: ${preview}${suffix}`,
          6000,
        );
      } else {
        showToast(`Đã import ${mapped.length} câu hỏi từ Markdown.`);
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
          aria-selected={inputMode === "markdown"}
          className={`${styles.modeBtn} ${inputMode === "markdown" ? styles.modeBtnActive : ""}`}
          onClick={() => setInputMode("markdown")}
        >
          Import Markdown
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
        <FinalExamMarkdownImportPanel
          markdownText={markdownText}
          onMarkdownChange={setMarkdownText}
          onImport={handleImportMarkdown}
          importing={importingMarkdown}
        />
      )}

      <WizardBottomActions
        onSaveDraft={handleSaveDraft}
        onBack={() => navigate(basePath)}
        onContinue={handleContinue}
      />
    </div>
  );
}

export default FinalExamQuestionsStep;
