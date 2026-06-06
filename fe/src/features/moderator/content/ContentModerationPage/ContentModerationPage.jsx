import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import { useToast } from "@/common/Toast/ToastProvider";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import ModeratorToolbar from "@/features/moderator/components/ModeratorToolbar/ModeratorToolbar";
import {
  CATEGORY_OPTIONS,
  CONTENT_QUEUE_MOCK,
  CONTENT_QUEUE_PAGE_SIZE,
  filterContentQueue,
  SORT_OPTIONS,
  STATUS_META,
  TYPE_META,
  TYPE_TABS,
} from "@/features/moderator/content/contentModerationData";
import styles from "./ContentModerationPage.module.css";

const CONTENT_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Kiểm duyệt", to: "/moderator/content" },
  { label: "Duyệt nội dung" },
];

function TypeBadge({ type }) {
  const meta = TYPE_META[type];
  return <ModeratorBadge label={meta.label} tone={meta.tone} />;
}

function StatusBadge() {
  const meta = STATUS_META.pending;
  return <ModeratorBadge label={meta.label} tone={meta.tone} dot />;
}

function ContentModerationPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState(CONTENT_QUEUE_MOCK);
  const [preModeration, setPreModeration] = useState(true);
  const [typeTab, setTypeTab] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set(["cq-1", "cq-2", "cq-3"]));

  const filtered = useMemo(
    () => filterContentQueue(items, { query: "", typeTab, category, sort }),
    [items, typeTab, category, sort],
  );

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
  const showBulkBar = selectedCount > 0;

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * CONTENT_QUEUE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * CONTENT_QUEUE_PAGE_SIZE, filtered.length);

  const preModToggle = (
    <label className={styles.preMod}>
      <span className={styles.preModLabel}>Tiền kiểm duyệt (Pre-moderation)</span>
      <input
        type="checkbox"
        className={styles.preModInput}
        checked={preModeration}
        onChange={(event) => setPreModeration(event.target.checked)}
      />
      <span className={styles.preModTrack} aria-hidden>
        <span className={styles.preModThumb} />
      </span>
    </label>
  );

  function handleFilterChange(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleRow(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageRows() {
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

  function removeItems(ids) {
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((item) => !idSet.has(item.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function handleApprove(ids) {
    removeItems(ids);
    showToast(`Đã duyệt ${ids.length} mục (mock).`);
  }

  function handleReject(ids) {
    removeItems(ids);
    showToast(`Đã từ chối ${ids.length} mục (mock).`);
  }

  function handleRefresh() {
    setItems(CONTENT_QUEUE_MOCK);
    setSelectedIds(new Set(["cq-1", "cq-2", "cq-3"]));
    setPage(1);
    showToast("Đã làm mới hàng đợi duyệt.");
  }

  return (
    <ModeratorPageShell
      title="Hàng đợi duyệt nội dung"
      description="Quản lý và xét duyệt các bài viết, bình luận chờ xuất bản."
      crumbs={CONTENT_CRUMBS}
      actions={preModToggle}
    >
      <section className={styles.card}>
        <ModeratorToolbar
          end={
            <button type="button" className={styles.refreshBtn} onClick={handleRefresh}>
              <FontAwesomeIcon icon={faRotateRight} />
              Làm mới
            </button>
          }
        >
          <div className={styles.tabs} role="tablist" aria-label="Loại nội dung">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={typeTab === tab.value}
                className={`${styles.tab} ${typeTab === tab.value ? styles.tabActive : ""}`}
                onClick={() => {
                  setTypeTab(tab.value);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className={styles.divider} aria-hidden />
          <FilterDropdown
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={handleFilterChange(setCategory)}
            ariaLabel="Lọc chuyên mục"
          />
          <FilterDropdown
            options={SORT_OPTIONS}
            value={sort}
            onChange={handleFilterChange(setSort)}
            ariaLabel="Sắp xếp"
          />
        </ModeratorToolbar>

        {showBulkBar && (
          <div className={styles.bulkBar}>
            <p className={styles.bulkText}>Đã chọn {selectedCount} mục</p>
            <div className={styles.bulkActions}>
              <button
                type="button"
                className={styles.bulkReject}
                onClick={() => handleReject([...selectedIds])}
              >
                <FontAwesomeIcon icon={faXmark} />
                Từ chối tất cả
              </button>
              <button
                type="button"
                className={styles.bulkApprove}
                onClick={() => handleApprove([...selectedIds])}
              >
                <FontAwesomeIcon icon={faCheck} />
                Duyệt tất cả
              </button>
            </div>
          </div>
        )}

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
                    aria-label="Chọn tất cả trên trang"
                  />
                </th>
                <th>Loại</th>
                <th>Nội dung</th>
                <th>Tác giả</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    Không có nội dung chờ duyệt phù hợp.
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <tr key={item.id} className={isSelected ? styles.rowSelected : undefined}>
                      <td className={styles.colCheck}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => toggleRow(item.id)}
                          aria-label={`Chọn ${item.type === "post" ? "bài viết" : "bình luận"}`}
                        />
                      </td>
                      <td>
                        <TypeBadge type={item.type} />
                      </td>
                      <td>
                        <div className={styles.contentCell}>
                          {item.type === "post" && item.title ? (
                            <p className={styles.contentTitle}>{item.title}</p>
                          ) : null}
                          <p
                            className={
                              item.type === "comment" ? styles.contentQuote : styles.contentExcerpt
                            }
                          >
                            {item.type === "comment" ? `"${item.excerpt}"` : item.excerpt}
                          </p>
                          {item.parentLabel ? (
                            <p className={styles.contentParent}>{item.parentLabel}</p>
                          ) : null}
                          {item.tags?.length ? (
                            <div className={styles.tags}>
                              {item.tags.map((tag) => (
                                <span key={tag} className={styles.tag}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
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
                      <td>
                        <StatusBadge />
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.actionReject}
                            aria-label="Từ chối"
                            onClick={() => handleReject([item.id])}
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                          <button
                            type="button"
                            className={styles.actionApprove}
                            aria-label="Duyệt"
                            onClick={() => handleApprove([item.id])}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <p className={styles.summary}>
            Hiển thị {rangeStart}-{rangeEnd} trên tổng số {filtered.length} mục
          </p>
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pageArrow}
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Trang trước"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`${styles.pageNum} ${
                    pageNumber === safePage ? styles.pageNumActive : ""
                  }`}
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === safePage ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type="button"
              className={styles.pageArrow}
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              aria-label="Trang sau"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </footer>
      </section>
    </ModeratorPageShell>
  );
}

export default ContentModerationPage;
