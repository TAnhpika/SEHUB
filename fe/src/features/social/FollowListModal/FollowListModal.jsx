import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGroup,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Modal } from "@/common/Modal/Modal";
import FollowListItem from "@/features/social/FollowListItem/FollowListItem";
import {
  loadFollowersPage,
  loadFollowingPage,
} from "@/features/social/followListData";
import styles from "./FollowListModal.module.css";

const MODE_COPY = {
  followers: {
    title: "Người theo dõi",
    emptyTitle: "Chưa có người theo dõi",
    emptyDesc: "Khi có người theo dõi tài khoản này, họ sẽ hiển thị tại đây.",
    emptyIcon: faUserGroup,
    loadError: "Không tải được danh sách người theo dõi.",
  },
  following: {
    title: "Đang theo dõi",
    emptyTitle: "Chưa theo dõi ai",
    emptyDesc: "Những tài khoản được theo dõi sẽ hiển thị tại đây.",
    emptyIcon: faUserPlus,
    loadError: "Không tải được danh sách đang theo dõi.",
  },
};

function FollowListModal({
  open,
  onClose,
  userId,
  mode = "followers",
  totalCount = 0,
  currentUserId,
  onItemFollowChange,
}) {
  const copy = MODE_COPY[mode] ?? MODE_COPY.followers;
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = useCallback(
    async (nextPage, append = false) => {
      if (!userId) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const loader = mode === "following" ? loadFollowingPage : loadFollowersPage;
        const result = await loader(userId, nextPage);

        setItems((current) => (append ? [...current, ...result.items] : result.items));
        setPage(result.page);
        setHasNextPage(result.hasNextPage);
      } catch (err) {
        setError(err?.message ?? copy.loadError);
        if (!append) {
          setItems([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [copy.loadError, mode, userId],
  );

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    setItems([]);
    setPage(1);
    setHasNextPage(false);
    loadPage(1, false);
  }, [open, userId, mode, loadPage]);

  function handleItemFollowChange(targetUserId, state) {
    setItems((current) =>
      current.map((item) =>
        item.userId === targetUserId
          ? { ...item, isFollowing: Boolean(state.isFollowing) }
          : item,
      ),
    );
    onItemFollowChange?.(targetUserId, state);
  }

  function handleLoadMore() {
    if (!hasNextPage || loadingMore) return;
    loadPage(page + 1, true);
  }

  const resolvedTotalCount = totalCount > 0 ? totalCount : items.length;

  return (
    <Modal open={open} onClose={onClose} title={copy.title} panelClassName={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{copy.title}</h2>
          {!loading && resolvedTotalCount > 0 ? (
            <p className={styles.meta}>{resolvedTotalCount} tài khoản</p>
          ) : null}
        </div>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading} aria-busy="true" aria-label={`Đang tải ${copy.title}`}>
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
              <FontAwesomeIcon icon={copy.emptyIcon} />
            </span>
            <p className={styles.emptyTitle}>{copy.emptyTitle}</p>
            <p className={styles.emptyDesc}>{copy.emptyDesc}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map((user) => (
              <FollowListItem
                key={user.userId}
                user={user}
                currentUserId={currentUserId}
                onFollowChange={handleItemFollowChange}
                onNavigate={onClose}
              />
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

export default FollowListModal;
