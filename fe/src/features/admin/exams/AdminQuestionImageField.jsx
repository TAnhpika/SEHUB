import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faTrash } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import styles from "./AdminQuestionImageField.module.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function AdminQuestionImageField({
  questionIndex,
  imageUrl,
  uploading = false,
  disabled = false,
  onUpload,
  onRemove,
  onError,
}) {
  const fileInputRef = useRef(null);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      onError?.("Ảnh tối đa 5MB.");
      return;
    }

    try {
      await onUpload?.(questionIndex, file);
    } catch (error) {
      onError?.(error.message ?? "Không tải được ảnh.");
    }
  }

  return (
    <div className={styles.root}>
      {imageUrl ? (
        <div className={styles.preview}>
          <img src={imageUrl} alt={`Minh họa câu ${questionIndex + 1}`} />
          <div className={styles.previewActions}>
            <Button
              type="button"
              look="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Đang tải..." : "Đổi ảnh"}
            </Button>
            <button
              type="button"
              className={styles.removeButton}
              disabled={disabled || uploading}
              onClick={() => onRemove?.(questionIndex)}
            >
              <FontAwesomeIcon icon={faTrash} />
              Gỡ ảnh
            </button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          look="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <FontAwesomeIcon icon={faImage} />
          {uploading ? "Đang tải ảnh..." : "Thêm hình ảnh"}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className={styles.fileInput}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default AdminQuestionImageField;
