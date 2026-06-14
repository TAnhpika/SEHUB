import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faImage,
  faPlus,
  faSquareRootVariable,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { ANSWER_KEYS } from "@/features/moderator/finalExams/finalExamData";
import styles from "./QuestionEditorCard.module.css";

function QuestionEditorCard({
  questionNumber,
  question,
  onChange,
  onAnswerChange,
  onCorrectAnswerChange,
  onToggleExplanation,
  onRemove,
}) {
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
        {ANSWER_KEYS.map((key) => (
          <label
            key={key}
            className={`${styles.answer} ${
              question.correctAnswer === key ? styles["answer-selected"] : ""
            }`}
          >
            <input
              type="radio"
              name={`correct-${question.id}`}
              className={styles.radio}
              checked={question.correctAnswer === key}
              onChange={() => onCorrectAnswerChange(key)}
            />
            <span className={styles.answerKey}>{key}</span>
            <input
              type="text"
              className={styles.answerInput}
              placeholder={`Nhập đáp án ${key}`}
              value={question.answers[key]}
              onChange={(event) => onAnswerChange(key, event.target.value)}
            />
          </label>
        ))}
      </div>

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
