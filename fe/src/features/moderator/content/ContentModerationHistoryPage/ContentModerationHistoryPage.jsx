import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faClipboardList,
  faClock,
  faFilePdf,
  faImage,
  faInbox,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import Pagination from "@/common/Pagination/Pagination";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import ModeratorToolbar from "@/features/moderator/components/ModeratorToolbar/ModeratorToolbar";
import ContentPostDetailPanel from "@/features/moderator/content/components/ContentPostDetailPanel/ContentPostDetailPanel";
import {
  CONTENT_HISTORY_PAGE_SIZE,
  countContentByStatus,
  filterContentItems,
  HISTORY_STATUS_TABS,
  SORT_OPTIONS,
  STATUS_META,
} from "@/features/moderator/content/contentModerationData";
import {
  CONTENT_MODERATION_USE_MOCK,
  loadModerationCounts,
} from "@/features/moderator/content/contentModerationService";
import {
  useContentModerationDetail,
  useContentModerationHistory,
} from "@/features/moderator/content/contentModerationStore";
import styles from "./ContentModerationHistoryPage.module.css";

const HISTORY_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Kiểm duyệt", to: "/moderator/content" },
  { label: "Lịch sử duyệt bài" },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return <ModeratorBadge label={meta.label} tone={meta.tone} dot />;
}

function ContentModerationHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [focusedId, setFocusedId] = useState(null);
  const [metricCounts, setMetricCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
  });

  const { items, loading, error } = useContentModerationHistory({ status: tab, sort });
  const { item: focusedItem, loading: detailLoading } = useContentModerationDetail(focusedId);

  const counts = useMemo(() => {
    if (CONTENT_MODERATION_USE_MOCK) {
      return countContentByStatus(items);
    }
    return metricCounts;
  }, [items, metricCounts]);

  useEffect(() => {
    if (CONTENT_MODERATION_USE_MOCK) return undefined;

    let cancelled = false;
    loadModerationCounts()
      .then((data) => {
        if (!cancelled) setMetricCounts(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [items]);

  const filtered = useMemo(
    () => (CONTENT_MODERATION_USE_MOCK ? filterContentItems(items, { status: tab, sort }) : items),
    [items, tab, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / CONTENT_HISTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * CONTENT_HISTORY_PAGE_SIZE;
    return filtered.slice(start, start + CONTENT_HISTORY_PAGE_SIZE);
  }, [filtered, safePage]);

  const focusedItemResolved = useMemo(
    () => focusedItem ?? filtered.find((item) => item.id === focusedId) ?? null,
    [focusedItem, filtered, focusedId],
  );

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * CONTENT_HISTORY_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * CONTENT_HISTORY_PAGE_SIZE, filtered.length);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && HISTORY_STATUS_TABS.some((option) => option.id === tabFromUrl)) {
      setTab(tabFromUrl);
    }
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && items.some((item) => item.id === idFromUrl)) {
      setFocusedId(idFromUrl);
      const item = items.find((entry) => entry.id === idFromUrl);
      if (item?.status) setTab(item.status === "pending" ? "pending" : item.status);
    }
  }, [searchParams, items]);

  useEffect(() => {
    if (filtered.length === 0) {
      setFocusedId(null);
      return;
    }
    if (!focusedId || !filtered.some((item) => item.id === focusedId)) {
      setFocusedId(filtered[0]?.id ?? null);
    }
  }, [filtered, focusedId]);

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setPage(1);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", nextTab);
        params.delete("id");
        return params;
      },
      { replace: true },
    );
  }

  function handleFilterChange(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function focusItem(id) {
    setFocusedId(id);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("id", id);
        params.set("tab", tab);
        return params;
      },
      { replace: true },
    );
  }

  return (
    <ModeratorPageShell
      title="Lịch sử duyệt bài viết"
      description="Theo dõi bài đang chờ, đã duyệt và đã từ chối. Bài Rejected có thể được sinh viên chỉnh sửa và gửi lại (Pending)."
      crumbs={HISTORY_CRUMBS}
    >
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.metricPending}`}>
            <FontAwesomeIcon icon={faClock} />
          </span>
          <div>
            <p className={styles.metricValue}>{counts.pending}</p>
            <p className={styles.metricLabel}>Đang chờ</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.metricApproved}`}>
            <FontAwesomeIcon icon={faCheck} />
          </span>
          <div>
            <p className={styles.metricValue}>{counts.approved}</p>
            <p className={styles.metricLabel}>Đã duyệt</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.metricRejected}`}>
            <FontAwesomeIcon icon={faXmark} />
          </span>
          <div>
            <p className={styles.metricValue}>{counts.rejected}</p>
            <p className={styles.metricLabel}>Đã từ chối</p>
          </div>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.metricTotal}`}>
            <FontAwesomeIcon icon={faInbox} />
          </span>
          <div>
            <p className={styles.metricValue}>{counts.all}</p>
            <p className={styles.metricLabel}>Tổng bài</p>
          </div>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.tabs} role="tablist" aria-label="Lọc theo trạng thái duyệt">
          {HISTORY_STATUS_TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={tab === option.id}
              className={`${styles.tab} ${tab === option.id ? styles.tabActive : ""}`}
              onClick={() => handleTabChange(option.id)}
            >
              {option.label}
              {option.id !== "all" ? (
                <span className={styles.tabCount}>{counts[option.id] ?? 0}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className={styles.toolbarBlock}>
          <ModeratorToolbar
            end={
              <Link to="/moderator/content" className={styles.queueLink}>
                <FontAwesomeIcon icon={faClipboardList} />
                Hàng đợi duyệt
              </Link>
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

        <div className={styles.workspace}>
          <div className={styles.listCol}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tiêu đề / Nội dung</th>
                    <th>Tác giả</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className={styles.empty}>
                        Đang tải lịch sử duyệt...
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
                        Không có bài viết trong mục này.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((item) => {
                      const isFocused = focusedId === item.id;
                      const timeLabel =
                        item.status === "pending"
                          ? item.submittedAtLabel ?? item.timeLabel
                          : item.moderation?.actionAtLabel ?? item.timeLabel;

                      return (
                        <tr
                          key={item.id}
                          className={isFocused ? styles.rowFocused : ""}
                          onClick={() => focusItem(item.id)}
                        >
                          <td>
                            <div className={styles.contentCell}>
                              <p className={styles.contentTitle}>{item.title}</p>
                              <p className={styles.contentExcerpt}>{item.excerpt}</p>
                              <div className={styles.contentHints}>
                                {item.coverImage?.url ? (
                                  <span className={styles.contentHint}>
                                    <FontAwesomeIcon icon={faImage} />
                                    Ảnh bìa
                                  </span>
                                ) : null}
                                {item.attachments?.length ? (
                                  <span className={styles.contentHint}>
                                    <FontAwesomeIcon icon={faFilePdf} />
                                    {item.attachments.length} file
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
                            <StatusBadge status={item.status} />
                          </td>
                          <td>
                            <span className={styles.time}>{timeLabel}</span>
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
                ariaLabel="Phân trang lịch sử duyệt bài viết"
                alwaysShow
                flush
              />
            </footer>
          </div>

          <aside className={styles.detailCol} aria-label="Chi tiết bài viết">
            {detailLoading && focusedId ? (
              <div className={styles.empty}>Đang tải chi tiết bài viết...</div>
            ) : (
              <ContentPostDetailPanel item={focusedItemResolved} mode="history" />
            )}
          </aside>
        </div>
      </section>
    </ModeratorPageShell>
  );
}

export default ContentModerationHistoryPage;
