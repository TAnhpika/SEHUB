/**
 * Plain-text comment editor (no rich HTML toolbar).
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   placeholder?: string;
 *   rows?: number;
 *   className?: string;
 *   textareaClassName?: string;
 *   onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
 *   'aria-label'?: string;
 * }} props
 */
function CommentPlainTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
  textareaClassName = "",
  onKeyDown,
  "aria-label": ariaLabel,
}) {
  return (
    <div className={className}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={textareaClassName}
        aria-label={ariaLabel}
      />
    </div>
  );
}

export default CommentPlainTextarea;
