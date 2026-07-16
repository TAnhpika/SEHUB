import { useId, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faImage,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./PostImagesPicker.module.css";

export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
export const POST_IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";

let nextLocalId = 0;

function createLocalId() {
  nextLocalId += 1;
  return `local-${Date.now()}-${nextLocalId}`;
}

export function createPickerItemFromFile(file) {
  return {
    key: createLocalId(),
    file,
    previewUrl: URL.createObjectURL(file),
    existingId: null,
    sortOrder: 0,
  };
}

export function createPickerItemFromExisting(image) {
  return {
    key: image.id ?? createLocalId(),
    file: null,
    previewUrl: image.url,
    existingId: image.id ?? null,
    sortOrder: image.sortOrder ?? 0,
  };
}

export function revokePickerPreview(item) {
  if (item?.file && item.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(item.previewUrl);
  }
}

export function getNewImageFiles(items) {
  return items.filter((item) => item.file).map((item) => item.file);
}

export function getExistingImageIds(items) {
  return items.filter((item) => item.existingId).map((item) => item.existingId);
}

function PostImagesPicker({ items, onChange, disabled = false, maxFiles = 12 }) {
  const inputId = useId();
  const inputRef = useRef(null);

  function emit(next) {
    onChange(
      next.map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    );
  }

  function handleFilesSelected(event) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || disabled) return;

    const remaining = Math.max(0, maxFiles - items.length);
    if (remaining === 0) return;

    const accepted = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_POST_IMAGE_BYTES) continue;
      accepted.push(createPickerItemFromFile(file));
    }

    if (accepted.length === 0) return;
    emit([...items, ...accepted]);
  }

  function removeAt(index) {
    const target = items[index];
    revokePickerPreview(target);
    emit(items.filter((_, i) => i !== index));
  }

  function move(index, delta) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    emit(next);
  }

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.label}>
          <FontAwesomeIcon icon={faImage} />
          Ảnh bài viết
        </span>
        <p className={styles.hint}>Ảnh đầu dùng xem trước trên feed.</p>
      </div>

      <div className={styles.grid}>
        {items.map((item, index) => (
          <div key={item.key} className={styles.tile}>
            <img src={item.previewUrl} alt="" className={styles.thumb} />
            <div className={styles.tileActions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Đưa sang trái"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Đưa sang phải"
                disabled={disabled || index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Xóa ảnh"
                disabled={disabled}
                onClick={() => removeAt(index)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>
        ))}

        {items.length < maxFiles ? (
          <label
            htmlFor={inputId}
            className={`${styles.add} ${disabled ? styles.addDisabled : ""}`}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Thêm ảnh</span>
          </label>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={POST_IMAGE_ACCEPT}
        multiple
        className={styles.fileInput}
        disabled={disabled}
        onChange={handleFilesSelected}
      />
    </div>
  );
}

export default PostImagesPicker;
