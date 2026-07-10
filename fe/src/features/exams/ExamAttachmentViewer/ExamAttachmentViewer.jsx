import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { downloadExamAttachment, fetchExamAttachmentBlobUrl } from "@/api/examsApi";
import { formatFileSize } from "@/features/exams/practiceSession";
import PracticeAttachmentPreview from "@/features/exams/PracticeAttachmentPreview/PracticeAttachmentPreview";
import { isPreviewablePracticeAttachment } from "@/features/moderator/practiceExams/practiceExamUpload";
import styles from "./ExamAttachmentViewer.module.css";

function ExamAttachmentViewer({ examApiId, attachments = [] }) {
  const { showToast } = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const activeAttachment = attachments[activeIndex] ?? null;
  const activeName = activeAttachment?.name ?? activeAttachment?.originalFileName ?? "";
  const canPreview = isPreviewablePracticeAttachment(activeName);

  useEffect(() => {
    setActiveIndex(0);
  }, [examApiId, attachments]);

  useEffect(() => {
    if (!examApiId || !activeAttachment?.id) {
      setBlobUrl(null);
      setError(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let objectUrl = null;

    async function loadAttachment() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);

      try {
        objectUrl = await fetchExamAttachmentBlobUrl(examApiId, activeAttachment.id, {
          contentType: activeAttachment.contentType,
          fileName: activeName,
        });
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setBlobUrl(objectUrl);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message ?? "Không tải được file đề.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAttachment();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [activeAttachment?.id, activeName, examApiId]);

  if (!examApiId || attachments.length === 0) {
    return null;
  }

  async function handleDownload() {
    if (!activeAttachment?.id || downloading) return;

    setDownloading(true);
    try {
      await downloadExamAttachment(examApiId, activeAttachment.id, activeName, {
        contentType: activeAttachment.contentType,
        fileName: activeName,
      });
    } catch {
      showToast("Không tải được file đề. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className={styles.viewer} aria-label="File đề gốc">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>File đề gốc</h2>
          <p className={styles.fileName}>{activeName || "Đề đính kèm"}</p>
          {(activeAttachment?.fileSize ?? activeAttachment?.size) ? (
            <p className={styles.meta}>
              {formatFileSize(activeAttachment.fileSize ?? activeAttachment.size)}
            </p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading || loading || Boolean(error)}
          >
            <FontAwesomeIcon icon={faDownload} />
            {downloading ? "Đang tải..." : "Tải xuống"}
          </button>
        </div>
      </div>

      {attachments.length > 1 ? (
        <div className={styles.attachmentTabs} role="tablist" aria-label="Chọn file đính kèm">
          {attachments.map((attachment, index) => (
            <button
              key={attachment.id ?? `${attachment.name}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={`${styles.tab} ${index === activeIndex ? styles.tabActive : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              {attachment.name ?? attachment.originalFileName}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? <p className={styles.loading}>Đang tải file đề từ Drive...</p> : null}

      {!loading && error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error && blobUrl && canPreview ? (
        <PracticeAttachmentPreview blobUrl={blobUrl} fileName={activeName} />
      ) : null}

      {!loading && !error && blobUrl && !canPreview ? (
        <div className={styles.fileCard}>
          <FontAwesomeIcon icon={faFileLines} size="2x" color="#004ac6" />
          <p>
            File <strong>{activeName}</strong> không hỗ trợ xem trực tiếp trên trình duyệt.
            Bấm <strong>Tải xuống</strong> để mở file trên máy.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default ExamAttachmentViewer;
