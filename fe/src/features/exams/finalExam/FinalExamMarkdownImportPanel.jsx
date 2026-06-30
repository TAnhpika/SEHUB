import Button from "@/common/Button/Button";
import { MARKDOWN_IMPORT_PLACEHOLDER } from "@/features/moderator/finalExams/finalExamData";
import styles from "./FinalExamMarkdownImportPanel.module.css";

function FinalExamMarkdownImportPanel({
  markdownText,
  onMarkdownChange,
  onImport,
  importing = false,
  importLabel = "Import Markdown vào đề",
  showModeSwitch = false,
  inputMode,
  onInputModeChange,
}) {
  return (
    <section className={styles.panel}>
      {showModeSwitch ? (
        <div className={styles.modeSwitch} role="tablist" aria-label="Cách nhập câu hỏi">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "upload"}
            className={`${styles.modeBtn} ${inputMode === "upload" ? styles.modeBtnActive : ""}`}
            onClick={() => onInputModeChange?.("upload")}
          >
            Upload &amp; OCR
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "markdown"}
            className={`${styles.modeBtn} ${inputMode === "markdown" ? styles.modeBtnActive : ""}`}
            onClick={() => onInputModeChange?.("markdown")}
          >
            Import Markdown
          </button>
        </div>
      ) : null}

      <h2 className={styles.title}>Import câu hỏi bằng Markdown</h2>
      <p className={styles.desc}>
        Mỗi câu: tiêu đề <code>## Câu N</code> hoặc <code>Câu N</code>, nội dung, phương án <code>A.</code>–
        <code>H.</code>, dòng <code>**Đáp án: X**</code> hoặc <code>Đáp án: X</code>. Đúng/sai dùng A. Đúng / B. Sai.
        Nội dung có thể nhắc &quot;A. B. C. D.&quot; trong đề — phương án vẫn ghi riêng từng dòng.
        Multi-select: <code>[MULTI:3]</code> và <code>**Đáp án: A, C, E**</code>.
      </p>
      <textarea
        className={styles.textarea}
        rows={14}
        value={markdownText}
        onChange={(event) => onMarkdownChange(event.target.value)}
        placeholder={MARKDOWN_IMPORT_PLACEHOLDER}
      />
      <p className={styles.hint}>
        Phân tách các câu bằng <strong>## Câu N</strong> hoặc dòng <strong>---</strong>.
        Câu thiếu phương án / thiếu dòng đáp án sẽ bị bỏ qua — xem toast cảnh báo sau khi import.
      </p>
      <div className={styles.actions}>
        <Button type="button" onClick={onImport} disabled={importing}>
          {importing ? "Đang import..." : importLabel}
        </Button>
      </div>
    </section>
  );
}

export default FinalExamMarkdownImportPanel;
