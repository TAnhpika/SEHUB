import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFile,
  faFileImage,
  faFilePdf,
  faFileZipper,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { downloadPracticeAttachment } from "@/features/exams/practiceBriefData";
import styles from "./PracticeBriefPanel.module.css";

const KIND_ICONS = {
  pdf: faFilePdf,
  image: faFileImage,
  zip: faFileZipper,
  file: faFile,
};

function PracticeBriefPanel({
  brief,
  canDownload = true,
  compact = false,
  enlarged = false,
  onDownloadBlocked,
}) {
  if (!brief) return null;

  function handleDownload(attachment) {
    if (!canDownload) {
      onDownloadBlocked?.();
      return;
    }
    downloadPracticeAttachment(attachment);
  }

  return (
    <section
      className={`${styles.panel} ${compact ? styles.compact : ""} ${enlarged ? styles.enlarged : ""}`}
      aria-label="Nội dung đề bài thực hành"
    >
      <header className={styles.head}>
        <div>
          <h3 className={styles.title}>Nội dung đề · {brief.label}</h3>
          <p className={styles.summary}>{brief.summary}</p>
        </div>
        {!canDownload ? (
          <span className={styles.viewOnly}>
            <FontAwesomeIcon icon={faLock} />
            Chỉ xem
          </span>
        ) : null}
      </header>

      {brief.format === "pdf" && brief.pages?.length ? (
        <div className={styles.preview}>
          {brief.pages.map((page) => (
            <article key={page.pageNum} className={styles.page}>
              <p className={styles.pageLabel}>
                {page.title} · Trang {page.pageNum}
              </p>
              {page.lines.map((line) => (
                <p key={line} className={styles.pageLine}>
                  {line}
                </p>
              ))}
            </article>
          ))}
        </div>
      ) : null}

      {brief.format === "image" && brief.previewImageUrl ? (
        <figure className={styles.figure}>
          <img
            src={brief.previewImageUrl}
            alt={`Ảnh đề bài thực hành ${brief.label}`}
            className={styles.image}
          />
          <figcaption className={styles.caption}>
            Xem ảnh đề — bấm tải file bên dưới để lưu về máy.
          </figcaption>
        </figure>
      ) : null}

      {brief.format === "file" ? (
        <div className={styles.fileHint}>
          <FontAwesomeIcon icon={faFileZipper} className={styles.fileHintIcon} />
          <p>
            Đề và tài nguyên kèm theo nằm trong file nén. Tải về, giải nén và làm bài theo hướng dẫn
            trong gói.
          </p>
        </div>
      ) : null}

      <ul className={styles.attachments}>
        {brief.attachments.map((file) => {
          const icon = KIND_ICONS[file.kind] ?? faFile;
          return (
            <li key={file.id} className={styles.attachment}>
              <span className={styles.fileIcon} aria-hidden="true">
                <FontAwesomeIcon icon={icon} />
              </span>
              <div className={styles.fileMeta}>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>{file.sizeLabel}</p>
              </div>
              <button
                type="button"
                className={`${styles.downloadBtn} ${!canDownload ? styles.downloadBtnLocked : ""}`}
                onClick={() => handleDownload(file)}
                title={canDownload ? `Tải ${file.name}` : "Premium mới tải được khi làm bài"}
              >
                <FontAwesomeIcon icon={canDownload ? faDownload : faLock} />
                {canDownload ? "Tải đề" : "Tải đề (Premium)"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default PracticeBriefPanel;
