import { useState } from "react";
import examStyles from "@/features/admin/exams/AdminExam.module.css";
import pickerStyles from "@/features/moderator/finalExams/steps/FinalExamQuestionsStep.module.css";
import styles from "./AdminExamQuestionViewer.module.css";

function QuestionBody({ question, index }) {
  return (
    <article className={examStyles.questionItem}>
      <p className={examStyles.questionText}>
        Câu {question.id ?? index + 1}. {question.text}
        {question.isMulti ? (
          <span className={examStyles.multiBadge}>
            Chọn {question.requiredSelectCount} đáp án
          </span>
        ) : null}
      </p>
      {question.imageUrl ? (
        <img src={question.imageUrl} alt="" className={styles.questionImage} />
      ) : null}
      <ol className={examStyles.optionList}>
        {question.options.map((opt, optionIndex) => {
          const isCorrect =
            question.correctIndices?.includes(optionIndex) || optionIndex === question.correct;
          return (
            <li
              key={`${question.id ?? index}-${optionIndex}`}
              className={isCorrect ? examStyles.optionCorrect : undefined}
            >
              {String.fromCharCode(65 + optionIndex)}. {opt}
              {isCorrect ? " ✓" : ""}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/**
 * Xem ngân hàng câu hỏi đề cuối kỳ — từng câu (mặc định) hoặc xem tất cả.
 */
function AdminExamQuestionViewer({ questions = [] }) {
  const [viewMode, setViewMode] = useState("single");
  const [activeIndex, setActiveIndex] = useState(0);

  if (!questions.length) {
    return null;
  }

  const activeQuestion = questions[activeIndex] ?? questions[0];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < questions.length - 1;

  return (
    <section className={styles.viewer}>
      <div className={styles.toolbar}>
        <div className={pickerStyles.modeSwitch} role="tablist" aria-label="Chế độ xem câu hỏi">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "single"}
            className={`${pickerStyles.modeBtn} ${
              viewMode === "single" ? pickerStyles.modeBtnActive : ""
            }`}
            onClick={() => setViewMode("single")}
          >
            Từng câu
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "all"}
            className={`${pickerStyles.modeBtn} ${
              viewMode === "all" ? pickerStyles.modeBtnActive : ""
            }`}
            onClick={() => setViewMode("all")}
          >
            Xem tất cả
          </button>
        </div>
        {viewMode === "single" ? (
          <p className={styles.position}>
            Câu {activeIndex + 1}/{questions.length}
          </p>
        ) : null}
      </div>

      {viewMode === "all" ? (
        <ul className={examStyles.questionList}>
          {questions.map((question, index) => (
            <li key={question.id ?? index}>
              <QuestionBody question={question} index={index} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <QuestionBody question={activeQuestion} index={activeIndex} />

          {questions.length > 1 ? (
            <div className={pickerStyles.picker}>
              <span className={pickerStyles.pickerLabel}>
                Chuyển câu ({questions.length} câu):
              </span>
              <div className={pickerStyles.pickerList}>
                {questions.map((item, index) => (
                  <button
                    key={item.id ?? index}
                    type="button"
                    className={`${pickerStyles.pickerBtn} ${
                      index === activeIndex ? pickerStyles["pickerBtn-active"] : ""
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.nav}>
            <button
              type="button"
              className={styles.navBtn}
              disabled={!canGoPrev}
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            >
              Câu trước
            </button>
            <button
              type="button"
              className={styles.navBtn}
              disabled={!canGoNext}
              onClick={() => setActiveIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            >
              Câu sau
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default AdminExamQuestionViewer;
