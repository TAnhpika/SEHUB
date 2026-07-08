import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  buildMockPageLabels,
  getDocumentAccessState,
} from "@/features/documents/documentAccessPolicy";
import {
  downloadStudentDocument,
  isSlideDocument,
} from "@/features/documents/documentDownload";
import {
  getDocumentOverview,
  loadDocumentOverview,
  loadDocumentPageContent,
} from "@/features/documents/documentPageContent";
import {
  isPdfDocument,
  loadDocumentDetail,
  loadDocumentFullContentBlob,
  resolveDocumentApiId,
} from "@/features/documents/studentDocumentsData";
import styles from "./StudentDocumentViewer.module.css";

function StudentDocumentViewer({ document: doc }) {
  const { pathname, search } = useLocation();
  const { isPremium, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [enrichedDoc, setEnrichedDoc] = useState(doc);
  const [overview, setOverview] = useState(() => getDocumentOverview(doc));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageContent, setPageContent] = useState(null);
  const [pageLoadError, setPageLoadError] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [fullPdfBlobUrl, setFullPdfBlobUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const fullPdfUrlRef = useRef(null);
  const pageCacheRef = useRef(new Map());

  const documentId = resolveDocumentApiId(enrichedDoc) ?? enrichedDoc?.id ?? null;

  function revokeFullPdfUrl() {
    if (fullPdfUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(fullPdfUrlRef.current);
      fullPdfUrlRef.current = null;
    }
  }

  function clearPageCache() {
    for (const entry of pageCacheRef.current.values()) {
      if (entry?.contentUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(entry.contentUrl);
      }
    }
    pageCacheRef.current.clear();
  }

  useEffect(() => {
    setEnrichedDoc(doc);
    setOverview(getDocumentOverview(doc));
    setCurrentPage(1);
    revokeFullPdfUrl();
    clearPageCache();
    setPageContent(null);
    setFullPdfBlobUrl(null);
    setPageLoadError(null);
    setPageLoading(false);
  }, [doc]);

  useEffect(() => {
    let cancelled = false;

    loadDocumentDetail(doc)
      .then((detail) => {
        if (cancelled || !detail) return;
        setEnrichedDoc(detail);
      })
      .catch(() => {
        /* keep prop doc */
      });

    loadDocumentOverview(doc)
      .then((nextOverview) => {
        if (!cancelled && nextOverview) {
          setOverview(nextOverview);
        }
      })
      .catch(() => {
        /* keep local overview */
      });

    return () => {
      cancelled = true;
    };
  }, [doc]);

  const access = getDocumentAccessState(enrichedDoc, { isPremium, isAuthenticated });
  const isSlide = isSlideDocument(enrichedDoc);
  const useFullPdfMode = access.canDownload && isPdfDocument(enrichedDoc);
  const pageLabels = buildMockPageLabels(access.totalPages, access.visiblePages);
  const activePageLabel = pageLabels[currentPage - 1];
  const canShowCurrentPage = Boolean(activePageLabel?.visible);

  const prefetchPage = useCallback(
    (pageNum) => {
      if (useFullPdfMode || !documentId || pageCacheRef.current.has(pageNum)) {
        return;
      }

      const label = pageLabels[pageNum - 1];
      if (!label?.visible) {
        return;
      }

      loadDocumentPageContent(enrichedDoc, pageNum)
        .then((content) => {
          if (content?.contentUrl?.startsWith("blob:")) {
            pageCacheRef.current.set(pageNum, content);
          }
        })
        .catch(() => {
          /* ignore prefetch errors */
        });
    },
    [documentId, enrichedDoc, pageLabels, useFullPdfMode],
  );

  useEffect(() => {
    if (!access.canView || !useFullPdfMode) {
      revokeFullPdfUrl();
      setFullPdfBlobUrl(null);
      return undefined;
    }

    let cancelled = false;
    setPageLoading(true);
    setPageLoadError(null);

    loadDocumentFullContentBlob(enrichedDoc)
      .then((blobUrl) => {
        if (cancelled || !blobUrl) {
          throw new Error("Không tải được tài liệu.");
        }
        revokeFullPdfUrl();
        fullPdfUrlRef.current = blobUrl;
        setFullPdfBlobUrl(blobUrl);
      })
      .catch((error) => {
        if (!cancelled) {
          revokeFullPdfUrl();
          setFullPdfBlobUrl(null);
          setPageLoadError(error?.message ?? "Không tải được tài liệu.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPageLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [access.canView, documentId, enrichedDoc, useFullPdfMode]);

  useEffect(() => {
    if (!access.canView || useFullPdfMode || !canShowCurrentPage) {
      setPageContent(null);
      setPageLoading(false);
      return undefined;
    }

    const cached = pageCacheRef.current.get(currentPage);
    if (cached) {
      setPageContent(cached);
      setPageLoadError(null);
      setPageLoading(false);
      prefetchPage(currentPage + 1);
      prefetchPage(currentPage - 1);
      return undefined;
    }

    let cancelled = false;
    setPageLoading(true);
    setPageLoadError(null);

    loadDocumentPageContent(enrichedDoc, currentPage)
      .then((content) => {
        if (!cancelled) {
          if (content?.contentUrl?.startsWith("blob:")) {
            pageCacheRef.current.set(currentPage, content);
          }
          setPageContent(content);
          prefetchPage(currentPage + 1);
          prefetchPage(currentPage - 1);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPageContent(null);
          setPageLoadError(error?.message ?? "Không tải được trang này.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPageLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    access.canView,
    canShowCurrentPage,
    currentPage,
    documentId,
    enrichedDoc.pages,
    prefetchPage,
    useFullPdfMode,
  ]);

  useEffect(
    () => () => {
      revokeFullPdfUrl();
      clearPageCache();
    },
    [],
  );

  async function handleDownload() {
    if (!access.canDownload || downloading) return;

    setDownloading(true);
    try {
      await downloadStudentDocument(enrichedDoc);
      showToast(`Đã tải ${enrichedDoc.name} về máy.`);
    } catch (error) {
      showToast(error?.message ?? "Không tải được tài liệu.");
    } finally {
      setDownloading(false);
    }
  }

  const pageIndicatorTotal = access.limited ? access.visiblePages : access.totalPages;
  const previewFrameSrc = useFullPdfMode
    ? fullPdfBlobUrl
      ? `${fullPdfBlobUrl}#toolbar=0&navpanes=0`
      : null
    : pageContent?.contentUrl
      ? `${pageContent.contentUrl}#page=1&toolbar=0&navpanes=0`
      : null;

  function goToPage(nextPage) {
    const label = pageLabels[nextPage - 1];
    if (!label?.visible) return;
    setCurrentPage(nextPage);
  }

  return (
    <section className={styles.viewer} aria-label="Xem tài liệu">
      <header className={styles.header}>
        <div>
          <h2 className={styles.fileName}>{enrichedDoc.name}</h2>
          <p className={styles.meta}>
            {isSlide ? "Slide · " : ""}
            {enrichedDoc.uploadedAt ? `Tải lên ${enrichedDoc.uploadedAt}` : ""}
          </p>
          {enrichedDoc.description ? (
            <p className={styles.description}>{enrichedDoc.description}</p>
          ) : null}
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
          {access.reason === "login" ? (
            <Link
              to="/login"
              state={{ from: `${pathname}${search}` }}
              className={styles.upgradeBtn}
            >
              Đăng nhập
            </Link>
          ) : null}
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
                <FontAwesomeIcon icon={faLock} /> Tài khoản Basic xem tối đa{" "}
                {access.visiblePages} trang —{" "}
                <Link to="/home/premium">Premium</Link> để tải file đầy đủ.
              </p>
            ) : null}
          </article>

          {canShowCurrentPage ? (
            <div className={styles.pageView}>
              <h4 className={styles.pageTitle}>
                {useFullPdfMode
                  ? enrichedDoc.name
                  : (pageContent?.title ?? "Đang tải trang...")}
              </h4>
              {pageLoading ? (
                <div className={styles.pageBody}>
                  <p>Đang tải trang...</p>
                </div>
              ) : previewFrameSrc ? (
                <iframe
                  key={useFullPdfMode ? `${documentId}-full` : `${documentId}-page-${currentPage}`}
                  title={useFullPdfMode ? enrichedDoc.name : `${enrichedDoc.name} trang ${currentPage}`}
                  src={previewFrameSrc}
                  className={useFullPdfMode ? styles.previewFrameFull : styles.previewFrame}
                />
              ) : pageLoadError ? (
                <div className={styles.pageBody}>
                  <p>{pageLoadError}</p>
                </div>
              ) : (
                <div className={styles.pageBody}>
                  {(pageContent?.lines ?? []).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}

              {!useFullPdfMode ? (
                <div className={styles.pageNav}>
                  <button
                    type="button"
                    className={styles.navBtn}
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    aria-label="Trang trước"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <span className={styles.pageIndicator}>
                    {isSlide ? "Slide" : "Trang"} {currentPage} / {pageIndicatorTotal}
                  </span>
                  <button
                    type="button"
                    className={styles.navBtn}
                    disabled={
                      currentPage >= pageIndicatorTotal ||
                      !pageLabels[currentPage]?.visible
                    }
                    onClick={() => goToPage(currentPage + 1)}
                    aria-label="Trang sau"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              ) : null}

              {!isPremium && access.limited ? (
                <p className={styles.limitBanner}>
                  Basic chỉ xem được {access.visiblePages} trang đầu.{" "}
                  <Link to="/home/premium">Nâng cấp Premium</Link> để xem & tải toàn bộ.
                </p>
              ) : null}
            </div>
          ) : null}

          <footer className={styles.footer}>
            <button
              type="button"
              className={`${styles.downloadBtn} ${access.canDownload ? styles.downloadBtnActive : ""}`}
              disabled={!access.canDownload || downloading}
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
