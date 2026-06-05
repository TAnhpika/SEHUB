import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faLock } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import {
  buildMockPageLabels,
  getDocumentAccessState,
} from "@/features/documents/documentAccessPolicy";
import styles from "./StudentDocumentViewer.module.css";

function StudentDocumentViewer({ document: doc }) {
  const { isPremium, isAuthenticated } = useAuth();
  const access = getDocumentAccessState(doc, { isPremium, isAuthenticated });

  const pages = buildMockPageLabels(
    access.totalPages,
    access.canView ? access.visiblePages : 0,
  );

  return (
    <section className={styles.viewer} aria-label="Xem tài liệu">
      <header className={styles.header}>
        <div>
          <h2 className={styles.fileName}>{doc.name}</h2>
          <p className={styles.meta}>
            {doc.pages} trang · Quyền Admin: <strong>{doc.access}</strong>
          </p>
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
          <h3>Tài liệu Premium</h3>
          <p>Gói Basic không mở được file này. Nâng cấp Premium để xem & tải đầy đủ.</p>
          <Link to="/home/premium" className={styles.upgradeBtn}>
            Xem gói Premium
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.pages}>
            {pages.map((page) => (
              <article
                key={page.pageNum}
                className={`${styles.page} ${
                  page.visible ? styles.pageVisible : styles.pageLocked
                }`}
              >
                <span className={styles.pageLabel}>Trang {page.pageNum}</span>
                {page.visible ? (
                  <p className={styles.pageBody}>
                    [Mock] Nội dung trang {page.pageNum} của <em>{doc.name}</em>…
                  </p>
                ) : (
                  <p className={styles.pageBlocked}>
                    <FontAwesomeIcon icon={faLock} /> Trang bị khóa — nâng cấp Premium để xem tiếp
                  </p>
                )}
              </article>
            ))}
          </div>

          <footer className={styles.footer}>
            {access.limited ? (
              <p className={styles.limitNote}>
                Bạn đang xem {access.visiblePages}/{access.totalPages} trang (giới hạn Basic).
              </p>
            ) : null}
            <button
              type="button"
              className={styles.downloadBtn}
              disabled={!access.canDownload}
              title={
                access.canDownload
                  ? "Tải file đầy đủ"
                  : "Chỉ Premium mới được tải tài liệu"
              }
            >
              <FontAwesomeIcon icon={faDownload} />
              {access.canDownload ? "Tải tài liệu" : "Tải xuống (Premium)"}
            </button>
          </footer>
        </>
      )}
    </section>
  );
}

export default StudentDocumentViewer;
