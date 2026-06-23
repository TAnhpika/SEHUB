import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faClockRotateLeft,
  faImage,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import Pagination from "@/common/Pagination/Pagination";
import { useToast } from "@/common/Toast/ToastProvider";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import ModeratorToolbar from "@/features/moderator/components/ModeratorToolbar/ModeratorToolbar";
import ContentPostDetailPanel from "@/features/moderator/content/components/ContentPostDetailPanel/ContentPostDetailPanel";
import {
  CONTENT_QUEUE_PAGE_SIZE,
  filterContentQueue,
  SORT_OPTIONS,
} from "@/features/moderator/content/contentModerationData";
import {
  useContentModerationDetail,
  useContentModerationQueue,
} from "@/features/moderator/content/contentModerationStore";
import styles from "./ContentModerationPage.module.css";

const CONTENT_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Kiểm duyệt", to: "/moderator/content" },
  { label: "Duyệt bài viết" },
];

function ContentModerationPage() {
  const { showToast } = useToast();
  const {
    items,
    loading,
    error,
    sort,
    setSort,
    refresh,
    approveItems,
    rejectItems,
  } = useContentModerationQueue();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [focusedId, setFocusedId] = useState(null);
  const [acting, setActing] = useState(false);
  const { item: focusedItem, loading: detailLoading } = useContentModerationDetail(focusedId);

  const filtered = useMemo(() => filterContentQueue(items, { sort }), [items, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CONTENT_QUEUE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * CONTENT_QUEUE_PAGE_SIZE;
    return filtered.slice(start, start + CONTENT_QUEUE_PAGE_SIZE);
  }, [filtered, safePage]);

  const pageIds = pageItems.map((item) => item.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const selectedCount = selectedIds.size;

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * CONTENT_QUEUE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * CONTENT_QUEUE_PAGE_SIZE, filtered.length);

  useEffect(() => {
    if (filtered.length === 0) {
      setFocusedId(null);
      return;
    }
    if (focusedId && !filtered.some((item) => item.id === focusedId)) {
      setFocusedId(filtered[0]?.id ?? null);
    }
  }, [filtered, focusedId]);

  function handleFilterChange(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleRow(id, event) {
    event.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageRows(event) {
    event.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection(ids) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (focusedId && ids.includes(focusedId)) {
      setFocusedId(null);
    }
  }

  async function handleApprove(ids) {
    if (acting || ids.length === 0) return;
    setActing(true);
    try {
      await approveItems(ids);
      clearSelection(ids);
      showToast(`Đã duyệt ${ids.length} bài viết. Bài sẽ hiển thị trên feed.`);
    } catch (err) {
      showToast(err.message ?? "Không duyệt được bài viết.");
    } finally {
      setActing(false);
    }
  }

  async function handleReject(ids) {
    if (acting || ids.length === 0) return;
    setActing(true);
    try {
      await rejectItems(ids);
      clearSelection(ids);
      showToast(`Đã từ chối ${ids.length} bài viết. Sinh viên có thể chỉnh sửa và gửi lại.`);
    } catch (err) {
      showToast(err.message ?? "Không từ chối được bài viết.");
    } finally {
      setActing(false);
    }
  }

  async function handleRefresh() {
    setSelectedIds(new Set());
    setFocusedId(null);
    setPage(1);
    try {
      await refresh(sort);
      showToast("Đã làm mới hàng đợi duyệt bài viết.");
    } catch (err) {
      showToast(err.message ?? "Không làm mới được dữ liệu.");
    }
  }

  function focusItem(id) {
    setFocusedId(id);
  }

  return (
    <ModeratorPageShell
      title="Hàng đợi duyệt bài viết"
      description="Duyệt bài viết sinh viên gửi trước khi hiển thị trên cộng đồng. Bài Rejected có thể được gửi duyệt lại."
      crumbs={CONTENT_CRUMBS}
    >
      <section className={styles.card}>
        <div className={styles.toolbarBlock}>
          <ModeratorToolbar
            end={
              <>
                <Link to="/moderator/content/history" className={styles.historyLink}>
                  <FontAwesomeIcon icon={faClockRotateLeft} />
                  Lịch sử duyệt
                </Link>
                <button type="button" className={styles.refreshBtn} onClick={handleRefresh}>
                  <FontAwesomeIcon icon={faRotateRight} />
                  Làm mới
                </button>
              </>
            }
          >
            <FilterDropdown
              options={SORT_OPTIONS}
              value={sort}
              onChange={handleFilterChange(setSort)}
              ariaLabel="Sắp xếp"
            />
          </ModeratorToolbar>
        </div>

        {selectedCount > 0 ? (
          <div className={styles.bulkBar}>
            <p className={styles.bulkText}>
              Đã chọn <strong>{selectedCount}</strong> bài viết
            </p>
            <div className={styles.bulkActions}>
              <button
                type="button"
                className={styles.bulkClear}
                onClick={() => setSelectedIds(new Set())}
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                className={styles.bulkReject}
                disabled={acting}
                onClick={() => handleReject([...selectedIds])}
              >
                <FontAwesomeIcon icon={faXmark} />
                Từ chối tất cả
              </button>
              <button
                type="button"
                className={styles.bulkApprove}
                disabled={acting}
                onClick={() => handleApprove([...selectedIds])}
              >
                <FontAwesomeIcon icon={faCheck} />
                Duyệt tất cả
              </button>
            </div>
          </div>
        ) : null}

        <div className={styles.workspace}>
          <div className={styles.listCol}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.colCheck}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={allPageSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = somePageSelected && !allPageSelected;
                        }}
                        onChange={togglePageRows}
                        aria-label="Chọn tất cả bài viết trên trang"
                      />
                    </th>
                    <th>Tiêu đề / Nội dung</th>
                    <th>Tác giả</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className={styles.empty}>
                        Đang tải hàng đợi duyệt...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className={styles.empty} role="alert">
                        {error}
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.empty}>
                        Không có bài viết chờ duyệt.{" "}
                        <Link to="/moderator/content/history">Xem lịch sử duyệt</Link>
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      const isFocused = focusedId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className={[
                            isFocused ? styles.rowFocused : "",
                            isSelected ? styles.rowSelected : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => focusItem(item.id)}
                        >
                          <td className={styles.colCheck}>
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={isSelected}
                              onChange={(event) => toggleRow(item.id, event)}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Chọn bài viết: ${item.title}`}
                            />
                          </td>
                          <td>
                            <div className={styles.contentCell}>
                              <p className={styles.contentTitle}>{item.title}</p>
                              <p className={styles.contentExcerpt}>{item.excerpt}</p>
                              <div className={styles.contentHints}>
                                {item.resubmission ? (
                                  <span className={styles.contentHintResubmit}>Gửi lại</span>
                                ) : null}
                                {item.coverImage?.url ? (
                                  <span className={styles.contentHint}>
                                    <FontAwesomeIcon icon={faImage} />
                                    Ảnh bìa
                                  </span>
                                ) : null}
                                {item.inlineImages?.length ? (
                                  <span className={styles.contentHint}>
                                    <FontAwesomeIcon icon={faImage} />
                                    {item.inlineImages.length} ảnh
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.author}>
                              <div className={styles.avatar} aria-hidden>
                                {item.authorInitial}
                              </div>
                              <div>
                                <p className={styles.authorName}>{item.authorName}</p>
                                <p className={styles.authorId}>{item.studentId}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.time}>{item.timeLabel}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <footer className={styles.tableFooter}>
              <p className={styles.summary}>
                Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> / {filtered.length} bài viết
              </p>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                ariaLabel="Phân trang hàng đợi duyệt bài viết"
                alwaysShow
                flush
              />
            </footer>
          </div>

          <aside className={styles.detailCol} aria-label="Chi tiết bài viết">
            {detailLoading && focusedId ? (
              <div className={styles.empty}>Đang tải chi tiết bài viết...</div>
            ) : (
              <ContentPostDetailPanel
                item={focusedItem}
                mode="queue"
                onApprove={(id) => handleApprove([id])}
                onReject={(id) => handleReject([id])}
              />
            )}
          </aside>
        </div>
      </section>
    </ModeratorPageShell>
  );
}

export default ContentModerationPage;
