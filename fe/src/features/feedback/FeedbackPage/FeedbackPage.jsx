import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFileArrowUp,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import * as feedbackApi from "@/api/feedbackApi";
import { ApiError } from "@/api/httpClient";
import {
  ACCEPTED_FILE_TYPES,
  formatFileSize,
  MAX_FEEDBACK_FILE_SIZE,
  MAX_FEEDBACK_FILES,
} from "./feedbackData";
import styles from "./FeedbackPage.module.css";

function FeedbackPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [username, setUsername] = useState(user?.username ?? "");
  const [errorDescription, setErrorDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleAddFiles(event) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    setFileError("");

    const nextFiles = [...files];
    for (const file of selectedFiles) {
      if (nextFiles.length >= MAX_FEEDBACK_FILES) {
        setFileError(`Chỉ được tải tối đa ${MAX_FEEDBACK_FILES} tệp.`);
        break;
      }

      if (file.size > MAX_FEEDBACK_FILE_SIZE) {
        setFileError(`Tệp "${file.name}" vượt quá 100 MB.`);
        continue;
      }

      const isDuplicate = nextFiles.some(
        (item) => item.name === file.name && item.size === file.size,
      );
      if (!isDuplicate) {
        nextFiles.push(file);
      }
    }

    setFiles(nextFiles);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setFileError("");
  }

  function handleClearForm() {
    setUsername(user?.username ?? "");
    setErrorDescription("");
    setFiles([]);
    setFileError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim()) {
      showToast("Vui lòng nhập username SEHUB của bạn.");
      return;
    }

    if (!errorDescription.trim()) {
      showToast("Vui lòng mô tả lỗi bạn gặp phải.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrls = [];

      if (files.length > 0) {
        const uploadResult = await feedbackApi.uploadFeedbackAttachments(files);
        attachmentUrls = uploadResult?.urls ?? [];
      }

      await feedbackApi.submitFeedback({
        username: username.trim(),
        description: errorDescription.trim(),
        attachmentUrls,
      });

      showToast("Đã gửi báo cáo lỗi. Cảm ơn bạn đã phản hồi!");
      handleClearForm();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không gửi được báo cáo lỗi. Vui lòng thử lại.";
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/home" className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Báo cáo lỗi SEHUB</h1>
        <p className={styles.subtitle}>
          Mẫu form báo cáo lỗi SEHUB. Mỗi 1 báo cáo lỗi có ý nghĩa sẽ nhận được quà từ
          SEHUB
        </p>
        <div className={styles.account}>
          <p>
            Đang đăng nhập với <strong>{user?.email}</strong>
          </p>
          <p className={styles.note}>
            Tên, email và ảnh đại diện của bạn sẽ được ghi lại khi tải tệp lên và gửi
            biểu mẫu.
          </p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.card}>
          <label className={styles.field} htmlFor="feedback-username">
            <span className={styles.label}>
              Username SEHUB của bạn là ? (Điền đúng để nhận quà)
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            </span>
            <input
              id="feedback-username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Câu trả lời của bạn"
              required
            />
          </label>
        </section>

        <section className={styles.card}>
          <label className={styles.field} htmlFor="feedback-error">
            <span className={styles.label}>
              Bạn gặp lỗi gì
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            </span>
            <input
              id="feedback-error"
              type="text"
              className={styles.input}
              value={errorDescription}
              onChange={(event) => setErrorDescription(event.target.value)}
              placeholder="Câu trả lời của bạn"
              required
            />
          </label>
        </section>

        <section className={styles.card}>
          <div className={styles.field}>
            <span className={styles.label}>Ảnh tại thời điểm lỗi</span>
            <p className={styles.hint}>
              Tải tối đa {MAX_FEEDBACK_FILES} tệp được hỗ trợ lên. Mỗi tệp có kích thước
              tối đa 100 MB.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              className={styles["file-input"]}
              accept={ACCEPTED_FILE_TYPES}
              multiple
              onChange={handleAddFiles}
            />

            <button
              type="button"
              className={styles["upload-btn"]}
              onClick={() => fileInputRef.current?.click()}
            >
              <FontAwesomeIcon icon={faFileArrowUp} />
              Thêm tệp
            </button>

            {fileError && <p className={styles["file-error"]}>{fileError}</p>}

            {files.length > 0 && (
              <ul className={styles["file-list"]}>
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${index}`} className={styles["file-item"]}>
                    <div className={styles["file-meta"]}>
                      <span className={styles["file-name"]}>{file.name}</span>
                      <span className={styles["file-size"]}>{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles["file-remove"]}
                      onClick={() => removeFile(index)}
                      aria-label={`Xóa tệp ${file.name}`}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className={styles.actions}>
          <Button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi"}
          </Button>
          <button type="button" className={styles.clear} onClick={handleClearForm} disabled={submitting}>
            Xóa hết câu trả lời
          </button>
        </div>
      </form>
    </div>
  );
}

export default FeedbackPage;
