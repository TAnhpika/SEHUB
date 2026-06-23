import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  applyWysiwygAction,
  getPlainTextLength,
  insertImageAtSelection,
  normalizeEditorHtml,
  valueToEditorHtml,
} from "./richTextEditorWysiwyg";
import { TOOL_DEFINITIONS, TOOLBAR_VARIANTS } from "./toolbarConfig";
import styles from "./RichTextEditor.module.css";

const MAX_INLINE_IMAGE_SIZE = 5 * 1024 * 1024;

function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 8,
  maxLength,
  variant = "full",
  showCounter = false,
  counterLabel = "ký tự",
  bordered = true,
  toolbarPlacement = "top",
  className = "",
  textareaClassName = "",
  toolbarAriaLabel = "Định dạng văn bản",
  required = false,
  disabled = false,
  readOnly = false,
  id,
  name,
  onKeyDown,
  onImageUpload,
  onImageUploadError,
  "aria-label": ariaLabel,
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const skipExternalSyncRef = useRef(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const tools = TOOLBAR_VARIANTS[variant] ?? TOOLBAR_VARIANTS.full;
  const plainTextLength = getPlainTextLength(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || skipExternalSyncRef.current) {
      return;
    }

    const html = valueToEditorHtml(value);
    if (editor.innerHTML !== html) {
      editor.innerHTML = html;
    }
  }, [value]);

  function emitChange(html) {
    skipExternalSyncRef.current = true;
    onChange(html);
    requestAnimationFrame(() => {
      skipExternalSyncRef.current = false;
    });
  }

  function syncFromEditor() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const html = normalizeEditorHtml(editor.innerHTML);
    if (maxLength != null && getPlainTextLength(html) > maxLength) {
      editor.innerHTML = valueToEditorHtml(value);
      return;
    }

    emitChange(html);
  }

  function handleToolClick(action) {
    if (disabled || readOnly || uploadingImage) {
      return;
    }

    if (action === "image" && onImageUpload) {
      fileInputRef.current?.click();
      return;
    }

    applyWysiwygAction(action, editorRef.current, syncFromEditor);
  }

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !onImageUpload) {
      return;
    }

    if (file.size > MAX_INLINE_IMAGE_SIZE) {
      onImageUploadError?.("Ảnh tối đa 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await onImageUpload(file);
      if (!url) {
        throw new Error("Không nhận được URL ảnh.");
      }

      insertImageAtSelection(url, file.name, editorRef.current);
      syncFromEditor();
    } catch (error) {
      onImageUploadError?.(error.message ?? "Không tải được ảnh.");
    } finally {
      setUploadingImage(false);
    }
  }

  const rootClassName = [
    styles.root,
    bordered ? styles.bordered : styles.unbordered,
    toolbarPlacement === "floating" ? styles.floatingRoot : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const editorClassNames = [
    styles.editor,
    toolbarPlacement === "floating" ? styles.editorFloating : "",
    textareaClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const toolbar = (
    <div
      className={
        toolbarPlacement === "floating" ? styles.floatingToolbar : styles.toolbar
      }
      aria-label={toolbarAriaLabel}
    >
      {tools.map((action) => {
        const tool = TOOL_DEFINITIONS[action];
        if (!tool) {
          return null;
        }

        const isImageUploading = action === "image" && uploadingImage;

        return (
          <button
            key={action}
            type="button"
            className={styles.tool}
            aria-label={tool.label}
            title={isImageUploading ? "Đang tải ảnh..." : tool.label}
            disabled={disabled || readOnly || isImageUploading}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleToolClick(action)}
          >
            {tool.glyph ? (
              <span className={styles.glyph}>{tool.glyph}</span>
            ) : (
              <FontAwesomeIcon icon={tool.icon} />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={rootClassName}>
      {toolbarPlacement === "top" ? toolbar : null}

      <div
        ref={editorRef}
        id={id}
        className={editorClassNames}
        style={{ "--editor-rows": rows }}
        contentEditable={!disabled && !readOnly && !uploadingImage}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel ?? placeholder}
        aria-busy={uploadingImage}
        data-placeholder={placeholder}
        onInput={syncFromEditor}
        onBlur={syncFromEditor}
        onKeyDown={onKeyDown}
      />

      {onImageUpload ? (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className={styles.fileInput}
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleImageFileChange}
        />
      ) : null}

      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : null}

      {required ? (
        <input
          type="text"
          className={styles.requiredProxy}
          value={plainTextLength > 0 ? "1" : ""}
          required
          tabIndex={-1}
          aria-hidden="true"
          readOnly
        />
      ) : null}

      {toolbarPlacement === "floating" ? toolbar : null}

      {showCounter && maxLength != null ? (
        <p className={styles.counter}>
          {plainTextLength}/{maxLength} {counterLabel}
        </p>
      ) : null}
    </div>
  );
}

export default RichTextEditor;
