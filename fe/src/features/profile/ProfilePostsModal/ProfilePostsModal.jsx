import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "@/common/Modal/Modal";
import ProfilePostListItem from "@/features/profile/ProfilePostListItem/ProfilePostListItem";
import { loadProfilePostsPage } from "@/features/profile/profileData";
import styles from "./ProfilePostsModal.module.css";

function ProfilePostsModal({ open, onClose, username, totalCount = 0 }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = useCallback(
    async (nextPage, append = false) => {
      if (!username) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await loadProfilePostsPage(username, nextPage);
        setItems((current) => (append ? [...current, ...result.items] : result.items));
        setPage(result.page);
        setHasNextPage(result.hasNextPage);
      } catch (err) {
        setError(err?.message ?? "Không tải được danh sách bài viết.");
        if (!append) {
          setItems([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [username],
  );

  useEffect(() => {
    if (!open || !username) {
      return;
    }

    setItems([]);
    setPage(1);
    setHasNextPage(false);
    loadPage(1, false);
  }, [open, username, loadPage]);

  function handleLoadMore() {
    if (!hasNextPage || loadingMore) return;
    loadPage(page + 1, true);
  }

  const resolvedTotalCount = totalCount > 0 ? totalCount : items.length;

  return (
    <Modal open={open} onClose={onClose} title="Bài viết" panelClassName={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Bài viết</h2>
          {!loading && resolvedTotalCount > 0 ? (
            <p className={styles.meta}>{resolvedTotalCount} bài viết</p>
          ) : null}
        </div>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading} aria-busy="true" aria-label="Đang tải bài viết">
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
          </div>
        ) : error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <FontAwesomeIcon icon={faFileLines} />
            </span>
            <p className={styles.emptyTitle}>Chưa có bài viết nào</p>
            <p className={styles.emptyDesc}>
              Người dùng này chưa đăng bài viết nào. Hãy quay lại sau nhé!
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map((post) => (
              <ProfilePostListItem key={post.id} post={post} onNavigate={onClose} />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && hasNextPage ? (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Đang tải…" : `Tải thêm (${items.length}/${resolvedTotalCount})`}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

export default ProfilePostsModal;
