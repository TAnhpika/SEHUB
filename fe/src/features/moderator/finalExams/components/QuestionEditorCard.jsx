import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faImage,
  faPlus,
  faSquareRootVariable,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  OPTION_LABELS,
  QUESTION_TYPES,
} from "@/features/exams/examQuestionTypes";
import styles from "./QuestionEditorCard.module.css";

function QuestionEditorCard({
  questionNumber,
  question,
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

      <label className={styles.field}>
        <span className={styles.label}>
          Nội dung câu hỏi <span className={styles.required}>*</span>
        </span>
        <div className={styles.textareaWrap}>
          <textarea
            className={styles.textarea}
            placeholder="Nhập nội dung câu hỏi..."
            value={question.content}
            onChange={(event) => onChange({ content: event.target.value })}
            rows={5}
          />
          <div className={styles.textareaTools}>
            <button type="button" className={styles.toolBtn} aria-label="Chèn công thức">
              <FontAwesomeIcon icon={faSquareRootVariable} />
            </button>
            <button type="button" className={styles.toolBtn} aria-label="Chèn hình ảnh">
              <FontAwesomeIcon icon={faImage} />
            </button>
          </div>
        </div>
      </label>

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
        <label className={styles.field}>
          <span className={styles.label}>Giải thích đáp án</span>
          <textarea
            className={styles.textareaPlain}
            placeholder="Nhập giải thích cho đáp án đúng..."
            value={question.explanation}
            onChange={(event) => onChange({ explanation: event.target.value })}
            rows={4}
          />
        </label>
      )}
    </article>
  );
}

export default QuestionEditorCard;
