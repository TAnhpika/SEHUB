import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink, faInbox, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { ACTION_LOADING } from "@/utils/actionLoadingLabels";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import {
  FEEDBACK_STATUS_ACTIONS,
  FEEDBACK_STATUS_FILTER_OPTIONS,
  FEEDBACK_STATUS_META,
  formatFeedbackDate,
  loadAdminFeedbackPage,
  updateFeedbackStatus,
} from "@/features/admin/feedback/adminFeedbackData";
import pageStyles from "@/features/admin/feedback/AdminFeedbackPage.module.css";

const PAGE_SIZE = ADMIN_PAGE_SIZES[0] ?? 20;

function AdminFeedbackPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await loadAdminFeedbackPage({
        status: statusFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      setItems([]);
      setTotalCount(0);
      setLoadError(error?.message ?? "Không tải được danh sách phản hồi.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const fromUrl = searchParams.get("id");
    if (fromUrl) {
      setSelectedId(fromUrl);
    }
  }, [searchParams]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [item.username, item.description, item.statusLabel]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [items, search]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  function handleSelectItem(item) {
    setSelectedId(item.id);
    setSearchParams({ id: item.id });
  }

  function handleCloseDetail() {
    setSelectedId(null);
    setSearchParams({});
  }

  async function handleStatusChange(nextStatus) {
    if (!selectedItem || selectedItem.status === nextStatus) return;

    setStatusUpdating(nextStatus);
    try {
      const updated = await updateFeedbackStatus(selectedItem.id, nextStatus);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast(`Đã cập nhật trạng thái: ${FEEDBACK_STATUS_META[nextStatus]?.label ?? nextStatus}`);
    } catch (error) {
      showToast(error?.message ?? "Không cập nhật được trạng thái.");
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <AdminPageLayout
      title="Phản hồi / Báo lỗi"
      subtitle="Xem báo cáo lỗi từ sinh viên, mở ảnh đính kèm và cập nhật trạng thái xử lý."
    >
      <div className={pageStyles.toolbar}>
        <select
          className={pageStyles.filterSelect}
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Lọc trạng thái"
        >
          {FEEDBACK_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="search"
          className={pageStyles.searchInput}
          placeholder="Tìm theo username hoặc mô tả..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Tìm kiếm phản hồi"
        />

        <Button type="button" variant="secondary" onClick={refresh} disabled={loading}>
          {loading ? ACTION_LOADING.refresh : "Làm mới"}
        </Button>
      </div>

      {loadError ? <p className={pageStyles.errorText}>{loadError}</p> : null}

      <div className={pageStyles.tableWrap}>
        <table className={pageStyles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Mô tả lỗi</th>
              <th>Trạng thái</th>
              <th>Đính kèm</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {loading && filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className={pageStyles.emptyState}>
                  Đang tải...
                </td>
              </tr>
            ) : null}

            {!loading && filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className={pageStyles.emptyState}>
                  <FontAwesomeIcon icon={faInbox} /> Chưa có phản hồi nào.
                </td>
              </tr>
            ) : null}

            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className={selectedId === item.id ? pageStyles.selected : undefined}
                onClick={() => handleSelectItem(item)}
              >
                <td>@{item.username}</td>
                <td className={pageStyles.descriptionCell} title={item.description}>
                  {item.description}
                </td>
                <td>
                  <StatusBadge status={item.badgeStatus} label={item.statusLabel} />
                </td>
                <td>{item.attachmentUrls.length}</td>
                <td>{formatFeedbackDate(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminTableFooter
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={totalCount}
        unit="phản hồi"
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        ariaLabel="Phân trang phản hồi"
      />

      {selectedItem ? (
        <section className={pageStyles.detailPanel} aria-label="Chi tiết phản hồi">
          <div className={pageStyles.detailHeader}>
            <h2 className={pageStyles.detailTitle}>@{selectedItem.username}</h2>
            <button
              type="button"
              className={pageStyles.closeButton}
              onClick={handleCloseDetail}
              aria-label="Đóng chi tiết"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className={pageStyles.detailMeta}>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <StatusBadge status={selectedItem.badgeStatus} label={selectedItem.statusLabel} />
            </p>
            <p>
              <strong>Gửi lúc:</strong> {formatFeedbackDate(selectedItem.createdAt)}
            </p>
            {selectedItem.userId ? (
              <p>
                <strong>User ID:</strong> {selectedItem.userId}
              </p>
            ) : null}
          </div>

          <p className={pageStyles.detailDescription}>{selectedItem.description}</p>

          {selectedItem.attachmentUrls.length > 0 ? (
            <div className={pageStyles.attachments}>
              <strong>Ảnh / tệp đính kèm:</strong>
              {selectedItem.attachmentUrls.map((url, index) => (
                <a
                  key={`${url}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={pageStyles.attachmentLink}
                >
                  <FontAwesomeIcon icon={faExternalLink} />
                  Tệp {index + 1}
                </a>
              ))}
            </div>
          ) : null}

          <div className={pageStyles.statusActions}>
            {FEEDBACK_STATUS_ACTIONS.map((status) => {
              const meta = FEEDBACK_STATUS_META[status];
              const isActive = selectedItem.status === status;
              return (
                <Button
                  key={status}
                  type="button"
                  look={isActive ? "solid" : "outline"}
                  className={pageStyles.statusBtn}
                  disabled={isActive || statusUpdating !== null}
                  onClick={() => handleStatusChange(status)}
                >
                  {statusUpdating === status ? ACTION_LOADING.save : meta.label}
                </Button>
              );
            })}
          </div>
        </section>
      ) : null}
    </AdminPageLayout>
  );
}

export default AdminFeedbackPage;
