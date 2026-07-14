import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import RichTextEditor from "@/common/RichTextEditor/RichTextEditor";
import PostImagesPicker from "@/features/posts/PostImagesPicker/PostImagesPicker";
import {
  OPTION_LABELS,
  QUESTION_TYPES,
} from "@/features/exams/examQuestionTypes";
import styles from "./QuestionEditorCard.module.css";

/**
 * @fileoverview Form soạn một câu hỏi trắc nghiệm trong wizard đề cuối kỳ.
 *
 * Hỗ trợ single-choice, multi-select, thêm/xóa phương án, rich text nội dung,
 * giải thích đáp án và hiển thị cảnh báo import.
 *
 * @module features/moderator/finalExams/components/QuestionEditorCard
 */

/**
 * @typedef {Object} QuestionEditorCardProps
 * @property {number} questionNumber - Số thứ tự câu hiển thị (1-based).
 * @property {object} question - Object câu hỏi wizard (content, answers, correctAnswer, ...).
 * @property {Array<string>} [importWarnings=[]] - Cảnh báo từ bước import Markdown/OCR.
 * @property {(patch: object) => void} onChange - Cập nhật một phần câu hỏi.
 * @property {(key: string, text: string) => void} onAnswerChange - Cập nhật text phương án.
 * @property {(key: string) => void} onCorrectAnswerChange - Chọn đáp án đúng (single).
 * @property {(answers: string[]) => void} onCorrectAnswersChange - Chọn đáp án đúng (multi).
 * @property {() => void} onToggleExplanation - Bật/tắt khối giải thích.
 * @property {(() => void) | undefined} onRemove - Xóa câu hỏi (undefined để ẩn nút xóa).
 */

/**
 * Card editor soạn một câu hỏi trắc nghiệm đầy đủ.
 *
 * @param {QuestionEditorCardProps} props - Props của component.
 * @returns {import('react').ReactElement} Form câu hỏi với rich text và phương án.
 */
function QuestionEditorCard({
  questionNumber,
  question,
  importWarnings = [],
  onChange,
  onAnswerChange,
  onCorrectAnswerChange,
  onCorrectAnswersChange,
  onToggleExplanation,
  onRemove,
}) {
  const optionLabels = question.optionLabels ?? OPTION_LABELS.slice(0, 4);
  const isMulti = question.questionType === QUESTION_TYPES.MULTI;
  const requiredCount = question.requiredSelectCount ?? question.correctAnswers?.length ?? 2;

  function addOption() {
    const nextLabel = OPTION_LABELS.find((label) => !optionLabels.includes(label));
    if (!nextLabel) return;
    onChange({
      optionLabels: [...optionLabels, nextLabel],
      answers: { ...question.answers, [nextLabel]: "" },
    });
  }

  function removeOption(label) {
    if (optionLabels.length <= 2) return;
    const nextLabels = optionLabels.filter((item) => item !== label);
    const nextAnswers = { ...question.answers };
    delete nextAnswers[label];
    const nextCorrectAnswers = (question.correctAnswers ?? []).filter((item) => item !== label);
    onChange({
      optionLabels: nextLabels,
      answers: nextAnswers,
      correctAnswers: nextCorrectAnswers,
      correctAnswer: question.correctAnswer === label ? nextLabels[0] : question.correctAnswer,
    });
  }

  function toggleMultiCorrect(label) {
    const current = new Set(question.correctAnswers ?? []);
    if (current.has(label)) {
      current.delete(label);
    } else if (current.size < requiredCount) {
      current.add(label);
    } else {
      return;
    }
    onCorrectAnswersChange(Array.from(current));
  }

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.heading}>Câu {questionNumber}</h3>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={onRemove}
          aria-label={`Xóa câu ${questionNumber}`}
          disabled={!onRemove}
          style={onRemove ? undefined : { visibility: "hidden" }}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </header>

      {importWarnings.length > 0 && (
        <div className={styles.importWarning} role="status">
          <strong>Cảnh báo import:</strong>
          <ul>
            {importWarnings.map((warning) => (
              <li key={warning}>
                {warning.replace(/^Câu\s+\d+\s*:\s*/iu, "")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className={styles.field}>
        <span className={styles.label}>Loại câu hỏi</span>
        <select
          className={styles.select}
          value={question.questionType ?? QUESTION_TYPES.SINGLE}
          onChange={(event) => {
            const questionType = event.target.value;
            onChange({
              questionType,
              correctAnswers: questionType === QUESTION_TYPES.MULTI ? [] : question.correctAnswers,
              requiredSelectCount:
                questionType === QUESTION_TYPES.MULTI
                  ? question.requiredSelectCount ?? 2
                  : null,
            });
          }}
        >
          <option value={QUESTION_TYPES.SINGLE}>Một đáp án đúng</option>
          <option value={QUESTION_TYPES.MULTI}>Nhiều đáp án đúng</option>
        </select>
      </label>

      {isMulti ? (
        <label className={styles.field}>
          <span className={styles.label}>Số đáp án phải chọn</span>
          <input
            type="number"
            min={2}
            max={optionLabels.length}
            className={styles.numberInput}
            value={requiredCount}
            onChange={(event) =>
              onChange({ requiredSelectCount: Number(event.target.value) || 2 })
            }
          />
        </label>
      ) : null}

      <div className={styles.field}>
        <span id={`question-${questionNumber}-content-label`} className={styles.label}>
          Nội dung câu hỏi <span className={styles.required}>*</span>
        </span>
        <RichTextEditor
          value={question.content}
          onChange={(content) => onChange({ content })}
          placeholder="Nhập nội dung câu hỏi..."
          variant="minimal"
          toolbarPlacement="floating"
          rows={5}
          bordered={false}
          className={styles.textareaWrap}
          textareaClassName={styles.questionEditor}
          toolbarAriaLabel="Công cụ soạn câu hỏi"
          aria-labelledby={`question-${questionNumber}-content-label`}
          allowImages={false}
        />
      </div>

      <div className={styles.field}>
        <PostImagesPicker
          items={question.images ?? []}
          onChange={(images) => onChange({ images })}
        />
      </div>

      <div className={styles.answers}>
        {optionLabels.map((key) => (
          <label
            key={key}
            className={`${styles.answer} ${
              isMulti
                ? question.correctAnswers?.includes(key)
                  ? styles["answer-selected"]
                  : ""
                : question.correctAnswer === key
                  ? styles["answer-selected"]
                  : ""
            }`}
          >
            <input
              type={isMulti ? "checkbox" : "radio"}
              name={`correct-${question.id}`}
              className={styles.radio}
              checked={
                isMulti
                  ? question.correctAnswers?.includes(key)
                  : question.correctAnswer === key
              }
              onChange={() =>
                isMulti ? toggleMultiCorrect(key) : onCorrectAnswerChange(key)
              }
            />
            <span className={styles.answerKey}>{key}</span>
            <input
              type="text"
              className={styles.answerInput}
              placeholder={`Nhập đáp án ${key}`}
              value={question.answers[key] ?? ""}
              onChange={(event) => onAnswerChange(key, event.target.value)}
            />
            {optionLabels.length > 2 ? (
              <button
                type="button"
                className={styles.removeOptionBtn}
                aria-label={`Xóa phương án ${key}`}
                onClick={() => removeOption(key)}
              >
                ×
              </button>
            ) : null}
          </label>
        ))}
      </div>

      {optionLabels.length < OPTION_LABELS.length ? (
        <button type="button" className={styles.addOptionBtn} onClick={addOption}>
          <FontAwesomeIcon icon={faPlus} />
          Thêm phương án
        </button>
      ) : null}

      <button
        type="button"
        className={styles.explainToggle}
        onClick={onToggleExplanation}
      >
        <FontAwesomeIcon icon={faPlus} />
        Thêm giải thích đáp án
        <FontAwesomeIcon
          icon={question.showExplanation ? faChevronUp : faChevronDown}
        />
      </button>

      {question.showExplanation && (
        <div className={styles.field}>
          <span id={`question-${questionNumber}-explanation-label`} className={styles.label}>
            Giải thích đáp án
          </span>
          <RichTextEditor
            value={question.explanation}
            onChange={(explanation) => onChange({ explanation })}
            placeholder="Nhập giải thích cho đáp án đúng..."
            variant="basic"
            rows={4}
            bordered={false}
            textareaClassName={styles.textareaPlain}
            toolbarAriaLabel="Định dạng giải thích"
            aria-labelledby={`question-${questionNumber}-explanation-label`}
            allowImages={false}
          />
        </div>
      )}
    </article>
  );
}

export default QuestionEditorCard;
