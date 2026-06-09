import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faLock } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  getDocumentAccessState,
} from "@/features/documents/documentAccessPolicy";
import {
  downloadStudentDocument,
  isSlideDocument,
} from "@/features/documents/documentDownload";
import { getDocumentOverview } from "@/features/documents/documentPageContent";
import styles from "./StudentDocumentViewer.module.css";

function StudentDocumentViewer({ document: doc }) {
  const { isPremium, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const access = getDocumentAccessState(doc, { isPremium, isAuthenticated });
  const isSlide = isSlideDocument(doc);
  const overview = getDocumentOverview(doc);

  function handleDownload() {
    if (!access.canDownload) return;
    downloadStudentDocument(doc);
    showToast(`Đã tải ${doc.name} về máy.`);
  }

  return (
    <section className={styles.viewer} aria-label="Xem tài liệu">
      <header className={styles.header}>
        <div>
          <h2 className={styles.fileName}>{doc.name}</h2>
          <p className={styles.meta}>
            {isSlide ? "Slide · " : ""}
            {doc.uploadedAt ? `Tải lên ${doc.uploadedAt}` : ""}
          </p>
          {doc.description ? <p className={styles.description}>{doc.description}</p> : null}
        </div>
        <span
          className={`${styles.planBadge} ${
            isPremium ? styles.planPremium : styles.planBasic
          }`}
        >
          {isPremium ? "Premium" : "Basic"}
        </span>
      </header>

      <p className={styles.accessLabel}>{access.label}</p>

      {!access.canView ? (
        <div className={styles.locked}>
          <FontAwesomeIcon icon={faLock} className={styles.lockIcon} />
          <h3>
            {access.reason === "login"
              ? "Cần đăng nhập"
              : "Tài liệu dành cho Premium"}
          </h3>
          <p>
            {access.reason === "login"
              ? "Đăng nhập để xem tài liệu học tập theo môn."
              : "Gói Basic không mở được file này. Nâng cấp Premium để xem & tải đầy đủ."}
          </p>
          {access.reason === "premium_required" ? (
            <Link to="/home/premium" className={styles.upgradeBtn}>
              Xem gói Premium
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <article className={styles.overview}>
            <h4 className={styles.overviewTitle}>{overview.title}</h4>
            <p className={styles.overviewSummary}>{overview.summary}</p>
            <p className={styles.overviewHeading}>
              {isSlide ? "Nội dung slide gồm:" : "Nội dung gồm:"}
            </p>
            <ul className={styles.overviewList}>
              {overview.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
            {!isPremium && access.limited ? (
              <p className={styles.overviewHint}>
                <FontAwesomeIcon icon={faLock} /> Tài khoản Basic xem mô tả —{" "}
                <Link to="/home/premium">Premium</Link> để tải file đầy đủ.
              </p>
            ) : null}
          </article>

          <footer className={styles.footer}>
            <button
              type="button"
              className={`${styles.downloadBtn} ${access.canDownload ? styles.downloadBtnActive : ""}`}
              disabled={!access.canDownload}
              title={
                access.canDownload
                  ? "Tải toàn bộ tài liệu về máy"
                  : "Chỉ Premium mới được tải tài liệu"
              }
              onClick={handleDownload}
            >
              <FontAwesomeIcon icon={access.canDownload ? faDownload : faLock} />
              Tải xuống
            </button>
          </footer>
        </>
      )}
    </section>
  );
}

export default StudentDocumentViewer;
